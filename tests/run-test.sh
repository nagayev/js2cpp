# !/bin/sh
#PARENT_COMMAND=$(ps -o comm= $PPID)
touch tmp_output.cpp
touch tmp.log
node js2cpp $1 --output tmp_output.cpp > /dev/null
g++ tmp_output.cpp -o tmp_bin
./tmp_bin 2> tmp.log #redirect stderr
log_size=$(stat --printf="%s" tmp.log)
if [ $log_size -ne 0 ]; then
        echo "Test failed"
        echo "For details see tmp.log"
else
        echo "Test passed"
        rm -rf tmp.log
fi
rm -rf tmp_bin tmp_output.cpp
