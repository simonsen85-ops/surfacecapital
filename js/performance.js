/* =====================================================================
   Surface Capital — interaktiv performance
   =====================================================================
   Kilde: Historisk_performance ... Sheet 1 ("10 års performance").
   Alle årlige afkast er REVIDEREDE tal i procent (verificeret mod totaler:
   efter fees 18,84 % / før fees 22,01 % / MSCI 11,73 % / S&P500 Acc 14,26 %).
   Før fees 2025 rettet fra 23,80 til 24,80 (okt. 2026) — verificeret mod Portfolio Performance-XML.
   Efter fees omregnet okt. 2026 efter vilkårene: 1 % management fee, derefter 20 % af merafkastet
   over MSCI ACWI efter management fee (af primo-kapital), kun i år med positivt afkast. Kilde: IRR-workbook.

   >>> Tilføj/ret en serie nedenfor. 'on' styrer om den vises som standard.
   ===================================================================== */
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

const SERIES = [
  { key:'efter', name:'Porteføljen efter fees', color:'#FFBA00', on:true,
    r:[44.58, 26.81, -11.00, 34.85, 13.75, 26.66, 4.79, 12.96, 21.47, 23.31] },
  { key:'foer',  name:'Porteføljen før fees',   color:'#C8952E', on:false,
    r:[55.30, 28.80, -10.10, 38.30, 14.90, 30.00, 11.70, 14.10, 23.70, 24.80] },
  { key:'msci',  name:'MSCI ACWI',              color:'#C0C0C0', on:true,
    r:[7.90, 24.00, -9.40, 26.60, 16.30, 18.50, -18.40, 22.20, 17.50, 22.34] },
  { key:'spacc', name:'S&P 500 Acc (USD)',      color:'#7FA6BD', on:false,
    r:[11.20, 21.10, -4.90, 30.70, 17.80, 28.20, -18.50, 25.70, 24.50, 17.60] },
  { key:'speh',  name:'S&P 500 (EUR-hedged)',   color:'#9DAE8E', on:false,
    r:[11.50, 18.90, -8.10, 27.20, 14.00, 28.40, -21.80, 23.50, 23.00, 15.17] },
];

/* Surface Capital — fondens EGEN performance, pr. kvartal (udfyld løbende).
   Samme valuta som 2016–2025-serierne ovenfor (MSCI ACWI = samme kilde som tidligere),
   så grafen kan kæde forvalterens historik og fondens afkast sammen.

   sinceStart: officielle "siden start"-tal fra NAV-workbooken (som i investorbrevet).
   Bruges kun når asOf matcher seneste kvartal; ellers kædes kvartalerne automatisk. */
const SURFACE = {
  quarters: [
    { label: 'Q1 2026', gross: -5.23, port: -5.48, bench: -3.21 },
    { label: 'Q2 2026', gross: 8.61, port: 8.36, bench: 14.93 },
    { label: 'Q3 2026', gross: 1.69, port: 1.44, bench: 1.60 },
  ],
  sinceStart: { asOf: 'Q3 2026', gross: 4.68, port: 3.90, bench: 13.03 },
};
const FUND_YEAR = 2026;
/* Hvilke historiske serier fortsætter med fondens tal fra 2026 (serie-key -> felt i quarters). */
const FUND_MAP = { efter: 'port', foer: 'gross', msci: 'bench' };
/* ===================================================================== */

