# Genera las planillas de juego imprimibles (A4 horizontal, una hoja por partido).
# Uso: python3 generar_planillas.py   (lee ../data.js vía /tmp/sh/data.json; ver LEEME)
import json, os, sys
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, black, white

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
datos = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "/tmp/sh/data.json", encoding="utf-8"))
EQ = {e["id"]: e for e in datos["eq"]}
PL = {}
for j in datos["pl"]:
    PL.setdefault(j["equipo"], []).append(j["nombre"])

ORO = HexColor("#C9A227"); NEGRO = HexColor("#111111"); GRIS = HexColor("#9a9a9a"); GRISCLARO = HexColor("#f1f1f1")
W, H = landscape(A4)
M = 8 * mm
DIAS = {"2026-10-24": "Sáb 24/10", "2026-10-31": "Sáb 31/10", "2026-11-07": "Sáb 7/11", "2026-11-14": "Sáb 14/11", "2026-11-21": "Sáb 21/11"}
FECHAS = {"2026-10-24": "Fecha 2", "2026-10-31": "Fecha 3"}

def nombre_equipo(t):
    return EQ[t]["nombre"] if t in EQ else t

def box(c, x, y, s=4.2 * mm):
    c.setLineWidth(0.7); c.setStrokeColor(black); c.rect(x, y, s, s, fill=0)

def tabla(c, x0, ytop, ancho, eid, filas=16):
    """Dibuja la tabla de un equipo. ytop = borde superior del título."""
    nombre = nombre_equipo(eid)
    # título del equipo
    c.setFillColor(NEGRO); c.rect(x0, ytop - 9 * mm, ancho, 9 * mm, fill=1, stroke=0)
    c.setFillColor(ORO); c.setFont("Helvetica-Bold", 14)
    esc = os.path.join(RAIZ, EQ[eid]["escudo"]) if eid in EQ and EQ[eid].get("escudo") else ""
    tx = x0 + 3 * mm
    if esc and os.path.exists(esc):
        try:
            c.drawImage(esc, x0 + 1.5 * mm, ytop - 8.5 * mm, 8 * mm, 8 * mm, preserveAspectRatio=True, mask="auto"); tx = x0 + 11 * mm
        except Exception:
            pass
    c.drawString(tx, ytop - 6.3 * mm, nombre.upper())
    # columnas
    cols = [("Nº", 9), ("Nombre y apellido", 49), ("JUGÓ", 11), ("GOLES (palitos)", 29), ("AMAR.", 11), ("ROJA", 11), ("AZUL", 11)]
    tot = sum(w for _, w in cols); esc_f = ancho / mm / tot
    xs = [x0]
    for _, w in cols: xs.append(xs[-1] + w * esc_f * mm)
    yh = ytop - 9 * mm
    c.setFillColor(GRISCLARO); c.rect(x0, yh - 6.5 * mm, ancho, 6.5 * mm, fill=1, stroke=0)
    c.setFillColor(black); c.setFont("Helvetica-Bold", 7)
    for i, (t, _) in enumerate(cols):
        cx = (xs[i] + xs[i + 1]) / 2
        if i == 1: c.drawString(xs[i] + 1.5 * mm, yh - 4.3 * mm, t)
        else: c.drawCentredString(cx, yh - 4.3 * mm, t)
    # filas
    alto = 6.9 * mm
    jug = PL.get(eid, [])
    y = yh - 6.5 * mm
    for r in range(filas):
        yb = y - alto
        c.setLineWidth(0.4); c.setStrokeColor(GRIS); c.line(x0, yb, x0 + ancho, yb)
        nom = jug[r] if r < len(jug) else ""
        c.setFillColor(black); c.setFont("Helvetica", 9 if len(nom) < 26 else 7.5)
        if nom: c.drawString(xs[1] + 1.5 * mm, yb + 2.2 * mm, nom)
        s = 4.2 * mm
        cy = yb + (alto - s) / 2
        box(c, (xs[2] + xs[3]) / 2 - s / 2, cy)
        bw = (xs[4] - xs[3]) - 4 * mm
        c.setLineWidth(0.7); c.setStrokeColor(black); c.rect(xs[3] + 2 * mm, yb + 0.9 * mm, bw, alto - 1.8 * mm, fill=0)
        for i in (4, 5, 6): box(c, (xs[i] + xs[i + 1]) / 2 - s / 2, cy)
        y = yb
    # líneas verticales
    c.setStrokeColor(GRIS); c.setLineWidth(0.4)
    top = yh - 6.5 * mm
    for xv in xs: c.line(xv, top, xv, y)
    c.setStrokeColor(black); c.setLineWidth(0.9); c.rect(x0, y, ancho, ytop - 9 * mm - y - 0, fill=0)
    # goles en contra
    c.setFont("Helvetica", 7.5); c.setFillColor(black)
    c.drawString(x0 + 1 * mm, y - 4.2 * mm, "Goles en contra a favor de este equipo:")
    for k in range(3): box(c, x0 + 63 * mm + k * 6 * mm, y - 5 * mm, 4 * mm)
    c.drawString(x0 + 83 * mm, y - 4.2 * mm, "Faltas 1T:  ______   2T:  ______")
    return y

