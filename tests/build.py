from sys import exit
from os import system, name as os_name
from glob import glob

def fail_CI(test_number):
    exit(test_number)

print('Creating folder output...')
system('mkdir -p output/logs')
print('Copy src to output/src')
system('cp -r src/ output/src')

print("Transcomping .js to .cpp...")

files=glob('tests/correct/*.js')
assert len(files)>0
for file in files:
    cpp_file = file.replace('js','cpp')
    system(f'node js2cpp tests/correct/{file} --output {cpp_file}')
#TODO: implement  incorrect tests
print('Compiling .cpp files...')

bin_type="exe"
compiler_flags=''
if os_name == "posix":
    bin_type = "elf"

if bin_type == 'exe':
    compiler_flags = '-static-libstdc++ -static-libgcc'
    
for i,file in enumerate(files):
    binary_ext=file.replace('cpp',bin_type)
    r = system(f'g++ output/$file -o output/{binary_ext} {compiler_flags}')
    if r!=0:
        print(f'Test {i} was failed')
        fail_CI(i)
    else:
        print(f'Test {i} was passed')
print("Deleting src folder")
system('rm -rf output/src') #exclude src from output
