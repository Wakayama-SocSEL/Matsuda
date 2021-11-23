jq '
map(select(
  .state=="failure" and
  (.isBreaking | not)
)) | 
map({
   url: ("https://github.com/" + .nameWithOwner + "/compare/" + .prev.hash + "..." + .updated.hash),
   testCases: .testCases,
   otherCodes: .otherCodes,
   stats: .stats
})' ./output/proposal_result.json
