/* =====================================================================
   Surface Capital — interaktiv performance
   =====================================================================
   Kilde: Historisk_performance ... Sheet 1 ("10 års performance").
   Alle årlige afkast er REVIDEREDE tal i procent (verificeret mod totaler:
   efter fees 18,48 % / før fees 21,91 % / MSCI 11,62 % / S&P500 Acc 14,26 %).

   >>> Tilføj/ret en serie nedenfor. 'on' styrer om den vises som standard.
   ===================================================================== */
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

const SERIES = [
  { key:'efter', name:'Porteføljen efter fees', color:'#FFBA00', on:true,
    r:[39.17, 26.29, -11.00, 33.71, 13.75, 25.74, 8.00, 12.96, 22.46, 21.92] },
  { key:'foer',  name:'Porteføljen før fees',   color:'#C8952E', on:false,
    r:[55.30, 28.80, -10.10, 38.30, 14.90, 30.00, 11.70, 14.10, 23.70, 23.80] },
  { key:'msci',  name:'MSCI ACWI',              color:'#C0C0C0', on:true,
    r:[7.90, 24.00, -9.40, 26.60, 16.30, 18.50, -18.40, 22.20, 17.50, 21.20] },
  { key:'spacc', name:'S&P 500 Acc (USD)',      color:'#7FA6BD', on:false,
    r:[11.20, 21.10, -4.90, 30.70, 17.80, 28.20, -18.50, 25.70, 24.50, 17.60] },
  { key:'speh',  name:'S&P 500 (EUR-hedged)',   color:'#9DAE8E', on:false,
    r:[11.50, 18.90, -8.10, 27.20, 14.00, 28.40, -21.80, 23.50, 23.00, 12.80] },
];

/* Surface Capital — fondens EGEN performance, pr. kvartal (udfyld løbende). */
const SURFACE = {
  quarters: [
    { label: 'Q1 2026', port: -5.23, bench: -3.21 },
    // { label: 'Q2 2026', port: null, bench: null },
  ]
};
/* ===================================================================== */

