#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Surface Capital — trackrecord data builder
Parses the Portfolio Performance XML (export with IDs) and writes
js/trackrecord-data.js for trackrecord.html.

Scope replicates the PP dashboard: portfolio "Sikkerhedsdepot" +
cash account "Sikringskonto", 1 Jan 2016 – 31 Dec 2025, daily TWR,
start-of-day flows, price-less securities carried at cost.
Requires:  pip install currencyconverter
Usage:     python3 build_trackrecord_data.py <path-to-xml>
"""
import sys, json
import xml.etree.ElementTree as ET
from collections import defaultdict
from datetime import date, timedelta
from bisect import bisect_right
from currency_converter import CurrencyConverter

XML = sys.argv[1] if len(sys.argv) > 1 else "portfolio.xml"
OUT = __file__.rsplit("/tools/", 1)[0] + "/js/trackrecord-data.js"
SHOW_ABSOLUTE = False           # flip to True to expose DKK amounts
END = date(2025, 12, 31)

# Official figures from Portfolio Performance (headline source of truth)
OFFICIAL = {
    "cum": 631.73, "ann": 22.01, "irr": 19.81, "maxdd": 29.65,
    "years": [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
    "port":  [55.3, 28.8, -10.1, 38.3, 14.9, 30.0, 11.7, 14.1, 23.7, 24.8],
    "acwi":  [16.8,  9.3,  -5.7, 30.2,  4.5, 29.1, -13.6, 18.8, 24.6,  9.2],
}

CC = CurrencyConverter(fallback_on_missing_rate=True, fallback_on_wrong_date=True)
def fx(cur, d):
    if cur in (None, "DKK"): return 1.0
    if cur == "GBX": return CC.convert(1, "GBP", "DKK", date=d) / 100.0
    return CC.convert(1, cur, "DKK", date=d)

root = ET.parse(XML).getroot()
id_map = {el.get("id"): el for el in root.iter() if el.get("id")}
def resolve(el):
    return id_map[el.get("reference")] if el is not None and el.get("reference") else el

SEC = {}
for s in root.find("securities"):
    pts = sorted((p.get("t"), int(p.get("v")) / 1e8) for p in s.findall("./prices/price"))
    SEC[s.get("id")] = dict(name=(s.findtext("name") or "").strip(), cur=s.findtext("currencyCode"),
                            ticker=s.findtext("tickerSymbol"), isin=s.findtext("isin"),
                            dates=[d for d, _ in pts], px=[v for _, v in pts])
def price_at(sid, d):
    r = SEC[sid]; i = bisect_right(r["dates"], d.isoformat()) - 1
    return r["px"][i] if i >= 0 else None

ACC = {i: el for i, el in id_map.items() if el.tag == "account" and el.find("uuid") is not None}
PORT = {i: el for i, el in id_map.items() if el.tag == "portfolio" and el.find("uuid") is not None}
SCOPE_ACC = {i for i, a in ACC.items() if a.findtext("name") == "Sikringskonto"}

def d_of(t): return date.fromisoformat(t.findtext("date")[:10])
def amt(t):  return int(t.findtext("amount")) / 100.0
def units(t, typ, d):
    tot = 0.0; un = t.find("units")
    if un is not None:
        for u in un:
            if u.get("type") == typ:
                a = u.find("amount"); tot += int(a.get("amount")) / 100.0 * fx(a.get("currency"), d)
    return tot
def forex_amount(t, want_cur):
    """native-currency gross value if recorded (for per-share prices)."""
    un = t.find("units")
    if un is not None:
        for u in un:
            if u.get("type") == "GROSS_VALUE":
                fxel = u.find("forex")
                if fxel is not None and fxel.get("currency") == want_cur:
                    return int(fxel.get("amount")) / 100.0
    return None

atx, ptx = {}, {}
for aid, a in ACC.items():
    for t in a.findall("./transactions/account-transaction"):
        t = resolve(t); atx[t.findtext("uuid")] = (aid, t)
for pid, p in PORT.items():
    for t in p.findall("./transactions/portfolio-transaction"):
        t = resolve(t); ptx[t.findtext("uuid")] = (pid, t)

# ---- event collection -------------------------------------------------
cash_ev = defaultdict(float)                     # Sikringskonto cash (DKK)
sec_ev  = defaultdict(list)                      # date -> [(sid, dShares, dkkAmt, tx)]
flow_ev = defaultdict(float)                     # external flows DKK
div_ev  = defaultdict(list)                      # sid -> [(date, gross_dkk, net_dkk, tx)]

ACT = {"DEPOSIT":1,"REMOVAL":-1,"DIVIDENDS":1,"INTEREST":1,"INTEREST_CHARGE":-1,
       "SELL":1,"BUY":-1,"TRANSFER_IN":1,"TRANSFER_OUT":-1}
for aid, t in atx.values():
    d = d_of(t)
    if d > END: continue
    ty = t.findtext("type"); a = amt(t)
    if aid in SCOPE_ACC:
        cash_ev[d] += ACT[ty] * a
        if ty in ("DEPOSIT","REMOVAL","TRANSFER_IN","TRANSFER_OUT"):
            flow_ev[d] += ACT[ty] * a
    if ty == "DIVIDENDS":
        sid_el = resolve(t.find("security"))
        if sid_el is not None:
            acur = ACC[aid].findtext("currencyCode")
            net = a * fx(acur, d); gross = net + units(t, "TAX", d)
            div_ev[sid_el.get("id")].append((d, gross, net, t))

for pid, t in ptx.values():
    d = d_of(t)
    if d > END: continue
    ty = t.findtext("type"); sh = int(t.findtext("shares") or 0) / 1e8
    sid = resolve(t.find("security")).get("id")
    a = amt(t) * fx(t.findtext("currencyCode"), d)
    sign = 1 if ty in ("BUY","DELIVERY_INBOUND","TRANSFER_IN") else -1
    sec_ev[d].append((sid, sign * sh, sign * a, t))
    if ty in ("DELIVERY_INBOUND","DELIVERY_OUTBOUND"):
        flow_ev[d] += sign * amt(t) * fx(t.findtext("currencyCode"), d)
    elif ty in ("BUY","SELL"):
        ce = resolve(t.find("crossEntry"))
        acc = resolve(ce.find("account")) if ce is not None and ce.find("account") is not None else None
        acc_ids = [i for i, el in ACC.items() if el is acc]
        if not (acc_ids and acc_ids[0] in SCOPE_ACC):
            flow_ev[d] += sign * amt(t) * fx(t.findtext("currencyCode"), d)

start = min(min(cash_ev), min(sec_ev))

# ---- daily walk: NAV, TWR index, per-position peak weight -------------
cash = 0.0; hold = defaultdict(float); carry = defaultdict(float)
twr = 1.0; prev = None; d = start
index_series = []          # (date, index)
nav_series = []            # (date, nav)
peak_w = defaultdict(float)
val_at_end = {}
year_snap = {}             # year -> {sid: value at Dec 31}
while d <= END:
    cash += cash_ev.get(d, 0.0)
    for sid, dsh, da, _ in sec_ev.get(d, []):
        hold[sid] += dsh
        if dsh > 0: carry[sid] = da / dsh
        if abs(hold[sid]) < 1e-9: hold[sid] = 0.0
    v = cash; vals = {}
    for sid, sh in hold.items():
        if sh:
            p = price_at(sid, d)
            pv = sh * p * fx(SEC[sid]["cur"], d) if p is not None else sh * carry.get(sid, 0.0)
            vals[sid] = pv; v += pv
    f = flow_ev.get(d, 0.0)
    if prev is not None and prev + f > 1e-9:
        twr *= v / (prev + f)
    if v > 0:
        for sid, pv in vals.items():
            w = pv / v
            if w > peak_w[sid]: peak_w[sid] = w
    index_series.append((d, twr * 100.0))
    nav_series.append((d, v))
    prev = v
    if d.month == 12 and d.day == 31: year_snap[d.year] = dict(vals)
    if d == END: val_at_end = dict(vals)
    d += timedelta(days=1)

# weekly downsample (Fridays + last day)
weekly = [(dd.isoformat(), round(ix, 2)) for dd, ix in index_series
          if dd.weekday() == 4 or dd == END]

# ---- per-position analytics ------------------------------------------
def xirr(cf):
    if len(cf) < 2: return None
    t0 = cf[0][0]
    def npv(r): return sum(c / (1 + r) ** ((dd - t0).days / 365.25) for dd, c in cf)
    if all(c <= 0 for _, c in cf[1:]): return -1.0          # total loss
    lo, hi = -0.9999, 1e6
    if npv(lo + 1e-6) * npv(hi) > 0:
        return -1.0 if npv(0) < 0 and npv(lo + 1e-6) < 0 else None
    for _ in range(300):
        mid = (lo + hi) / 2
        if npv(mid) > 0: lo = mid
        else: hi = mid
    return mid

positions = []
total_gain = 0.0
sids_traded = sorted({sid for evs in sec_ev.values() for sid, _, _, _ in evs},
                     key=lambda s: SEC[s]["name"] or "")
for sid in sids_traded:
    S = SEC[sid]
    evs = sorted([(dd, dsh, da, t) for dd, l in sec_ev.items() for s2, dsh, da, t in l if s2 == sid])
    if not evs: continue
    first = evs[0][0]
    open_sh = sum(dsh for _, dsh, _, _ in evs)
    is_open = abs(open_sh) > 1e-6
    last = END if is_open else max(dd for dd, _, _, _ in evs)
    invested = sum(da for _, _, da, _ in evs if da > 0)
    received = -sum(da for _, _, da, _ in evs if da < 0)
    divs = sorted(div_ev.get(sid, []))
    div_gross = sum(g for dd, g, _, _ in divs if dd <= END)
    terminal = val_at_end.get(sid, 0.0) if is_open else 0.0
    gain = received + div_gross + terminal - invested
    total_gain += gain
    moic = (received + div_gross + terminal) / invested if invested > 0 else None

    cf = [(dd, -da) for dd, _, da, _ in evs]
    cf += [(dd, g) for dd, g, _, _ in divs if dd <= END]
    if is_open: cf.append((END, terminal))
    cf.sort()
    r = xirr(cf)

    events = []
    for dd, dsh, da, t in evs:
        native = forex_amount(t, S["cur"])
        gross_native = native if native is not None else abs(int(t.findtext("amount")) / 100.0
                        if t.findtext("currencyCode") == S["cur"] else 0) or None
        pps = (gross_native / abs(dsh)) if gross_native and abs(dsh) > 0 else (
              abs(da) / abs(dsh) / fx(S["cur"], dd) if abs(dsh) > 0 else None)
        e = {"d": dd.isoformat(), "k": "buy" if dsh > 0 else "sell",
             "pps": round(pps, 4) if pps else None}
        if SHOW_ABSOLUTE: e["dkk"] = round(abs(da))
        events.append(e)
    for dd, g, n, t in divs:
        if dd > END: continue
        e = {"d": dd.isoformat(), "k": "div"}
        if SHOW_ABSOLUTE: e["dkk"] = round(g)
        events.append(e)
    events.sort(key=lambda e: e["d"])

    # weekly price window for the mini chart
    w0 = first - timedelta(weeks=8); w1 = min(last + timedelta(weeks=4), END)
    ser = []
    dd = w0
    while dd <= w1:
        if dd.weekday() == 4 or dd == w1:
            p = price_at(sid, dd)
            if p is not None: ser.append([dd.isoformat(), round(p, 4)])
        dd += timedelta(days=1)

    pos = {"name": S["name"], "ticker": S["ticker"], "cur": S["cur"],
           "open": is_open, "first": first.isoformat(),
           "last": None if is_open else last.isoformat(),
           "years": round((last - first).days / 365.25, 2),
           "nBuy": sum(1 for _, dsh, _, _ in evs if dsh > 0),
           "nSell": sum(1 for _, dsh, _, _ in evs if dsh < 0),
           "nDiv": len([1 for dd, *_ in divs if dd <= END]),
           "moic": round(moic, 2) if moic else None,
           "xirr": (round(max(min(r, 99.999), -1.0) * 100, 1) if r is not None else None),
           "peakW": round(peak_w.get(sid, 0.0) * 100, 1),
           "events": events, "px": ser}
    if SHOW_ABSOLUTE:
        pos["invested"] = round(invested); pos["gain"] = round(gain)
    pos["_gain"] = gain
    positions.append(pos)

for p in positions:
    p["gainShare"] = round(p.pop("_gain") / total_gain * 100, 1) if total_gain else 0.0

# ---- per-position yearly P&L (fractions of total gain) ----------------
sid_by_name = {}
flows_y = defaultdict(lambda: defaultdict(float))   # sid -> year -> net invested (buys-sells)
divs_y  = defaultdict(lambda: defaultdict(float))   # sid -> year -> gross dividends
for dd, l in sec_ev.items():
    for sid, dsh, da, _ in l:
        flows_y[sid][dd.year] += da
for sid, lst in div_ev.items():
    for dd, g, _, _ in lst:
        if dd <= END: divs_y[sid][dd.year] += g
years_all = list(range(start.year, END.year + 1))
pnlY_map = {}
for sid in sids_traded:
    out = {}
    for y in years_all:
        v0 = year_snap.get(y - 1, {}).get(sid, 0.0)
        v1 = year_snap.get(y, {}).get(sid, 0.0)
        pnl = v1 - v0 - flows_y[sid].get(y, 0.0) + divs_y[sid].get(y, 0.0)
        if abs(pnl) > 0.5: out[str(y)] = round(pnl / total_gain * 1000, 2)   # per-mille of total gain
    pnlY_map[sid] = out

# attach to positions (same order as sids_traded)
for p, sid in zip(positions, sids_traded):
    p["pnlY"] = pnlY_map[sid]

# ---- per-window IRR and max drawdown (engine daily series) ------------
nav_by_date = dict(nav_series)
def window_stats(y0, y1):
    a, b = max(date(y0, 1, 1), start), date(y1, 12, 31)
    v0 = nav_by_date.get(a - timedelta(days=1), 0.0)
    cf = [(a - timedelta(days=1), -v0)] if v0 > 0 else []
    cf += [(dd, -f) for dd, f in sorted(flow_ev.items()) if a <= dd <= b and f]
    cf.append((b, nav_by_date[b]))
    r = xirr(sorted(cf))
    seg = [ix for dd, ix in index_series if a <= dd <= b]
    peak = seg[0]; mdd = 0.0
    for x in seg:
        peak = max(peak, x); mdd = min(mdd, x / peak - 1)
    return (round(r * 100, 1) if r is not None else None, round(-mdd * 100, 1))
windows = {}
for y0 in range(start.year, END.year + 1):
    for y1 in range(y0, END.year + 1):
        irr, mdd = window_stats(y0, y1)
        windows[f"{y0}-{y1}"] = [irr, mdd]

payload = {
    "official": OFFICIAL,
    "asOf": END.isoformat(),
    "inception": start.isoformat(),
    "index": weekly,
    "positions": positions,
    "windows": windows,
    "absolute": SHOW_ABSOLUTE,
}
with open(OUT, "w", encoding="utf-8") as f:
    f.write("/* Genereret af tools/build_trackrecord_data.py — redigér ikke i hånden. */\n")
    f.write("const TRACKRECORD = ")
    json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")

import os
print(f"wrote {OUT} ({os.path.getsize(OUT)/1024:.0f} KB)")
print(f"positions: {len(positions)} | index points: {len(weekly)} | index end: {weekly[-1]}")
print(f"total gain (internal): {total_gain:,.0f} DKK")
top = sorted(positions, key=lambda p: -abs(p['gainShare']))[:10]
for p in top:
    print(f"  {p['name'][:34]:36s} share {p['gainShare']:+6.1f}%  xirr {p['xirr']}  moic {p['moic']}  peakW {p['peakW']}%  {'OPEN' if p['open'] else 'closed'}")
