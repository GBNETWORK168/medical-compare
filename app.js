'use strict';
const S={type:null,ded:null,reg:null,co:null,pick:null,plan:null,pick2:null,plan2:null,cap:null,cmp:[]};
const $=q=>document.querySelector(q);
const U='未確認',W=n=>n==null||isNaN(n)?null:Number(n);
const f=n=>n==null?'<span class="unk">未確認</span>':Number(n).toLocaleString('zh-TW');
const wan=n=>n==null?'<span class="unk">未確認</span>':(n>=10000?(+(n/10000).toFixed(2))+'萬':Number(n).toLocaleString('zh-TW'));
const esc=s=>String(s==null?U:s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const unk=s=>/^未確認/.test(String(s))?`<span class="unk">${esc(s)}</span>`:esc(s);
const SC=[100000,300000,500000];
const TYPES=[['reg','一般實支','單買一張'],['ded','自負額實支','單買一張'],['combo','一般＋自負額','組合看總保障'],['cmp','商品比較','2–4張並排'],['fubon','富邦比較','資料支持的優劣']];
const IC={pre:'<path d="M4 20h16M6 20V9l6-5 6 5v11M10 20v-5h4v5" stroke="#1f6fd1" stroke-width="2" fill="none"/>',
 room:'<path d="M3 18V8m0 6h18v4M7 14v-3h5a3 3 0 0 1 3 3" stroke="#1f6fd1" stroke-width="2" fill="none"/><circle cx="7" cy="10" r="1.6" fill="#1f6fd1"/>',
 surg:'<path d="M5 19l9-9m2-2 3-3M13 7l4 4M4 20l2-2" stroke="#1f6fd1" stroke-width="2" fill="none"/>',
 misc:'<rect x="5" y="4" width="14" height="17" rx="2" stroke="#1f6fd1" stroke-width="2" fill="none"/><path d="M9 9h6M9 13h6M9 17h3" stroke="#1f6fd1" stroke-width="2"/>',
 opd:'<path d="M12 3v18M3 12h18" stroke="#1f6fd1" stroke-width="3"/>',
 post:'<path d="M5 12h11m-4-5 5 5-5 5M19 4v16" stroke="#1f6fd1" stroke-width="2" fill="none"/>'};
const icon=k=>`<div class="ic"><svg viewBox="0 0 24 24">${IC[k]}</svg></div>`;
const CO_ALIAS={'臺灣':'台灣','台銀':'臺銀','三商':'三商美邦','中壽':'中國','新壽':'新光','國壽':'國泰'};const coN=c=>{c=(c||'').trim().replace(/(人壽)?(保險)?(股份)?(有限公司)?$/,'').replace(/人壽$/,'');return CO_ALIAS[c]||c||'其他'};
async function getDed(){if(!S.ded){const j=await (await fetch('data/deductible_products.json')).json();S.ded=j.products.filter(p=>p.id!=='XHQN'||true);S.ded.forEach(p=>p.company=coN(p.company))}return S.ded}
async function getReg(){if(!S.reg){try{const j=await (await fetch('data/regular.json')).json();S.reg=j.products;S.reg.forEach(p=>p.company=coN(p.company));S.regUpd=j.updated}catch(e){S.reg=[]}}return S.reg}
// ---------- view models ----------
function vmDed(p,pl){const n=pl.limit_mode==='net';const room=pl.room_lim==null?null:(n?pl.room_lim:pl.room_lim-pl.room_ded),op=pl.op_lim==null?null:(n?pl.op_lim:pl.op_lim-pl.op_ded);
 const pp=/前|後/.test(p.hosp_scope);const calc=(p.id!=='DHSR'&&p.offset_level!=='未確認'&&pl.net_hosp!=null);
 return {kind:'ded',p,pl,label:`${p.company} ${p.code}`,plan:pl.plan,
  room:{amt:room,unit:'/日',d:pl.room_ded!=null?`每日先自付 ${f(pl.room_ded)}`:''},
  misc:{amt:pl.net_hosp,d:`總費用超過 ${wan(pl.hosp_ded)} 才開始賠`},
  surg:{amt:null,txt:/手術/.test(p.hosp_scope)?'併入雜費額度':'',d:''},
  opd:{amt:op,d:pl.op_ded!=null?`先自付 ${f(pl.op_ded)}`:''},
  prepost:{txt:pp?'併入雜費額度':''},
  ded:pl.hosp_ded,top:pl.bridge,calc,
  pay:(c,first)=>calc?Math.min(Math.max(0,c-Math.max(pl.hosp_ded,first)),pl.net_hosp):null}}
function ex(t){t=String(t||'');return t.length>46?t.slice(0,46)+'…':t}
function vmReg(r,pl){const lab=`${r.company} ${r.code&&!/^未確認/.test(r.code)?r.code.replace(/[(（【].*$/,''):''}`;
 if(!pl)return {kind:'reg',r,label:lab,plan:'',none:true,cap:null,pay:()=>null};
 const dk=(t)=>({txt:'依條款',d:ex(t)});
 const hy=(r.hybrid?`（${r.hybrid}）`:'')+(/^每1單位/.test(pl.plan)?'每單位，×投保單位數':'');const per=/^每1單位/.test(pl.plan);
 return {kind:'reg',r,pl,label:lab,plan:pl.plan,
  room:pl.room!=null?{amt:pl.room,unit:'/日',d:hy}:(r.room_txt?{txt:r.room_txt,d:'無病房費實支'}:(/無病房|無獨立病房/.test(r.room)?{txt:'無',d:ex(r.room)}:dk(r.room))),
  misc:{amt:pl.misc,d:(pl.misc_long?`住院超過30日最高 ${wan(pl.misc_long)}`:(r.combined?'含住院手術':''))+hy},
  surg:r.combined?{txt:'併入雜費額度'}:pl.surg_max!=null?{amt:pl.surg_max,d:'另計'+(/比率|百分率|×/.test(r.surg)?'，依手術比率表，最高':'')}:dk(r.surg),
  opd:pl.opd!=null?{amt:pl.opd,d:''}:(/無|未見/.test(r.opd)?{txt:'無',d:''}:dk(r.opd)),
  prepost:r.prepost_txt?{txt:'併入雜費',d:r.prepost_txt}:{txt:'依條款',d:''},cap:per?null:pl.misc,pay:(c)=>Math.min(c,pl.misc)}}
function vmManual(cap){return {kind:'reg',label:'我現有的一般實支',plan:'',room:{amt:null},misc:{amt:cap},surg:{amt:null},opd:{amt:null},prepost:{txt:''},cap,pay:c=>Math.min(c,cap)}}
// ---------- 醫療保障圖 ----------
function station(k,t,cells){const any=cells.some(c=>c.amt!=null||c.txt);
 const amt=cells.map(c=>c.amt!=null?`${wan(c.amt)}${c.unit||''}`:(c.txt?`<span style="font-size:14px">${c.txt}</span>`:'')).filter(Boolean).join('<br>+ ');
 const d=cells.map(c=>c.d).filter(Boolean).join('；');
 return `<div class="st ${any?'cov':''}">${icon(k)}<div><div class="t">${t}</div><div class="d">${d}</div></div><div class="amt">${any?amt:'<span class="mut">依條款</span>'}</div></div>`}
function diagram(vms,title){const g=k=>vms.map(v=>v[k]);
 const nn=vms.find(v=>v.none);if(nn){const r=nn.r;return `<div class="map"><h3>醫療保障圖</h3><div class="who">${esc(nn.label)}</div><div class="mut" style="padding:10px 0">${r.copay?'<b>'+esc(r.copay)+'</b>'+'。':r.reclass?esc(r.reclass)+'。':''}此商品各方案限額仍在核對中，暫不繪圖；條款摘錄見下方。</div>${detail(nn)}</div>`}
 let h=`<div class="map"><h3>醫療保障圖</h3><div class="who">${vms.map(v=>esc(v.label)+' '+esc(v.plan)).join(' ＋ ')}</div><div class="journey">`;
 h+=station('pre','住院前門急診',g('prepost'))+station('room','住院病房費',g('room'))+station('surg','住院手術',g('surg'))+station('misc','住院雜費（醫材、藥）',g('misc'))+station('opd','門診手術',g('opd'))+station('post','出院後門診',g('prepost'));
 h+='</div>';
 const reg=vms.find(v=>v.kind==='reg'),ded=vms.find(v=>v.kind==='ded');
 if(reg&&ded&&reg.cap!=null){const top=Math.max(ded.top||0,reg.cap,1);const pc=x=>(x/top*100).toFixed(1)+'%';
  const gap=Math.max(0,ded.ded-reg.cap),ov=Math.max(0,reg.cap-ded.ded);
  h+=`<div class="layer"><div class="lb">住院雜費＋手術：兩張怎麼接起來</div><div class="lbar"><div style="width:${pc(reg.cap)};background:var(--ok)">一般 ${wan(reg.cap)}</div>${gap?`<div style="width:${pc(gap)};background:#f0d9d6;color:#b44">自付缺口 ${wan(gap)}</div>`:''}<div style="width:${pc(ded.top-Math.max(ded.ded,reg.cap))};background:var(--blue)">自負額 ${wan(ded.pl.net_hosp)}</div></div><div class="ax"><span>0</span><span>${wan(top)}</span></div>
  <div class="mut">${gap?'一般實支上限低於自負額，中間要自己付。':ov?'兩張額度重疊，依條款取「自負額」與「他保已賠」較大者扣除，重疊部分不重複賠。':'剛好接上，沒有缺口。'}</div></div>`}
 const can=vms.every(v=>v.kind==='ded'?v.calc:v.cap!=null);
 h+='<div class="scn"><div class="lb">住院花費情境（雜費＋手術）</div>';
 if(!can)h+='<div class="mut">此商品方案限額未結構化或條款文義未確認，暫不試算。</div>';
 else for(const c of SC){let first=reg?reg.pay(c):0,dp=ded?ded.pay(c,first):0;const tot=first+dp,self=c-tot;
  h+=`<div class="sc"><div class="h"><span>帳單 <b>${wan(c)}</b></span><span>理賠 <b style="color:var(--ok)">${wan(tot)}</b>　自付 <b style="color:#b44">${wan(self)}</b></span></div><div class="sbar">${reg?`<div class="p" style="width:${first/c*100}%"></div>`:''}${ded?`<div class="p2" style="width:${dp/c*100}%"></div>`:''}</div></div>`}
 h+=`<div class="legend">${reg?'<span><i style="background:var(--ok)"></i>一般實支</span>':''}${ded?'<span><i style="background:var(--blue)"></i>自負額實支</span>':''}<span><i style="background:#f0d9d6"></i>自付</span></div>`;
 h+='<div class="mut">僅試算雜費＋手術一個總額；不含病房、日額、非健保比例。'+(reg&&reg.r&&!reg.r.combined&&reg.pl?'一般實支之手術依比率表另計，未計入。':'')+'</div></div>';
 h+=vms.map(detail).join('')+'</div>';return h}
function detail(v){if(v.kind==='ded'){const p=v.p;return `<details><summary>${esc(v.label)} 條款重點與出處</summary><div class="kv"><b>年齡</b> ${esc(p.ages)}<br><b>續保</b> ${esc(p.renew)}<br><b>他保可抵自負額</b> ${unk(p.offset)}<br><b>非健保</b> ${unk(p.nonNHI)}<br><b>門診手術</b> ${unk(p.op_rule)}<br><b>年度上限</b> ${unk(p.annual_cap)}<br><b>主約限制</b> ${unk(p.main_rule)}<br><b>保費</b> ${premTxt(p.all_prem[v.plan])}<br><b>出處</b> ${p.src.map(s=>esc(s[0].split('/').pop()+' '+s[1])).join('；')}</div></details>`}
 if(!v.r)return '';const r=v.r;return `<details><summary>${esc(v.label)} 條款重點與出處</summary><div class="kv"><b>名稱</b> ${esc(r.name)}<br><b>投保年齡</b> ${unk(r.issue_age)}<br><b>保證續保</b> ${unk(r.guaranteed)}${r.renew_age!==U?'（至'+esc(r.renew_age)+'歲）':''}<br><b>病房</b> ${unk(r.room)}<br><b>雜費</b> ${unk(r.misc)}<br><b>手術</b> ${unk(r.surg)}<br><b>門診手術</b> ${unk(r.opd)}<br><b>年度上限</b> ${unk(r.annual)}<br><b>日額選擇</b> ${unk(r.daily)}<br><b>正本／副本</b> ${unk(r.copy)}<br><b>主約限制</b> ${unk(r.main_rule)}；${unk(r.standalone)}<br><b>保費</b> ${premReg(r,v.plan)}<br><b>資料</b> ${r.manual?'人工核對':'<span class="unk">條款自動擷取，核對中</span>'}；保發中心 ${esc(r.tii)}；${esc(r.src)}</div></details>`}
function premTxt(o){if(!o||!Object.keys(o).length)return '<span class="unk">未確認</span>';return `30歲男 ${f(o['30M'])}／女 ${f(o['30F'])}；40歲男 ${f(o['40M'])}／女 ${f(o['40F'])}（元/年）`}
function premReg(r,plan){const o=r.prem[plan]||r.prem._auto;return o?premTxt(o)+(r.prem._auto?' <span class="unk">（自動擷取，計劃別待核）</span>':''):'<span class="unk">未確認</span>'}
// ---------- steps ----------
function render1(){$('#types').innerHTML=TYPES.map(([k,t,s])=>`<button class="btn ${S.type===k?'on':''}" data-t="${k}"><b>${t}</b><small>${s}</small></button>`).join('');
 document.querySelectorAll('#types .btn').forEach(b=>b.onclick=()=>{S.type=b.dataset.t;Object.assign(S,{co:null,pick:null,plan:null,pick2:null,plan2:null,cap:null,cmp:[]});render1();go()})}
async function go(){const s2=$('#s2'),s3=$('#s3');s2.classList.remove('hide');s3.classList.add('hide');$('#out').innerHTML='';
 if(S.type==='fubon'){s2.classList.add('hide');await Promise.all([getDed(),getReg()]);$('#out').innerHTML=fubon();return}
 if(S.type==='ded')return pickFlow(await getDed(),'ded');
 if(S.type==='reg')return pickFlow(await getReg(),'reg');
 if(S.type==='combo'){await Promise.all([getDed(),getReg()]);return comboFlow()}
 if(S.type==='cmp'){await Promise.all([getDed(),getReg()]);return cmpFlow()}}
const items=(list,kind)=>list.map(p=>({kind,p,id:(kind==='ded'?'D':'')+p.id,co:p.company,name:kind==='ded'?p.name:p.name,code:p.code,plans:p.plans.map(x=>x.plan),main:kind==='ded'?p.main_rule:(p.standalone+' '+p.main_rule)}));
function coChips(its,sel,cb,id){const cos=[...new Set(its.map(i=>i.co))];return `<div class="chips" id="${id}">${cos.map(c=>`<button class="chip ${sel===c?'on':''}" data-c="${c}">${c}</button>`).join('')}</div>`}
function bindChips(id,cb){document.querySelectorAll(`#${id} .chip`).forEach(b=>b.onclick=()=>cb(b.dataset.c))}
function prodList(its,sel,id){const grp=i=>i.kind!=='reg'?0:i.p.copay?2:i.p.reclass?3:i.p.hybrid?1:0;const H=['','日額轉實支（混合型）','部分負擔型','分類待確認'];let last=0;
 const cd=i=>i.code&&i.code!==U&&!/^未確認/.test(i.code)?esc(i.code.replace(/[(（【].*$/,'')):'';
 return `<div class="list" id="${id}">${its.slice().sort((a,b)=>grp(a)-grp(b)).map(i=>{const g=grp(i);const hd=g!==last?(last=g,`<div class="sub" style="margin:10px 0 4px;font-weight:600">${H[g]}</div>`):'';
  const tag=i.kind==='reg'?(esc(i.p.type)+(i.p.hybrid?' ・'+esc(i.p.hybrid):'')+(i.p.copay?' ・<b style="color:#b44">部分負擔</b>':'')):'';
  return hd+`<button class="item ${sel===i.id?'on':''}" data-i="${i.id}">${esc(i.name)}<div class="c">${cd(i)} ${tag}</div></button>`}).join('')}</div>`}
function bindList(id,cb){document.querySelectorAll(`#${id} .item`).forEach(b=>b.onclick=()=>cb(b.dataset.i))}
function planChips(it,sel,id){if(!it.plans.length)return (id==='rp'?'<div class="sub">此商品限額核對中，請改用下方輸入上限。</div>':`<div class="sub">此商品方案限額仍在核對中，可直接看條款摘錄。</div><div class="chips" id="${id}"><button class="chip" data-p="">看條款重點</button></div>`);
 return `<div class="chips" id="${id}">${it.plans.map(p=>`<button class="chip ${sel===p?'on':''}" data-p="${p}">${p}</button>`).join('')}</div>`}
function pickFlow(list,kind){const its=items(list,kind);const s2=$('#s2'),s3=$('#s3');
 const sel=S.co?its.filter(i=>i.co===S.co):[];
 s2.innerHTML=`<h2><span class="no">2</span>選公司・商品</h2>${coChips(its,S.co,null,'cos')}${S.co?prodList(sel,S.pick,'pl'):'<div class="sub">請先點選公司</div>'}<div class="sub">${kind==='reg'?`共 ${its.length} 張現售一般實支`:`共 ${its.length} 張現售自負額實支（皆為附約）`}</div>`;
 bindChips('cos',c=>{S.co=c;S.pick=null;S.plan=null;pickFlow(list,kind)});bindList('pl',i=>{S.pick=i;S.plan=null;pickFlow(list,kind)});
 if(!S.pick){s3.classList.add('hide');$('#out').innerHTML='';return}
 const it=its.find(i=>i.id===S.pick);s3.classList.remove('hide');s3.innerHTML=`<h2><span class="no">3</span>選計劃</h2>${planChips(it,S.plan,'pc')}`;
 const show=pl=>{S.plan=pl;s3.querySelectorAll('.chip').forEach(b=>b.classList.toggle('on',b.dataset.p===pl));
  const vm=kind==='ded'?vmDed(it.p,it.p.plans.find(x=>x.plan===pl)):vmReg(it.p,it.p.plans.find(x=>x.plan===pl));$('#out').innerHTML=diagram([vm]);$('#out').scrollIntoView({behavior:'smooth'})};
 s3.querySelectorAll('.chip').forEach(b=>b.onclick=()=>show(b.dataset.p));if(S.plan!=null)show(S.plan)}
function comboFlow(){const R=items(S.reg,'reg'),D=items(S.ded.filter(p=>p.id!=='XHQN'),'ded');const s2=$('#s2'),s3=$('#s3');
 const rsel=S.co?R.filter(i=>i.co===S.co):[];
 s2.innerHTML=`<h2><span class="no">2</span>你的第一張：一般實支</h2><div class="sub">有結構化限額者可直接選；其他請輸入雜費＋手術上限。</div>${coChips(R,S.co,null,'rc')}${S.co?prodList(rsel,S.pick,'rl'):''}
 ${S.pick?planChips(R.find(i=>i.id===S.pick),S.plan,'rp'):''}<div class="sub" style="margin-top:12px">或直接輸入現有一般實支「住院雜費＋手術」上限（元）</div><input class="num" id="capIn" inputmode="numeric" placeholder="例 100000" value="${S.cap||''}">`;
 bindChips('rc',c=>{S.co=c;S.pick=null;S.plan=null;comboFlow()});bindList('rl',i=>{S.pick=i;S.plan=null;S.cap=null;comboFlow()});
 s2.querySelectorAll('#rp .chip').forEach(b=>b.onclick=()=>{S.plan=b.dataset.p;S.cap=null;comboFlow()});
 const x=$('#rp'+'x');if(x)x.onclick=()=>{};
 $('#capIn').onchange=e=>{S.cap=+e.target.value||null;if(S.cap){S.pick=null;S.plan=null}comboFlow()};
 let first=null;if(S.cap)first=vmManual(S.cap);else if(S.pick&&S.plan){const it=R.find(i=>i.id===S.pick);first=vmReg(it.p,it.p.plans.find(p=>p.plan===S.plan))}
 if(!first){s3.classList.add('hide');$('#out').innerHTML='';return}
 s3.classList.remove('hide');const dsel=S.co2?D.filter(i=>i.co===S.co2):[];
 s3.innerHTML=`<h2><span class="no">3</span>再加一張：自負額實支</h2>${coChips(D,S.co2,null,'dc')}${S.co2?prodList(dsel,S.pick2,'dl'):''}${S.pick2?planChips(D.find(i=>i.id===S.pick2),S.plan2,'dp'):''}`;
 bindChips('dc',c=>{S.co2=c;S.pick2=null;S.plan2=null;comboFlow()});bindList('dl',i=>{S.pick2=i;S.plan2=null;comboFlow()});
 s3.querySelectorAll('#dp .chip').forEach(b=>b.onclick=()=>{S.plan2=b.dataset.p;comboFlow();$('#out').scrollIntoView({behavior:'smooth'})});
 if(S.pick2&&S.plan2){const it=D.find(i=>i.id===S.pick2);$('#out').innerHTML=diagram([first,vmDed(it.p,it.p.plans.find(p=>p.plan===S.plan2))])}else $('#out').innerHTML=''}
function cmpFlow(){const A=[...items(S.ded,'ded'),...items(S.reg,'reg')];const s2=$('#s2');const sel=S.co?A.filter(i=>i.co===S.co):[];
 s2.innerHTML=`<h2><span class="no">2</span>挑 2–4 張（可混合一般與自負額）</h2>${coChips(A,S.co,null,'cc')}${S.co?`<div class="list" id="cl">${sel.map(i=>`<button class="item ${S.cmp.includes(i.id)?'on':''}" data-i="${i.id}">${i.kind==='ded'?'【自負額】':'【一般】'}${esc(i.name)}</button>`).join('')}</div>`:''}<div class="sub">已選 ${S.cmp.length}/4</div>`;
 bindChips('cc',c=>{S.co=c;cmpFlow()});document.querySelectorAll('#cl .item').forEach(b=>b.onclick=()=>{const i=b.dataset.i;S.cmp=S.cmp.includes(i)?S.cmp.filter(x=>x!==i):S.cmp.concat(i).slice(-4);cmpFlow()});
 if(S.cmp.length<2){$('#out').innerHTML='';return}
 const ps=S.cmp.map(id=>A.find(i=>i.id===id));const row=(k,fn)=>`<tr><td>${k}</td>${ps.map(i=>`<td>${fn(i)}</td>`).join('')}</tr>`;
 const D=(i,fd,fr)=>i.kind==='ded'?fd(i.p,i.p.plans.find(x=>x.plan===i.p.rep)):fr(i.p,i.p.plans[0]);
 $('#out').innerHTML=`<div class="map"><h3>並排比較</h3><div class="who">自負額商品以代表方案、一般實支以計劃1（有結構化者）呈現</div><div class="tw"><table><tr><td></td>${ps.map(i=>`<th>${esc(i.co)}<br>${esc(i.code!==U?i.code:i.name.slice(0,14))}</th>`).join('')}</tr>
 ${row('類型',i=>i.kind==='ded'?'自負額':'一般')}
 ${row('病房/日',i=>D(i,(p,pl)=>f(pl.room_lim)+(pl.room_ded?'（自付'+f(pl.room_ded)+'）':''),(r,pl)=>pl?f(pl.room):unk(r.room)))}
 ${row('雜費＋手術',i=>D(i,(p,pl)=>'最高 '+wan(pl.net_hosp)+'（超過'+wan(pl.hosp_ded)+'起賠）',(r,pl)=>pl?wan(pl.misc)+(r.combined?'（含手術）':'＋手術依比率'):unk(r.misc)))}
 ${row('門診手術',i=>D(i,(p,pl)=>f(pl.op_lim),(r,pl)=>pl?f(pl.opd):unk(r.opd)))}
 ${row('年度上限',i=>unk(i.kind==='ded'?i.p.annual_cap:i.p.annual))}
 ${row('續保',i=>unk(i.kind==='ded'?i.p.renew:(i.p.guaranteed==='是'?'保證續保'+(i.p.renew_age!==U?'至'+i.p.renew_age+'歲':''):i.p.guaranteed==='否'?'非保證續保':i.p.guaranteed)))}
 ${row('主約限制',i=>unk(i.kind==='ded'?i.p.main_rule:i.p.standalone))}
 ${row('30歲男保費',i=>i.kind==='ded'?f((i.p.all_prem[i.p.rep]||{})['30M']):unk(((i.p.prem['計劃1']||i.p.prem._auto)||{})['30M']||U))}
 </table></div></div>`}
function fubon(){const hsy=S.ded.find(p=>p.id==='HSY');const hsv=S.reg.find(r=>r.code==='HSV1/HSV2/HSV3');
 return `<div class="map"><h3>富邦 佳實在 HSV（一般實支）</h3><div class="who">依 HSV 條款（113.07.15版）人工核對；同業 73 張已人工覆核條款（regular/summary.md v2）</div>
 <div class="lb">資料支持的優勢</div><ol class="adv">
 <li><b>保證續保</b>（第17條）。條款明載「非保證續保」的同業有 <b>9 張</b>：國泰新iHealth、凱基一生康泰、台灣人壽龍實在、元大元心實足、宏泰泰實在、宏泰實分醫靠、全球實足滿意、合庫網路投保、新光 New Health。</li>
 <li>續保至 <b>80歲</b>，高於上限 75歲以下者：南山 1HS、台灣人壽保實在、台灣人壽溫心、保誠兩張、遠雄永安康／永康富／安心康富（75）、台灣人壽新住院醫療健康保險附約（65）。</li>
 <li>有 <b>特定處置</b> 保險金（0.75／1／1.25萬，每年6次，第12條）。</li>
 <li>住院超過30日，雜費限額按日數增加，最高 <b>15／30／45萬</b>（附表一）；但同類長期住院設計同業也有（全球、新光乙丙型、台灣人壽85版）。</li></ol>
 <div class="lb">需誠實說明的弱點</div><ul class="adv">
 <li><b>續保年齡已非最高</b>：新光 HXA、HX06，宏泰醫吉讚、薰衣草、安心醫靠，南山 1HSCO 至 <b>85歲</b>；遠雄好安心、康富 <b>84歲</b>；全球實在醫靠、實分鑫安 <b>81歲</b>。</li>
 <li><b>同級保費最貴</b>：標準比較計劃下，30F、40M、40F 皆為 5 家中最高（見下表）；30M 與凱基相當。</li>
 <li><b>加護病房加倍只限病房費、最多 7 日</b>；凱基心康泰病房加倍最多30日且醫療費用整次加倍，三商保健康病房與醫療手術額度皆加倍。</li>
 <li>住院手術依 <b>手術比率表</b>（每次限額×比率，第10條）；多家同業雜費與手術合併為一個額度。</li>
 <li>須 <b>收據正本</b>（第23條）；同業亦未見明文接受副本者，非富邦獨有。</li></ul>
 <div class="lb">標準比較計劃 年繳保費（病房約1,000／雜費約10萬）</div>
 <div style="overflow-x:auto"><table class="pt"><tr><th>公司・商品・計劃</th><th>30M</th><th>30F</th><th>40M</th><th>40F</th></tr>
 <tr><td>南山 1HS C型</td><td>2,200</td><td>3,700</td><td>3,000</td><td>5,220</td></tr>
 <tr><td>宏泰 醫吉讚 計畫1*</td><td>3,140</td><td>3,598</td><td>4,436</td><td>4,527</td></tr>
 <tr style="background:#fff4e5"><td><b>富邦 HSV 計劃1</b></td><td>3,350</td><td><b>6,500</b></td><td><b>6,710</b></td><td><b>7,150</b></td></tr>
 <tr><td>凱基 心康泰 1單位</td><td>3,390</td><td>6,180</td><td>5,500</td><td>6,950</td></tr>
 <tr><td>台灣人壽 保實在 計劃一*</td><td>4,099</td><td>5,076</td><td>6,785</td><td>6,320</td></tr></table></div>
 <div class="mut">*非完全同級（醫吉讚醫療15萬；保實在為日額1,000＋醫療5萬）。各家結構不同，僅作同級參考。來源：南山型錄 File/2470、宏泰條款附表二費率表、TII 費率表＋富邦四季春快速報價、凱基 DM PLDL1140119、台灣人壽 DM（regular/summary.md v2）。</div></div>
 <div class="map"><h3>富邦 全鑫 HSY（自負額實支）</h3><div class="lb">資料支持的優勢</div><ol class="adv"><li>非健保費用按 <b>75%</b> 給付，同業自負額商品為65–70%。</li><li>設有特定處置保險金（全球XHO/XHP另有門診特定診療）。</li><li>投保年齡至70歲，高於南山、三商、新光A2A3（65歲）。</li><li>有每日病房費用；凱基AAHSR無病房給付。</li></ol>
 <div class="lb">弱點</div><ul class="adv"><li>每年總限額 75萬／50萬；多數同業條款未見年度總限額。</li><li>最高給付20萬，與國泰WV4、全球XHO 2A、凱基AAHSR同級，非較高。</li><li>保費非最低（30歲男計劃1 3,694元）。</li><li>續保至80歲；全球XHO/XHP至81歲。</li></ul>
 <div class="mut">出處：${hsy.src.map(s=>esc(s[0].split('/').pop()+' '+s[1])).join('；')}；HSV 條款 regular/pdfs/富邦/HSV_條款.pdf；富邦四季春快速報價 費率資料</div></div>`}
(async()=>{render1();try{const u=await (await fetch('data/updated.txt')).text();$('#upd').textContent='資料更新日期：'+u.trim();$('#upd2').textContent='資料更新日期：'+u.trim()}catch(e){$('#upd').textContent=''}
 const m=location.hash.slice(1);if(m){const [t,...rest]=m.split('/');if(TYPES.some(x=>x[0]===t)){S.type=t;render1();await go();if(rest.length)await deep(rest)}}})();
async function deep(r){ // #ded/HSY/計劃1  #combo/HSV:計劃1/HSY:計劃1
 if(S.type==='ded'||S.type==='reg'){const list=S.type==='ded'?S.ded:S.reg;const p=list.find(x=>x.id===r[0]||x.code===r[0]||x.code.startsWith(r[0]));if(!p)return;S.co=p.company;S.pick=(S.type==='ded'?'D':'')+p.id;S.plan=decodeURIComponent(r[1]||'');pickFlow(list,S.type)}
 if(S.type==='combo'){const [a,ap]=decodeURIComponent(r[0]).split(':'),[b,bp]=decodeURIComponent(r[1]).split(':');const R=S.reg.find(x=>x.code===a)||S.reg.find(x=>x.code.startsWith(a+'(')||x.code.startsWith(a+'/'))||S.reg.find(x=>x.code.startsWith(a)),D=S.ded.find(x=>x.id===b);S.co=R.company;S.pick=R.id;S.plan=ap;S.co2=D.company;S.pick2='D'+D.id;S.plan2=bp;comboFlow()}
 if(S.type==='cmp'){S.cmp=r.map(x=>{const d=S.ded.find(p=>p.id===x);if(d)return 'D'+d.id;const g=S.reg.find(p=>p.code.startsWith(x));return g&&g.id}).filter(Boolean);S.co=S.ded.find(p=>'D'+p.id===S.cmp[0])?.company||'富邦';cmpFlow()}}