(function () {
  const $ = (id) => document.getElementById(id);
  if (!$('fromYear')) return;

  const da     = (v, d) => v.toFixed(d).replace('.', ',').replace('-', '\u2212');
  const signed = (v, d) => (v >= 0 ? '+' : '\u2212') + Math.abs(v).toFixed(d).replace('.', ',');

  function period(s, from, to) {
    const fi = YEARS.indexOf(from), ti = YEARS.indexOf(to);
    const r = s.r.slice(fi, ti + 1), n = r.length;
    const idx = [100]; r.forEach(x => idx.push(idx[idx.length - 1] * (1 + x / 100)));
    const cum = idx[idx.length - 1];
    return { idx, cum, ann: (Math.pow(cum / 100, 1 / n) - 1) * 100, n };
  }
  const visible = () => SERIES.filter(s => s.on);

  function renderStats(from, to) {
    const vis = visible();
    let html = vis.map(s => {
      const p = period(s, from, to);
      return `<div class="stat"><span class="stat-label"><i class="sdot" style="background:${s.color}"></i>${s.name}</span>` +
             `<span class="stat-num">${da(p.ann, 2)} %</span>` +
             `<span class="stat-sub">${da(p.cum, 0)} % akkumuleret</span></div>`;
    }).join('');
    const e = vis.find(s => s.key === 'efter'), m = vis.find(s => s.key === 'msci');
    if (e && m) {
      const d = period(e, from, to).ann - period(m, from, to).ann;
      html += `<div class="stat"><span class="stat-label">Merafkast p.a.</span>` +
              `<span class="stat-num">${signed(d, 2)} %-p</span>` +
              `<span class="stat-sub">efter fees vs. MSCI ACWI</span></div>`;
    }
    $('perfStats').innerHTML = html || '<p class="terms-meta">Vælg mindst én serie ovenfor.</p>';
  }

  function niceMax(v) {
    const steps = [150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 3000];
    for (const st of steps) if (v <= st) return st;
    return Math.ceil(v / 1000) * 1000;
  }

  function renderChart(from, to) {
    const vis = visible();
    const x0 = 70, x1 = 950, y0 = 40, y1 = 440, ymin = 100;
    const fi = YEARS.indexOf(from), ti = YEARS.indexOf(to);
    const yrs = [from - 1, ...YEARS.slice(fi, ti + 1)], n = yrs.length;
    if (!vis.length) { $('perfChart').innerHTML = ''; return; }
    const data = vis.map(s => ({ s, p: period(s, from, to) }));
    const ymax = niceMax(Math.max(100, ...data.flatMap(d => d.p.idx)));
    const X = (i) => x0 + (x1 - x0) * i / (n - 1);
    const Y = (v) => y1 - (v - ymin) / (ymax - ymin) * (y1 - y0);
    const span = ymax - ymin, step = span <= 400 ? 100 : span <= 800 ? 200 : span <= 1600 ? 400 : 500;
    let grid = '', yl = '';
    for (let g = ymin; g <= ymax + 1; g += step) {
      grid += `<line x1="${x0}" y1="${Y(g).toFixed(1)}" x2="${x1}" y2="${Y(g).toFixed(1)}"/>`;
      yl += `<text x="${x0 - 12}" y="${(Y(g) + 5).toFixed(1)}">${g}</text>`;
    }
    const ev = n > 8 ? 2 : 1;
    let xl = '';
    yrs.forEach((yr, i) => { if (i % ev === 0 || i === n - 1) xl += `<text x="${X(i).toFixed(1)}" y="${y1 + 30}">${yr}</text>`; });

    let fillArea = '';
    const eD = data.find(d => d.s.key === 'efter');
    if (eD) {
      const pts = eD.p.idx.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
      fillArea = `<polygon fill="url(#gf)" points="${X(0).toFixed(1)},${y1} ${pts} ${X(n - 1).toFixed(1)},${y1}"/>`;
    }
    let lines = '', dots = '';
    data.forEach(d => {
      const pts = d.p.idx.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
      lines += `<polyline fill="none" stroke="${d.s.color}" stroke-width="${d.s.key === 'efter' ? 1.9 : 1.55}" stroke-linejoin="round" stroke-linecap="round" points="${pts}"/>`;
      dots += `<circle cx="${X(n - 1).toFixed(1)}" cy="${Y(d.p.idx[d.p.idx.length - 1]).toFixed(1)}" r="${d.s.key === 'efter' ? 4 : 3.2}" fill="${d.s.color}"/>`;
    });
    const ends = data.map(d => ({ c: d.s.color, v: d.p.cum, y: Y(d.p.cum) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 17) ends[i].y = ends[i - 1].y + 17;
    const labels = ends.map(e =>
      `<text x="${(X(n - 1) - 8).toFixed(1)}" y="${(e.y + 5).toFixed(1)}" text-anchor="end" fill="${e.c}" font-family="Crimson Text, serif" font-size="15" font-weight="600">${e.v.toFixed(2).replace('.', ',')}</text>`).join('');

    $('perfChart').innerHTML = `<svg class="perf-chart" viewBox="0 0 1010 520" role="img" aria-label="Indekseret afkast ${from}\u2013${to}">
      <defs><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFBA00" stop-opacity="0.16"/><stop offset="100%" stop-color="#FFBA00" stop-opacity="0"/></linearGradient></defs>
      <g stroke="#3a5462" stroke-width="1" opacity="0.5">${grid}</g>
      <g fill="#C0C0C0" font-family="Crimson Text, serif" font-size="15" text-anchor="end">${yl}</g>
      <text x="${x0}" y="26" fill="#C0C0C0" font-family="Crimson Text, serif" font-size="14" font-style="italic">indeks</text>
      <g fill="#C0C0C0" font-family="Crimson Text, serif" font-size="15" text-anchor="middle">${xl}</g>
      ${fillArea}${lines}${dots}${labels}
    </svg>`;
  }

  function renderToggles(update) {
    $('seriesToggles').innerHTML = SERIES.map((s, i) =>
      `<button class="series-chip" type="button" data-i="${i}" aria-pressed="${s.on}">` +
      `<i class="dot" style="background:${s.color}"></i>${s.name}</button>`).join('');
    $('seriesToggles').querySelectorAll('.series-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = +btn.dataset.i; SERIES[i].on = !SERIES[i].on;
        btn.setAttribute('aria-pressed', SERIES[i].on);
        update();
      });
    });
  }

  function renderSurface() {
    const wrap = $('surfaceWrap'); if (!wrap) return;
    const q = SURFACE.quarters.filter(x => x.port !== null && x.port !== undefined);
    const cell = (x) => x === null || x === undefined ? '\u2014' : signed(x, 2) + ' %';
    if (!q.length) { wrap.innerHTML = '<p class="terms-meta">ÅTD-tal indsættes her.</p>'; return; }
    let rows = q.map(x => `<tr><td>${x.label}</td><td class="num">${cell(x.port)}</td><td class="num">${cell(x.bench)}</td></tr>`).join('');
    if (q.length > 1) {
      const prod = (k) => q.reduce((m, x) => m * (1 + x[k] / 100), 1);
      rows += `<tr class="sum"><td>Siden start</td><td class="num">${signed((prod('port') - 1) * 100, 2)} %</td><td class="num">${signed((prod('bench') - 1) * 100, 2)} %</td></tr>`;
    }
    wrap.innerHTML = `<table class="perf-table"><thead><tr><th>Periode</th><th class="num">Surface Capital</th><th class="num">MSCI ACWI</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function fill(sel, vals, selected) {
    sel.innerHTML = vals.map(v => `<option value="${v}"${v === selected ? ' selected' : ''}>${v}</option>`).join('');
  }

  function update() {
    const f = +$('fromYear').value, t = +$('toYear').value;
    renderStats(f, t);
    renderChart(f, t);
    $('perfCredit').textContent =
      `Indekseret forl\u00f8b (basis\u00e5r ${f - 1} = 100), ${f}\u2013${t}. ` +
      `Afkast efter fees medmindre andet er angivet. Historisk afkast er ikke en p\u00e5lidelig indikator for fremtidigt afkast.`;
  }

  function init() {
    renderToggles(update);
    fill($('fromYear'), YEARS, YEARS[0]);
    fill($('toYear'), YEARS, YEARS[YEARS.length - 1]);
    $('fromYear').addEventListener('change', () => {
      const f = +$('fromYear').value, cur = +$('toYear').value;
      fill($('toYear'), YEARS.filter(y => y >= f), Math.max(cur, f));
      update();
    });
    $('toYear').addEventListener('change', update);
    update();
    renderSurface();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
