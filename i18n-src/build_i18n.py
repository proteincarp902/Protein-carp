import json
en={}; ur={}; bn={}; items={}
for f in ['tr1.tsv','tr2.tsv','tr3.tsv']:
    for ln in open(f,encoding='utf-8'):
        p=ln.rstrip('\n').split('\t')
        if len(p)==3: en[p[0]]=p[1]; ur[p[0]]=p[2]
for f in ['tr4.tsv','tr5.tsv']:
    for ln in open(f,encoding='utf-8'):
        p=ln.rstrip('\n').split('\t')
        if len(p)==2: ur[p[0]]=p[1]
for f in ['bn1.tsv','bn2.tsv','bn3.tsv','bn4.tsv']:
    for ln in open(f,encoding='utf-8'):
        p=ln.rstrip('\n').split('\t')
        if len(p)==2: bn[p[0]]=p[1]
itl=[l.rstrip('\n').split('\t') for l in open('it1.tsv',encoding='utf-8') if l.strip()]
bnl=[l.rstrip('\n') for l in open('bnit.txt',encoding='utf-8')]
assert len(itl)==len(bnl)
for p,b in zip(itl,bnl): items[p[0].strip()]=[p[1],p[2],b]
en['بهارات']='Spices'
js="/* Translations for the operations app: UI phrases (Arabic → English / Urdu / Bengali) and item names [en, ur, bn].\n   Generated from i18n-src/*; item fields nameEn / nameUr / nameBn take precedence over these. */\n"
js+="window.PC_I18N = "+json.dumps({"en":en,"ur":ur,"bn":bn},ensure_ascii=False,separators=(',',':'))+";\n"
js+="window.PC_ITEMS_I18N = "+json.dumps(items,ensure_ascii=False,separators=(',',':'))+";\n"
for f in ['/home/claude/repo/Protein-carp/i18n.js','demo/i18n.js']: open(f,'w',encoding='utf-8').write(js)
print(len(en),len(ur),len(bn),len(items))
