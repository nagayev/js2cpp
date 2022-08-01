let warn = console.warn;
let error = console.error;
const YELLOW = '\033[0;33m';
const RED = '\033[0;31m';
const NC = '\033[0m';
console.warn = (message) => warn(`${YELLOW}WARNING:${NC} ${message}`);
console.error = (message) => error(`${RED}ERROR:${NC} ${message}`);

Object.defineProperty(global, '__stack', {
get: function() {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
get: function() {
        return __stack[1].getLineNumber();
    }
});

Object.defineProperty(global, '__function', {
get: function() {
        return __stack[1].getFunctionName();
    }
});
