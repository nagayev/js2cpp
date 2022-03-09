echo "Creating output"
mkdir output
cp -r stdlib output/stdlib

echo "Compiling correct tests..."

all_tests=$(ls tests/correct | wc -l)
i=1
for file in $(ls tests/correct)
do
cpp_ext="${file%.js}.cpp"
echo Test $i/$all_tests
node js2cpp.js tests/correct/$file  --output output/$cpp_ext
i=$(($i+1));
done

echo "Compiling incorrect tests..."

all_tests=$(ls tests/incorrect | wc -l)
i=1
for file in $(ls tests/incorrect)
do
echo Test $i/$all_tests
node js2cpp.js tests/incorrect/$file  --output output/js_result.cpp #don't produce js_result.cpp
# panic if something is ok
if [[ $? -eq 0 ]]
then
  exit 1
fi
i=$(($i+1));
done

for file in $(ls output/ | grep .cpp)
do
without_ext="${file%.cpp}"
g++ output/$file -o output/$without_ext
# panic if something went wrong
if [[ $? -gt 0 ]]
then
  exit 1
fi
done

echo "Deleting stdlib folder"
rm -rf output/stdlib #exclude stdlib from output
 
