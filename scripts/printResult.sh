SB=`jq 'map(select(.state=="success" and .isBreaking)) | length' ./output/proposal_result.json`
FB=`jq 'map(select(.state=="failure" and .isBreaking)) | length' ./output/proposal_result.json`
SnB=`jq 'map(select(.state=="success" and (.isBreaking | not))) | length' ./output/proposal_result.json`
FnB=`jq 'map(select(.state=="failure" and (.isBreaking | not))) | length' ./output/proposal_result.json`
echo "$FB\t$FnB"
echo "$SB\t$SnB"
echo "再現率: "`node -e "console.log($FB / ($FB + $FnB))"`
