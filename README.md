# 研究用リポジトリ

## 実行手順
### 1. 準備
```console
$ git clone https://github.com/mzdkzk/survey.git
$ docker-compose build
$ docker-compose run --rm main yarn docker:analysis
$ docker-compose run --rm main yarn docker:experiment
```

### 2. 分析
#### 準備(省略可能)
```console
$ mv path/to/dataset ./dataset
$ docker-compose run --rm main ./scripts/initDB.sh
$ docker-compose run --rm main ./scripts/inputAnalysis.sh
```

#### 実行

* 第一引数 ... 実行する`runner-analysis/input.json`の最大数
* 第二引数 ... 並列実行するコンテナ数

```console
$ docker-compose run --rm main yarn analysis 10 3
```

### 3. 実験
#### 準備(省略可能)
```console
$ docker-compose run --rm main ./scripts/loadAnalysisResult.sh
$ docker-compose run --rm main ./scripts/inputExperiment.sh
```

#### 実行

* 第一引数 ... 実行する`runner-experiment/input.json`の最大数
* 第二引数 ... 並列実行するコンテナ数

```console
$ docker-compose run --rm main yarn experiment 10 3
```

## データセット

Mujahid, Suhaib, Abdalkareem, Rabe, Shihab, Emad, & McIntosh, Shane. (2019). MSR - Using Others' Tests to Avoid Breaking Updates [Data set]. Zenodo. http://doi.org/10.5281/zenodo.2549129
