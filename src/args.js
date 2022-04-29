const { ArgumentParser } = require('argparse');
const defaultArgs = {
    output:'js_result.cpp',
    stdlib:'src/stdlib',
    no_type_checks:false,
    no_format:false,
    sort_imports:false
};
const parser = new ArgumentParser({});

parser.add_argument("filename", {type:"str", help:"Input Javascript file"});
parser.add_argument('-o', '--output', { help: `Output name, default is ${defaultArgs.output}` });
parser.add_argument('-s', '--stdlib', { help: `Path to stdlib folder, default is ${defaultArgs.stdlib}` });
parser.add_argument('--no_type_checks', '--no-type-checks', { help: `Don't check JavaScript types, default is ${defaultArgs.no_types}`,
action:'store_true' });
parser.add_argument('--no_format', '--no-format', { help: `Don't format output code, default is ${defaultArgs.no_format}`,
action:'store_true' });
parser.add_argument('--sort_imports', '--sort-imports', { help: `Sort C++ imports, default is ${defaultArgs.sort_imports}`,
action:'store_true' });

if (process.argv.length<3){
    console.error("Invalid script usage!");
}

const args = parser.parse_args();

//Check experimental args

if (args.no_type_checks){
    console.warn(`\`no-type-checks\` is a very unstable feature`);
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

module.exports = args;
