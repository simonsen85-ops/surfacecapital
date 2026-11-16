#!/usr/bin/env python3
"""
Surface Capital: benchmarks i DKK (docs/RUNBOOK-dkk-benchmark.md, trin 2).

Input (rå data i data/raw/, hentet 16-11-2026):
  msci_892400_NETR_{DKK,EUR,USD}_daily.json  MSCI ACWI Net (892400), daglige indeksniveauer
      kilde: app2.msci.com/products/service/index/indexmaster/getLevelDataForGraph
             (JSON'en bag MSCI's end-of-day index data search)
  ecb_EUR{DKK,USD}_daily.csv                 ECB-referencekurser, daglige
      kilde: data-api.ecb.europa.eu/service/data/EXR/D.{DKK,USD}.EUR.SP00.A
  data/track_record_2016_2025.csv            acwi_usd og sp500_usd (factsheet-tal)

Beregner:
  acwi_dkk   = MSCI ACWI Net i DKK direkte fra MSCI (offentliggjort tal)
  route 1    = niveau_EUR x EURDKK(ECB)                    (kontrol, skal ramme DKK direkte)
  route 2    = (1 + acwi_usd) x USDDKK_slut/USDDKK_start - 1 (kontrol, max 0,15 pp afvigelse)
  sp500_dkk  = (1 + sp500_usd) x USDDKK_slut/USDDKK_start - 1
               kontrolleret mod YCharts ^SPXNTREUR omregnet til DKK (max ~0,3 pp)

  USDDKK = ECB EUR/DKK / EUR/USD kl. 16 London (WM/Reuters), hvor EUR/USD kl. 16 er udledt af MSCI's
  egne niveauer (niveau_USD / niveau_EUR). Grund: ECB fixer kl. 14:15 CET, og EUR/USD kan flytte sig
  op til 0,6 % før lukkekursen (fx 31-12-2021), hvilket gav afvigelser på op til 1 pp. MSCI og S&P
  bruger selv WM/Reuters kl. 16. EUR/DKK er fastkurs, så tidspunktet er ligegyldigt dér.
  Beslutning (Rasmus, 16-11-2026): ACWI DKK = MSCI's DKK-serie direkte, uden omregning.
  2026-kvartaler for ACWI DKK (og USD til sammenligning med SURFACE.quarters)

Brug:
  python tools/benchmarks_dkk.py            # vis tabeller og kontroller
  python tools/benchmarks_dkk.py --write    # + skriv acwi_dkk/sp500_dkk i CSV'en og data/acwi_quarters_2026.csv
Exit-kode 1 hvis en kontrol fejler (STOP og vis Rasmus tabellen).
"""
import argparse, csv, json, os, sys
from bisect import bisect_right
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")
TRACK = os.path.join(ROOT, "data", "track_record_2016_2025.csv")
QUARTERS_OUT = os.path.join(ROOT, "data", "acwi_quarters_2026.csv")

YEAR_ENDS = [date(y, 12, 31) for y in range(2015, 2026)]
Q_ENDS = [date(2025, 12, 31), date(2026, 3, 31), date(2026, 6, 30), date(2026, 9, 30)]
TOL_ROUTE2 = 0.15   # pp, krav i runbook
TOL_ROUTE1 = 0.15   # pp, samme krav for EUR x ECB mod MSCI DKK
TOL_SPX = 0.30      # pp, krav i runbook
# YCharts S&P 500 Net TR EUR (^SPXNTREUR), kalenderår, fra runbook trin 2
YCHARTS_SPX_EUR = {2019: 33.10, 2020: 8.03, 2021: 37.89, 2022: -13.17, 2023: 21.41, 2024: 32.82, 2025: 3.54}


class Series:
    """Dato-sorteret serie; .on(d) = sidste observation på eller før d."""
    def __init__(self, pairs):
        pairs = sorted(pairs)
        self.d = [p[0] for p in pairs]
        self.v = [p[1] for p in pairs]

    def on(self, d):
        i = bisect_right(self.d, d) - 1
        if i < 0:
            raise ValueError(f"ingen observation på/før {d}")
        return self.d[i], self.v[i]


