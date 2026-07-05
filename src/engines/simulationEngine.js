import { annualLoanSchedule } from './loanEngine.js';
import { portfolioStats } from './portfolioEngine.js';
import { estimateTax, inflationFor, livingExpenseByStrategy, safemaxFromCAPE } from './withdrawalEngine.js';
function seededRandom(seed) { let x = seed % 2147483647; if (x <= 0) x += 2147483646; return () => (x = x * 16807 % 2147483647) / 2147483647; }
function normal(rand) { const u = Math.max(rand(), 1e-9), v = Math.max(rand(), 1e-9); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function regimeReturn(rand, stats, y) {
  const r = rand();
  let mean = stats.cagr, vol = stats.vol, inf = inflationFor('regime', y);
  if (r < 0.56) { mean += 2.5; vol *= 0.85; inf = 1.6 + rand()*1.2; }
  else if (r < 0.73) { mean -= 9; vol *= 1.45; inf = 0.5 + rand()*2.0; }
  else if (r < 0.89) { mean += 5; vol *= 1.2; inf = 1.5 + rand()*2.5; }
  else { mean -= 3; vol *= 1.25; inf = 4.5 + rand()*3.5; }
  return { ret: mean + normal(rand)*vol, inflation: inf };
}
function shouldFreezeCola(config, inflation, ret, withdrawalRateBefore) {
  if (!config.dynamicCola) return false;
  const highInflation = inflation > config.dynamicColaInflationThreshold;
  const badReturn = ret < config.dynamicColaDrawdownThreshold;
  const highWithdrawal = withdrawalRateBefore > config.dynamicColaWithdrawalThreshold;
  const rule = config.dynamicColaFreezeRule || 'balanced';
  if (rule === 'any') return highInflation || badReturn || highWithdrawal;
  if (rule === 'withdrawalOnly') return highWithdrawal;
  // balanced: freeze only when high inflation and weak market happen together, or withdrawal rate is already too high.
  return (highInflation && badReturn) || highWithdrawal;
}
function modeReturn(mode, stats, y, rand) {
  if (mode === 'historical') {
    const seq=[12,-8,22,5,-15,18,9,7,-4,14,3,11,-20,26,15,2];
    return { ret: seq[y%seq.length] * (stats.cagr/8.5), inflation: inflationFor('historical', y) };
  }
  if (mode === 'worst') {
    const seq=[-28,-13,-5,8,12,-18,4,10,6,7,5,4];
    return { ret: seq[Math.min(y, seq.length-1)] * (stats.vol/16), inflation: inflationFor('worst', y) };
  }
  if (mode === 'extreme') {
    const seq=[-42,-20,-8,12,10,7,6,5];
    return { ret: seq[Math.min(y, seq.length-1)] * (stats.vol/18), inflation: inflationFor('extreme', y) };
  }
  return regimeReturn(rand, stats, y);
}
export function runSinglePath(config, loans, portfolio, seed=1234, startDelay=0) {
  const rand = seededRandom(seed + startDelay*1000);
  const years = config.retirementYears;
  const loanRows = annualLoanSchedule(loans, years + startDelay + 1, config.startYear);
  const stats = portfolioStats(portfolio);
  const householdIncome = config.incomeSelf + config.incomeSpouse;
  const tax = estimateTax(householdIncome, config.effectiveTaxByIncome);
  const afterTaxIncome = householdIncome - tax;
  let assets = config.investableAssets;
  let living = config.annualLivingExpense;
  const rows = [];
  for (let y=0;y<years+startDelay;y++) {
    const { ret, inflation } = modeReturn(config.marketMode, stats, y, rand);
    const loan = loanRows[y] || {loanPayment:0, loanBalance:0};
    const beginAssets = assets;
    const totalSpendingBefore = living + loan.loanPayment;
    const withdrawalRateBefore = beginAssets > 0 ? totalSpendingBefore / beginAssets * 100 : 999;
    const freeze = shouldFreezeCola(config, inflation, ret, withdrawalRateBefore);
    if (y > 0) living = livingExpenseByStrategy(living, y, inflation, config.spendingStrategy, freeze);
    const totalSpending = living + loan.loanPayment;
    const investmentReturn = beginAssets * ret / 100;
    const contribution = y < startDelay ? Math.max(0, afterTaxIncome - totalSpending) : 0;
    assets = Math.max(0, beginAssets + investmentReturn + contribution - totalSpending);
    rows.push({ year: config.startYear + y, age: config.age + y, beginAssets, assets, living, loanPayment: loan.loanPayment, loanBalance: loan.loanBalance, totalSpending, withdrawalRate: beginAssets>0?totalSpending/beginAssets*100:999, investmentReturn, contribution, ret, inflation, freeze });
  }
  return rows;
}
export function simulate(config, loans, portfolio, runs=600, seedBase=202600) {
  const paths = [];
  let successes=0;
  for (let i=0;i<runs;i++) {
    const rows = runSinglePath(config, loans, portfolio, seedBase+i*17, 0);
    paths.push(rows);
    if (rows[rows.length-1]?.assets > 0 && rows.every(r=>r.assets>0)) successes++;
  }
  const years = config.retirementYears;
  const percentiles = [];
  for (let y=0;y<years;y++) {
    const vals = paths.map(p=>p[y]?.assets || 0).sort((a,b)=>a-b);
    const pick = p => vals[Math.min(vals.length-1, Math.max(0, Math.floor((vals.length-1)*p)))];
    percentiles.push({ year: config.startYear+y, p10: pick(0.10), p50: pick(0.50), p60: pick(0.60) });
  }
  return { successRate: successes/runs*100, percentiles, sample: paths[0], safemax: safemaxFromCAPE(config.cape, config.retirementYears), stats: portfolioStats(portfolio) };
}
export function timingOptimizer(config, loans, portfolio, options = {}) {
  const runs = options.runs ?? 600;
  const seedBase = options.seedBase ?? 202600;
  const out=[];
  for (let delay=0; delay<=10; delay++) {
    const cfg={...config};
    let success=0; let firstWRs=[];
    for (let i=0;i<runs;i++) {
      const rows=runSinglePath(cfg, loans, portfolio, seedBase+i*17, delay);
      const retireRow=rows[delay] || rows[0];
      firstWRs.push(retireRow.withdrawalRate);
      const retirementRows=rows.slice(delay);
      if (retirementRows.every(r=>r.assets>0) && retirementRows[retirementRows.length-1]?.assets>0) success++;
    }
    out.push({ year: config.startYear+delay, age: config.age+delay, successRate: success/runs*100, firstWithdrawalRate: firstWRs.reduce((a,b)=>a+b,0)/firstWRs.length });
  }
  return out;
}
export function decisionMatrix(config, loans, portfolio, scenarios, options = {}) {
  const runs = options.runs ?? 600;
  const seedBase = options.seedBase ?? 202600;
  return scenarios.map(s => {
    const cfg = { ...config, investableAssets: s };
    const sim = simulate(cfg, loans, portfolio, runs, seedBase);
    const first = sim.sample[0];
    let advice = '🔴 不建議';
    if (sim.successRate >= 96) advice = '🟢 建議'; else if (sim.successRate >= 92) advice = '🟡 可考慮';
    return { assets:s, firstWithdrawalRate:first.withdrawalRate, successRate:sim.successRate, safemax:sim.safemax, advice };
  });
}
