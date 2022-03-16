let warn = console.warn;
let error = console.error;
const YELLOW = '\033[0;33m';
const RED = '\033[0;31m';
const NC = '\033[0m';
console.warn = (message) => warn(`${YELLOW}WARNING:${NC} ${message}`);
console.error = (message) => error(`${RED}ERROR:${NC} ${message}`); 
