const fs = require('fs');
const assert = require('assert');

const {parse} = require("@babel/parser");
//const traverse = require("@babel/traverse").default;
//const generator = require("@babel/generator").default;

if (process.argv.length!=3){
    console.error("Invalid script usage!");
    console.log("Usage: node js2cpp.js path_to_your_source.js");
    process.exit(1);
}
let jscode,ast;
jscode = fs.readFileSync(process.argv[2]).toString('utf-8');


try{
    ast = parse(jscode);
}

catch(e){
    e.code="JS_SyntaxError"; //instead of mentioning Babel)
    throw e;
}

const nodes = ast.program.body;

function JS_assert(value,message){
    try{
        assert(value,message);
    }
    catch(e){
        throw new Error(message);
    }
}


const defaultOptions = {level:1}; //NOTE: level is applyed to all nodes!
class CPPGenerator{
    
    constructor(){
        this._cpp = "";
        this._modules = new Set(['<iostream>']);
    }
    
    _getSpacesByLevel(level){
        ////3 spaces for level 2, 6 for level 3
        return ' '.repeat(3*(level-1));
    }
    
    addCode(code){
        const options = globalThis.options||defaultOptions;
        if (globalThis.options!==defaultOptions){
            globalThis.options=defaultOptions;
        }
        const spaces = this._getSpacesByLevel(options.level);
        this._cpp += `${spaces}${code};\n`;
    }
    
    addRaw(code){
        const options = globalThis.options||defaultOptions;
        if (globalThis.options!==defaultOptions){
            globalThis.options=defaultOptions;
        }
        const spaces = this._getSpacesByLevel(options.level);
        this._cpp += `${spaces}${code}`;
    }
    
    addImport(module){
        this._modules.add(module);
    }
    
    save(){
        //add prolog
        let prolog = '//Auto generated code using js2cpp\n';
        const epilog = 'return 0;\n}';
        for(module of this._modules){
          prolog+=`#include ${module}\n`;
        } 
        prolog+="using namespace std;\n";
        prolog+="int main(){\n";
        this._cpp = prolog + this._cpp + epilog;
        fs.writeFileSync('js_result.cpp',this._cpp);
    }
    
}

const cpp_generator = new CPPGenerator(jscode);

function getType(node){
    let ctype; 
    let js_type;
    try{
        js_type = node.declarations[0].init.type;
    }
    catch{
        js_type = node.type;
    }
    switch (js_type){
        case 'UnaryExpression':
        case 'NumericLiteral':
            ctype="int64_t";
            let value;
            try{
                value = node.declarations[0].init.value;
            }
            catch{
               value = node.value; 
            }
            if (value===undefined && node.declarations[0].init.operator){
                value = node.declarations[0].init.argument.value;
                /*console.log(value);
                if (node.declarations[0].init.operator==='-') value*=-1; */
            }
            if (value!=parseInt(value)) ctype="float";
            break;
        case 'StringLiteral':
            ctype="string";
            break;
        case 'ArrayExpression':
            const first_element = node.declarations[0].init.elements[0];
            if (first_element===undefined){
                //empty array
                throw new Error('You coudn\'t declare empty array: we don\'t know it\'s type');
            }
            const first_type = first_element.type;
            const isEqual = (element) => {
                return element.type == first_type; 
            }
            JS_assert(node.declarations[0].init.elements.every(isEqual),'array\'s elements must be not heterogeneous');
            ctype = `vector<${getType(first_element)}>`;
            cpp_generator.addImport('<vector>');
            break;
        case 'ObjectExpression':
            throw new Error('Unsopperted type: object!');
            //ctype = "map<int64_t>";
            //cpp_generator.addImport('<vector>');
            break;
        case 'CallExpression':
            //console.log(node);
            throw new Error('We coudn\'t understood function\'s returning type');
            break;
        case 'MemberExpression':
            const err = 'We coudn\'t understood type\n';
            throw new Error(err+'Probably you are trying to do something like: let c=arr[i+1]');
            //ctype = "int64_t";
            break;
        default:
            throw new Error(`Unknown type ${js_type}`);
    }
    return ctype;
}

