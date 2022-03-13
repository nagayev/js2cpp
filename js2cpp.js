//js2cpp test.js -s stdlib -o output/js_bin --cpp
const fs = require('fs');
const assert = require('assert');

const { ArgumentParser } = require('argparse');
const {parse} = require("@babel/parser");

const defaultArgs = {
    output:'js_result.cpp',
    stdlib:'stdlib',
    no_type_checks:false,
    no_format:false
};

const makeString = (arr) => arr.join('');
const parser = new ArgumentParser({});

parser.add_argument("filename", {type:"str", help:"Input Javascript file"});
parser.add_argument('-o', '--output', { help: `Output name, default is ${defaultArgs.output}` });
parser.add_argument('-s', '--stdlib', { help: `Path to stdlib folder, default is ${defaultArgs.stdlib}` });
parser.add_argument('--no_type_checks', '--no-type-checks', { help: `Don't check JavaScript types, default is ${defaultArgs.no_types}`,
action:'store_true' });
parser.add_argument('--no_format', '--no-format', { help: `Don't format output code, default is ${defaultArgs.no_format}`,
action:'store_true' });

if (process.argv.length<3){
    console.error("Invalid script usage!");
}

const args = parser.parse_args();

//Check experimental args

if (args.no_type_checks){
    console.warn(`WARNING: \`no-type-checks\` is a very unstable feature`);
}
//Set default values
for (let key in defaultArgs){
    if (args[key]===undefined){
        args[key]=defaultArgs[key];
    }
}
if (args.stdlib=='.'){
    args.stdlib='';
}

let jscode,ast;
jscode = fs.readFileSync(args.filename).toString('utf-8');


try{
    ast = parse(jscode);
}

catch(e){
    e.code="JS_SyntaxError"; //instead of mentioning Babel)
    throw e;
}

const nodes = ast.program.body;

const lockIndent = () => cpp_generator.options.locked = true;
const unlockIndent = () => cpp_generator.options.locked = false;

const incrementIndent = () =>  cpp_generator.options.level++;
const decrementIndent = () => {
    cpp_generator.options.level--;
    unlockIndent();
}

function JS_type_assert(value,message){
    if (!args.no_type_checks) JS_assert(value,message,TypeError);
}

function JS_assert(value,message,CustomError = Error){
    try{
        assert(value,message);
    }
    catch(e){
        throw new CustomError(message);
    }
}


const defaultOptions = {
    level:1,
    locked:false, //true if we want to ignore level
    function_name:'' //string if we are parsing function's code
};

class CPPGenerator{
    
    constructor(filename='js_result.cpp'){
        this._cpp = ""; //cpp code
        this.types = {}; //types of js variables
        this.functions={}; //functions arguments' types
        this.functions_code = "";
        this._modules = new Set(['<iostream>']); //cpp includes
        this.options = defaultOptions; //options like formating
        this._filename = filename; //output filename
    }

    _getSpacesByLevel(level){
        //3 spaces for level 2, 6 for level 3
        if (this.options.locked || args.no_format) return '';
        return ' '.repeat(3*(level-1));
    }
    
    addCode(code){
        const options = this.options;
        const spaces = this._getSpacesByLevel(options.level);
        const result_code = `${spaces}${code};\n`
        if (options.function_name!==''){
            this.functions[options.function_name].code+=result_code;
        }
        else {
            this._cpp += result_code;
        }
    }
    
    deleteTralingComma(l=1){
        if (!this.options.function_name){
            this._cpp = this._cpp.slice(0,-l);
        }
        
        else{
            this.functions[this.options.function_name].code=this.functions[this.options.function_name].code.slice(0,-l);
        }
    }

    _buildFunction(name){
        const func = this.functions[name];
        cpp_generator.options.function_name=name;
        incrementIndent();
        parse_node(func.node.body);
        decrementIndent();
        let code = `${func.ret} ${name}(`;
        for (let arg in func.args){
           code+=`${func.args[arg]} ${arg}, `; 
        }
        if (Object.keys(func.args).length!==0){
            code=code.slice(0,code.length-2);
        } 
        code+='){\n';
        code=code+func.code;
        code+='}\n';
        cpp_generator.options.function_name='';
        this.functions_code += code;
    }
    
