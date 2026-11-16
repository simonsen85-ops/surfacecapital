#!/usr/bin/env python3
"""
Surface Capital — fee-vandfald 2016-2025 (pro forma) og BILAG 1-tabellen.

Beregner NAV efter fees ud fra:
  * portfolio_gross  (afkast før fees, DKK)
  * benchmark-kolonnen (hurdle) — vælg med --bench acwi_usd | acwi_dkk
Vilkår: 1 % management fee af NAV; derefter 20 % af merafkastet (efter management fee)
over benchmark, målt i procent af primo-NAV; kun i år med positivt afkast efter management fee.

Brug:
  python tools/bilag1.py --bench acwi_usd --check     # regressionstest: skal give 562,08 / 18,84 %
  python tools/bilag1.py --bench acwi_dkk             # skriver data/fee_waterfall_acwi_dkk.json + tools/out/bilag1_acwi_dkk.html
  python tools/bilag1.py --bench acwi_dkk --png       # + PNG (kræver: pip install playwright && playwright install chromium)

Ingen tredjepartsafhængigheder ud over (valgfrit) playwright til PNG.
"""
import argparse, csv, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "track_record_2016_2025.csv")
FONTS = os.path.join(ROOT, "assets", "fonts")
MGMT = 1.0          # % p.a.
PERF_SHARE = 0.20   # 20 % af merafkast

LABEL = {"acwi_usd": "MSCI ACWI (USD)", "acwi_dkk": "MSCI ACWI (DKK)"}
NOTE = {"acwi_usd": "MSCI ACWI Net Total Return (USD)", "acwi_dkk": "MSCI ACWI Net Total Return (DKK)"}


def load(bench):
    rows = []
    with open(DATA, encoding="utf-8") as f:
        lines = [l for l in f if not l.startswith("#")]
    for r in csv.DictReader(lines):
        if r[bench] in ("", None):
            sys.exit(f"Kolonnen '{bench}' er ikke udfyldt for {r['year']} i {DATA}.")
        rows.append({"y": int(r["year"]), "g": float(r["portfolio_gross"]), "b": float(r[bench])})
    return rows


def waterfall(rows):
    nav, out = 100.0, []
    for x in rows:
        navF = nav * (1 + x["g"] / 100)
        navM = navF * (1 - MGMT / 100)
        rm = navM / nav - 1
        pf = max(0.0, (rm - x["b"] / 100) * PERF_SHARE * 100) if rm > 0 else 0.0
        navA = navM - pf / 100 * nav
        out.append(dict(y=x["y"], g=x["g"], navF=navF, mf=MGMT, navM=navM, b=x["b"], pf=pf,
                        navA=navA, ra=(navA / nav - 1) * 100))
        nav = navA
    irr = ((nav / 100) ** (1 / len(rows)) - 1) * 100
    return out, nav, irr


def da(v, dec=2, pct=False):
    s = f"{abs(v):,.{dec}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("−" if v < 0 else "") + s + (" %" if pct else "")


