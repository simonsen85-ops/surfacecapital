/* =====================================================================
   Surface Capital — track record (dybdegående)
   Data: js/trackrecord-data.js (genereret af tools/build_trackrecord_data.py)
   Hovedtal = officielle Portfolio Performance-tal. Kurven er beregnet fra
   samme transaktionsdata og kalibreres marginalt (eksponent-justering,
   <0,3 %) så slutpunktet matcher det officielle akkumulerede afkast.
   ===================================================================== */
(function () {
  if (typeof TRACKRECORD === 'undefined' || !document.getElementById('trStats')) return;
  const D = TRACKRECORD;
  const $ = (id) => document.getElementById(id);

  const da = (v, d = 1) => v.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d }).replace('-', '\u2212');
  const signed = (v, d = 1) => (v >= 0 ? '+' : '\u2212') + da(Math.abs(v), d);
  const esc = (t) => t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const dato = (iso) => { const [y, m, dd] = iso.split('-'); return `${+dd}.${+m}.${y}`; };

  /* ---------- headline stats (officielle PP-tal) ---------- */
  const O = D.official;
  $('trStats').innerHTML = [
    { l: 'Akkumuleret 2016–2025', n: da(O.cum, 2) + ' %', s: '100 bliver til ' + da(100 + O.cum, 0) },
    { l: 'Årligt afkast (TWR)', n: da(O.ann, 2) + ' %', s: 'tidsvægtet, før skat' },
    { l: 'Årligt afkast (IRR)', n: da(O.irr, 2) + ' %', s: 'pengevægtet' },
    { l: 'Største kursfald', n: '\u2212' + da(O.maxdd, 2) + ' %', s: 'maksimal drawdown' },
  ].map(s => `<div class="stat"><span class="stat-label">${s.l}</span><span class="stat-num">${s.n}</span><span class="stat-sub">${s.s}</span></div>`).join('');

  /* ---------- hovedgraf ---------- */
  (function mainChart() {
    const pts = D.index;
    const target = 100 + O.cum;
    const actual = pts[pts.length - 1][1];
    const k = Math.log(target / 100) / Math.log(actual / 100);   // kalibrering
    const val = (v) => 100 * Math.pow(v / 100, k);

    const W = 1010, H = 520, L = 70, R = 950, T = 40, B = 440;
    const t0 = new Date(pts[0][0]).getTime(), t1 = new Date(pts[pts.length - 1][0]).getTime();
    const vmax = Math.ceil(val(Math.max(...pts.map(p => p[1]))) / 100) * 100;
    const X = (iso) => L + (new Date(iso).getTime() - t0) / (t1 - t0) * (R - L);
    const Y = (v) => B - (val(v) - 0) / vmax * (B - T);

    let grid = '', ylab = '';
    for (let g = 0; g <= vmax; g += 100) {
      const y = B - g / vmax * (B - T);
      grid += `<line x1="${L}" y1="${y.toFixed(1)}" x2="${R}" y2="${y.toFixed(1)}"/>`;
      ylab += `<text x="${L - 12}" y="${(y + 5).toFixed(1)}">${g}</text>`;
    }
    let xlab = '';
    for (let yr = 2016; yr <= 2025; yr++) {
      const x = X(`${yr}-07-01`);
      xlab += `<text x="${x.toFixed(0)}" y="${B + 30}">${yr}</text>`;
    }
    const line = pts.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
    const area = `${L},${B} ` + line + ` ${R},${B}`;
    const endV = val(pts[pts.length - 1][1]);

    $('trChart').innerHTML =
      `<svg class="perf-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Indekseret track record 2016–2025: fra 100 til ${da(endV, 0)}.">
        <defs><linearGradient id="trgold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFBA00" stop-opacity="0.18"/><stop offset="100%" stop-color="#FFBA00" stop-opacity="0"/>
        </linearGradient></defs>
        <g stroke="#3a5462" stroke-width="1" opacity="0.5">${grid}</g>
        <g fill="#C0C0C0" font-family="Crimson Text, serif" font-size="15" text-anchor="end">${ylab}</g>
        <text x="${L}" y="26" fill="#C0C0C0" font-family="Crimson Text, serif" font-size="14" font-style="italic">indeks · dagligt TWR-forløb</text>
        <g fill="#C0C0C0" font-family="Crimson Text, serif" font-size="15" text-anchor="middle">${xlab}</g>
        <polygon fill="url(#trgold)" points="${area}"/>
        <polyline fill="none" stroke="#FFBA00" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" points="${line}"/>
        <circle cx="${R}" cy="${Y(pts[pts.length - 1][1]).toFixed(1)}" r="4" fill="#FFBA00"/>
        <text x="${R - 8}" y="${(Y(pts[pts.length - 1][1]) - 12).toFixed(1)}" text-anchor="end" fill="#FFBA00" font-family="Crimson Text, serif" font-size="18" font-weight="600">${da(endV, 2)}</text>
      </svg>`;
  })();

  /* ---------- årstabel ---------- */
  (function yearTable() {
    let rows = O.years.map((y, i) => {
      const p = O.port[i], b = O.acwi[i];
      return `<tr><td>${y}</td><td class="num">${signed(p, 1)} %</td><td class="num">${signed(b, 1)} %</td><td class="num">${signed(p - b, 1)}</td></tr>`;
    }).join('');
    const cumP = O.port.reduce((a, r) => a * (1 + r / 100), 1), cumB = O.acwi.reduce((a, r) => a * (1 + r / 100), 1);
    rows += `<tr class="sum"><td>Akkumuleret</td><td class="num">${signed((cumP - 1) * 100, 0)} %</td><td class="num">${signed((cumB - 1) * 100, 0)} %</td><td class="num"></td></tr>`;
    $('trYearTable').innerHTML =
      `<thead><tr><th>År</th><th class="num">Portefølje</th><th class="num">MSCI ACWI</th><th class="num">Merafkast</th></tr></thead><tbody>${rows}</tbody>`;
  })();

  /* ---------- positionsliste ---------- */
  const list = $('trList');
  let filter = 'all';
  let sortKey = 'gainShare';

  const cmp = {
    gainShare: (a, b) => b.gainShare - a.gainShare,
    xirr: (a, b) => (b.xirr ?? -1e9) - (a.xirr ?? -1e9),
    first: (a, b) => a.first.localeCompare(b.first),
    years: (a, b) => b.years - a.years,
    peakW: (a, b) => b.peakW - a.peakW,
    name: (a, b) => a.name.localeCompare(b.name, 'da'),
  };

  function render() {
    const rows = D.positions
      .filter(p => filter === 'all' || (filter === 'open' ? p.open : !p.open))
      .sort(cmp[sortKey]);
    list.innerHTML = rows.map((p, i) => {
      const id = 'pos' + i;
      const period = dato(p.first) + ' – ' + (p.open ? 'åben' : dato(p.last));
      const irr = p.xirr === null ? '\u2013' : (p.xirr > 500 ? '\u203a 500 %' : signed(p.xirr, 1) + ' %');
      const share = signed(p.gainShare, 1) + ' %';
      return `<div class="tr-row${p.open ? ' is-open' : ''}" data-i="${D.positions.indexOf(p)}">
        <button class="tr-head" aria-expanded="false" aria-controls="${id}">
          <span class="tr-name">${esc(p.name)}${p.open ? '<span class="tr-badge">åben</span>' : ''}</span>
          <span class="tr-cell"><span class="tr-cl">Periode</span>${period}</span>
          <span class="tr-cell num"><span class="tr-cl">IRR p.a.</span>${irr}</span>
          <span class="tr-cell num"><span class="tr-cl">Bidrag</span>${share}</span>
          <span class="tr-caret" aria-hidden="true">▾</span>
        </button>
        <div class="tr-detail" id="${id}" hidden></div>
      </div>`;
    }).join('') || '<p class="terms-meta">Ingen positioner i dette filter.</p>';
  }

  /* ---------- detaljepanel ---------- */
  function detail(p) {
    const stats = [
      ['Ejertid', da(p.years, 1) + ' år'],
      ['Køb / salg', `${p.nBuy} / ${p.nSell}`],
      ['Udbyttebetalinger', String(p.nDiv)],
      ['Multipel på indskudt', p.moic === null ? '\u2013' : da(p.moic, 2).replace(',00', ',0') + '\u00d7'],
      ['IRR p.a.', p.xirr === null ? '\u2013' : (p.xirr > 500 ? '\u203a 500 % (kort ejertid)' : signed(p.xirr, 1) + ' %')],
      ['Største porteføljevægt', da(p.peakW, 1) + ' %'],
      ['Bidrag til samlet resultat', signed(p.gainShare, 1) + ' %'],
    ].map(([l, v]) => `<div class="tr-stat"><span class="tr-cl">${l}</span><span class="tr-sv">${v}</span></div>`).join('');

    return `<div class="tr-stats">${stats}</div>${posChart(p)}
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
    const yrs = new Set(p.px.map(x => x[0].slice(0, 4)));
    let xlab = '';
    yrs.forEach(y => {
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

  list.addEventListener('click', (ev) => {
    const head = ev.target.closest('.tr-head');
    if (!head) return;
    const row = head.parentElement;
    const panel = row.querySelector('.tr-detail');
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

  render();
})();
