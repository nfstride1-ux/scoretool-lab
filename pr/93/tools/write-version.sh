#!/bin/sh
# version.json always mirrors the tag in sw.js (the app polls it to show "New version ready").
cd "$(dirname "$0")/.."
V=$(grep -oE 'v[0-9]{4}-[0-9]{2}-[0-9]{2}[A-Za-z0-9-]*' sw.js | head -1)
printf '{"version":"%s"}\n' "$V" > version.json
