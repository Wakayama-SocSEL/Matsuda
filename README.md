# 研究用リポジトリ

## 実行手順
```sh
$ git clone https://github.com/mzdkzk/survey.git
$ docker-compose build
$ docker-compose run --rm main yarn start
```

## データセット
> Mujahid, Suhaib, Abdalkareem, Rabe, Shihab, Emad, & McIntosh, Shane. (2019). MSR - Using Others' Tests to Avoid Breaking Updates [Data set]. Zenodo. http://doi.org/10.5281/zenodo.2549129

入力として用いるデータ(`./runner/input.json`)は以下のコマンドで抽出しています
```sh
$ mv path/to/dataset ./dataset
$ docker-compose run --rm -w /code/runner main ./getInput.sh
```
