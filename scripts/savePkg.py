import os
import glob
import json
import subprocess

pkg_filepaths = glob.glob('./out/temp/*.json')
for path in pkg_filepaths:
    with open(path, 'r') as f_temp:
        try:
            f_temp_str = f_temp.read()
            pkg_json = json.loads(f_temp_str)
            with open(f"./out/package.{pkg_json['version']}.json", 'w') as f_new:
                f_new.write(f_temp_str)
            print('copied: ' + pkg_json['version'])
        except Exception as e:
            print('pass: ' + str(e))
