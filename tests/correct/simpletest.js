function test(){
    console.log('Function test was called');
}
test();
let a = 2;
let b = 2;
let boolean_var = false;
b = a;
let c = [1,2,3];
c = [4,5];
b = c[0];
console.log(a);
console.log(b);
console.log(c);
console.log(boolean_var);
//NOTE: we coudn't print c
let i = 0;
for(;i<5;i++){
    console.log(i);
}
