#!/bin/sh
# 只把本美术批次对 index.html 的两处引入（art.css / art_map.js）暂存进提交，不带入同事未提交的改动
git show HEAD:index.html | python3 -c "
import sys;s=sys.stdin.read()
if 'art.css' not in s: s=s.replace('<link rel=\"stylesheet\" href=\"endgame.css\">','<link rel=\"stylesheet\" href=\"endgame.css\"><link rel=\"stylesheet\" href=\"art.css\">',1)
if 'art_map.js' not in s: s=s.replace('<script src=\"eg_secret.js\"></script>','<script src=\"eg_secret.js\"></script><script src=\"art_map.js\"></script>',1)
sys.stdout.write(s)" > /tmp/idx.html
h=$(git hash-object -w /tmp/idx.html); git update-index --cacheinfo 100644,$h,index.html
