import { twMoney, pct } from '../utils/format.js';

const NS = 'http://www.w3.org/2000/svg';
const COLORS = {
  blue: '#2563eb', green: '#16a34a', red: '#dc2626', amber: '#d97706', teal: '#0891b2', gray: '#64748b', purple: '#7c3aed'
};
function svgEl(name, attrs = {}, text = '') {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text !== '') e.textContent = text;
  return e;
}
function finite(n, fallback = 0) { return Number.isFinite(Number(n)) ? Number(n) : fallback; }
function niceRange(values, forceMin = null, forceMax = null) {
  const clean = values.map(v => finite(v)).filter(Number.isFinite);
  let min = forceMin ?? Math.min(...clean, 0);
  let max = forceMax ?? Math.max(...clean, 1);
  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max)) max = 1;
  if (min === max) max = min + 1;
  const pad = (max - min) * 0.06;
  return { min: forceMin ?? Math.min(0, min - pad), max: forceMax ?? (max + pad) };
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function widthOf(node) { return Math.max(720, Math.round(node.getBoundingClientRect().width || node.clientWidth || 900)); }
function makeSvg(node, height, rightAxis = false) {
  clear(node);
  const w = widthOf(node);
  const m = { l: 82, r: rightAxis ? 84 : 30, t: 24, b: 70 };
  const svg = svgEl('svg', { viewBox: `0 0 ${w} ${height}`, class: 'chart-svg', role: 'img', preserveAspectRatio: 'xMidYMid meet' });
  node.appendChild(svg);
  return { svg, w, h: height, m };
}
function drawAxes(svg, w, h, m, yr, yFormat, ticks = 4) {
  const plotW = w - m.l - m.r, plotH = h - m.t - m.b;
  const y = v => h - m.b - ((v - yr.min) / (yr.max - yr.min)) * plotH;
  svg.append(svgEl('line', { x1: m.l, y1: h - m.b, x2: w - m.r, y2: h - m.b, class: 'axis' }));
  svg.append(svgEl('line', { x1: m.l, y1: m.t, x2: m.l, y2: h - m.b, class: 'axis' }));
  for (let i = 0; i <= ticks; i++) {
    const val = yr.min + (yr.max - yr.min) * i / ticks;
    const yy = y(val);
    svg.append(svgEl('line', { x1: m.l, y1: yy, x2: w - m.r, y2: yy, class: 'grid' }));
    svg.append(svgEl('text', { x: m.l - 12, y: yy + 4, 'text-anchor': 'end', class: 'axis-label' }, yFormat(val)));
  }
  return { plotW, plotH, y };
}
function drawXAxis(svg, data, xKey, w, h, m, valueForSub = null, subFormat = twMoney) {
  const plotW = w - m.l - m.r;
  const x = i => m.l + i * plotW / Math.max(data.length - 1, 1);
  data.forEach((d, i) => {
    if (i % 5 === 0 || i === data.length - 1) {
      const xx = x(i);
      svg.append(svgEl('line', { x1: xx, y1: h - m.b, x2: xx, y2: h - m.b + 6, class: 'axis' }));
      svg.append(svgEl('text', { x: xx, y: h - m.b + 22, 'text-anchor': 'middle', class: 'axis-label' }, String(d[xKey])));
      if (valueForSub) svg.append(svgEl('text', { x: xx, y: h - m.b + 40, 'text-anchor': 'middle', class: 'axis-sub-label' }, subFormat(finite(d[valueForSub]))));
    }
  });
  return x;
}
function drawLegend(svg, items, x, y) {
  const g = svgEl('g', { transform: `translate(${x},${y})` });
  let lx = 0;
  items.forEach(item => {
    const color = COLORS[item.className] || COLORS.blue;
    g.append(svgEl('line', { x1: lx, y1: 0, x2: lx + 20, y2: 0, stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }));
    g.append(svgEl('text', { x: lx + 28, y: 5, class: 'legend-text' }, item.label));
    lx += Math.max(140, item.label.length * 14 + 45);
  });
  svg.append(g);
}
export function lineChart(node, opts) {
  try {
    const { data = [], series = [], xKey = 'year', yFormat = twMoney, y2Series = null, y2Format = pct, height = 280 } = opts || {};
    const { svg, w, h, m } = makeSvg(node, height, Boolean(y2Series));
    if (!data.length || !series.length) return;
    const yVals = [];
    series.forEach(s => data.forEach(d => yVals.push(finite(d[s.key]))));
    const yr = niceRange(yVals);
    const axes = drawAxes(svg, w, h, m, yr, yFormat);
    const x = drawXAxis(svg, data, xKey, w, h, m, series[0]?.key, yFormat);
    series.forEach(s => {
      const color = COLORS[s.className] || COLORS.blue;
      const d = data.map((row, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${axes.y(finite(row[s.key])).toFixed(1)}`).join(' ');
      svg.append(svgEl('path', { d, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    });
    const legends = [...series];
    if (y2Series) {
      const vals2 = data.map(d => finite(d[y2Series.key]));
      const r2 = niceRange(vals2, 0, Math.max(10, Math.ceil(Math.max(...vals2, 1))));
      const y2 = v => h - m.b - ((v - r2.min) / (r2.max - r2.min)) * (h - m.t - m.b);
      svg.append(svgEl('line', { x1: w - m.r, y1: m.t, x2: w - m.r, y2: h - m.b, class: 'axis' }));
      for (let i = 0; i <= 4; i++) {
        const val = r2.min + (r2.max - r2.min) * i / 4;
        const yy = y2(val);
        svg.append(svgEl('text', { x: w - m.r + 12, y: yy + 4, 'text-anchor': 'start', class: 'axis-label' }, y2Format(val)));
      }
      const color = COLORS[y2Series.className] || COLORS.blue;
      const d = data.map((row, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y2(finite(row[y2Series.key])).toFixed(1)}`).join(' ');
      svg.append(svgEl('path', { d, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      legends.push(y2Series);
    }
    drawLegend(svg, legends, m.l, h - 18);
  } catch (err) {
    node.innerHTML = `<div class="chart-error">圖表無法顯示：${err.message}</div>`;
    console.error('lineChart failed', err);
  }
}
export function barLineChart(node, opts) {
  try {
    const { data = [], bars = [], lines = [], xKey = 'year', yFormat = twMoney, height = 280 } = opts || {};
    const { svg, w, h, m } = makeSvg(node, height, false);
    if (!data.length) return;
    const allKeys = [...bars, ...lines];
    const vals = [];
    allKeys.forEach(s => data.forEach(d => vals.push(finite(d[s.key]))));
    const yr = niceRange(vals);
    const axes = drawAxes(svg, w, h, m, yr, yFormat);
    const x = drawXAxis(svg, data, xKey, w, h, m, 'totalSpending', yFormat);
    const gapW = (w - m.l - m.r) / Math.max(data.length - 1, 1);
    const bw = Math.max(3, Math.min(12, gapW / (bars.length + 2)));
    bars.forEach((b, bi) => {
      const color = COLORS[b.className] || '#9db5e8';
      data.forEach((row, i) => {
        const v = Math.max(0, finite(row[b.key]));
        const xx = x(i) - (bars.length * bw) / 2 + bi * bw;
        const yy = axes.y(v);
        svg.append(svgEl('rect', { x: xx, y: yy, width: bw, height: Math.max(0, h - m.b - yy), fill: color, opacity: 0.55, rx: 2 }));
      });
    });
    lines.forEach(l => {
      const color = COLORS[l.className] || COLORS.blue;
      const d = data.map((row, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${axes.y(finite(row[l.key])).toFixed(1)}`).join(' ');
      svg.append(svgEl('path', { d, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    });
    drawLegend(svg, [...bars, ...lines], m.l, h - 18);
  } catch (err) {
    node.innerHTML = `<div class="chart-error">圖表無法顯示：${err.message}</div>`;
    console.error('barLineChart failed', err);
  }
}
export function sparkBars(node, rows) {
  node.innerHTML = '';
  const total = rows.reduce((s, r) => s + finite(r.riskShare), 0) || 1;
  rows.slice(0, 10).forEach(r => {
    const div = document.createElement('div');
    div.className = 'risk-row';
    const label = r.name ? `${r.ticker}｜${r.name}` : r.ticker;
    div.innerHTML = `<span title="${r.description || ''}">${label}</span><div><i style="width:${finite(r.riskShare) / total * 100}%"></i></div><b>${pct(r.riskShare, 1)}</b>`;
    node.append(div);
  });
}
