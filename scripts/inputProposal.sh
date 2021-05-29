#!/bin/sh


jq -r 'group_by(.L__nameWithOwner) |
 map(group_by(.S__nameWithOwner)) |
 map(map(select(.[0].state=="success" and .[-1].state=="failure")[-2:])) |
 map(map({
   nameWithOwner: .[1].L__nameWithOwner,
   breaking: {
     version: .[1].L__version,
     hash: .[1].L__hash
   },
   prev: {
     version: .[0].L__version,
     hash: .[0].L__hash,
   }
 })) |
 flatten |
 unique' ./output/test_result.json > ./runner-proposal/inputs.json
