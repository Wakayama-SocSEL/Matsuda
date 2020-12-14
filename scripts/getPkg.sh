rm -rf out/*.json out/temp/*.json
cd libs/express

FMT="git show %H:package.json > ../../out/temp/package.%cd.json && echo 'output: temp/package.%cd.json'"
D_FMT="%Y%m%d-%H%M%S"
git log --pretty=format:"$FMT" --date=format:"$D_FMT" package.json | xargs -I{} bash -c {}
