#!/bin/sh
# Antes de cada publicação: sobe a versão (sw.js + APP_VER no index.html) e copia index.html para app.html
python3 - <<'PY'
import re
s=open('sw.js').read(); n=int(re.search(r"rta-v(\d+)",s).group(1))+1
open('sw.js','w').write(s.replace('rta-v%d'%(n-1),'rta-v%d'%n,1))
t=open('index.html').read()
open('index.html','w').write(re.sub(r"const APP_VER='[^']*'","const APP_VER='1.0.%d'"%n,t,1))
print('versão 1.0.%d'%n)
PY
cp index.html app.html
