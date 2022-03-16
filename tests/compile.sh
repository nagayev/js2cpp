echo "Creating output"
mkdir -p output/logs
cp -r src/stdlib output/stdlib

echo "Compiling correct tests..."

all_tests=$(ls tests/correct | wc -l)
i=1
for file in $(ls tests/correct)
do
cpp_ext="${file%.js}.cpp"
echo Test $i/$all_tests
node js2cpp.js tests/correct/$file  --output output/$cpp_ext
echo "Test $i was passed!"
i=$(($i+1));
done

echo "Compiling incorrect tests..."

all_tests=$(ls tests/incorrect | wc -l)
i=1
for file in $(ls tests/incorrect)
do
echo Test $i/$all_tests
#don't produce js_result.cpp and don't show errors
node js2cpp.js tests/incorrect/$file  --output output/js_result.cpp > /dev/null
# panic if incorrect test was compiled
if [[ $? -eq 0 ]]
then
  exit 1
else
  echo "Test $i was passed!"
fi
i=$(($i+1));
done

bin_type="exe"
if [[ $(uname) -eq "Linux" ]] 
then
bin_type="elf"
fi

for file in $(ls output/ | grep .cpp)
do
binary_ext="${file%.cpp}.${bin_type}"
g++ output/$file -o output/$binary_ext
# panic if something went wrong
if [[ $? -gt 0 ]]
then
  exit 1
fi
done

echo "Deleting stdlib folder"
rm -rf output/stdlib #exclude stdlib from output
 
