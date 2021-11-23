jq -r '
map(select(
  .L__hash=="'$1'"
)) 
| map(
  .S__nameWithOwner + "\n" + .err + "\n====================="
) 
| .[]' ./output/test_result.json | less
