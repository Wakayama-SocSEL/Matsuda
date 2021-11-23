function aggregate() {
  B=`jq 'map(select(.state=="'$1'" and .isBreaking)) | length' ./output/proposal_result.json`
  nB=`jq 'map(select(.state=="'$1'" and (.isBreaking | not))) | length' ./output/proposal_result.json`
  echo "$B\t$nB"
  echo "再現率: "`node -e "console.log($B / ($B + $nB))"`
}
aggregate failure
aggregate success

function aggregate100() {
  B=`jq 'map(select(.state=="'$1'" and .isBreaking and .prev.coverage.lines.pct>=95)) | length' ./output/proposal_result.json`
  nB=`jq 'map(select(.state=="'$1'" and (.isBreaking | not) and .prev.coverage.lines.pct>=95)) | length' ./output/proposal_result.json`
  echo "$B\t$nB"
  echo "再現率: "`node -e "console.log($B / ($B + $nB))"`
}
aggregate100 failure
aggregate100 success

function successRange() {
  SB=`jq 'map(select(.state=="success")) | sort_by(.stats.success) | .['$1':'$2'] | map(select(.isBreaking)) | length' ./output/proposal_result.json`
  SnB=`jq 'map(select(.state=="success")) | sort_by(.stats.success) | .['$1':'$2'] | map(select(.isBreaking | not)) | length' ./output/proposal_result.json`
  echo "$SB\t$SnB\t"`node -e "console.log($SnB / ($SB + $SnB))"`
}
successRange 0 120
successRange 120 240
successRange 240 360
successRange 360
