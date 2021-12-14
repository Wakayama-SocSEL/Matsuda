#!/bin/bash

function aggregate() {
  B=`jq 'map(select(.state=="'$1'" and .isBreaking)) | length' ./output/proposal_result.json`
  nB=`jq 'map(select(.state=="'$1'" and (.isBreaking | not))) | length' ./output/proposal_result.json`
  echo "[$B,$nB]"
}

function aggregate2() {
  B=`jq 'map(select(.state=="'$1'" and .isBreaking and (.stats.success + .stats.faialure) >= '$2')) | length' ./output/proposal_result.json`
  nB=`jq 'map(select(.state=="'$1'" and (.isBreaking | not) and (.stats.success + .stats.faialure) >= '$2')) | length' ./output/proposal_result.json`
  echo "[$B,$nB]"
}

echo "
const f = `aggregate2 failure 0`
const s = `aggregate2 success 20`
console.log(',テスト変更あり<br>(後方互換性なしの可能性が高い),テスト変更なし<br>(後方互換性なしの可能性が低い)')
console.log('ソフトウェアが一つ以上失敗<br>(実際の後方互換性なし),' + f.join(','))
console.log('ソフトウェアが全て以上失敗<br>(実際の後方互換性不明),' + s.join(','))
console.log('再現率,' + f[0] / (f[0] + f[1]))
console.log('適合率,' + f[0] / (f[0] + s[0]))
" | node | nkf -s > result.csv
