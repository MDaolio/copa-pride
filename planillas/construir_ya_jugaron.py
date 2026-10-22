# Convierte la lista de "quién jugó" (nombres) en ids de jugadores -> ya_jugaron.json
import json, unicodedata, sys
sys.path.insert(0, ".")
from ya_jugaron_fecha1 import JUGARON, A_MANO
d = json.load(open("/tmp/sh/data.json", encoding="utf-8"))
def n(s): return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")
res = {}
for eid, lst in JUGARON.items():
    pl = [j for j in d["pl"] if j["equipo"] == eid]; res[eid] = list(A_MANO.get(eid, []))
    for nombre in lst:
        t = n(nombre).split()
        ok = [j for j in pl if all(x in n(j["nombre"]).split() for x in t)] or [j for j in pl if t[0] in n(j["nombre"]).split() and t[-1] in n(j["nombre"]).split()]
        if len(ok) == 1 and ok[0]["id"] not in res[eid]: res[eid].append(ok[0]["id"])
        elif len(ok) != 1: print("SIN MATCH / AMBIGUO:", eid, nombre, [j["nombre"] for j in ok])
json.dump(res, open("ya_jugaron.json", "w"), indent=1)
print(sum(len(v) for v in res.values()), "jugadores")
