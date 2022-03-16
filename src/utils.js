const assert = require('assert');
const args = require('./args');
const makeString = (arr) => arr.join(''); 

function JS_assert(value,message,CustomError = Error){
    try{
        assert(value,message);
    }
    catch(e){
        throw new CustomError(message);
    }
}

function JS_type_assert(value,message){
    if (!args.no_type_checks) JS_assert(value,message,TypeError);
}

module.exports = {makeString, JS_assert, JS_type_assert};
