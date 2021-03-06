const fs = require('fs');
const args = require('./args');

const incrementIndent = () =>  cpp_generator.options.indentLevel++;
const decrementIndent = () => cpp_generator.options.indentLevel--;


const defaultOptions = {
    indentLevel:1,
    function_name:'' //string if we are parsing function's code
};

//gets types for default Objects like console
function _getDefaultTypes(){
    let types = {};
    const standartModules = fs.readdirSync(`${args.stdlib}/types`);
    const files = standartModules.map((module)=>`${args.stdlib}/types/${module}`);
    for (file of files) {
       const content = fs.readFileSync(file);
       Object.assign(types,JSON.parse(content));
    }
    return types;
}

function _getStdObjects(types){
    for (let i in types){
        if (types[i].__import_path__===undefined){
            delete types[i];
        }
    }
    return types;
}

class CPPGenerator{
    
    constructor(filename='js_result.cpp'){
        this._cpp = ""; //cpp code
        this.types = _getDefaultTypes(); //types of js variables
        this.std_objects = _getStdObjects(Object.assign({},this.types));
        this.functions_code = ""; //like this._cpp, but for functions
        this._modules = new Set(['<iostream>',`"${args.stdlib}/builtins.h"`]); //cpp includes
        this.options = defaultOptions; //options like formating
        this._filename = filename; //output filename
    }

    _getSpacesByLevel(level){
        //3 spaces for level 2, 6 for level 3
        const SPACE = ' ';
        const SPACES_PER_LEVEL = 3;
        const lastChar = this.options.function_name==='' ? this._cpp[this._cpp.length-1]: 
            this.types[this.options.function_name].code.slice(-1);
        if (lastChar!='\n' || this.options.locked || args.no_format) return '';
        return SPACE.repeat(SPACES_PER_LEVEL*(level-1));
    }
    
    addCode(code){
        const options = this.options;
        const spaces = this._getSpacesByLevel(options.indentLevel);
        const result_code = `${spaces}${code};\n`
        if (options.function_name!==''){
            this.types[options.function_name].code+=result_code;
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
            this.types[this.options.function_name].code=this.types[this.options.function_name].code.slice(0,-l);
        }
    }

    _buildFunction(name){
        const func = this.types[name];
        cpp_generator.options.function_name=name;
        incrementIndent();
        this.__parse_node__(func.node.body);
        decrementIndent();
        let code = `${func.ret} ${name}(`;
        for (let arg in func.args){
           code+=`${func.args[arg]} ${arg}, `; 
        }
        //if it's necessary, delete last `, `
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
        const spaces = this._getSpacesByLevel(options.indentLevel);
        const result_code = `${spaces}${code}`;
        if (options.function_name!==''){
            this.types[options.function_name].code+=result_code;
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
        if (args.sort_imports) {
            this._modules = Array(...this._modules).sort();
        }
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

module.exports = (parse_node)=>{
    cpp_generator.__parse_node__ = parse_node;
    return {cpp_generator,incrementIndent,decrementIndent};
};
