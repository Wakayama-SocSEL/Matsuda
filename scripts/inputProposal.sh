#!/bin/sh


jq -r 'group_by(.L__nameWithOwner, .S__nameWithOwner) |
 map(select(.[0].state=="success")) |
 map(select(length >= 2)[-2:]) |
 map({
   nameWithOwner: .[0].L__nameWithOwner,
   state: .[1].state,
   updated: {
     version: .[1].L__version,
     hash: .[1].L__hash
   },
   prev: {
     version: .[0].L__version,
     hash: .[0].L__hash,
   }
 }) |
 unique |
 group_by(.nameWithOwner, .updated.version, .prev.version) |
 map(.[0]) |
 flatten' ./output/test_result.json > ./runner-proposal/inputs.json
