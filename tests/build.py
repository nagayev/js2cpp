from sys import exit
from os import system
from glob import glob

def fail_CI(test_number):
    exit(test_number)

print("Transcomping .js to .cpp...")

files=glob('tests/correct/*.js')
assert len(files)>0
for file in files:
    #cpp_file must be like output/*.cpp
    cpp_file = file.replace('tests/correct/','output/')
    cpp_file = cpp_file.replace('js','cpp')
    system(f'node js2cpp {file} --output {cpp_file}')
#TODO: implement  incorrect tests
print('Compiling .cpp files...')


compiler_flags = '-static-libstdc++ -static-libgcc'
    
for i,_file in enumerate(files):
    file = _file.replace('tests/correct/','output/')
    file = file.replace('js','cpp')
    binary_elf = file.replace('cpp','elf')
    binary_exe = file.replace('cpp','exe')
    r1 = system(f'g++ {file} -o {binary_elf}')
    r2 = system(f'i686-w64-mingw32-g++ {file} -o {binary_exe} {compiler_flags}')
    if r1!=0 and r2!=0:
        print(f'Test {i+1} was failed')
        fail_CI(i)
    else:
        print(f'Test {i+1} was passed')
print("Deleting src folder")
system('rm -rf output/src') #exclude src from output
