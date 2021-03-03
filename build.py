import os
import glob
import subprocess
from pathlib import Path
from typing import List


def get_tex_paths() -> List[Path]:
    return [Path(f) for f in glob.glob("./*/src/*.tex")]


def create_dist(tex_path: Path) -> Path:
    dist_path = tex_path.parent.parent / "dist"
    os.makedirs(dist_path, exist_ok=True)
    return dist_path


def convert_tex(tex_path: Path, dist_path: Path) -> Path:
    converted_tex_path = dist_path / tex_path.name
    with open(tex_path.resolve(), 'r') as source, \
            open(converted_tex_path.resolve(), 'w') as target:
        converted_tex = source.read().replace('、', '，').replace('。', '．')
        target.write(converted_tex)
    return converted_tex_path


def build_pdf(tex_path: Path, dist_path: Path) -> None:
    command = " ".join([
        "ptex2pdf",
        "-l",
        "-ot",
        '"-halt-on-error"',
        "-output-directory",
        f'"{dist_path.resolve()}"',
        f'"{tex_path.resolve()}"'
    ])
    print(command)
    subprocess.call(command, shell=True)


for tex_path in get_tex_paths():
    dist_path = create_dist(tex_path)
    temp_path = convert_tex(tex_path, dist_path)
    build_pdf(temp_path, dist_path)
    os.remove(temp_path.resolve())
