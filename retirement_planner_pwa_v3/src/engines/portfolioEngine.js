function normalize(obj) {
  const sum = Object.values(obj).reduce((a, b) => a + (b.weight || 0), 0) || 1;
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = { ...v, normWeight: (v.weight || 0) / sum };
  return out;
}
export function expandPortfolio(portfolio) {
  const stock = portfolio.topLevel.stock / 100;
  const bond = portfolio.topLevel.bond / 100;
  const cash = portfolio.topLevel.cash / 100;
  const eq = normalize(portfolio.equity);
  const bd = normalize(portfolio.bond);
  const assets = [];
  for (const [ticker, a] of Object.entries(eq)) assets.push({ ticker, weight: stock * a.normWeight, cagr: a.cagr, vol: a.vol, className: '股票' });
  for (const [ticker, a] of Object.entries(bd)) assets.push({ ticker, weight: bond * a.normWeight, cagr: a.cagr, vol: a.vol, className: '債券' });
  assets.push({ ticker: 'Cash', weight: cash, cagr: portfolio.cash.cagr, vol: portfolio.cash.vol, className: '現金' });
  return assets;
}
function corr(a,b){
  if (a.ticker === b.ticker) return 1;
  if (a.className === '股票' && b.className === '股票') return 0.82;
  if (a.className === '債券' && b.className === '債券') return 0.65;
  if (a.className === '現金' || b.className === '現金') return 0.05;
  return -0.15;
}
export function portfolioStats(portfolio) {
  const assets = expandPortfolio(portfolio);
  const cagr = assets.reduce((s,a)=>s + a.weight * a.cagr,0);
  let variance = 0;
  for (const a of assets) for (const b of assets) variance += a.weight*b.weight*(a.vol/100)*(b.vol/100)*corr(a,b);
  const vol = Math.sqrt(Math.max(0, variance))*100;
  const riskContrib = assets.map(a => ({ ticker:a.ticker, weight:a.weight*100, riskShare: (a.weight * a.vol) })).sort((a,b)=>b.riskShare-a.riskShare);
  const riskTotal = riskContrib.reduce((s,a)=>s+a.riskShare,0)||1;
  riskContrib.forEach(x=>x.riskShare = x.riskShare/riskTotal*100);
  return { assets, cagr, vol, sharpe: (cagr-2)/Math.max(vol,0.1), riskContrib };
}
export function rebalanceTopLevel(portfolio, stock, bond, cash) {
  portfolio.topLevel.stock = stock; portfolio.topLevel.bond = bond; portfolio.topLevel.cash = cash;
}