(function () {
  const $ = (id) => document.getElementById(id);
  if (!$('fromYear')) return;

  const da     = (v, d) => v.toFixed(d).replace('.', ',').replace('-', '\u2212');
  const signed = (v, d) => (v >= 0 ? '+' : '\u2212') + Math.abs(v).toFixed(d).replace('.', ',');
  const LAST_FULL = YEARS[YEARS.length - 1];
  const Q = SURFACE.quarters.filter(q => q.port !== null && q.port !== undefined)
    .map(q => Object.assign({ n: +(/Q(\d)/.exec(q.label) || [0, 4])[1] }, q));
  const HAS_FUND = Q.length > 0;
  const lastQ = HAS_FUND ? Q[Q.length - 1].label : '';
  const ALL = HAS_FUND ? [...YEARS, FUND_YEAR] : YEARS.slice();
  const yLabel = (y) => y === FUND_YEAR ? `${FUND_YEAR} (t.o.m. ${lastQ.split(' ')[0]})` : String(y);

  /* Fondens "siden start" — officielle tal hvis de matcher seneste kvartal, ellers kædet. */
  function fundSince(k) {
    const o = SURFACE.sinceStart;
    if (o && o.asOf === lastQ && typeof o[k] === 'number') return o[k];
    return (Q.reduce((m, x) => m * (1 + x[k] / 100), 1) - 1) * 100;
  }

  /* Punkter for en serie: x = år efter basis (ultimo from-1), v = indeks. */
  function path(s, from, to) {
    const pts = [{ x: 0, v: 100 }];
    let v = 100;
    if (from <= LAST_FULL) {
      const fi = YEARS.indexOf(from), ti = YEARS.indexOf(Math.min(to, LAST_FULL));
      s.r.slice(fi, ti + 1).forEach((r, i) => { v *= 1 + r / 100; pts.push({ x: i + 1, v }); });
    }
    if (to === FUND_YEAR && FUND_MAP[s.key]) {
      const base = from <= LAST_FULL ? LAST_FULL - from + 1 : 0, k = FUND_MAP[s.key];
      Q.forEach(q => { v *= 1 + q[k] / 100; pts.push({ x: base + q.n / 4, v, fund: true }); });
    }
    return pts;
  }
  function period(s, from, to) {
    const pts = path(s, from, to), last = pts[pts.length - 1];
    const cum = last.v, yrs = last.x;
    return { pts, cum, yrs, ann: yrs > 0 ? (Math.pow(cum / 100, 1 / yrs) - 1) * 100 : 0,
             short: to === FUND_YEAR && !FUND_MAP[s.key] };
  }
  const visible = () => SERIES.filter(s => s.on);

  function renderStats(from, to) {
    const vis = visible();
    let html = vis.map(s => {
      const p = period(s, from, to);
      if (p.yrs <= 0) return '';
      const fundOnly = from > LAST_FULL && FUND_MAP[s.key];
      const main = p.yrs >= 1 ? `${da(p.ann, 2)} %` : `${signed(fundOnly ? fundSince(FUND_MAP[s.key]) : p.cum - 100, 2)} %`;
      let sub = p.yrs >= 1 ? `${da(p.cum - 100, 0)} % akkumuleret` : 'akkumuleret, ikke annualiseret';
      if (p.short) sub += ` · t.o.m. ${LAST_FULL}`;
      return `<div class="stat"><span class="stat-label"><i class="sdot" style="background:${s.color}"></i>${s.name}</span>` +
             `<span class="stat-num">${main}</span><span class="stat-sub">${sub}</span></div>`;
    }).join('');
    const e = vis.find(s => s.key === 'efter'), m = vis.find(s => s.key === 'msci');
    if (e && m && period(e, from, to).yrs >= 1) {
      const d = period(e, from, to).ann - period(m, from, to).ann;
      html += `<div class="stat"><span class="stat-label">Merafkast p.a.</span>` +
              `<span class="stat-num">${signed(d, 2)} %-p</span>` +
              `<span class="stat-sub">efter fees vs. MSCI ACWI</span></div>`;
    }
    if (to === FUND_YEAR && from <= LAST_FULL && HAS_FUND) {
      html += `<div class="stat"><span class="stat-label">Heraf Surface Capital A/S</span>` +
              `<span class="stat-num">${signed(fundSince('port'), 2)} %</span>` +
              `<span class="stat-sub">${FUND_YEAR} t.o.m. ${lastQ.split(' ')[0]}, efter fees · MSCI ACWI ${signed(fundSince('bench'), 2)} %</span></div>`;
    }
    $('perfStats').innerHTML = html || '<p class="terms-meta">Vælg mindst én serie ovenfor.</p>';
  }

  function niceStep(span) {
    const raw = span / 5, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const f of [1, 2, 2.5, 5, 10]) if (raw <= f * mag) return f * mag;
    return 10 * mag;
  }

  function renderChart(from, to) {
    const vis = visible();
    const x0 = 70, x1 = 950, y0 = 40, y1 = 440;
    if (!vis.length) { $('perfChart').innerHTML = ''; return; }
    const data = vis.map(s => ({ s, p: period(s, from, to) })).filter(d => d.p.yrs > 0);
    if (!data.length) { $('perfChart').innerHTML = ''; return; }
    const xmax = Math.max(...data.map(d => d.p.yrs), 0.25);
    const vals = data.flatMap(d => d.p.pts.map(p => p.v));
    const lo = Math.min(100, ...vals), hi = Math.max(100, ...vals);
    const step = niceStep(hi - lo || 10);
    const ymin = Math.floor(lo / step) * step, ymax = Math.ceil(hi / step) * step;
    const X = (x) => x0 + (x1 - x0) * x / xmax;
    const Y = (v) => y1 - (v - ymin) / (ymax - ymin) * (y1 - y0);
    const dec = step < 1 ? 1 : 0;

    let grid = '', yl = '';
    for (let g = ymin; g <= ymax + step / 2; g += step) {
      grid += `<line x1="${x0}" y1="${Y(g).toFixed(1)}" x2="${x1}" y2="${Y(g).toFixed(1)}"/>`;
      yl += `<text x="${x0 - 12}" y="${(Y(g) + 5).toFixed(1)}">${da(g, dec)}</text>`;
    }

    /* x-akse: hele år + evt. kvartaler i fondsperioden */
    const fullYears = Math.floor(xmax + 1e-9), partial = xmax - fullYears > 1e-9;
    const ticks = [];
    if (from > LAST_FULL) {           // kun fonden: kvartalsakse
      ticks.push({ x: 0, t: `Ultimo ${LAST_FULL}` });
      Q.forEach(q => ticks.push({ x: q.n / 4, t: q.label }));
    } else {
      const ev = fullYears > 8 ? 2 : 1;
      for (let k = 0; k <= fullYears; k++)
        if (k % ev === 0 || (k === fullYears && !partial)) ticks.push({ x: k, t: String(from - 1 + k) });
      if (partial) {
        while (ticks.length && X(xmax) - X(ticks[ticks.length - 1].x) < 50) ticks.pop();
        ticks.push({ x: xmax, t: lastQ });
      }
    }
    const xl = ticks.map(t => `<text x="${X(t.x).toFixed(1)}" y="${y1 + 30}">${t.t}</text>`).join('');

    /* markering af fondsperioden */
    let band = '';
    if (to === FUND_YEAR && from <= LAST_FULL && HAS_FUND) {
      const xb = X(LAST_FULL - from + 1);
      band = `<rect x="${xb.toFixed(1)}" y="${y0}" width="${(x1 - xb).toFixed(1)}" height="${y1 - y0}" fill="#C0C0C0" opacity="0.06"/>` +
             `<line x1="${xb.toFixed(1)}" y1="${y0 - 8}" x2="${xb.toFixed(1)}" y2="${y1}" stroke="#FFBA00" stroke-width="1" stroke-dasharray="4 4" opacity="0.85"/>` +
             `<text x="${(xb - 8).toFixed(1)}" y="26" text-anchor="end" fill="#C0C0C0" font-family="Crimson Text, serif" font-size="13" letter-spacing="1.6">FORVALTERENS PORTEFØLJE</text>` +
             `<text x="${(xb + 8).toFixed(1)}" y="26" text-anchor="start" fill="#E6E6E6" font-family="Crimson Text, serif" font-size="13" letter-spacing="1.6">FONDEN</text>`;
    } else if (from > LAST_FULL) {
      band = `<text x="${x1}" y="26" text-anchor="end" fill="#E6E6E6" font-family="Crimson Text, serif" font-size="13" letter-spacing="1.6">SURFACE CAPITAL A/S</text>`;
    }

    let fillArea = '';
    const eD = data.find(d => d.s.key === 'efter');
    if (eD) {
      const pts = eD.p.pts.map(p => `${X(p.x).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ');
      fillArea = `<polygon fill="url(#gf)" points="${X(0).toFixed(1)},${y1} ${pts} ${X(eD.p.yrs).toFixed(1)},${y1}"/>`;
    }
    let lines = '', dots = '';
    data.forEach(d => {
      const main = d.s.key === 'efter';
      const pts = d.p.pts.map(p => `${X(p.x).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ');
      lines += `<polyline fill="none" stroke="${d.s.color}" stroke-width="${main ? 1.9 : 1.55}" stroke-linejoin="round" stroke-linecap="round" points="${pts}"/>`;
      d.p.pts.filter(p => p.fund).forEach(p => {
        dots += `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="${main ? 2.6 : 2.1}" fill="${d.s.color}"/>`;
      });
      const last = d.p.pts[d.p.pts.length - 1];
      dots += `<circle cx="${X(last.x).toFixed(1)}" cy="${Y(last.v).toFixed(1)}" r="${main ? 4 : 3.2}" fill="${d.s.color}"/>`;
    });
    const ends = data.map(d => { const l = d.p.pts[d.p.pts.length - 1]; return { c: d.s.color, v: l.v, x: X(l.x), y: Y(l.v) }; })
      .sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 17) ends[i].y = ends[i - 1].y + 17;
    const labels = ends.map(e =>
      `<text x="${(e.x - 8).toFixed(1)}" y="${(e.y - 8).toFixed(1)}" text-anchor="end" fill="${e.c}" font-family="Crimson Text, serif" font-size="15" font-weight="600">${e.v.toFixed(2).replace('.', ',')}</text>`).join('');

    const span = from > LAST_FULL ? `${FUND_YEAR}` : `${from}\u2013${to === FUND_YEAR ? lastQ : to}`;
    $('perfChart').innerHTML = `<svg class="perf-chart" viewBox="0 0 1010 520" role="img" aria-label="Indekseret afkast ${span}">
      <defs><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFBA00" stop-opacity="0.16"/><stop offset="100%" stop-color="#FFBA00" stop-opacity="0"/></linearGradient></defs>
      ${band}
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
    const cell = (x) => x === null || x === undefined ? '\u2014' : signed(x, 2) + ' %';
    if (!Q.length) { wrap.innerHTML = '<p class="terms-meta">ÅTD-tal indsættes her.</p>'; return; }
    let rows = Q.map(x => `<tr><td>${x.label}</td><td class="num">${cell(x.gross)}</td><td class="num">${cell(x.port)}</td><td class="num">${cell(x.bench)}</td></tr>`).join('');
    if (Q.length > 1) {
      rows += `<tr class="sum"><td>Siden start</td><td class="num">${cell(fundSince('gross'))}</td><td class="num">${cell(fundSince('port'))}</td><td class="num">${cell(fundSince('bench'))}</td></tr>`;
    }
    wrap.innerHTML = `<table class="perf-table"><thead><tr><th>Periode</th><th class="num">Før fees</th><th class="num">Efter fees</th><th class="num">MSCI ACWI</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function fill(sel, vals, selected) {
    sel.innerHTML = vals.map(v => `<option value="${v}"${v === selected ? ' selected' : ''}>${yLabel(v)}</option>`).join('');
  }

  function update() {
    const f = +$('fromYear').value, t = +$('toYear').value;
    renderStats(f, t);
    renderChart(f, t);
    let txt;
    if (f > LAST_FULL) {
      txt = `Surface Capital A/S' faktiske afkast pr. kvartal, indekseret (ultimo ${LAST_FULL} = 100), t.o.m. ${lastQ}. `;
    } else {
      txt = `Indekseret forl\u00f8b (basis\u00e5r ${f - 1} = 100), ${f}\u2013${t === FUND_YEAR ? lastQ : t}. `;
      if (t === FUND_YEAR)
        txt += `Til venstre for den stiplede linje: forvalterens personlige portef\u00f8lje (2016\u2013${LAST_FULL}, pro forma fees). ` +
               `Til h\u00f8jre: Surface Capital A/S' faktiske afkast fra ${FUND_YEAR}. `;
    }
    $('perfCredit').textContent = txt +
      `Afkast efter fees medmindre andet er angivet. Historisk afkast er ikke en p\u00e5lidelig indikator for fremtidigt afkast.`;
  }

  function init() {
    renderToggles(update);
    fill($('fromYear'), ALL, ALL[0]);
    fill($('toYear'), ALL, ALL[ALL.length - 1]);
    $('fromYear').addEventListener('change', () => {
      const f = +$('fromYear').value, cur = +$('toYear').value;
      fill($('toYear'), ALL.filter(y => y >= f), Math.max(cur, f));
      update();
    });
    $('toYear').addEventListener('change', update);
    update();
    renderSurface();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
