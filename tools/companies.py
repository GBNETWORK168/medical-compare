#!/usr/bin/env python3
"""公司名正規化（唯一來源）＋檢查：同一保險公司只能有一個晶片名稱。
用法：companies.py fix <json>...   就地正規化所有 company 欄位
      companies.py check <json>... 若有非正規名稱或同公司多名稱即 exit 1"""
import json,re,sys
ALIAS={'臺灣':'台灣','台銀':'臺銀','三商':'三商美邦','中壽':'中國','新壽':'新光','國壽':'國泰','富邦人壽':'富邦'}
def canon(c):
    c=(c or '').strip().replace('（','(')
    c=re.sub(r'(人壽)?(保險)?(股份)?(有限公司)?$','',c)
    c=re.sub(r'人壽$','',c)
    return ALIAS.get(c,c) or '其他'
def walk(o,f):
    if isinstance(o,dict):
        for k,v in o.items():
            if k=='company' and isinstance(v,str): o[k]=f(v)
            else: walk(v,f)
    elif isinstance(o,list):
        for v in o: walk(v,f)
def main():
    cmd,files=sys.argv[1],sys.argv[2:];bad=[];seen={}
    for fn in files:
        j=json.load(open(fn))
        if cmd=='fix':
            walk(j,canon);json.dump(j,open(fn,'w'),ensure_ascii=False,indent=None if fn.endswith('regular.json') else 1,separators=(',',':') if fn.endswith('regular.json') else None)
        else:
            def chk(v):
                if canon(v)!=v: bad.append(f'{fn}: 非正規名稱「{v}」→ 應為「{canon(v)}」')
                seen.setdefault(canon(v),set()).add(v);return v
            walk(j,chk)
    if cmd=='check':
        for k,s in seen.items():
            if len(s)>1: bad.append(f'同一公司多個名稱：{k} ← {sorted(s)}')
        if bad: print('公司名檢查失敗：\n'+'\n'.join(bad));sys.exit(1)
        print('公司名檢查 OK：',' '.join(sorted(seen)))
if __name__=='__main__': main()
