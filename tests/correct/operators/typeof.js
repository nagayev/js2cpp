const n = typeof 123;
const f = typeof 123.123;
const s = typeof "123";
const arr = typeof [1,2,3];
_assertEqual(n,"number");
_assertEqual(f,"number");
_assertEqual(s,"string");
_assertEqual(arr,"object");
