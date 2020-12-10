rm -rf out
mkdir out
cd libs/express

FMT="git show %H:package.json > ../../out/package.%cd.json"
D_FMT="%Y%m%d-%H%M%S"
git log --pretty=format:"$FMT" --date=format:"$D_FMT" package.json | xargs -I{} bash -c {}
