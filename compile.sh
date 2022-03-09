echo "Creating output"
mkdir output
cp -r stdlib output/stdlib
echo "Compiling correct.js"
node js2cpp.js tests/correct.js  --output output/js_result.cpp
echo "Compiling incorrect.js"
node js2cpp.js tests/incorrect.js  --output output/js_result.cpp #don't produce js_result.cpp
rm -rf output/stdlib #exclude stdlib from output
if [[ $? -gt 0 ]]
then
  exit 0
else
  exit 1
fi
 