def msci(ccy):
    p = os.path.join(RAW, f"msci_892400_NETR_{ccy}_daily.json")
    lv = json.load(open(p, encoding="utf-8"))["indexes"]["INDEX_LEVELS"]
    return Series((date(x["calc_date"] // 10000, x["calc_date"] // 100 % 100, x["calc_date"] % 100),
                   float(x["level_eod"])) for x in lv)


def ecb(ccy):
    p = os.path.join(RAW, f"ecb_EUR{ccy}_daily.csv")
    with open(p, encoding="utf-8") as f:
        return Series((date.fromisoformat(r["TIME_PERIOD"]), float(r["OBS_VALUE"]))
                      for r in csv.DictReader(f) if r["OBS_VALUE"])


def track():
    with open(TRACK, encoding="utf-8") as f:
        lines = f.readlines()
    comments = [l for l in lines if l.startswith("#")]
    rows = list(csv.DictReader(l for l in lines if not l.startswith("#")))
    return comments, rows


def ret(a, b):
    return (b / a - 1) * 100


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    a = ap.parse_args()

    m_dkk, m_eur, m_usd = msci("DKK"), msci("EUR"), msci("USD")
    eurdkk, eurusd = ecb("DKK"), ecb("USD")
    eurusd_wm = lambda d: m_usd.on(d)[1] / m_eur.on(d)[1]   # proportional med WM/Reuters EUR/USD
    usddkk = lambda d: eurdkk.on(d)[1] / eurusd_wm(d)
    comments, rows = track()
    by_year = {int(r["year"]): r for r in rows}

    # --- datolog: hvilke observationsdatoer blev brugt
    print("Observationsdatoer (sidste på/før skæringsdato):")
    for d in sorted(set(YEAR_ENDS + Q_ENDS)):
        used = {n: s.on(d)[0] for n, s in
                [("MSCI", m_dkk), ("ECB DKK", eurdkk), ("ECB USD", eurusd)]}
        flag = "" if all(u == d for u in used.values()) else "   <- ikke handelsdag"
        print(f"  {d}: " + ", ".join(f"{n} {u}" for n, u in used.items()) + flag)

    # --- årstabel
    print("\nÅrsafkast i % (pp = procentpoint)")
    hdr = ("år", "USD csv", "USD MSCI", "DKK MSCI", "rute1 EURxECB", "Δ1", "rute2 USDxFX", "Δ2",
           "SPX USD", "SPX DKK", "YCh→DKK", "Δspx")
    print(" ".join(f"{h:>13}" for h in hdr))
    fails, results = [], {}
    for y in range(2016, 2026):
        d0, d1 = date(y - 1, 12, 31), date(y, 12, 31)
        r = by_year[y]
        usd_csv, spx_usd = float(r["acwi_usd"]), float(r["sp500_usd"])
        usd_m = ret(m_usd.on(d0)[1], m_usd.on(d1)[1])
        dkk = ret(m_dkk.on(d0)[1], m_dkk.on(d1)[1])
        r1 = ret(m_eur.on(d0)[1] * eurdkk.on(d0)[1], m_eur.on(d1)[1] * eurdkk.on(d1)[1])
        fx = usddkk(d1) / usddkk(d0)
        r2 = ((1 + usd_csv / 100) * fx - 1) * 100
        spx = ((1 + spx_usd / 100) * fx - 1) * 100
        ych = YCHARTS_SPX_EUR.get(y)
        ych_dkk = ((1 + ych / 100) * eurdkk.on(d1)[1] / eurdkk.on(d0)[1] - 1) * 100 if ych is not None else None
        d1v, d2v = r1 - dkk, r2 - dkk
        dspx = spx - ych_dkk if ych_dkk is not None else None
        if abs(d1v) > TOL_ROUTE1: fails.append(f"{y}: rute 1 afviger {d1v:+.2f} pp")
        if abs(d2v) > TOL_ROUTE2: fails.append(f"{y}: rute 2 afviger {d2v:+.2f} pp")
        if dspx is not None and abs(dspx) > TOL_SPX: fails.append(f"{y}: S&P DKK afviger fra YCharts {dspx:+.2f} pp")
        results[y] = (dkk, spx)
        cells = [y, usd_csv, usd_m, dkk, r1, d1v, r2, d2v, spx_usd, spx,
                 ych_dkk if ych_dkk is not None else "", dspx if dspx is not None else ""]
        print(" ".join(f"{c:>13.2f}" if isinstance(c, float) else f"{c!s:>13}" for c in cells))

    # --- 2026 kvartaler
    print("\n2026 kvartaler, MSCI ACWI Net i %")
    print(f"{'kvartal':>10} {'USD':>8} {'DKK':>8} {'rute1':>8}")
    qrows = []
    for i in range(1, len(Q_ENDS)):
        d0, d1 = Q_ENDS[i - 1], Q_ENDS[i]
        u = ret(m_usd.on(d0)[1], m_usd.on(d1)[1])
        k = ret(m_dkk.on(d0)[1], m_dkk.on(d1)[1])
        r1 = ret(m_eur.on(d0)[1] * eurdkk.on(d0)[1], m_eur.on(d1)[1] * eurdkk.on(d1)[1])
        qrows.append((f"Q{i} 2026", d0, d1, u, k))
        print(f"{'Q%d 2026' % i:>10} {u:8.2f} {k:8.2f} {r1:8.2f}")
        if abs(r1 - k) > TOL_ROUTE1: fails.append(f"Q{i} 2026: rute 1 afviger {r1 - k:+.2f} pp")
    ss_u = ret(m_usd.on(Q_ENDS[0])[1], m_usd.on(Q_ENDS[-1])[1])
    ss_k = ret(m_dkk.on(Q_ENDS[0])[1], m_dkk.on(Q_ENDS[-1])[1])
    print(f"{'siden start':>10} {ss_u:8.2f} {ss_k:8.2f}")

    print("\nKONTROLLER:", "OK" if not fails else "FEJL")
    for f in fails:
        print("  ", f)

    if a.write and not fails:
        for y, (dkk, spx) in results.items():
            by_year[y]["acwi_dkk"] = f"{dkk:.2f}"
            by_year[y]["sp500_dkk"] = f"{spx:.2f}"
        new_comments = [c for c in comments if not c.startswith(("# acwi_dkk", "# sp500_dkk", "#   Kontrol"))]
        new_comments += [
            "# acwi_dkk: MSCI ACWI Net Total Return, DKK (892400, MSCI end-of-day index data, niveauer 31/12, hentet 16-11-2026).\n",
            "#   Kontrol: EUR-niveau x ECB EUR/DKK og acwi_usd x USD/DKK, begge inden for 0,15 pp hvert år. tools/benchmarks_dkk.py\n",
            "# sp500_dkk: (1 + sp500_usd) x USDDKK_slut/USDDKK_start - 1. USDDKK = ECB EUR/DKK / EUR/USD kl. 16 London (udledt af MSCI USD/EUR-niveauer).\n",
            "#   Kontrol: YCharts ^SPXNTREUR x ECB EUR/DKK 2019-2025, inden for 0,3 pp.\n",
        ]
        with open(TRACK, "w", encoding="utf-8", newline="\n") as f:
            f.writelines(new_comments)
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), lineterminator="\n")
            w.writeheader()
            w.writerows(rows)
        with open(QUARTERS_OUT, "w", encoding="utf-8", newline="\n") as f:
            f.write("# MSCI ACWI Net Total Return (892400), kvartalsafkast 2026 i %. Kilde: MSCI end-of-day index data, hentet 16-11-2026.\n")
            f.write("# acwi_usd til sammenligning med de tidligere SURFACE.quarters[].bench. tools/benchmarks_dkk.py\n")
            f.write("quarter,start,end,acwi_usd,acwi_dkk\n")
            for lab, d0, d1, u, k in qrows:
                f.write(f"{lab},{d0},{d1},{u:.2f},{k:.2f}\n")
            f.write(f"since_start,{Q_ENDS[0]},{Q_ENDS[-1]},{ss_u:.2f},{ss_k:.2f}\n")
        print("\nskrev", TRACK, "og", QUARTERS_OUT)
    elif a.write:
        print("\nSkrev IKKE: kontroller fejlede.")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
