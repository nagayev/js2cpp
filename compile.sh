echo "Compiling correct.js"
node js2cpp.js tests/correct.js
echo "Compiling incorrect.js"
node js2cpp.js tests/incorrect.js #don't produce js_result.cpp
if [[ $? -gt 0 ]]
then
  exit 0
else
  exit 1
fi
 