//TODO: move parsing to several modules
function parse_node(node){ //options=defaultOptions
    /*if(options!==defaultOptions){
        globalThis.options=options;
    }*/
    switch(node.type){
        case 'NumericLiteral':
            cpp_generator.addRaw(`${node.value}`);
            break;
        case 'StringLiteral':
            cpp_generator.addRaw(`"${node.value}"`);
            break;
        case 'BinaryExpression':
            //something like a>5 or 1!=2
            parse_node(node.left);
            cpp_generator.addRaw(node.operator);
            parse_node(node.right);
            break;
        case 'VariableDeclaration':
            //FIXME: hacky code
            type = getType(node);
            let code = '';
            if (type=="string") code = `${type} ${node.declarations[0].id.name} = "${node.declarations[0].init.value}"`;
            else if (type.includes("vector")){
                const elements = node.declarations[0].init.elements;
                cpp_generator.addRaw(`${type} ${node.declarations[0].id.name} = {`);
                for (element of elements) {
                    parse_node(element); //TODO: maybe we need ret code's mode
                    cpp_generator.addRaw(',');
                }
                if (elements.length!==0){
                    //delete traling ,
                    cpp_generator._cpp = cpp_generator._cpp.substr(0,cpp_generator._cpp.length-1);
                }
                cpp_generator.addCode('}');
            }
            else{
                let value = node.declarations[0].init.value;
                if (value===undefined){
                    //TODO: assert that operator is + or - (+2 or -2.1)
                    //FIXME: fix unary +
                    value = node.declarations[0].init.argument.value; 
                    if (node.declarations[0].init.operator==='-') value='-'+value; 
                }
                code = `${type} ${node.declarations[0].id.name} = ${value}`;
            }
            if (code!='') cpp_generator.addCode(code);
            break;
        case 'FunctionDeclaration':
            JS_assert(!node.async,'We don\'t support async functions');
            JS_assert(!node.generator,'We don\'t support generators');
            cpp_generator.addRaw(`auto ${node.id.name}=[](`);
            if (node.params.length!==0){
                console.log(node.params);
                throw new Error('We don\'t support functions with params');
            }
            /*for (param of node.params){
                cpp_generator.addRaw('vector<int64_t> '); //TODO: get type from typescript
                parse_node(param);
                cpp_generator.addRaw(',');
            }*/
            cpp_generator.addRaw('){\n');
            globalThis.options={level:2};
            parse_node(node.body);
            cpp_generator.addCode(`}`);
            break;
        case 'Identifier':
            cpp_generator.addRaw(node.name);
            break;
        case 'UpdateExpression':
            //something like i++
            if (node.prefix) {
                cpp_generator.addRaw(`${node.operator}${node.argument.name}`); //++i
            }
            else {
                cpp_generator.addRaw(`${node.argument.name}${node.operator}`); //i++
            }
            break;
        case 'BlockStatement':
            soptions = globalThis.options;
            for (subnode of node.body){
                parse_node(subnode);
                globalThis.options=soptions; //restore options
                //this is used to add spaces into function's body
            }
            break;
        case 'ExpressionStatement':
            const expr = node.expression;
            if (expr.type == 'CallExpression'){
                //handle something like Math.cos(0);
                if (expr.callee.type=='MemberExpression'){
                    //method of an object
                    //const object = expr.callee.object;
                    const module_name = expr.callee.object.name; //f.g console
                    const function_name = expr.callee.property.name; //f.g log
                    cpp_generator.addRaw(`JS_${module_name.toLowerCase()}_${function_name.toLowerCase()}(`); //JS_console_log(
                    cpp_generator.addImport(`"${module_name}/${function_name}.h"`); //#include "console/log.h"
                }
                //handle something like test(1);
                else if (expr.callee.type=='Identifier'){
                    const function_name = expr.callee.name;
                    cpp_generator.addRaw(`${function_name}(`);
                }
                
                for (argument of expr.arguments){
                    parse_node(argument);
                    cpp_generator.addRaw(', ');
                }
                if (expr.arguments.length!==0){
                    //delete traling ,
                cpp_generator._cpp = cpp_generator._cpp.substr(0,cpp_generator._cpp.length-2); //2 because , and space
                }
                cpp_generator.addCode(')'); //replace last , with )
            }
            else if (expr.type=='AssignmentExpression'){
                const twoVariables = expr.left.type=='Identifier' && expr.right.type=='Identifier';
                //TODO: add type assert
                if (twoVariables) {
                    //something like a = b, not a = 5
                    console.warn(`We coudn\'t check typeof ${expr.right.name}`);
                    cpp_generator.addCode(`${expr.left.name}=${expr.right.name}`)
                }
                else if (expr.right.type!=='Identifier'){
                    //something like a = 5;
                    console.warn(`We coudn\'t check typeof ${expr.left.name}`);
                    cpp_generator.addRaw(`${expr.left.name} = `);
                    parse_node(expr.right);
                    cpp_generator.addRaw(';\n');
                }
            }
            else {
              console.log(node);
              throw new Error(`Invalid ExpressionStatement`);  
            }
            break;
        case 'IfStatement':
            cpp_generator.addRaw('if (');
            parse_node(node.test); //condition
            cpp_generator.addRaw(') {\n')
            parse_node(node.consequent); //if's body
            cpp_generator.addRaw('}\n');
            if (node.alternate!=null){
               cpp_generator.addRaw('else {\n');
               parse_node(node.alternate); //parsing else 
               cpp_generator.addRaw('}\n');
            } 
            break;
        case 'ForStatement':
            //init,test,update,body
            cpp_generator.addRaw('for (');
            parse_node(node.init);
            //FIXME: hack for delete last \n
            cpp_generator._cpp = cpp_generator._cpp.substr(0,cpp_generator._cpp.length-1);
            parse_node(node.test);
            cpp_generator.addRaw(';');
            parse_node(node.update);
            cpp_generator.addRaw('){\n');
            globalThis.options={level:2};
            parse_node(node.body);
            cpp_generator.addRaw('}\n');
            break;
        case 'ReturnStatement':
            throw new Error('We haven\'t support returning value yet');
            break;
        default:
            console.log(node);
            throw new Error(`Invalid AST type ${node.type}`);
    }
}

function main_parse(){
    //In the future we can do something async here
    for (node of nodes){
        parse_node(node);
    }
}

function main(){
    main_parse();
    console.log('Compiled successfully!\nSee js_result.cpp');
    cpp_generator.save();
}
main();