def html(out, end, irr, bench):
    font = lambda n: "file://" + os.path.join(FONTS, n).replace("\\", "/")
    body = ['<tr><td>2015</td><td></td><td>100,00</td><td></td><td></td><td></td><td></td><td class="em">100,00</td><td></td></tr>']
    for x in out:
        body.append(f"<tr><td>{x['y']}</td><td>{da(x['g'],2,1)}</td><td>{da(x['navF'])}</td><td>{da(x['mf'],2,1)}</td>"
                    f"<td>{da(x['navM'])}</td><td>{da(x['b'],2,1)}</td><td>{da(x['pf'],2,1)}</td>"
                    f"<td class='em'>{da(x['navA'])}</td><td>{da(x['ra'],2,1)}</td></tr>")
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:'Crimson Text';src:url('{font("CrimsonText-Regular.ttf")}');font-weight:400}}
@font-face{{font-family:'Crimson Text';src:url('{font("CrimsonText-Italic.ttf")}');font-weight:400;font-style:italic}}
@font-face{{font-family:'Crimson Text';src:url('{font("CrimsonText-SemiBold.ttf")}');font-weight:600}}
html,body{{margin:0;background:transparent}}
#wrap{{width:1656px;font-family:'Crimson Text',serif;color:#E6E6E6}}
.panel{{background:#20404D;border:1px solid #7A6422;border-radius:6px;padding:26px 30px 18px}}
table{{width:100%;border-collapse:collapse;font-size:22.5px;font-variant-numeric:tabular-nums}}
th{{color:#C0C0C0;font-weight:400;font-size:16.5px;text-transform:uppercase;letter-spacing:.08em;line-height:1.3;
   text-align:right;vertical-align:bottom;padding:0 10px 13px;border-bottom:1px solid #FFBA00}}
th:first-child,td:first-child{{text-align:left}}
td{{padding:7px 10px;text-align:right;border-bottom:1px solid rgba(192,192,192,.13)}}
td:first-child{{color:#C0C0C0}} td.em{{font-weight:600}}
tbody tr:last-child td{{border-bottom:none}}
tfoot td{{border-top:1px solid #FFBA00;border-bottom:none;padding-top:13px;font-weight:600;font-size:23.5px;color:#E6E6E6}}
.note{{margin:14px 2px 0;color:#C0C0C0;font-style:italic;font-size:18.5px}}
</style></head><body><div id="wrap"><div class="panel"><table>
<thead><tr><th>År</th><th>Afkast<br>før fees</th><th>NAV før fees<br>(indekseret)</th><th>Management<br>fee</th><th>NAV efter<br>management fee</th>
<th>{LABEL[bench]}<br>årligt afkast</th><th>Performance<br>fee</th><th>NAV efter<br>alle fees</th><th>Afkast<br>efter fees</th></tr></thead>
<tbody>{"".join(body)}</tbody>
<tfoot><tr><td colspan="7">Årligt gennemsnitligt afkast efter fees (IRR), 2016–2025</td><td>{da(end)}</td><td>{da(irr,2,1)}</td></tr></tfoot>
</table></div>
<p class="note">Indekseret, ultimo 2015 = 100. Performance fee angivet i procent af primo-NAV. Benchmark: {NOTE[bench]}.</p>
</div></body></html>'''


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bench", default="acwi_dkk", choices=list(LABEL))
    ap.add_argument("--check", action="store_true", help="regressionstest mod oktober-workbooken (kun acwi_usd)")
    ap.add_argument("--png", action="store_true")
    a = ap.parse_args()

    out, end, irr = waterfall(load(a.bench))
    for x in out:
        print(f"{x['y']}  før {x['g']:7.2f}  bench {x['b']:7.2f}  perf.fee {x['pf']:5.2f}  NAV {x['navA']:8.2f}  efter {x['ra']:7.2f}")
    print(f"Slut-NAV {end:.2f}   IRR efter fees {irr:.2f} %")

    if a.check:
        assert a.bench == "acwi_usd", "--check gælder kun acwi_usd"
        ok = abs(end - 562.0803) < 0.01 and abs(irr - 18.84) < 0.005
        print("REGRESSION OK (matcher workbook 562,08 / 18,84 %)" if ok else "REGRESSION FEJLER")
        sys.exit(0 if ok else 1)

    os.makedirs(os.path.join(ROOT, "tools", "out"), exist_ok=True)
    js = os.path.join(ROOT, "data", f"fee_waterfall_{a.bench}.json")
    json.dump({"bench": a.bench, "end_nav": end, "irr": irr, "rows": out}, open(js, "w", encoding="utf-8"), indent=1)
    h = os.path.join(ROOT, "tools", "out", f"bilag1_{a.bench}.html")
    open(h, "w", encoding="utf-8").write(html(out, end, irr, a.bench))
    print("skrev", js, "og", h)

    if a.png:
        from playwright.sync_api import sync_playwright
        png = os.path.join(ROOT, "tools", "out", f"Surface_Capital_Bilag1_Performance_og_fees_{a.bench}.png")
        with sync_playwright() as p:
            b = p.chromium.launch()
            pg = b.new_page(viewport={"width": 1700, "height": 900}, device_scale_factor=2)
            pg.goto("file://" + h.replace("\\", "/"))
            pg.wait_for_timeout(500)
            pg.locator("#wrap").screenshot(path=png, omit_background=True)
            b.close()
        print("skrev", png)


if __name__ == "__main__":
    main()
