import os
import glob
import subprocess
from pathlib import Path
from typing import List
from distutils.dir_util import copy_tree, remove_tree


def get_tex_paths() -> List[Path]:
    return [Path(f) for f in glob.glob("./*/src/*.tex")]


def convert_tex(tex_path: Path) -> None:
    with open(tex_path, 'r+') as f:
        converted = f.read().replace('、', '，').replace('。', '．')
        f.seek(0)
        f.write(converted)


def build_pdf(tex_path: Path) -> None:
    command = f"latexmk {tex_path.name}"
    subprocess.call(command, cwd=tex_path.parent, shell=True)


def copy_src_to_dist(src_path: Path, dist_path: Path) -> None:
    if os.path.exists(dist_path):
        remove_tree(str(dist_path))
    copy_tree(str(src_path), str(dist_path))


for tex_path in get_tex_paths():
    dist_tex_path = tex_path.parent.parent / 'dist' / tex_path.name
    copy_src_to_dist(tex_path.parent, dist_tex_path.parent)
    convert_tex(dist_tex_path)
    build_pdf(dist_tex_path)
