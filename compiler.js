const fs = require('fs');

const {parse} = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;

if (process.argv.length!=3){
    console.error("Invalid script usage!");
    console.log("Usage: node compiler.js path_to_your_source.js");
    process.exit(1);
} 
jscode = fs.readFileSync(process.argv[2]).toString('utf-8');

let ast;

try{
    ast = parse(jscode);
}

catch(e){
    e.code="JS_SyntaxError"; //instead of mentioning Babel)
    throw e;
}

const nodes = ast.program.body;

class CPPGenerator{
    
    constructor(){
        this._cpp = "";
        this._modules = new Set(['<iostream>']);
    }
    
    addCode(code){
        this._cpp += `${code};\n`;
    }
    
    addRaw(code){
        this._cpp += code;
    }
    
    addImport(module){
        this._modules.add(module);
    }
    
    save(){
        //add prolog
        let prolog = '//Auto generated code using js-compiler\n';
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
    let js_type = node.declarations[0].init.type;
    switch (js_type){
        case 'UnaryExpression':
        case 'NumericLiteral':
            ctype="int64_t";
            let value = node.declarations[0].init.value;
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
            throw new Error('Unsopperted type: array!');
            ctype = "vector<int64_t>";
            cpp_generator.addImport('<vector>');
        case 'ObjectExpression':
            throw new Error('Unsopperted type: object!');
            ctype = "map<int64_t>";
            //cpp_generator.addImport('<vector>');
            break;
        case 'CallExpression':
            console.log(node);
            throw new Error('We coudn\'t understood function\'s returning type');
            break;
        default:
            //console.log(node.declarations[0].init);
            throw new Error('Unknown type '+js_type);
    }
    return ctype;
}

//TODO: move parsing to several modules
function parse_node(node){ //addLineEnding = true
    switch(node.type){
        case 'NumericLiteral':
            cpp_generator.addRaw(`${node.value}`);
            break;
        case 'StringLiteral':
            cpp_generator.addRaw(`"${node.value}"`);
            break;
        case 'BinaryExpression':
            parse_node(node.left);
            cpp_generator.addRaw(node.operator);
            parse_node(node.right);
            break;
        case 'VariableDeclaration':
            type = getType(node);
            if (type=="string") code = `${type} ${node.declarations[0].id.name} = "${node.declarations[0].init.value}"`;
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
            cpp_generator.addCode(code);
            break;
        case 'Identifier':
            cpp_generator.addRaw(node.name);
            break;
        case 'UpdateExpression':
            if (node.prefix) {
                cpp_generator.addRaw(`${node.operator}${node.argument.name}`); //++i
            }
            else {
                cpp_generator.addRaw(`${node.argument.name}${node.operator}`); //i++
            }
            break;
        case 'BlockStatement':
            for (subnode of node.body){
                parse_node(subnode);
            }
            break;
        case 'ExpressionStatement':
            const expr = node.expression;
            if (expr.type == 'CallExpression'){
                if (expr.callee.type=='MemberExpression'){
                    //method of an object
                    //const object = expr.callee.object;
                    const module_name = expr.callee.object.name; //f.g console
                    const function_name = expr.callee.property.name; //f.g log
                    cpp_generator.addRaw(`JS_${module_name.toLowerCase()}_${function_name.toLowerCase()}(`); //JS_console_log(
                    cpp_generator.addImport(`"${module_name}/${function_name}.h"`); //#include "console/log.h"
                }
                
                for (argument of expr.arguments){
                    parse_node(argument);
                    cpp_generator.addRaw(', ');
                }
                cpp_generator._cpp = cpp_generator._cpp.substr(0,cpp_generator._cpp.length-2); //2 because , and space
                cpp_generator.addCode(')'); //replace last , with )
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
            cpp_generator.addRaw('}\n')
            if (alternate!=null){
               cpp_generator.addRaw('else {\n');
               parse_node(node.alternate); //parsing else 
               cpp_generator.addRaw('}\n');
            } 
            break;
        case 'ForStatement':
            //init,test,update,body
            cpp_generator.addRaw('for (');
            parse_node(node.init);
            parse_node(node.test);
            cpp_generator.addRaw(';');
            parse_node(node.update);
            cpp_generator.addRaw('){\n');
            parse_node(node.body);
            cpp_generator.addRaw('}\n');
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
    cpp_generator.save();
}
main();

