#!/usr/bin/env bash

BASEDIR=$(dirname "$0")
DATA_DIR=.data
DIR1=$1
DIR2=$2

if [ "$DIR1" = "" ] || [ "$DIR2" = "" ]; then
  echo "Usage $0 DIR1 DIR2 [DIR3 ...]"
  exit 1
fi

OUTPUT=data.js

# clone data
if [ ! -d $DATA_DIR ]; then
  git clone https://github.com/dailyrandomphoto/hexo-benchmark-data.git $DATA_DIR
else
  cd $DATA_DIR
  git pull -f
  cd ..
fi

rm -rf .work
mkdir -p .work
cd .work

# copy data files
for var in "$@"
do
    var=`echo $var | perl -pe 's/^(data-)?/data-/'`
    echo "copy $var"
    cp ../$DATA_DIR/$var/* ./
done

echo "const map = {};" > $OUTPUT

ls -l | grep -o -P "[\w-]+-node-\w+" |  perl -pe 's#(.*)#map["$1"] = [];#' >> $OUTPUT

grep "|" *node* | grep -v grep | perl -pe 's#([\w-]+-node-\w+).+:\| +(.*?)\s+\|\s+(.*?)\s+\|#map["$1"].push({"$2": "$3"});#' >> $OUTPUT

echo "module.exports=map;" >> $OUTPUT

node ../$BASEDIR/gen.js > result.md
