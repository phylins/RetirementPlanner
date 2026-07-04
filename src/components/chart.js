import { twMoney, twWan, pct } from '../utils/format.js';
const NS='http://www.w3.org/2000/svg';
function el(name, attrs={}, text='') { const e=document.createElementNS(NS,name); for(const[k,v]of Object.entries(attrs)) e.setAttribute(k,v); if(text) e.textContent=text; return e; }
function range(vals){ const max=Math.max(...vals,1), min=Math.min(...vals,0); return {min, max:max===min?max+1:max}; }
export function lineChart(node, {data, series, xKey='year', yFormat=twMoney, y2Series=null, y2Format=pct, height=280, title=''}) {
  node.innerHTML='';
  const w=node.clientWidth || 620, h=height, m={l:72,r:y2Series?70:24,t:20,b:54};
  const svg=el('svg',{viewBox:`0 0 ${w} ${h}`, class:'chart-svg', role:'img'}); node.append(svg);
  if(!data?.length) return;
  const yVals=[]; for(const s of series) for(const d of data) yVals.push(d[s.key]||0);
  const yr=range(yVals), xN=data.length-1 || 1;
  const x=i=>m.l + i*(w-m.l-m.r)/xN;
  const y=v=>h-m.b - (v-yr.min)/(yr.max-yr.min)*(h-m.t-m.b);
  svg.append(el('line',{x1:m.l,y1:h-m.b,x2:w-m.r,y2:h-m.b,class:'axis'})); svg.append(el('line',{x1:m.l,y1:m.t,x2:m.l,y2:h-m.b,class:'axis'}));
  for(let i=0;i<=4;i++){ const val=yr.min+(yr.max-yr.min)*i/4, yy=y(val); svg.append(el('line',{x1:m.l,y1:yy,x2:w-m.r,y2:yy,class:'grid'})); svg.append(el('text',{x:m.l-10,y:yy+4,'text-anchor':'end',class:'axis-label'},yFormat(val))); }
  const step=5;
  data.forEach((d,i)=>{ if(i%step===0 || i===data.length-1){ const xx=x(i); svg.append(el('line',{x1:xx,y1:h-m.b,x2:xx,y2:h-m.b+5,class:'axis'})); svg.append(el('text',{x:xx,y:h-m.b+20,'text-anchor':'middle',class:'axis-label'},String(d[xKey]))); const primary=series[0]; if(primary){ svg.append(el('text',{x:xx,y:h-m.b+37,'text-anchor':'middle',class:'axis-sub-label'},yFormat(d[primary.key]||0))); } } });
  for(const s of series){ const path=data.map((d,i)=>`${i?'L':'M'}${x(i)},${y(d[s.key]||0)}`).join(' '); svg.append(el('path',{d:path,class:`line ${s.className||''}`})); }
  if(y2Series){ const vals=data.map(d=>d[y2Series.key]||0); const r2=range(vals); const y2=v=>h-m.b - (v-r2.min)/(r2.max-r2.min)*(h-m.t-m.b); svg.append(el('line',{x1:w-m.r,y1:m.t,x2:w-m.r,y2:h-m.b,class:'axis'})); for(let i=0;i<=4;i++){ const val=r2.min+(r2.max-r2.min)*i/4, yy=y2(val); svg.append(el('text',{x:w-m.r+10,y:yy+4,'text-anchor':'start',class:'axis-label'},y2Format(val))); } const path=data.map((d,i)=>`${i?'L':'M'}${x(i)},${y2(d[y2Series.key]||0)}`).join(' '); svg.append(el('path',{d:path,class:`line ${y2Series.className||'blue'}`})); }
  const legend=el('g',{transform:`translate(${m.l},${h-14})`}); let lx=0; [...series,(y2Series?[y2Series]:[])].forEach(s=>{ legend.append(el('line',{x1:lx,y1:0,x2:lx+18,y2:0,class:`line ${s.className||''}`})); legend.append(el('text',{x:lx+24,y:4,class:'legend-text'},s.label)); lx += Math.max(120, s.label.length*13); }); svg.append(legend);
}
export function barLineChart(node, {data, bars=[], lines=[], xKey='year', yFormat=twMoney, height=280}) {
  node.innerHTML=''; const w=node.clientWidth||620,h=height,m={l:72,r:24,t:20,b:58}; const svg=el('svg',{viewBox:`0 0 ${w} ${h}`,class:'chart-svg'}); node.append(svg); if(!data?.length)return;
  const vals=[]; for(const b of bars) for(const d of data) vals.push(d[b.key]||0); for(const l of lines) for(const d of data) vals.push(d[l.key]||0); const yr=range(vals); const xN=data.length-1||1; const x=i=>m.l+i*(w-m.l-m.r)/xN; const y=v=>h-m.b-(v-yr.min)/(yr.max-yr.min)*(h-m.t-m.b);
  svg.append(el('line',{x1:m.l,y1:h-m.b,x2:w-m.r,y2:h-m.b,class:'axis'})); svg.append(el('line',{x1:m.l,y1:m.t,x2:m.l,y2:h-m.b,class:'axis'}));
  for(let i=0;i<=4;i++){ const val=yr.min+(yr.max-yr.min)*i/4, yy=y(val); svg.append(el('line',{x1:m.l,y1:yy,x2:w-m.r,y2:yy,class:'grid'})); svg.append(el('text',{x:m.l-10,y:yy+4,'text-anchor':'end',class:'axis-label'},yFormat(val))); }
  data.forEach((d,i)=>{ if(i%5===0 || i===data.length-1){ const xx=x(i); svg.append(el('text',{x:xx,y:h-m.b+19,'text-anchor':'middle',class:'axis-label'},String(d[xKey]))); svg.append(el('text',{x:xx,y:h-m.b+36,'text-anchor':'middle',class:'axis-sub-label'},yFormat((d[bars[0]?.key]||0)+(bars[1]?d[bars[1].key]||0:0)))); } });
  const bw=Math.max(2,(w-m.l-m.r)/data.length/3); bars.forEach((b,bi)=> data.forEach((d,i)=>{ const v=d[b.key]||0; svg.append(el('rect',{x:x(i)-bw+bi*bw,y:y(v),width:bw,height:h-m.b-y(v),class:`bar ${b.className||''}`})); }));
  for(const l of lines){ const path=data.map((d,i)=>`${i?'L':'M'}${x(i)},${y(d[l.key]||0)}`).join(' '); svg.append(el('path',{d:path,class:`line ${l.className||''}`})); }
  const legend=el('g',{transform:`translate(${m.l},${h-14})`}); let lx=0; [...bars,...lines].forEach(s=>{ if(s.type==='bar'||bars.includes(s)) legend.append(el('rect',{x:lx,y:-8,width:18,height:8,class:`bar ${s.className||''}`})); else legend.append(el('line',{x1:lx,y1:-4,x2:lx+18,y2:-4,class:`line ${s.className||''}`})); legend.append(el('text',{x:lx+24,y:0,class:'legend-text'},s.label)); lx+=Math.max(110,s.label.length*13); }); svg.append(legend);
}
export function sparkBars(node, rows) {
  node.innerHTML=''; const total=rows.reduce((s,r)=>s+r.riskShare,0)||1;
  rows.slice(0,7).forEach(r=>{ const div=document.createElement('div'); div.className='risk-row'; div.innerHTML=`<span>${r.ticker}</span><div><i style="width:${r.riskShare/total*100}%"></i></div><b>${pct(r.riskShare,1)}</b>`; node.append(div); });
}
