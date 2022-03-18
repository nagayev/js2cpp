for (let i=0; i<5; i++){
    if (i>3){
        break;
    }
    console.log(i);
}

let j = 0;
for (;j<5;j++){
    if (j<2) continue;
    console.log(j);
}

let k = 0;
while (k<5){
    console.log(k);
    k+=1;
}