    addRaw(code){
        const options = this.options;
        const spaces = this._getSpacesByLevel(options.level);
        const result_code = `${spaces}${code}`;
        if (options.function_name!==''){
            this.functions[options.function_name].code+=result_code;
        }
        else {
            this._cpp += result_code;
        }
    }
    
    addImport(module){
        this._modules.add(module);
    }
    
    save(){
        //The program consists of several parts: prolog, user defined functions and the main code
        let prolog = '//Auto generated code using js2cpp\n';
        for(module of this._modules){
          prolog+=`#include ${module}\n`;
        } 
        prolog+="using namespace std;\n";
        const start_main = "int main(){\n";
        const epilog = 'return 0;\n}';
        this._cpp = prolog + this.functions_code + start_main + this._cpp + epilog;
        fs.writeFileSync(this._filename,this._cpp);
    }
    
}

const cpp_generator = new CPPGenerator(args.output);

function getExpressionType(node,anotherNode){
    let ctype; 
    let js_type = node.type;
    switch (js_type){
        case 'UnaryExpression':
        case 'NumericLiteral':
            ctype="int64_t";
            let value = node.value;
            //If it's unary expression (something like -2)
            if (value===undefined && node.operator){
                value = node.argument.value;
            }
            if (value!=parseInt(value)) ctype="float";
            break;
        case 'BooleanLiteral':
            ctype="bool";
            break;
        case 'StringLiteral':
            ctype="string";
            break;
        case 'ArrayExpression':
            const elements = node.elements;
            const first_element = elements[0]; 
            const message = 'You coudn\'t declare empty array: we don\'t know it\'s type';
            JS_type_assert(first_element!==undefined,message);
            const first_type = first_element.type;
            const isEqual = (element) => {
                return element.type == first_type; 
            }
            JS_type_assert(elements.every(isEqual),'array\'s elements must be not heterogeneous');
            ctype = `vector<${getExpressionType(first_element)}>`;
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
            const typeOfArray = getVariableType(node.object.name); //something like vector<int64_t>
            const typeOfElement = getTypeOfElements(typeOfArray); //int64_t
            let typeOfLeft;
            if (anotherNode===undefined){
                typeOfLeft = undefined;
            }
            else typeOfLeft = getVariableType(anotherNode.name);
            //typeOfLeft is undefined when we declare new variable
            //so we should accept expression like let temp = arr[i]
            if (typeOfLeft===undefined || typeOfElement===typeOfLeft){
                ctype = typeOfElement;
            }
            else{
                const err = `You are trying to do something like: let c=arr[i+1], `;
                JS_type_assert(true,err+`but c type is ${typeOfLeft} and arr type is ${typeOfArray}`);
            }
            break;
        case 'BinaryExpression':
            const comparasionOperators = ['>','<','>=','<=','!=','=='];
            if (comparasionOperators.includes(node.operator)){
                ctype = "bool";
            }
            else{
                throw new Error('Unknown BinaryExpression');
            }
            break;
        default:
            throw new TypeError(`Unknown type ${js_type}`);
    }
    return ctype;
}

//Returns typeof elements, f.g vector<int64_t> -> int64_t
function getTypeOfElements(typeOfArray){
    return typeOfArray.slice(typeOfArray.indexOf('<')+1,typeOfArray.indexOf('>'));
}

//Returnes type of variable if we remember it
function getVariableType(node){
    let ctype;
    if (typeof node==='string') return cpp_generator.types[node];
    switch (node.type){
        case 'MemberExpression':
            //TODO: test it
            ctype=getVariableType(node.object.name);
            ctype=getTypeOfElements(ctype);
            break;
        case 'Identifier':
            ctype=cpp_generator.types[node.name];
            break;
        default:
            throw TypeError(`getVariableType failed ${node.type}`);
    }
    return ctype;
}

