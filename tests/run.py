from subprocess import check_call
from sys import exit
from glob import glob
#Now we have binaries *.exe and *.elf

bin_type="elf"

files=glob(f'output/*.{bin_type}')
assert len(files)>0
for test_number,file in enumerate(files):
    print(f'Processing file {file}...')
    _file = file.replace(bin_type,'log') 
    __file = _file.replace('output/','output/logs/')
    with open(f'{__file}','w') as log_file:
        try:
           file_without_ext = file[0:file.index(bin_type)-1]
           subprocess.check_call(f"./{file}", shell=True, stdout=log_file)
           print(f'Test {test_number+1} was passed')
        except:
            print(f'Test {test_number+1} was failed')
            exit(test_number)
