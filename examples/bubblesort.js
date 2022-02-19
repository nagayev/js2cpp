function bubble(arr) {
    //var len = arr.length;
    let len = 5;
    
    for (var i = 0; i < len ; i++) {
        for (var j = 0 ; j < len - i - 1; j++) { // this was missing
        if (arr[j] > arr[j + 1]) {
          // swap
          var temp = arr[j];
          arr[j] = arr[j+1];
          arr[j + 1] = temp;
        }
       }
    }
    return arr;
}
console.log(bubble([3,1,5,2,4]));