def hoja(c, p):
    local, visit = p["local"], p["visitante"]
    # banda superior
    c.setFillColor(NEGRO); c.rect(0, H - 24 * mm, W, 24 * mm, fill=1, stroke=0)
    c.drawImage(os.path.join(RAIZ, "img", "logo-copa.png"), M, H - 23 * mm, 26 * mm, 22.8 * mm, preserveAspectRatio=True, mask="auto")
    c.setFillColor(ORO); c.setFont("Helvetica-Bold", 20); c.drawString(M + 32 * mm, H - 12 * mm, "PLANILLA DE JUEGO")
    c.setFillColor(white); c.setFont("Helvetica", 10)
    c.drawString(M + 32 * mm, H - 18.5 * mm, "Copa Pride 2026 · By Liga Pride · Juntxs por el deporte")
    # datos del partido (derecha)
    fecha = FECHAS.get(p["fecha"], p["fase"]); dia = DIAS.get(p["fecha"], p["fecha"])
    c.setFillColor(ORO); c.setFont("Helvetica-Bold", 13)
    c.drawRightString(W - M, H - 9 * mm, (nombre_equipo(local) + "  vs  " + nombre_equipo(visit)).upper())
    c.setFillColor(white); c.setFont("Helvetica-Bold", 10)
    zona = ("Zona " + p["zona"] + " · ") if p.get("zona") else ""
    c.drawRightString(W - M, H - 14.5 * mm, f"{zona}{fecha} · {dia} · {p['hora']} hs · {p['cancha']}")
    c.setFont("Helvetica-Bold", 10); c.drawRightString(W - M - 62 * mm, H - 20.5 * mm, "Veedor/a:")
    c.setStrokeColor(white); c.setLineWidth(0.7); c.line(W - M - 60 * mm, H - 21 * mm, W - M, H - 21 * mm)
    # tablas
    gap = 6 * mm; ancho = (W - 2 * M - gap) / 2
    ytop = H - 24 * mm - 3 * mm
    y1 = tabla(c, M, ytop, ancho, local); y2 = tabla(c, M + ancho + gap, ytop, ancho, visit)
    ybase = min(y1, y2) - 7 * mm
    # recuadro de resultado final
    bh = 17 * mm
    c.setFillColor(NEGRO); c.rect(M, ybase - bh, W - 2 * M, bh, fill=1, stroke=0)
    c.setFillColor(ORO); c.setFont("Helvetica-Bold", 9); c.drawString(M + 3 * mm, ybase - 5 * mm, "RESULTADO FINAL (escribilo grande, es lo que se carga)")
    c.setFillColor(white); c.setFont("Helvetica-Bold", 13)
    nl, nv = nombre_equipo(local).upper(), nombre_equipo(visit).upper()
    cx = W / 2
    c.drawRightString(cx - 24 * mm, ybase - 12.5 * mm, nl)
    c.drawString(cx + 24 * mm, ybase - 12.5 * mm, nv)
    c.setFillColor(white); c.rect(cx - 20 * mm, ybase - bh + 2 * mm, 16 * mm, 11 * mm, fill=1, stroke=0)
    c.rect(cx + 4 * mm, ybase - bh + 2 * mm, 16 * mm, 11 * mm, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 20); c.drawCentredString(cx, ybase - 12 * mm, "–")
    # pie: firmas
    yf = ybase - bh - 4 * mm
    c.setFillColor(black); c.setFont("Helvetica-Bold", 8)
    campos = ["Jugador del partido", "Firma y aclaración capitán " + nombre_equipo(local), "Firma y aclaración capitán " + nombre_equipo(visit), "Firma árbitro", "Veedor (nombre y equipo)"]
    cw = (W - 2 * M) / len(campos)
    for i, t in enumerate(campos):
        x = M + i * cw
        c.setFont("Helvetica-Bold", 6.8 if len(t) > 24 else 7.5); c.drawString(x + 1 * mm, yf - 3 * mm, t[:48])
        c.setStrokeColor(GRIS); c.setLineWidth(0.6); c.line(x + 1 * mm, yf - 12 * mm, x + cw - 3 * mm, yf - 12 * mm)
    c.setFont("Helvetica-Bold", 7.5); c.drawString(M + 1 * mm, yf - 17 * mm, "Incidencias:")
    c.line(M + 18 * mm, yf - 17.5 * mm, W - M, yf - 17.5 * mm)
    # instrucción
    c.setFillColor(ORO); c.rect(0, 0, W, 7 * mm, fill=1, stroke=0)
    c.setFillColor(black); c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(W / 2, 2.4 * mm, "GOLES: palitos en el recuadro (la banda cierra el 5). TARJETAS: pintá el casillero. El resultado final va siempre en el recuadro negro.")

def pdf(nombre, partidos):
    c = canvas.Canvas(os.path.join(AQUI, nombre), pagesize=landscape(A4))
    c.setTitle(nombre.replace(".pdf", "")); c.setAuthor("Liga Pride")
    for p in partidos:
        hoja(c, p); c.showPage()
    c.save(); print(nombre, len(partidos), "hojas")

if __name__ == "__main__":
    P = {p["id"]: p for p in datos["pa"]}
    for fecha, nom in (("2026-10-24", "Planillas_Fecha2_24-10.pdf"),):   # una fecha por vez: se agregan jugadores nuevos antes de generar la siguiente
        pdf(nom, [p for p in datos["pa"] if p["fecha"] == fecha])
