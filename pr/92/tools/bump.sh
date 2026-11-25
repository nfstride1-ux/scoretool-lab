#!/bin/sh
# Usage: tools/bump.sh [label]   -> new sw.js tag, ?v= on index.html scripts, and version.json
set -e; cd "$(dirname "$0")/.."
D=$(date +%Y-%m-%d); S=$(date +%H%M); L=${1:-deploy}
TAG="v$D-$S-$L"; Q=$(date +%Y%m%d%H%M)
sed -i -E "s/v[0-9]{4}-[0-9]{2}-[0-9]{2}[A-Za-z0-9-]*/$TAG/" sw.js
sed -i -E "s/\?v=[0-9a-z]+/?v=$Q/g" index.html
sh tools/write-version.sh; echo "$TAG"
