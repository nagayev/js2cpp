function enableColorfulDebug(){
    require('./src/color');
}

enableColorfulDebug();

const fs = require('fs');
const {parse} = require("@babel/parser");
const args = require('./src/args');
const {cpp_generator,incrementIndent,decrementIndent} = require('./src/cpp_generator')(parse_node);
const {makeString, JS_assert, JS_type_assert} = require('./src/utils');

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

function getExpressionType(node,anotherNode){
    let ctype; 
    let js_type = node.type;
    switch (js_type){
        case 'UnaryExpression':
        case 'NumericLiteral':
            ctype="JS_int";
            let value = node.value;
            //If it's unary expression (something like -2)
            if (value===undefined && node.operator){
                value = node.argument.value;
            }
            if (value!=parseInt(value)) ctype="JS_float";
            break;
        case 'BooleanLiteral':
            ctype="JS_boolean";
            break;
        case 'StringLiteral':
            ctype="JS_string";
            break;
        case 'TemplateLiteral':
            ctype="JS_string";
            break;
        case 'ArrayExpression':
            const elements = node.elements;
            const first_element = elements[0];
            const message = 'You coudn\'t declare empty array: we don\'t know it\'s type';
            JS_type_assert(first_element!==undefined,message);
            let first_type = first_element.type;
            //if (first_type==='Identifier') first_type = getVariableType(first_element);
            const hasOneType = (element) => {
                //if (element.type==='Identifier') element.type = getVariableType(element);
                //else element.type = getExpressionType(element);
                return element.type == first_type; 
            }
            JS_type_assert(elements.every(hasOneType),'array\'s elements must be not heterogeneous');
            ctype = `JS_Array<${getExpressionType(first_element)}>`;
            cpp_generator.addImport(`"${args.stdlib}/array.h"`);
            break;
        case 'ObjectExpression':
            throw new Error('Unsopperted type: object!');
            //ctype = "map<int64_t>";
            //cpp_generator.addImport('<vector>');
            break;
        case 'CallExpression':
            const callee = node.callee;
            if (callee.type==='MemberExpression') ctype = cpp_generator.types[callee.object.name][callee.property.name];
            else ctype = cpp_generator.types[callee.name];
            ctype = ctype.ret;
            break;
        case 'MemberExpression':
            if(!node.computed){
                ctype = getVariableType(node);
                break;
            }
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
            let leftType,rightType;
            leftType = getExpressionType(node.left);
            rightType = getExpressionType(node.right);
            const comparasionOperators = ['>','<','>=','<=','!=','=='];
            const arithOperators = ['+','-','*','/','**'];
            //const logicOperators = ['|','&','<<','>>','>>>'];
            //TODO: hack
            const isNumberType = (type) => type === 'int64_t' || type=='float';
            if (!isNumberType(leftType) || !isNumberType(rightType)) {
                JS_type_assert(false,`You can apply binary operation ${node.operator} only to numbers`);
            }
            if (comparasionOperators.includes(node.operator)){
                ctype = "bool";
            }
            else if (arithOperators.includes(node.operator)){
                JS_assert(leftType===rightType,"Invalid operator usage: both arguments should have the same type");
                //console.log("You coudn't use syntax like 2+\"abc\"");
                ctype=leftType;
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
            //FIXME: We will have problems with something like Math['E']
            if (!node.computed){
                //for cases like Math.E
                const type = cpp_generator.types[node.object.name][node.property.name]; 
                if (type===undefined) JS_type_assert(false,'We coudn\'t understood type');
                return type;
            }
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
    //parse // or /* 
    if (node.leadingComments){
        let start, end;
        for(let commentary of node.leadingComments){
            start = "//";
            end = "";
            if (commentary.type==="CommentBlock"){
                start = "/*";
                end = "*/";
            }
            cpp_generator.addRaw(`${start}${commentary.value}${end}\n`);
        }
    }
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
        case 'TemplateLiteral':
            cpp_generator.addImport(`"${args.stdlib}/string_format.h"`);
            let rawString = `std::format("`;
            let formaters = [];
            function compare(a, b) {
                if (a.start<b.start) {
                    return -1;
                }
                if (a.start>b.start) {
                    return 1;
                }
                return 0;
            }

            const mergedArray = node.expressions.concat(node.quasis);
            mergedArray.sort(compare);
            for (element of mergedArray) {
                if (element.tail!==undefined) {
                    rawString+=element.value.raw;
                }
                else {
                    rawString+=`{}`;
                    formaters.push(element.name);
                }
            }
            
            rawString = `${rawString}",${formaters.join()})`;
            cpp_generator.addRaw(rawString);
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
            if (node.operator==="**") throw new Error("Unsupported operator **");
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
            //FIXME: dirty hack
            if (!cpp_generator.options.HACKY_EXPR){
                cpp_generator.addCode('');
            }
            break;
        case 'FunctionDeclaration':
            //NOTE: we parse function's body when user calles function first time
            JS_assert(!node.async,'We don\'t support async functions');
            JS_assert(!node.generator,'We don\'t support generators');
            const function_name = node.id.name;
            cpp_generator.types[function_name]={args:{},ret:'void',code:'',node:node};
            for (param of node.params){
                cpp_generator.types[function_name].args[param.name]=''; //unknown type
            }
            break;
        case 'Identifier':
            cpp_generator.addRaw(node.name);
            break;
        case 'CallExpression':
            //FIXME: it's a dirty hack
            let new_node = {};
            new_node.type = 'ExpressionStatement';
            new_node.expression = node;
            cpp_generator.options.HACKY_EXPR = true;
            parse_node(new_node);
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
                let object_name, function_name;
                parse_node(expr.callee);
                cpp_generator.addRaw('(');
                
                if (expr.callee.type=='MemberExpression'){
                    //handle something like Math.cos(0);
                    object_name = expr.callee.object.name;
                    function_name = expr.callee.property.name;
                }
                //handle something like test(1), without object like console;
                else if (expr.callee.type=='Identifier'){
                    object_name = undefined;
                    function_name = expr.callee.name;
                }

                //parse function's arguments
                let i = 0;
                let expectedFunc;
                if (object_name){
                    expectedFunc = cpp_generator.types[object_name][function_name];
                }
                else {
                    expectedFunc = cpp_generator.types[function_name];
                }

                if (expectedFunc===undefined){
                    JS_type_assert(false,`Function ${function_name} is undefined`);
                }
                const argumentsNames = expectedFunc.args?Object.keys(expectedFunc.args):[];
                //arguments checking is disabled for functions like console.log
                if(!expectedFunc.disable_checking){
                    const expectedCount = Object.keys(expectedFunc.args).length;
                    const actualCount = Object.keys(expr.arguments).length;
                    JS_type_assert(expectedCount===actualCount,'Invalid number of arguments');
                }
                for (argument of expr.arguments){
                    if (!expectedFunc.disable_checking && expectedFunc.code!=''){
                        //if user previous called this function
                        const argumentName = argumentsNames[i];
                        let type;
                        //if it's variable it should be defined
                        if (argument.type==='Identifier'){
                            type = getVariableType(argument);
                            JS_type_assert(type!==undefined,`Variable ${argument.name} is undefined`);
                        } 
                        else type = getExpressionType(argument);
                        //check typeOf argument if it was defined and isn't equal to any
                        if (expectedFunc.args[argumentName]!=='' && expectedFunc.args[argumentName]!=='any'){
                            let expectedType = expectedFunc.args[argumentName];
                            if (expectedType.includes('|')) {
                                //handle cases like int64_t|float
                                let expectedTypes = expectedType.split('|');
                                if (expectedTypes.includes(type)){
                                    type = expectedType;
                                }
                            }
                            const message = makeString([`Invalid typeof argument ${argumentName},`,
                            `expected: ${expectedType}, actual: ${type}`]);
                            JS_type_assert(type===expectedType,message);
                        }
                        expectedFunc.args[argumentName]=type;
                    }
                    parse_node(argument);
                    cpp_generator.addRaw(', ');
                    i++;
                }
                if (expr.arguments.length>=1){
                    //delete traling ,
                    cpp_generator.deleteTralingComma(2);
                }
                cpp_generator.addCode(')');
                //Parse function's body if it's user-defined function (not console.log) and was called first time
                if (expectedFunc!==undefined && expectedFunc.code===''){
                    cpp_generator._buildFunction(function_name);
                }
            }
            else if (expr.type=='AssignmentExpression'){
                //MemberExpression arr[j] = something;
                const isVariable = (expr) => expr.type==='Identifier' || expr.type==='MemberExpression';
                const oneVariable = isVariable(expr.left) && !isVariable(expr.right);
                const variable = expr.left.name;
                let leftType = getVariableType(expr.left);
                let rightType;
                if (oneVariable){
                    //something like a = 5;
                    //left is passed for case like b = a[0]
                    //we need both of variable names (b and a)
                    rightType = getExpressionType(expr.right,expr.left); 
                    const message = `Varible ${variable} has already declared with type ${cpp_generator.types[variable]}`;
                    JS_type_assert(leftType===rightType,message);
                    cpp_generator.addRaw(`${expr.left.name} ${expr.operator} `);
                    parse_node(expr.right);
                    cpp_generator.addRaw(';\n');
                }
                else{
                    //something like a = b, not a = 5
                    rightType = getVariableType(expr.right);
                    if (leftType!==rightType){
                        //TODO: use node.loc
                        throw new TypeError(`Variable ${variable} has type ${leftType}, not ${rightType}`);
                    }
                    parse_node(expr.left);
                    cpp_generator.addRaw(expr.operator);
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
            if (node.consequent.type=="BlockStatement" &&  node.consequent.body.length===0){
                //skip if with empty body
                console.log('[INFO] Skip if with empty body');
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
            cpp_generator.addRaw('for (');
            if (node.init!==null){
                parse_node(node.init);
                //NOTE: hack for deleting last \n
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
        case 'WhileStatement':
            cpp_generator.addRaw('while (');
            parse_node(node.test);
            cpp_generator.addRaw('){\n');
            incrementIndent();
            parse_node(node.body);
            decrementIndent();
            cpp_generator.addRaw('}\n');
            break;
        case 'BreakStatement':
            JS_assert(node.label===null,"We don't support break with label");
            cpp_generator.addCode('break');
            break;
        case 'ContinueStatement':
            JS_assert(node.label===null,"We don't support continue with label");
            cpp_generator.addCode('continue');
            break;
        case 'MemberExpression':
            //handle case like arr[j] or Math.E
            let open,close;
            open = "[";
            close = "]";
            const name = node.object.name;
            const standartObjects = cpp_generator.std_objects;
            if (standartObjects.hasOwnProperty(node.object.name)){
                let slash = "";
                if (args.stdlib!=='' && !args.stdlib.endsWith('\\')) slash="/";
                let path = cpp_generator.std_objects[node.object.name].__import_path__;
                cpp_generator.addImport(`"${args.stdlib}${slash}${path}"`);
            }
            if (cpp_generator.types[name]===undefined){
                //TODO: it maybe function param
                JS_type_assert(false,`Variable ${name} isn't declared, couldn't use it as object`);
                //console.warn(`Variable isn't declared, use object ${name} carefully`);
            }
            if (!node.computed) {
                //object.property, not object['property']
                open = ".";
                close = "";
            }
            parse_node(node.object);
            cpp_generator.addRaw(open);
            parse_node(node.property);
            cpp_generator.addRaw(close);
            break;
        case 'TryStatement':
            cpp_generator.addImport(`"${args.stdlib}/errors.h"`);
            let hasClause = false;
            if (node.handler.param!==null){
                hasClause = true;
            }
            if(hasClause){
                JS_assert(false,'We don\'t support catch clause');
                //cpp_generator.addRaw('');
            }
            cpp_generator.addRaw('JS_try{\n');
            incrementIndent();
            cpp_generator.addCode('HANDLE_ERRORS()');
            parse_node(node.block);
            decrementIndent();
            cpp_generator.addRaw('}\n');
            let platformSpecificClause = '...';
            if (process.platform === "win32") {
                //NOTE: we don't need to import windows.h because it included in 'errors.h'
                platformSpecificClause = "EXCEPTION_EXECUTE_HANDLER";
            }
            cpp_generator.addRaw(`JS_catch(${platformSpecificClause}){\n`);
            incrementIndent();
            parse_node(node.handler.body);
            decrementIndent();
            cpp_generator.addRaw('}\n');
            break;
            break;
        case 'ReturnStatement':
            const return_type = getExpressionType(node.argument);
            const func_name = cpp_generator.options.function_name; 
            cpp_generator.functions[func_name].ret=return_type;
            cpp_generator.addRaw('return ');
            parse_node(node.argument);
            cpp_generator.addCode('');
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

