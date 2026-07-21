/* =====================================================================
   Surface Capital — track record (dybdegående)
   Data: js/trackrecord-data.js (genereret af tools/build_trackrecord_data.py)
   Fuld periode: officielle Portfolio Performance-hovedtal. Delperioder:
   akkumuleret/p.a. kædes af de officielle årsafkast; IRR og drawdown er
   forudberegnede fra transaktionsdata. Kurven beregnes fra samme data og
   kalibreres marginalt (<0,3 %) så den rammer de officielle tal.
   ===================================================================== */
(function () {
  if (typeof TRACKRECORD === 'undefined' || !document.getElementById('trStats')) return;
  const D = TRACKRECORD, O = D.official;
  const $ = (id) => document.getElementById(id);
  const YEARS = O.years;

  const da = (v, d = 1) => v.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d }).replace('-', '\u2212');
  const signed = (v, d = 1) => (v >= 0 ? '+' : '\u2212') + da(Math.abs(v), d);
  const dato = (iso) => { const [y, m, dd] = iso.split('-'); return `${+dd}.${+m}.${y}`; };
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let Y0 = YEARS[0], Y1 = YEARS[YEARS.length - 1];
  let filter = 'all', sortKey = 'gainShare';
  const isFull = () => Y0 === YEARS[0] && Y1 === YEARS[YEARS.length - 1];

  /* chained official yearly returns for the window */
  function chained() {
    const rs = YEARS.map((y, i) => (y >= Y0 && y <= Y1) ? O.port[i] : null).filter(x => x !== null);
    const cum = rs.reduce((a, r) => a * (1 + r / 100), 1);
    return { cum: (cum - 1) * 100, ann: (Math.pow(cum, 1 / rs.length) - 1) * 100, n: rs.length };
  }
  const winKey = () => `${Y0}-${Y1}`;
  function pnlShare(p) {  // signed share of |window net gain|
    let s = 0;
    for (const [y, v] of Object.entries(p.pnlY || {})) if (+y >= Y0 && +y <= Y1) s += v;
    return s;
  }

  /* ---------- headline stats ---------- */
  function renderStats() {
    let cum, ann, irr, mdd, note;
    if (isFull()) {
      cum = O.cum; ann = O.ann; irr = O.irr; mdd = O.maxdd; note = '';
    } else {
      const c = chained(); cum = c.cum; ann = c.ann;
      const w = D.windows[winKey()] || [null, null];
      irr = w[0]; mdd = w[1]; note = ' · valgt periode';
    }
    const lab = Y0 === Y1 ? `${Y0}` : `${Y0}–${Y1}`;
    $('trStats').innerHTML = [
      { l: `Akkumuleret ${lab}`, n: da(cum, 2) + ' %', s: '100 bliver til ' + da(100 + cum, 0) },
      { l: 'Årligt afkast (TWR)', n: da(ann, 2) + ' %', s: 'tidsvægtet, før skat' + note },
      { l: 'Årligt afkast (IRR)', n: irr === null ? '\u2013' : da(irr, isFull() ? 2 : 1) + ' %', s: 'pengevægtet' + note },
      { l: 'Største kursfald', n: mdd === null ? '\u2013' : '\u2212' + da(mdd, isFull() ? 2 : 1) + ' %', s: 'maksimal drawdown' + note },
    ].map(s => `<div class="stat"><span class="stat-label">${s.l}</span><span class="stat-num">${s.n}</span><span class="stat-sub">${s.s}</span></div>`).join('');
  }

  /* ---------- hovedgraf ---------- */
  function renderChart() {
    const a = `${Y0}-01-01`, b = `${Y1}-12-31`;
    let inWin = D.index.filter(p => p[0] >= a && p[0] <= b);
    if (inWin.length < 2) { $('trChart').innerHTML = ''; return; }
    const before = D.index.filter(p => p[0] < a);
    const base = before.length ? before[before.length - 1][1] : inWin[0][1];
    let pts = inWin.map(p => [p[0], p[1] / base * 100]);
    if (before.length) pts = [[a, 100], ...pts];
    const target = 100 + (isFull() ? O.cum : chained().cum);
    const actual = pts[pts.length - 1][1];
    /* linear calibration: preserves start=100, hits the official endpoint */
    const scale = Math.abs(actual - 100) > 0.01 ? (target - 100) / (actual - 100) : 1;
    const val = (v) => 100 + (v - 100) * scale;

    const W = 1010, H = 520, L = 70, R = 950, T = 40, B = 440;
    const t0 = new Date(pts[0][0]).getTime(), t1 = new Date(pts[pts.length - 1][0]).getTime();
    const lo = Math.min(100, ...pts.map(p => val(p[1]))), hi = Math.max(...pts.map(p => val(p[1])));
    const step = hi - lo > 300 ? 100 : hi - lo > 120 ? 50 : hi - lo > 40 ? 20 : 10;
    const vmin = Math.floor(lo / step) * step, vmax = Math.ceil(hi / step) * step;
    const X = (iso) => L + (new Date(iso).getTime() - t0) / (t1 - t0) * (R - L);
    const Y = (v) => B - (val(v) - vmin) / (vmax - vmin) * (B - T);

    let grid = '', ylab = '';
    for (let g = vmin; g <= vmax; g += step) {
      const y = B - (g - vmin) / (vmax - vmin) * (B - T);
      grid += `<line x1="${L}" y1="${y.toFixed(1)}" x2="${R}" y2="${y.toFixed(1)}"/>`;
      ylab += `<text x="${L - 12}" y="${(y + 5).toFixed(1)}">${g}</text>`;
    }
    let xlab = '';
    const span = Y1 - Y0 + 1, every = span > 6 ? 1 : 1;
    for (let yr = Y0; yr <= Y1; yr += every) xlab += `<text x="${X(`${yr}-07-01`).toFixed(0)}" y="${B + 30}">${yr}</text>`;
    const line = pts.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
    const area = `${L},${B} ` + line + ` ${R},${B}`;
    const endV = val(pts[pts.length - 1][1]);

    $('trChart').innerHTML =
      `<svg class="perf-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Indekseret forløb ${Y0}–${Y1}: fra 100 til ${da(endV, 0)}.">
        <defs><linearGradient id="trgold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFBA00" stop-opacity="0.18"/><stop offset="100%" stop-color="#FFBA00" stop-opacity="0"/>
        </linearGradient></defs>
        <g stroke="#3a5462" stroke-width="1" opacity="0.5">${grid}</g>
        <g fill="#C0C0C0" font-family="Crimson Text, serif" font-size="15" text-anchor="end">${ylab}</g>
        <text x="${L}" y="26" fill="#C0C0C0" font-family="Crimson Text, serif" font-size="14" font-style="italic">indeks · dagligt TWR-forløb (basis ${Y0 === YEARS[0] ? '20.5.2016' : '1.1.' + Y0} = 100)</text>
        <g fill="#C0C0C0" font-family="Crimson Text, serif" font-size="15" text-anchor="middle">${xlab}</g>
        <polygon fill="url(#trgold)" points="${area}"/>
        <polyline fill="none" stroke="#FFBA00" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" points="${line}"/>
        <circle cx="${R}" cy="${Y(pts[pts.length - 1][1]).toFixed(1)}" r="4" fill="#FFBA00"/>
        <text x="${R - 8}" y="${(Y(pts[pts.length - 1][1]) - 12).toFixed(1)}" text-anchor="end" fill="#FFBA00" font-family="Crimson Text, serif" font-size="18" font-weight="600">${da(endV, 2)}</text>
      </svg>`;
  }

  /* ---------- årstabel ---------- */
  function renderYearTable() {
    let cumP = 1, cumB = 1, rows = '';
    YEARS.forEach((y, i) => {
      if (y < Y0 || y > Y1) return;
      const p = O.port[i], b = O.acwi[i];
      cumP *= 1 + p / 100; cumB *= 1 + b / 100;
      rows += `<tr><td>${y}</td><td class="num">${signed(p, 1)} %</td><td class="num">${signed(b, 1)} %</td><td class="num">${signed(p - b, 1)}</td></tr>`;
    });
    rows += `<tr class="sum"><td>Akkumuleret</td><td class="num">${signed((cumP - 1) * 100, 0)} %</td><td class="num">${signed((cumB - 1) * 100, 0)} %</td><td class="num"></td></tr>`;
    $('trYearTable').innerHTML =
      `<thead><tr><th>År</th><th class="num">Portefølje</th><th class="num">MSCI ACWI</th><th class="num">Merafkast</th></tr></thead><tbody>${rows}</tbody>`;
  }

  /* ---------- positionsliste ---------- */
  const list = $('trList');
  const active = (p) => p.first <= `${Y1}-12-31` && (p.open || p.last >= `${Y0}-01-01`);
  const cmp = {
    gainShare: (a, b) => b._ws - a._ws,
    xirr: (a, b) => (b.xirr ?? -1e9) - (a.xirr ?? -1e9),
    first: (a, b) => a.first.localeCompare(b.first),
    years: (a, b) => b.years - a.years,
    peakW: (a, b) => b.peakW - a.peakW,
    name: (a, b) => a.name.localeCompare(b.name, 'da'),
  };

  function render() {
    const act = D.positions.filter(active);
    let tot = 0; act.forEach(p => { p._w = pnlShare(p); tot += p._w; });
    const denom = Math.max(Math.abs(tot), 1e-9);
    act.forEach(p => { p._ws = p._w / denom * 100; });
    const rows = act
      .filter(p => filter === 'all' || (filter === 'open' ? p.open : !p.open))
      .sort(cmp[sortKey]);
    list.innerHTML = rows.map(p => {
      const id = 'pos' + D.positions.indexOf(p);
      const period = dato(p.first) + ' – ' + (p.open ? 'åben' : dato(p.last));
      const irr = p.xirr === null ? '\u2013' : (p.xirr > 500 ? '\u203a 500 %' : signed(p.xirr, 1) + ' %');
      return `<div class="tr-row${p.open ? ' is-open' : ''}" data-i="${D.positions.indexOf(p)}">
        <button class="tr-head" aria-expanded="false" aria-controls="${id}">
          <span class="tr-name">${esc(p.name)}${p.open ? '<span class="tr-badge">åben</span>' : ''}</span>
          <span class="tr-cell"><span class="tr-cl">Periode</span>${period}</span>
          <span class="tr-cell num"><span class="tr-cl">IRR p.a.</span>${irr}</span>
          <span class="tr-cell num"><span class="tr-cl">Bidrag ${Y0 === Y1 ? Y0 : Y0 + '–' + Y1}</span>${signed(p._ws, 1)} %</span>
          <span class="tr-caret" aria-hidden="true">▾</span>
        </button>
        <div class="tr-detail" id="${id}" hidden></div>
      </div>`;
    }).join('') || '<p class="terms-meta">Ingen positioner i dette filter og denne periode.</p>';
  }

  /* ---------- detaljepanel (hele ejerperioden) ---------- */
  function detail(p) {
    const stats = [
      ['Ejertid', da(p.years, 1) + ' år'],
      ['Køb / salg', `${p.nBuy} / ${p.nSell}`],
      ['Udbyttebetalinger', String(p.nDiv)],
      ['Multipel på indskudt', p.moic === null ? '\u2013' : da(p.moic, 2).replace(',00', ',0') + '\u00d7'],
      ['IRR p.a.', p.xirr === null ? '\u2013' : (p.xirr > 500 ? '\u203a 500 % (kort ejertid)' : signed(p.xirr, 1) + ' %')],
      ['Største porteføljevægt', da(p.peakW, 1) + ' %'],
      ['Bidrag 2016–2025', signed(p.gainShare, 1) + ' %'],
    ].map(([l, v]) => `<div class="tr-stat"><span class="tr-cl">${l}</span><span class="tr-sv">${v}</span></div>`).join('');
    return `<p class="terms-meta" style="margin-top:0.5rem">Nøgletal og kursforløb dækker hele ejerperioden.</p>
      <div class="tr-stats">${stats}</div>${posChart(p)}
      <p class="chart-credit">Kurs i ${p.cur === 'GBX' ? 'GBp' : p.cur}. ▲ køb · ▽ salg · | udbytte.
      Handler er markeret på faktisk handelsdag; kurslinjen viser ugentlige lukkekurser.</p>`;
  }

  function posChart(p) {
    if (!p.px || p.px.length < 2) return '<p class="terms-meta">Ingen kurshistorik tilgængelig for denne position.</p>';
    const W = 1010, H = 330, L = 64, R = 980, T = 26, B = 270;
    const t0 = new Date(p.px[0][0]).getTime(), t1 = new Date(p.px[p.px.length - 1][0]).getTime();
    const vals = p.px.map(x => x[1]);
    let vmin = Math.min(...vals), vmax = Math.max(...vals);
    const padv = (vmax - vmin) * 0.12 || vmax * 0.1; vmin = Math.max(0, vmin - padv); vmax += padv;
    const X = (iso) => L + (new Date(iso).getTime() - t0) / (t1 - t0 || 1) * (R - L);
    const Y = (v) => B - (v - vmin) / (vmax - vmin) * (B - T);
    const line = p.px.map(x => `${X(x[0]).toFixed(1)},${Y(x[1]).toFixed(1)}`).join(' ');
    let xlab = '';
    new Set(p.px.map(x => x[0].slice(0, 4))).forEach(y => {
      const t = new Date(`${y}-01-01`).getTime();
      if (t >= t0 && t <= t1) xlab += `<text x="${X(`${y}-01-01`).toFixed(0)}" y="${B + 26}">${y}</text>`;
    });
    const gl = [0.25, 0.5, 0.75].map(f => {
      const v = vmin + f * (vmax - vmin);
      return `<line x1="${L}" y1="${Y(v).toFixed(1)}" x2="${R}" y2="${Y(v).toFixed(1)}"/>`;
    }).join('');
    const ylab = [vmin + 0.25 * (vmax - vmin), vmin + 0.75 * (vmax - vmin)]
      .map(v => `<text x="${L - 8}" y="${(Y(v) + 4).toFixed(1)}">${da(v, v >= 100 ? 0 : 1)}</text>`).join('');
    const nearPx = (iso) => {
      let best = p.px[0];
      for (const x of p.px) if (Math.abs(new Date(x[0]) - new Date(iso)) < Math.abs(new Date(best[0]) - new Date(iso))) best = x;
      return best[1];
    };
    let marks = '';
    for (const e of p.events) {
      const x = X(e.d).toFixed(1);
      if (e.k === 'div') {
        marks += `<line x1="${x}" y1="${T}" x2="${x}" y2="${B}" stroke="#C0C0C0" stroke-width="1" opacity="0.35"><title>Udbytte ${dato(e.d)}</title></line>`;
      } else {
        const py = Y(e.pps != null ? Math.min(Math.max(e.pps, vmin), vmax) : nearPx(e.d)).toFixed(1);
        const buy = e.k === 'buy';
        const tip = `${buy ? 'Køb' : 'Salg'} ${dato(e.d)}${e.pps != null ? ' · kurs ' + da(e.pps, 2) : ''}`;
        marks += buy
          ? `<path d="M ${x} ${py} m -6 5 l 6 -10 l 6 10 z" fill="#FFBA00"><title>${tip}</title></path>`
          : `<path d="M ${x} ${py} m -6 -5 l 6 10 l 6 -10 z" fill="none" stroke="#C0C0C0" stroke-width="1.4"><title>${tip}</title></path>`;
      }
    }
    return `<svg class="perf-chart tr-poschart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Kursforløb for ${esc(p.name)} med markerede handler.">
      <g stroke="#3a5462" stroke-width="1" opacity="0.5">${gl}</g>
      <g fill="#C0C0C0" font-family="Crimson Text, serif" font-size="13" text-anchor="end">${ylab}</g>
      <g fill="#C0C0C0" font-family="Crimson Text, serif" font-size="14" text-anchor="middle">${xlab}</g>
      <polyline fill="none" stroke="#E6E6E6" stroke-width="1.5" stroke-linejoin="round" points="${line}" opacity="0.9"/>
      ${marks}
    </svg>`;
  }

  /* ---------- wiring ---------- */
  function renderAll() { renderStats(); renderChart(); renderYearTable(); render(); }

  const selFrom = $('trFrom'), selTo = $('trTo');
  YEARS.forEach(y => {
    selFrom.insertAdjacentHTML('beforeend', `<option value="${y}">${y}</option>`);
    selTo.insertAdjacentHTML('beforeend', `<option value="${y}">${y}</option>`);
  });
  selFrom.value = String(Y0); selTo.value = String(Y1);
  selFrom.addEventListener('change', () => { Y0 = +selFrom.value; if (Y0 > Y1) { Y1 = Y0; selTo.value = String(Y1); } renderAll(); });
  selTo.addEventListener('change', () => { Y1 = +selTo.value; if (Y1 < Y0) { Y0 = Y1; selFrom.value = String(Y0); } renderAll(); });

  list.addEventListener('click', (ev) => {
    const head = ev.target.closest('.tr-head');
    if (!head) return;
    const row = head.parentElement, panel = row.querySelector('.tr-detail');
    const open = !panel.hidden;
    if (!open && !panel.innerHTML) panel.innerHTML = detail(D.positions[+row.dataset.i]);
    panel.hidden = open;
    head.setAttribute('aria-expanded', String(!open));
    row.classList.toggle('is-expanded', !open);
  });
  document.querySelectorAll('.tr-pill').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tr-pill').forEach(x => x.classList.remove('is-active'));
    b.classList.add('is-active');
    filter = b.dataset.filter;
    render();
  }));
  $('trSort').addEventListener('change', (e) => { sortKey = e.target.value; render(); });

  renderAll();
})();
