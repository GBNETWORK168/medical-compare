# 將 regular/products.json 轉為網站用精簡資料（不新增任何數字；結構化數字僅取自人工整理欄位原文）
import json,re,sys,datetime,os
SRC=sys.argv[1];OUT=sys.argv[2]
P=json.load(open(SRC))
U='未確認'
def short(v,n=140):
    if v is None: return U
    if isinstance(v,(dict,list)): return v
    v=str(v).strip()
    return v if len(v)<=n else v[:n]+'…'
def gr(v):
    v=str(v)
    if v.startswith('是'): return '是'
    if v.startswith('否'): return '否'
    if v.startswith('不適用'): return '不適用'
    return U
# 人工整理商品之結構化方案（數字逐字取自 products.json 人工欄位）
MAN={
 'HSV1/HSV2/HSV3':dict(combined=False,plans=[
   dict(plan='計劃1',room=1000,misc=100000,surg_max=40000,opd=15000,annual=750000,misc_long=150000),
   dict(plan='計劃2',room=2000,misc=200000,surg_max=60000,opd=20000,annual=1000000,misc_long=300000),
   dict(plan='計劃3',room=3000,misc=300000,surg_max=80000,opd=25000,annual=1500000,misc_long=450000)],
   note='手術費＝每次手術限額×附表二手術比率（最高為表列限額）；住院>30日雜費限額按日數增加'),
 'HAC1-3/HAD1-3':dict(combined=True,plans=[
   dict(plan='計劃1',room=1000,misc=100000,surg_max=None,opd=20000,annual=2500000),
   dict(plan='計劃2',room=2000,misc=200000,surg_max=None,opd=30000,annual=5000000),
   dict(plan='計劃3',room=3000,misc=300000,surg_max=None,opd=40000,annual=7500000)],
   note='實支自「啟動日」(75或80歲)起適用；雜費與住院手術合併限額'),
}
out=[]
for i,p in enumerate(P):
    code=p.get('code',U); m=MAN.get(code)
    sp=p.get('sample_premiums')
    prem={}
    if isinstance(sp,dict):
        if 'plan1' in sp:
            for k,v in sp.items():
                if k.startswith('plan'): prem['計劃'+k[4:]]={a:b for a,b in v.items()}
        elif any(k in sp for k in ('30M','40M')):
            prem['_auto']={k:sp.get(k,U) for k in ('30M','40M','30F','40F')}
        prem_note=short(sp.get('note','') ,120)+(' ｜ '+short(sp.get('source',''),160) if sp.get('source') else '')
    else: prem_note=U
    manual=not str(p.get('extraction_method','')).startswith('自動')
    out.append(dict(id='R%02d'%i,company=p['company'],name=p['name'],code=code,type=p.get('type',U),
      guaranteed=gr(p.get('guaranteed_renewal')),renew_age=p.get('renewal_max_age_num',U),issue_age=short(p.get('issue_age'),60),
      standalone=short(p.get('standalone'),40),main_rule=short(p.get('rider_attach_rules'),160),min_main=short(p.get('min_main_policy'),80),
      room=short(p.get('room_limit')),misc=short(p.get('misc_limit')),surg=short(p.get('surgery_limit')),opd=short(p.get('opd_surgery')),
      prepost=short(p.get('pre_post_opd_er'),100),annual=short(p.get('annual_cap'),100),daily=short(p.get('daily_option'),120),
      cancer=short(p.get('cancer_major_double'),120),copy=short(p.get('copy_receipt'),60),
      prem=prem,prem_note=prem_note,manual=manual,method=short(p.get('extraction_method'),60),
      plans=m['plans'] if m else [],combined=m['combined'] if m else None,plan_note=m['note'] if m else '',
      tii=p.get('tii_product_id',U),url=p.get('source_url',U) if isinstance(p.get('source_url'),str) else json.dumps(p.get('source_url'),ensure_ascii=False)[:200],
      src=(p.get('source_files') or [U])[0] if isinstance(p.get('source_files'),list) else str(p.get('source_files'))))
json.dump(dict(updated=datetime.datetime.fromtimestamp(os.path.getmtime(SRC)).strftime('%Y-%m-%d %H:%M')+'（台北時間）',products=out),open(OUT,'w'),ensure_ascii=False,separators=(',',':'))
print(len(out),os.path.getsize(OUT))
