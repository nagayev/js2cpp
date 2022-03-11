# If you want to update expected results you can run this: npm run update-test simpletest
node js2cpp tests/correct/$1.js -o js_result.cpp
g++ js_result.cpp -o js_bin
./js_bin>tests/correct/expected/$1.txt
