from os import name as os_name
from subprocess import check_call
from sys import exit
from glob import glob
#Now we have binaries *.exe and *.elf

bin_type="exe"
if os_name == "posix":
    bin_type = "elf"
print(f'[DEBUG] binary_type is {bin_type}')

files=glob(f'output/*.{bin_type}')
assert len(files)>0
for test_number,file in enumerate(files):
    with open(f'logs/{file_without_ext}.log','w') as log_file:
        try:
           file_without_ext = file[0:file.index(bin_type)-1]
           subprocess.check_call(f"./{file}", shell=True, stdout=log_file)
        except:
            exit(exit_number)
