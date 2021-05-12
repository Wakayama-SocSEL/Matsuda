#!/bin/sh

jq 'group_by(.L__nameWithOwner) |
 map(group_by(.S__nameWithOwner)) |
 map(map(select(.[0].state=="success" and .[-1].state=="failure")[-1])) |
 flatten' ./output/test_result.json 
