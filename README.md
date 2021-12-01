# 研究用リポジトリ

## 実行手順
### 0. 準備
```console
$ git clone https://github.com/mzdkzk/survey.git
$ docker-compose build
$ mv path/to/dataset ./dataset
```

### 1. analysis
`repository_versions`、`analysis_result`を生成
```console
$ docker-compose run --rm main yarn docker:analysis --build-arg repos=リポジトリ数
$ docker-compose run --rm main yarn analysis -c 個数 -p コンテナ数
```

### 2. experiment
`test_result`を生成
```console
# 1. の結果から runner-experiment/input.json を生成
$ docker-compose run --rm main ./scripts/loadAnalysisResult.sh
$ docker-compose run --rm main ./scripts/inputExperiment.sh

# 実行
$ docker-compose run --rm main yarn docker:experiment --build-arg repos=リポジトリ数
$ docker-compose run --rm -e HOST_PWD=$PWD main yarn experiment -c 個数 -p コンテナ数
```

### 3. proposal
`proposal_result`を生成
```console
# 2. の結果から runner-proposal/input.json を生成
$ docker-compose run --rm main ./scripts/loadExperimentResult.sh
$ docker-compose run --rm main ./scripts/inputProposal.sh

# 実行
$ docker-compose run --rm main yarn docker:proposal --build-arg repos=リポジトリ数
$ docker-compose run --rm main yarn proposal -c 個数 -p コンテナ数
```

## データセット

Mujahid, Suhaib, Abdalkareem, Rabe, Shihab, Emad, & McIntosh, Shane. (2019). MSR - Using Others' Tests to Avoid Breaking Updates [Data set]. Zenodo. http://doi.org/10.5281/zenodo.2549129
