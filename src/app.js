import { simulate, timingOptimizer, decisionMatrix } from './engines/simulationEngine.js';
import { annualLoanSchedule } from './engines/loanEngine.js';
import { portfolioStats, rebalanceTopLevel } from './engines/portfolioEngine.js';
import { estimateTax } from './engines/withdrawalEngine.js';
import { lineChart, barLineChart, sparkBars } from './components/chart.js';
import { twMoney, twWan, pct, numberInput, parseNumberInput, clamp, star } from './utils/format.js';
import { saveState, loadState } from './utils/storage.js';

const $ = id => document.getElementById(id);
const modes = [
  ['historical','Historical Backtest'],['worst','Worst Historical'],['regime','Regime Monte Carlo'],['extreme','Extreme Stress Test']
];
const strategies = [['classic','Classic COLA'],['dynamic','Dynamic COLA'],['smile','Spending Smile'],['guardrails','Guardrails']];
let state, loans, scenarios, portfolio;
async function loadJson(path){ return fetch(path).then(r=>r.json()); }
function control(id, label, min, max, step, value, onChange){
  const node=$(id); node.innerHTML='';
  const wrap=document.createElement('div'); wrap.className='control-row';
  wrap.innerHTML=`<label>${label}</label><input type="range" min="${min}" max="${max}" step="${step}" value="${value}"><input type="text" value="${numberInput(value)}">`;
  const range=wrap.querySelector('input[type=range]'), text=wrap.querySelector('input[type=text]');
  range.addEventListener('input',()=>{ text.value=numberInput(range.value); onChange(Number(range.value)); render(); });
  text.addEventListener('change',()=>{ const v=clamp(parseNumberInput(text.value),min,max); text.value=numberInput(v); range.value=v; onChange(v); render(); });
  node.append(wrap);
}
function pctControl(parent, key, label, obj, max=100, onChange=()=>{}){
  const wrap=document.createElement('div'); wrap.className='control-row asset-control';
  const name = obj[key].name || '';
  const desc = obj[key].description || '';
  wrap.innerHTML=`<label><b>${key}</b>${name?`<span class="asset-name">${name}</span>`:''}${desc?`<small>${desc}</small>`:''}</label><input type="range" min="0" max="${max}" step="1" value="${obj[key].weight}"><input type="text" value="${obj[key].weight}">`;
  const r=wrap.querySelector('input[type=range]'), t=wrap.querySelector('input[type=text]');
  function apply(v){ obj[key].weight=clamp(v,0,max); t.value=obj[key].weight; r.value=obj[key].weight; onChange(key); render(); }
  r.addEventListener('input',()=>apply(Number(r.value))); t.addEventListener('change',()=>apply(Number(t.value))); parent.append(wrap);
}
function normalizeGroup(group, changedKey){
  const keys=Object.keys(group); let total=Object.values(group).reduce((s,a)=>s+a.weight,0); if(total===100)return;
  const diff=100-total; const target=keys.find(k=>k!==changedKey && group[k].weight+diff>=0) || keys.find(k=>k!==changedKey);
  if(target) group[target].weight=Number((group[target].weight+diff).toFixed(1));
}
function setupControls(){
  control('input-investable','2026 可投資資產',120000000,300000000,1000000,state.investableAssets,v=>state.investableAssets=v);
  control('input-living','年度生活費',3000000,15000000,100000,state.annualLivingExpense,v=>state.annualLivingExpense=v);
  control('input-years','退休年限',20,60,1,state.retirementYears,v=>state.retirementYears=v);
  control('input-cape','Shiller CAPE',15,50,1,state.cape,v=>state.cape=v);
  control('input-income-self','我的年收入',0,30000000,100000,state.incomeSelf,v=>state.incomeSelf=v);
  control('input-income-spouse','家人年收入',0,30000000,100000,state.incomeSpouse,v=>state.incomeSpouse=v);
  control('input-stock','股票比例',30,90,1,portfolio.topLevel.stock,v=>{ const cash=portfolio.topLevel.cash; rebalanceTopLevel(portfolio, v, Math.max(0,100-v-cash), cash); });
  control('input-bond','債券比例',0,65,1,portfolio.topLevel.bond,v=>{ const cash=portfolio.topLevel.cash; rebalanceTopLevel(portfolio, Math.max(0,100-v-cash), v, cash); });
  control('input-cash','現金比例',0,20,1,portfolio.topLevel.cash,v=>{ rebalanceTopLevel(portfolio, Math.max(0,100-v-portfolio.topLevel.bond), portfolio.topLevel.bond, v); });
  const ms=$('mode-select'); ms.innerHTML=modes.map(([v,l])=>`<option value="${v}">${l}</option>`).join(''); ms.value=state.marketMode; ms.onchange=()=>{state.marketMode=ms.value;render();};
  const ss=$('spending-select'); ss.innerHTML=strategies.map(([v,l])=>`<option value="${v}">${l}</option>`).join(''); ss.value=state.spendingStrategy; ss.onchange=()=>{state.spendingStrategy=ss.value;render();};
  $('dynamic-cola').checked=state.dynamicCola; $('dynamic-cola').onchange=e=>{state.dynamicCola=e.target.checked;render();};
  const sb=$('scenario-buttons'); sb.innerHTML=''; scenarios.forEach(s=>{ const b=document.createElement('button'); b.textContent=twMoney(s,1); b.onclick=()=>{ state.investableAssets=s; setupControls(); render(); }; sb.append(b); });
  const eq=$('equity-controls'); eq.innerHTML=''; Object.keys(portfolio.equity).forEach(k=>pctControl(eq,k,k,portfolio.equity,80, changed=>normalizeGroup(portfolio.equity, changed)));
  const bd=$('bond-controls'); bd.innerHTML=''; Object.keys(portfolio.bond).forEach(k=>pctControl(bd,k,k,portfolio.bond,80, changed=>normalizeGroup(portfolio.bond, changed)));
}
function renderKpis(sim, loanRows){
  const income=state.incomeSelf+state.incomeSpouse; const tax=estimateTax(income,state.effectiveTaxByIncome); const after=income-tax; const first=sim.sample[0];
  const savings=Math.max(0,after-first.totalSpending); const saveRate=savings/Math.max(after,1)*100;
  const wr=first.totalSpending/state.investableAssets*100; const margin=sim.safemax-wr;
  const kpis=[['退休成功率',pct(sim.successRate,1),state.marketMode],['SAFE MAX',pct(sim.safemax,2),'CAPE '+state.cape],['第一年提領率',pct(wr,2),margin>=0?'低於 SAFE':'高於 SAFE'],['第一年總支出',twMoney(first.totalSpending),'生活費+貸款'],['稅後收入',twMoney(after),'所得稅估 '+twMoney(tax)],['年度新增投資',twMoney(savings),'儲蓄率 '+pct(saveRate,1)],['組合 CAGR',pct(sim.stats.cagr,1),'Vol '+pct(sim.stats.vol,1)],['貸款餘額',twWan(loanRows[0].loanBalance),'第一年底']];
  $('kpi-grid').innerHTML=kpis.map(([l,v,s])=>`<div class="kpi"><div class="label">${l}</div><div class="value">${v}</div><div class="sub">${s}</div></div>`).join('');
}
function table(node, headers, rows){ node.innerHTML=`<thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody>`; }
function renderTables(sim, matrix, marginal){
  table($('cashflow-table'), ['年份','年齡','生活費','貸款','總支出','提領率','投資報酬','新增投資','貸款餘額'], sim.sample.map(r=>`<tr><td>${r.year}</td><td>${r.age}</td><td>${twMoney(r.living)}</td><td>${twMoney(r.loanPayment)}</td><td>${twMoney(r.totalSpending)}</td><td>${pct(r.withdrawalRate,2)}</td><td>${twMoney(r.investmentReturn)}</td><td>${twMoney(r.contribution)}</td><td>${twWan(r.loanBalance)}</td></tr>`));
  table($('decision-table'), ['可投資資產','第一年提領率','成功率','SAFE MAX','建議','邊際成功率'], matrix.map((r,i)=>`<tr><td>${twMoney(r.assets,1)}</td><td>${pct(r.firstWithdrawalRate,2)}</td><td>${pct(r.successRate,1)}</td><td>${pct(r.safemax,2)}</td><td>${r.advice}</td><td>${i===0?'—':pct(matrix[i].successRate-matrix[i-1].successRate,1)}</td></tr>`));
}
function renderPortfolio(stats){
  const assetRows = stats.assets.map(a => `
    <div class="asset-row">
      <div><b>${a.ticker}</b><span>${a.name || ''}</span><small>${a.description || ''}</small></div>
      <strong>${pct(a.weight*100,1)}</strong>
    </div>`).join('');
  $('portfolio-summary').innerHTML=`
    <div class="portfolio-stat"><div><span>CAGR</span><b>${pct(stats.cagr,1)}</b></div><div><span>Volatility</span><b>${pct(stats.vol,1)}</b></div><div><span>Sharpe</span><b>${stats.sharpe.toFixed(2)}</b></div></div>
    <h4>標的與目標市場</h4><div class="asset-list">${assetRows}</div>
    <h4>風險貢獻</h4><div id="risk-bars"></div>`;
  sparkBars(document.getElementById('risk-bars'), stats.riskContrib);
}
function renderNotes(){
  const mode=modes.find(m=>m[0]===state.marketMode)?.[1]; const strat=strategies.find(s=>s[0]===state.spendingStrategy)?.[1];
  $('model-notes').innerHTML=`
  <div class="note-item"><b>🧭 市場模式：${mode}</b><br>可切換 Historical / Worst / Regime / Extreme。預設 Regime 用牛市、熊市、復甦與高通膨狀態交替，避免純常態 Monte Carlo 過度產生不合理連續崩盤。</div>
  <div class="note-item"><b>💸 支出策略：${strat}</b><br>Spending Smile 預設：退休前期小幅增加，中後期趨於平緩或下降，晚年保留醫療支出上升空間。</div>
  <div class="note-item"><b>🛡️ Dynamic COLA Freeze</b><br>若通膨過高、投資組合大跌，或第一年提領率高於門檻，該年生活費不跟通膨上調，以提高成功率。</div>
  <div class="note-item"><b>📈 股票配置</b><br>股票 65% 預設拆成：00631L 20%、VOO/VTI/VXUS 合計 60%、SOXX 20%。整體資產約為 00631L 13%、SOXX 13%、美國/全球核心 ETF 39%。</div>`;
}
function render(){
  [...document.querySelectorAll('#scenario-buttons button')].forEach(b=>b.classList.toggle('active', b.textContent===twMoney(state.investableAssets,1)));
  const sim=simulate(state,loans,portfolio,700); const loanRows=annualLoanSchedule(loans,state.retirementYears,state.startYear); const timing=timingOptimizer(state,loans,portfolio); const matrix=decisionMatrix(state,loans,portfolio,scenarios);
  renderKpis(sim, loanRows); renderTables(sim,matrix,[]); renderPortfolio(sim.stats); renderNotes();
  requestAnimationFrame(() => {
    lineChart($('asset-chart'),{data:sim.percentiles,series:[{key:'p10',label:'P10 悲觀',className:'red'},{key:'p50',label:'P50 中位數',className:'blue'},{key:'p60',label:'P60 樂觀',className:'green'}],height:260});
    barLineChart($('expense-chart'),{data:sim.sample,bars:[{key:'living',label:'生活費',className:'green'},{key:'loanPayment',label:'貸款',className:'amber'}],lines:[{key:'totalSpending',label:'總支出',className:'blue'}],height:260});
    lineChart($('loan-chart'),{data:loanRows.map(r=>({...r,loanBalanceWan:r.loanBalance/10000})),series:[{key:'loanBalanceWan',label:'貸款餘額（萬）',className:'amber'}],yFormat:v=>`${Math.round(v).toLocaleString()}萬`,height:260});
    lineChart($('timing-chart'),{data:timing,series:[{key:'successRate',label:'成功率（左軸）',className:'green'}],yFormat:v=>pct(v,0),y2Series:{key:'firstWithdrawalRate',label:'第一年提領率（右軸）',className:'blue'},y2Format:v=>pct(v,1),height:260});
  });
}
function showSaveModal(){
  const modal = $('save-modal');
  if (!modal) return;
  modal.hidden = false;
  modal.setAttribute('aria-hidden','false');
  const close = $('save-modal-close');
  if (close) close.focus();
}
function hideSaveModal(){
  const modal = $('save-modal');
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden','true');
}
async function init(){
  const [assumptions, loanData, port, scen] = await Promise.all([loadJson('./data/assumptions.json'),loadJson('./data/loans.json'),loadJson('./data/portfolio.json'),loadJson('./data/scenarios.json')]);
  state = { ...assumptions, ...(loadState()?.state || {}) }; loans=loanData; portfolio = loadState()?.portfolio || port; scenarios=scen;
  setupControls(); render();
  $('save-btn').onclick=()=>{ saveState({state,portfolio}); showSaveModal(); };
  $('save-modal-close')?.addEventListener('click', hideSaveModal);
  $('save-modal')?.addEventListener('click', e=>{ if(e.target.id==='save-modal') hideSaveModal(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') hideSaveModal(); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=3.4.0').catch(()=>{});
}
init();
