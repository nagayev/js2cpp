let a = 2n;
let b = 3n; //NOTE: we coudn't use BigInt(3)
let c = a+b;
let d = b-a;
_assert(c>a);
_assert(d<a);