//TODO: move parsing to several modules
function parse_node(node){
    switch(node.type){
        case 'NumericLiteral':
            cpp_generator.addRaw(`${node.value}`);
            break;
        case 'StringLiteral':
            cpp_generator.addRaw(`"${node.value}"`);
            break;
        case 'BooleanLiteral':
            cpp_generator.addRaw(`${node.value}`);
            break;
        case 'ArrayExpression':
            const elements = node.elements;
            cpp_generator.addRaw(`{`);
            for (element of elements) {
                parse_node(element); //TODO: maybe we need ret code's mode
                cpp_generator.addRaw(',');
            }
            if (elements.length!==0){
                //delete traling ,
                cpp_generator.deleteTralingComma(1);
            }
            cpp_generator.addRaw('}');
            break;
        case 'BinaryExpression':
            //something like a>5 or 1!=2
            parse_node(node.left);
            cpp_generator.addRaw(node.operator);
            parse_node(node.right);
            break;
        case 'VariableDeclaration':
            const variable = node.declarations[0].id.name;
            if (node.kind==='const') cpp_generator.addRaw('const ');
            let type = getExpressionType(node.declarations[0].init);
            cpp_generator.types[variable]=type;
            cpp_generator.addRaw(`${type} `);
            parse_node(node.declarations[0].id);
            cpp_generator.addRaw(' = ');
            parse_node(node.declarations[0].init);
            cpp_generator.addCode('');
            break;
        case 'FunctionDeclaration':
            //NOTE: we parse function's body when user calles function first time
            JS_assert(!node.async,'We don\'t support async functions');
            JS_assert(!node.generator,'We don\'t support generators');
            const function_name = node.id.name;
            cpp_generator.functions[function_name]={args:{},ret:'void',code:'',node:node};
            for (param of node.params){
                cpp_generator.functions[function_name].args[param.name]=''; //unknown type
            }
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
            for (subnode of node.body){
                parse_node(subnode);
            }
            break;
        case 'ExpressionStatement':
            const expr = node.expression;
            if (expr.type == 'CallExpression'){
                let function_name;
                if (expr.callee.type=='MemberExpression'){
                    //handle something like Math.cos(0);
                    const module_name = expr.callee.object.name; //f.g console
                    function_name = expr.callee.property.name; //f.g log
                    cpp_generator.addRaw(`JS_${module_name.toLowerCase()}_${function_name.toLowerCase()}(`); //JS_console_log(
                    let slash = "";
                    if (args.stdlib!=='' && !args.stdlib.endsWith('\\')) slash="/";
                    cpp_generator.addImport(`"${args.stdlib}${slash}${module_name}/${function_name}.h"`); //#include "console/log.h"
                }
                //handle something like test(1), without object like console;
                else if (expr.callee.type=='Identifier'){
                    function_name = expr.callee.name;
                    cpp_generator.addRaw(`${function_name}(`);
                }
                //NOTE: maybe this else is unreachable
                else {
                    throw new Error('Invalid function call');
                }

                let i = 0;
                const func = cpp_generator.functions[function_name];
                const argumentsNames = func?Object.keys(func.args):[]; //function f(a,b) -> ['a','b']
                lockIndent();
                for (argument of expr.arguments){
                    if (func!==undefined){
                        //if it's user defined function, not console.log
                        const argumentName = argumentsNames[i];
                        let type;
                        //if it's variable it should be defined
                        if (argument.type==='Identifier'){
                            type = getVariableType(argument);
                            JS_type_assert(type!==undefined,`Variable ${argument.name} is undefined`);
                        } 
                        else type = getExpressionType(argument);
                        //check typeOf argument if it was defined
                        if (func.args[argumentName]!==''){
                            const message = makeString([`Invalid typeof argument ${argumentName},`,
                            `expected: ${func.args[argumentName]}, actual: ${type}`]);
                            JS_type_assert(type===func.args[argumentName],message);
                        }
                        func.args[argumentName]=type;
                    }
                    parse_node(argument);
                    cpp_generator.addRaw(', ');
                    i++;
                }
                if (expr.arguments.length>0){
                    //delete traling ,
                    cpp_generator.deleteTralingComma(2);
                }
                cpp_generator.addCode(')');
                //Parse function's body if it's user-defined function (not console.log) and was called first time
                if (func!==undefined && func.code===''){
                    cpp_generator._buildFunction(function_name);
                }
                unlockIndent();
            }
            else if (expr.type=='AssignmentExpression'){
                //MemberExpression arr[j] = something;
                const isVariable = (expr) => expr.type==='Identifier' || expr.type==='MemberExpression';
                const oneVariable = isVariable(expr.left) && !isVariable(expr.right);
                const variable = expr.left.name || 'JS_undefined';
                let leftType = getVariableType(expr.left);
                let rightType;
                if(oneVariable){
                    //something like a = 5;
                    //left is passed for case like b = a[0]
                    //we need both of variable names (b and a)
                    rightType = getExpressionType(expr.right,expr.left); 
                    const message = `Varible ${variable} has already declared with type ${cpp_generator.types[variable]}`;
                    JS_type_assert(leftType===rightType,message);
                    cpp_generator.addRaw(`${expr.left.name} = `);
                    parse_node(expr.right);
                    cpp_generator.addRaw(';\n');
                }
                else{
                    //something like a = b, not a = 5
                    rightType = getVariableType(expr.right);
                    if (leftType!==rightType){
                        //TODO: use node.loc
                        //throw new TypeError(`Variable ${variable} has type ${leftType}, not ${rightType}`);
                    }
                    parse_node(expr.left);
                    cpp_generator.addRaw('=');
                    parse_node(expr.right);
                    cpp_generator.addCode('');
                }
                   
            }
            else {
              console.log(node);
              throw new Error(`Invalid ExpressionStatement`);  
            }
            break;
        case 'IfStatement':
            if (node.consequent.body.length===0){
                //skip if with empty body
                break;
            }
            cpp_generator.addRaw('if (');
            parse_node(node.test); //condition
            cpp_generator.addRaw(') {\n');
            incrementIndent();
            parse_node(node.consequent); //if's body
            decrementIndent();
            cpp_generator.addRaw('}\n');
            if (node.alternate!=null){
               cpp_generator.addRaw('else {\n');
               incrementIndent();
               parse_node(node.alternate); //parsing else 
               decrementIndent();
               cpp_generator.addRaw('}\n');
            } 
            break;
        case 'ForStatement':
            //init,test,update,body
            cpp_generator.addRaw('for (');
            if (node.init!==null){
                parse_node(node.init);
                //FIXME: hack for delete last \n
                cpp_generator.deleteTralingComma(1);
            }
            else {
                cpp_generator.addRaw(';');
            }
            parse_node(node.test);
            cpp_generator.addRaw(';');
            parse_node(node.update);
            cpp_generator.addRaw('){\n');
            incrementIndent();
            parse_node(node.body);
            decrementIndent();
            cpp_generator.addRaw('}\n');
            break;
        case 'MemberExpression':
            //handle case like arr[j]
            const name = node.object.name;
            if (cpp_generator.types[name]===undefined){
                //TODO: it maybe function param
                //throw new Error(`Variable ${name} isn't declared, couldn't use ${name}[something]`);
                console.warn(`Variable ${name} isn't declared, couldn't use ${name}[something]`);
            }
            parse_node(node.object);
            cpp_generator.addRaw('[');
            parse_node(node.property);
            cpp_generator.addRaw(']');
            break;
        case 'ReturnStatement':
            const return_type = getExpressionType(node.argument);
            const func_name = cpp_generator.options.function_name; 
            cpp_generator.functions[func_name].ret=return_type;
            cpp_generator.addRaw('return ');
            lockIndent();
            parse_node(node.argument);
            cpp_generator.addCode('');
            unlockIndent();
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
    console.log(`Compiled successfully!\nSee ${args.output}`);
    cpp_generator.save();
}
main();

