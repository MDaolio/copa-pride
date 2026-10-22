/* =====================================================================
   Lógica de la página. No hace falta tocar este archivo para cargar
   datos: todo se edita en data.js.
   ===================================================================== */
(function () {
  "use strict";

  if (typeof window !== "undefined") window.__APP_OK = true;

  const D = (typeof window !== "undefined" ? window.LIGA_DATA : null) || {};

  /* ---------------- utilidades ---------------- */
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const equipos = () => D.equipos || [];
  const jugadores = () => D.jugadores || [];
  const partidos = () => D.partidos || [];
  const llaves = () => D.llaves || [];

  const equipo = (id) => equipos().find((e) => e.id === id);
  const jugador = (id) => jugadores().find((j) => j.id === id);
  const enVivo = (p) => p.estado === "EN_JUEGO";
  const jugado = (p) => !enVivo(p) && p.golesLocal != null && p.golesVisitante != null;
  // Tarjeta roja: acepta t:"R" (data.js) o tipo:"roja".
  const esRoja = (t) => { const v = String(t.tipo || t.t || "").toLowerCase(); return v === "roja" || v === "r"; };
  const esAzul = (t) => { const v = String(t.tipo || t.t || "").toLowerCase(); return v === "azul" || v === "z"; };
  // Fair play: primero menos rojas, después menos amarillas, después menos azules.
  const cmpFP = (a, b) => a.ro - b.ro || a.am - b.am || a.az - b.az;
  const contarTarj = (ts) => { const c = { ro: 0, am: 0, az: 0 }; (ts || []).forEach((t) => { if (esRoja(t)) c.ro++; else if (esAzul(t)) c.az++; else c.am++; }); return c; };
  const iconoTarj = (t) => (esRoja(t) ? "🟥" : esAzul(t) ? "🟦" : "🟨");
  const faseLabel = (p) => (p.fase === "Zona" ? "Zona " + p.zona : p.fase);
  const porFecha = (a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora);
  const natural = (a, b) => String(a).localeCompare(String(b), "es", { numeric: true });
  const signo = (n) => (n > 0 ? "+" + n : String(n));

  const iniciales = (nombre) =>
    String(nombre || "?").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  function badge(e, clase) {
    const c = "badge" + (clase ? " " + clase : "");
    if (e && e.escudo) return `<img class="${c}" src="${esc(e.escudo)}" alt="">`;
    return `<span class="${c}">${esc(iniciales(e ? e.nombre : "?"))}</span>`;
  }
  const cabezaTag = (e) => (e && e.cabeza ? `<span class="cabeza" title="Cabeza de serie ${esc(e.cabeza)}">★ ${esc(e.cabeza)}</span>` : "");
  const paisTag = (e) => (e && e.pais ? `<span class="pais">${esc(e.pais)}</span>` : "");

  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function fechaLarga(iso) {
    const d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return iso;
    return cap(d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }));
  }
  function fechaCorta(iso) {
    const d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return iso;
    return cap(d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "numeric" }).replace(/[.,]/g, ""));
  }
  function diaMes(iso) {
    const d = new Date(iso + "T12:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" }).replace(/\./g, "").toUpperCase();
  }

  function ganadorId(p) {
    if (!jugado(p)) return null;
    if (p.golesLocal > p.golesVisitante) return p.local;
    if (p.golesLocal < p.golesVisitante) return p.visitante;
    const pe = p.penales;
    if (pe && pe.local != null && pe.visitante != null && pe.local !== pe.visitante)
      return pe.local > pe.visitante ? p.local : p.visitante;
    return null;
  }

  /* ---------------- cálculos ---------------- */
  // Tabla de una zona: 3 pts victoria, 1 empate.
  // Desempate: puntos, diferencia de gol, fair play (rojas, amarillas, azules; menos es mejor), orden alfabético.
  function tablaZona(zona) {
    const filas = {};
    equipos().filter((e) => e.zona === zona).forEach((e) => {
      filas[e.id] = { id: e.id, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, ro: 0, am: 0, az: 0, pts: 0 };
    });
    partidos().filter((p) => p.fase === "Zona" && p.zona === zona).forEach((p) => {
      (p.tarjetas || []).forEach((t) => { const f = filas[t.e]; if (f) { if (esRoja(t)) f.ro++; else if (esAzul(t)) f.az++; else f.am++; } });
      if (!jugado(p)) return;
      const l = filas[p.local], v = filas[p.visitante];
      if (!l || !v) return;
      l.pj++; v.pj++;
      l.gf += p.golesLocal; l.gc += p.golesVisitante;
      v.gf += p.golesVisitante; v.gc += p.golesLocal;
      if (p.golesLocal > p.golesVisitante) { l.pg++; v.pp++; l.pts += 3; }
      else if (p.golesLocal < p.golesVisitante) { v.pg++; l.pp++; v.pts += 3; }
      else { l.pe++; v.pe++; l.pts++; v.pts++; }
    });
    return Object.values(filas).map((f) => ({ ...f, dg: f.gf - f.gc })).sort((a, b) =>
      b.pts - a.pts || b.dg - a.dg || cmpFP(a, b) ||
      equipo(a.id).nombre.localeCompare(equipo(b.id).nombre, "es"));
  }

  // Ranking general 1-16 (para armar los cruces): primero la posición en la zona,
  // y dentro de cada posición puntos, diferencia de gol y fair play. Solo existe cuando terminaron todas las zonas.
  function rankingGeneral() {
    const zs = zonas();
    if (!zs.length || !zs.every(zonaCompleta)) return null;
    const lista = [];
    zs.forEach((z) => tablaZona(z).forEach((f, i) => lista.push({ ...f, pos: i + 1 })));
    return lista.sort((a, b) => a.pos - b.pos || b.pts - a.pts || b.dg - a.dg || cmpFP(a, b) ||
      equipo(a.id).nombre.localeCompare(equipo(b.id).nombre, "es"));
  }

  const zonas = () => [...new Set(equipos().map((e) => e.zona).filter(Boolean))].sort();

  function zonaCompleta(z) {
    const ps = partidos().filter((p) => p.fase === "Zona" && p.zona === z);
    return ps.length > 0 && ps.every(jugado);
  }

  /* ----- llaves: resuelve "1º Zona A", "G:SO1" o un id de equipo ----- */
  function buscarCruce(id) {
    for (const copa of llaves())
      for (const r of copa.rondas)
        for (const c of r.cruces) if (c.id === id) return c;
    return null;
  }

  function resolverSlot(slot, prof) {
    prof = prof || 0;
    if (prof > 10) return { texto: String(slot) };
    const e = equipo(slot);
    if (e) return { eq: e };
    let m = /^#(\d+)$/.exec(slot || "");
    if (m) {
      const r = rankingGeneral();
      if (r && r[Number(m[1]) - 1]) return { eq: equipo(r[Number(m[1]) - 1].id), prov: false };
      return { texto: "Puesto " + m[1] };
    }
    m = /^(\d+)º Zona (.+)$/.exec(slot || "");
    if (m) {
      if (zonaCompleta(m[2])) {
        const fila = tablaZona(m[2])[Number(m[1]) - 1];
        if (fila) return { eq: equipo(fila.id), prov: false };
      }
      return { texto: slot };
    }
    m = /^G:(.+)$/.exec(slot || "");
    if (m) {
      const c = buscarCruce(m[1]);
      if (c) {
        const rc = resolverCruce(c, prof + 1);
        const g = rc.p ? ganadorId(rc.p) : null;
        if (g) return { eq: equipo(g) };
        return { texto: "Ganador " + (c.nombre || c.id) };
      }
    }
    m = /^P:(.+)$/.exec(slot || "");
    if (m) {
      const c = buscarCruce(m[1]);
      if (c) {
        const rc = resolverCruce(c, prof + 1);
        const g = rc.p ? ganadorId(rc.p) : null;
        if (g) {
          const per = equipo(g === rc.p.local ? rc.p.visitante : rc.p.local);
          if (per) return { eq: per };
        }
        return { texto: "Perdedor " + (c.nombre || c.id) };
      }
    }
    return { texto: String(slot == null ? "" : slot) };
  }

  function resolverCruce(c, prof) {
    const p = c.partidoId ? partidos().find((x) => x.id === c.partidoId) : null;
    if (p) return { p, local: resolverSlot(p.local, prof), visitante: resolverSlot(p.visitante, prof) };
    return { p: null, local: resolverSlot(c.local, prof), visitante: resolverSlot(c.visitante, prof) };
  }

  // Los partidos de playoffs pueden tener "1º Zona A", "G:OC1" o "P:OS1" en vez de un equipo.
  // En cuanto se sabe quién es, se reemplaza por el id del equipo (el texto original queda guardado).
  function normalizar() {
    for (let pass = 0; pass < 6; pass++) {
      let cambio = false;
      partidos().forEach((p) => {
        [["local", "slotL"], ["visitante", "slotV"]].forEach(([k, sl]) => {
          if (p[sl] == null) { if (equipo(p[k])) return; p[sl] = p[k]; }
          const r = resolverSlot(p[sl]);
          const nuevo = r.eq ? r.eq.id : p[sl];
          if (p[k] !== nuevo) { p[k] = nuevo; cambio = true; }
        });
      });
      if (!cambio) break;
    }
  }

  function campeonDe(copa) {
    const rondas = copa.rondas || [];
    if (!rondas.length) return null;
    const ult = rondas[rondas.length - 1];
    const c = ult.cruces[0];
    if (!c) return null;
    const rc = resolverCruce(c);
    const g = rc.p ? ganadorId(rc.p) : null;
    return g ? equipo(g) : null;
  }

  /* ----- estadísticas ----- */
  const partidosEst = () => partidos().filter(jugado).filter((p) => !D.estadisticasSoloZona || p.fase === "Zona");

  function rankear(lista, valor) {
    let r = 0, prev;
    return lista.map((x, i) => {
      const val = valor(x);
      if (i === 0 || val !== prev) { r = i + 1; prev = val; }
      return { ...x, rank: r };
    });
  }

  /* Partidos que cuentan para goleadores y valla: jugados y sin W.O. (resultado de mesa).
     Los goles de las definiciones por penales no están en golesLocal/golesVisitante, así que nunca suman. */
  const partidosJuego = () => partidosEst().filter((p) => !p.wo);

  function pjEquipo(id) {
    return partidosJuego().filter((p) => p.local === id || p.visitante === id).length;
  }

  // Goleadores: más goles; si empatan, el que jugó menos partidos (partidos de su equipo); si siguen iguales, comparten puesto.
  function goleadores() {
    const cuenta = {};
    partidosJuego().forEach((p) => (p.goles || []).forEach((g) => { if (g.j) cuenta[g.j] = (cuenta[g.j] || 0) + 1; }));
    return Object.entries(cuenta).map(([id, goles]) => {
      const j = jugador(id);
      return { id, goles, pj: j ? pjEquipo(j.equipo) : 0 };
    }).sort((a, b) => b.goles - a.goles || a.pj - b.pj || (jugador(a.id)?.nombre || "").localeCompare(jugador(b.id)?.nombre || "", "es"));
  }

  function golesTotal(jid) {
    let n = 0;
    partidos().filter(jugado).forEach((p) => (p.goles || []).forEach((g) => { if (g.j === jid) n++; }));
    return n;
  }

  /* Hasta dónde llegó cada equipo en las copas (para desempatar la valla).
     La Copa de Oro siempre cuenta más lejos que la de Plata; dentro de cada copa vale la ronda. */
  function distancia(id) {
    let mejor = -1;
    partidos().forEach((p) => {
      if (p.local !== id && p.visitante !== id) return;
      const f = String(p.fase || "");
      const base = /oro/i.test(f) ? 100 : /plata/i.test(f) ? 0 : null;
      if (base === null) return;
      const gana = jugado(p) && ganadorId(p) === id;
      let v = null;
      if (/cuartos/i.test(f)) v = 1;
      else if (/semi/i.test(f)) v = 2;
      else if (/3er|tercer/i.test(f)) v = gana ? 2.6 : 2.2;
      else if (/final/i.test(f)) v = gana ? 4 : 3;
      if (v !== null && base + v > mejor) mejor = base + v;
    });
    return mejor;
  }

  // Valla menos vencida: promedio de goles recibidos por partido (GR ÷ PJ), gana el más bajo.
  // Desempate: llegó más lejos; después, menos goles recibidos en total.
  // No cuentan los partidos por W.O. ni los equipos que abandonaron.
  function valla() {
    const gr = {}, pj = {};
    partidosJuego().forEach((p) => {
      [[p.local, p.golesVisitante], [p.visitante, p.golesLocal]].forEach(([id, g]) => {
        if (!equipo(id)) return;
        gr[id] = (gr[id] || 0) + g; pj[id] = (pj[id] || 0) + 1;
      });
    });
    return Object.keys(gr).filter((id) => !(equipo(id) && equipo(id).abandono))
      .map((id) => ({ id, gr: gr[id], pj: pj[id], prom: gr[id] / pj[id], dist: distancia(id) }))
      .sort((a, b) => a.gr * b.pj - b.gr * a.pj || b.dist - a.dist || a.gr - b.gr ||
        (equipo(a.id)?.nombre || "").localeCompare(equipo(b.id)?.nombre || "", "es"));
  }
  /* Arquero titular del equipo (el que más partidos ataja): se marca con arquero: true en data.js. */
  const arqueroDe = (id) => {
    const a = jugadores().filter((j) => j.equipo === id && j.arquero);
    return a.length ? a.map((j) => `<a href="#/jugador/${esc(j.id)}">${esc(j.nombre)}</a>`).join(", ") : "—";
  };
  const promTxt = (n) => n.toFixed(2).replace(".", ",");

  function fairPlay() {
    const f = {};
    partidosEst().forEach((p) => {
      [p.local, p.visitante].forEach((id) => { if (!f[id]) f[id] = { id, am: 0, ro: 0, az: 0 }; });
      (p.tarjetas || []).forEach((t) => {
        if (!f[t.e]) f[t.e] = { id: t.e, am: 0, ro: 0, az: 0 };
        if (esRoja(t)) f[t.e].ro++; else if (esAzul(t)) f[t.e].az++; else f[t.e].am++;
      });
    });
    return Object.values(f).map((x) => ({ ...x, pts: x.ro * 1000000 + x.am * 1000 + x.az }))
      .sort((a, b) => cmpFP(a, b) || (equipo(a.id)?.nombre || "").localeCompare(equipo(b.id)?.nombre || "", "es"));
  }

  /* ---------------- piezas de interfaz ---------------- */
  function filaEq(id, goles, pen, ganador, esJugado) {
    const e = equipo(id);
    let cls = "";
    if (esJugado && ganador) cls = ganador === id ? "gana" : "pierde";
    const penTxt = pen != null ? `<i>(${esc(pen)})</i>` : "";
    const href = e ? `href="#/equipo/${esc(id)}"` : "";
    const nom = e ? esc(e.nombre) : esc(resolverSlot(id).texto || "?");
    return `<a class="fe ${cls}" ${href}>${badge(e, "chico")}<span class="n${e ? "" : " tbd"}">${nom}</span>${paisTag(e)}<span class="gl">${goles == null ? "" : esc(goles)}${penTxt}</span></a>`;
  }

  /* Detalle del partido: lo de cada equipo del lado de ese equipo (local a la izquierda, visitante a la derecha). */
  function detalle(p) {
    const lado = (id) => {
      const items = [];
      (p.goles || []).filter((x) => x.e === id).forEach((x) => {
        const j = jugador(x.j), nom = j ? j.nombre : "?";
        const prev = items.find((i) => i.tipo === "g" && i.j === x.j && !x.min && !i.min);
        if (prev) prev.n++; else items.push({ tipo: "g", j: x.j, nom, n: 1, min: x.min });
      });
      (p.tarjetas || []).filter((x) => x.e === id).forEach((x) => {
        const j = jugador(x.j);
        items.push({ tipo: "t", ico: iconoTarj(x), nom: j ? j.nombre : "?" });
      });
      return items.map((i) => i.tipo === "g"
        ? `<li><span class="ic">⚽</span><span class="nm">${esc(i.nom)}${i.min ? ` <small>${esc(i.min)}'</small>` : ""}</span>${i.n > 1 ? `<b class="cnt">${i.n}</b>` : ""}</li>`
        : `<li><span class="ic">${i.ico}</span><span class="nm">${esc(i.nom)}</span></li>`).join("");
    };
    const l = lado(p.local), v = lado(p.visitante);
    const pn = p.penales && p.penales.local != null && p.penales.visitante != null
      ? `<p class="det-pen">🥅 Definición por penales: ${esc((equipo(p.local) || {}).nombre || "")} ${esc(p.penales.local)} - ${esc(p.penales.visitante)} ${esc((equipo(p.visitante) || {}).nombre || "")} <small>(no suman goles)</small></p>` : "";
    if (!l && !v && !pn) return `<p class="det vacio-txt">Sin detalle cargado.</p>`;
    return `<div class="det2"><ul class="det-l">${l}</ul><ul class="det-v">${v}</ul></div>${pn}`;
  }

  /* Veedores: nombre (equipo). Se busca sin importar mayúsculas ni tildes. */
  const clave = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
  const veedorInfo = (nombre) => (D.veedores || []).find((v) => clave(v.nombre) === clave(nombre));
  const eqVeedor = (p) => p.veedorEq || ((veedorInfo(p.veedor) || {}).equipo) || "";
  const veedorTxt = (nombre, eqId) => {
    const v = veedorInfo(nombre), e = equipo(eqId) || (v && v.equipo ? equipo(v.equipo) : null);
    return e ? esc(e.nombre) : esc(nombre);
  };
  /* Cuántos partidos veedó cada equipo (jugados o en vivo, sin contar los W.O.). */
  function veedoresStats() {
    const m = {};
    equipos().forEach((e) => { m[e.id] = { id: e.id, partidos: 0, fechas: new Set() }; });
    partidos().filter((p) => (jugado(p) || enVivo(p)) && !p.wo).forEach((p) => {
      const k = eqVeedor(p);
      if (!k || !m[k]) return;
      m[k].partidos++; m[k].fechas.add(p.fecha);
    });
    return Object.values(m).map((x) => ({ id: x.id, partidos: x.partidos, fechas: x.fechas.size }))
      .sort((a, b) => b.partidos - a.partidos || b.fechas - a.fechas || (equipo(a.id).nombre).localeCompare(equipo(b.id).nombre, "es"));
  }

  /* Palitos de gol, como en la planilla: grupos de 5 (cuatro rayas y la tachada). */
  function palitos(n) {
    n = Number(n) || 0;
    if (n <= 0) return `<span class="pal pal0" aria-label="0">·</span>`;
    const MAX = 25, t = Math.min(n, MAX);
    let h = "";
    for (let i = 0; i < Math.floor(t / 5); i++) h += `<span class="g5"><s></s><s></s><s></s><s></s></span>`;
    if (t % 5) h += `<span class="g">${"<s></s>".repeat(t % 5)}</span>`;
    return `<span class="pal" role="img" aria-label="${n}">${h}${n > MAX ? `<em>+${n - MAX}</em>` : ""}</span>`;
  }

  /* Partido como renglón de planilla: hora y cancha a la izquierda, equipos apilados con su casillero de goles. */
  function marcador(p, o) {
    o = o || {};
    const ok = jugado(p), live = enVivo(p), gan = ganadorId(p), pe = p.penales || {};
    const muestra = ok || live;
    const clsDe = (id) => (ok && gan ? (gan === id ? "gana" : "pierde") : "");
    const fila = (id, k, v, pen) => {
      const e = equipo(id);
      const nom = e ? esc(e.nombre) : esc(resolverSlot(id).texto || "?");
      const href = e ? ` href="#/equipo/${esc(id)}"` : "";
      const gl = muestra ? `${esc(v)}${pen != null ? `<i>(${esc(pen)})</i>` : ""}` : "";
      return `<a class="mt-eq ${k} ${clsDe(id)}"${href}>${badge(e, "chico")}<span class="n${e ? "" : " tbd"}">${nom}</span>${paisTag(e)}<b class="gl${muestra ? "" : " vacio"}">${gl}</b></a>`;
    };
    const meta = [];
    if (o.sin !== "hora") meta.push(`<b>${esc(p.hora)}</b>`);
    if (o.sin !== "cancha") meta.push(`<span>${esc(p.cancha)}</span>`);
    const tag = ok ? `<span class="tag">${p.wo ? "W.O." : "FINAL"}</span>` : live ? '<span class="tag vivo"><i></i>EN VIVO</span>' : '<span class="tag pend">PRÓXIMO</span>';
    let pie = "";
    if (o.veedor && (p.veedor || p.veedorEq)) pie += `<p class="veedor">Veedor: ${veedorTxt(p.veedor, p.veedorEq)}</p>`;
    if (o.detalle && (ok || live)) {
      const res = (id, gol) => {
        const { am, ro, az } = contarTarj((p.tarjetas || []).filter((x) => x.e === id));
        return `<span class="sm"><span>⚽ ${gol}</span>${am ? `<span>🟨 ${am}</span>` : ""}${ro ? `<span>🟥 ${ro}</span>` : ""}${az ? `<span>🟦 ${az}</span>` : ""}</span>`;
      };
      pie += `<details${live ? " open" : ""}><summary>${res(p.local, p.golesLocal).replace('class="sm"', 'class="sm sm-l"')}<span class="chev">▾</span>${res(p.visitante, p.golesVisitante).replace('class="sm"', 'class="sm sm-v"')}</summary>${detalle(p)}</details>`;
    }
    if (p.mvp && jugador(p.mvp)) { const mj = jugador(p.mvp), me = equipo(mj.equipo); pie = `<p class="mvp">⭐ Jugador del partido: <a href="#/jugador/${esc(mj.id)}">${esc(mj.nombre)}</a>${me ? ` <small>${esc(me.nombre)}</small>` : ""}</p>` + pie; }
    if (ok && o.detalle) pie += `<button type="button" class="comp" data-comp="${esc(p.id)}">Compartir resultado ↗</button>`;
    return `<article class="mt ${live ? "live" : ""} ${ok ? "fin" : ""}"><div class="mt-meta">${meta.join("")}</div><div class="mt-body">${fila(p.local, "l", p.golesLocal, pe.local)}${fila(p.visitante, "v", p.golesVisitante, pe.visitante)}</div><div class="mt-estado">${tag}<small>${esc(faseLabel(p))}</small></div>${pie ? `<div class="mt-pie">${pie}</div>` : ""}</article>`;
  }
  const tarjetaResultado = (p) => marcador(p, { detalle: true, veedor: true });
  const tarjetaLista = (p) => marcador(p, { detalle: true, veedor: true });
  const celdaPartido = (p) => marcador(p, { sin: "hora" });

  const vacio = (t) => `<div class="vacio">${esc(t)}</div>`;


  /* ---- portada: próxima fecha ---- */
  const hoyBA = () => D.hoyPrueba || new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
  function etiquetaFecha(iso) {
    const ps = partidos().filter((p) => p.fecha === iso);
    if (ps.some((p) => p.fase === "Zona")) {
      const zf = [...new Set(partidos().filter((p) => p.fase === "Zona").map((p) => p.fecha))].sort();
      return "Fecha " + (zf.indexOf(iso) + 1);
    }
    const f = ps.map((p) => p.fase).join(" ");
    if (/Cuartos/i.test(f)) return "Cuartos de final";
    if (/Semi/i.test(f)) return "Semifinales";
    return "Finales";
  }
  const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  const DIAS3 = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  function heroInicio(fechas, rango, nCanchas, sede) {
    const unicas = [...new Set(fechas)];
    const hoy = hoyBA();
    const prox = unicas.find((f) => f >= hoy);
    let titulo, num, mes, dia, cuenta = "";
    if (prox) {
      const d = new Date(prox + "T12:00:00");
      const dias = Math.round((d - new Date(hoy + "T12:00:00")) / 86400000);
      titulo = etiquetaFecha(prox);
      num = String(d.getDate()); mes = MESES[d.getMonth()]; dia = DIAS3[d.getDay()];
      const h0 = partidos().filter((p) => p.fecha === prox && p.hora).map((p) => p.hora).sort()[0] || "14:00";
      cuenta = `<div class="cd" data-t="${esc(prox)}T${esc(h0)}:00-03:00"><p class="cd-k">${dias === 0 ? "Hoy · " : ""}Arranca la pelota en</p><div class="cd-t"><div><b data-u="d">00</b><span>días</span></div><div><b data-u="h">00</b><span>hs</span></div><div><b data-u="m">00</b><span>min</span></div><div><b data-u="s">00</b><span>seg</span></div></div></div>`;
    } else {
      titulo = "Terminó la Copa"; num = "FIN"; mes = ""; dia = D.estado || "Gracias por jugar";
    }
    return `<section class="cab">
        <div class="cab-marca"><svg class="cab-cancha" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><circle cx="150" cy="100" r="46"/><path d="M0 100h300M150 0v200"/><rect x="-2" y="50" width="52" height="100"/><rect x="250" y="50" width="52" height="100"/></svg><img src="img/logo-copa.png" alt="Copa Pride 2026 · 3ª edición · by Liga Pride"><p>${esc(D.lema || "")}</p></div>
        <div class="cab-fecha">
          <p class="k">${prox ? "Próxima fecha" : "Copa Pride"}</p>
          <div class="cab-num"><b>${esc(num)}</b><span>${esc(mes)}<br>${esc(dia)}</span></div>
          <h2>${esc(titulo)}</h2>
          ${cuenta}
          <p class="cab-hs">${esc(D.horario || rango)}</p>
          <div class="hero-cta"><a class="btn" href="#/fixture">Ver fixture</a><a class="btn sec" href="#/zonas">Ver zonas</a></div>
        </div>
      </section>`;
  }

  /* Cifras de la Copa */
  function cifrasHtml(ps) {
    const jug = ps.filter(jugado);
    if (!jug.length) return "";
    const goles = jug.reduce((s, p) => s + (p.golesLocal || 0) + (p.golesVisitante || 0), 0);
    const top = rankear(goleadores(), (x) => x.goles + "|" + x.pj)[0];
    const tj = top ? jugador(top.id) : null;
    return `<section class="cifras">
      <div class="cifra"><b>${goles}</b><span>goles</span></div>
      <div class="cifra"><b>${jug.length}<small>/${ps.length}</small></b><span>partidos jugados</span></div>
      <div class="cifra"><b>${(goles / jug.length).toFixed(1).replace(".", ",")}</b><span>goles por partido</span></div>
      ${tj ? `<a class="cifra cifra-g" href="#/jugador/${esc(tj.id)}"><b>${top.goles}</b><span>goleador · ${esc(tj.nombre)}</span></a>` : ""}
    </section>`;
  }

  /* Cuenta regresiva hasta el primer partido de la próxima fecha */
  function tickCuenta() {
    document.querySelectorAll(".cd[data-t]").forEach((el) => {
      const t = new Date(el.dataset.t) - Date.now();
      if (isNaN(t)) return;
      if (t <= 0) { el.innerHTML = '<p class="cd-ya">¡Rueda la pelota!</p>'; el.removeAttribute("data-t"); return; }
      const v = { d: Math.floor(t / 864e5), h: Math.floor(t / 36e5) % 24, m: Math.floor(t / 6e4) % 60, s: Math.floor(t / 1e3) % 60 };
      Object.keys(v).forEach((k) => { const x = el.querySelector(`[data-u="${k}"]`); if (x) x.textContent = String(v[k]).padStart(2, "0"); });
    });
  }

  /* Cinta de resultados (arriba de todo) */
  function cintaHtml() {
    const ps = partidos();
    const nom = (id) => { const e = equipo(id); return esc(e ? e.nombre : (resolverSlot(id).texto || "?")); };
    const it = [];
    ps.filter(enVivo).sort(porFecha).forEach((p) => it.push(`<span class="tk"><i class="tk-t vivo">EN VIVO</i>${nom(p.local)} <b>${p.golesLocal}</b>–<b>${p.golesVisitante}</b> ${nom(p.visitante)}</span>`));
    ps.filter(jugado).sort(porFecha).reverse().slice(0, 10).forEach((p) => it.push(`<span class="tk"><i class="tk-t">FINAL</i>${nom(p.local)} <b>${p.golesLocal}</b>–<b>${p.golesVisitante}</b> ${nom(p.visitante)}</span>`));
    ps.filter((p) => !jugado(p) && !enVivo(p)).sort(porFecha).slice(0, 4).forEach((p) => it.push(`<span class="tk"><i class="tk-t pr">${esc(fechaCorta(p.fecha))} ${esc(p.hora)}</i>${nom(p.local)} vs ${nom(p.visitante)}</span>`));
    if (!it.length) return "";
    const h = it.join("");
    return `<div class="tk-track" style="--d:${Math.max(30, it.length * 5)}s">${h}${h}</div>`;
  }

  /* Seguí a tu equipo: se guarda en el celu de cada uno (no es un dato de la liga). */
  function miEquipoId() { try { return localStorage.getItem("copaMiEq") || ""; } catch (e) { return ""; } }
  function miEquipoHtml() {
    const id = miEquipoId(), e = equipo(id);
    const opts = `<option value="">${e ? "Dejar de seguir" : "Elegí tu equipo…"}</option>` + equipos().slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
      .map((q) => `<option value="${esc(q.id)}" ${q.id === id ? "selected" : ""}>${esc(q.nombre)}</option>`).join("");
    if (!e) return `<section class="mi vacio-mi"><label><b>Seguí a tu equipo</b><span>Te mostramos sus partidos acá arriba.</span><select class="sel" data-mi="1">${opts}</select></label></section>`;
    const ps = partidos().filter((p) => p.local === id || p.visitante === id).sort(porFecha);
    const ahora = ps.find(enVivo) || ps.find((p) => !jugado(p));
    const ult = ps.filter(jugado).pop();
    return `<section class="mi"><div class="mi-cab"><a href="#/equipo/${esc(id)}">${badge(e, "med")}<span><small>Tu equipo</small><b>${esc(e.nombre)}</b></span></a><select class="sel" data-mi="1">${opts}</select></div>
      <div class="res-grid">${ahora ? marcador(ahora, { veedor: false }) : ""}${ult && ult !== ahora ? marcador(ult, { detalle: true }) : ""}${!ahora && !ult ? vacio("Todavía no hay partidos de tu equipo.") : ""}</div></section>`;
  }

  /* ---------------- vistas ---------------- */
  function vistaInicio() {
    const ps = partidos();
    const fechas = ps.map((p) => p.fecha).filter(Boolean).sort();
    const rango = fechas.length ? (fechas[0] === fechas[fechas.length - 1] ? diaMes(fechas[0]) : diaMes(fechas[0]) + " – " + diaMes(fechas[fechas.length - 1])) : "";
    const canchas = canchasLista();
    const sede = D.sede || {};

    const camps = llaves().map((c) => {
      const e = campeonDe(c);
      return `<div class="camp-card ${e ? "" : "tbd"}">
        ${e ? badge(e, "grande") : `<span class="badge grande vacio-b">?</span>`}
        <div><span class="kicker">${esc(c.copa)}</span><h3>${e ? esc(e.nombre) : "Por definirse"}</h3></div></div>`;
    }).join("");

    const ult = ps.filter(jugado).sort(porFecha).reverse().slice(0, 6);
    const vivos = ps.filter(enVivo).sort(porFecha);

    const hero = heroInicio(fechas, rango, canchas.length, sede);
    const sedeHtml = `<a class="sede2" href="${esc(mapsLink())}" target="_blank" rel="noopener">
      <svg class="sede-cancha" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect x="12" y="12" width="376" height="176" rx="6"/><path d="M200 12v176"/><circle cx="200" cy="100" r="34"/><rect x="12" y="62" width="48" height="76"/><rect x="340" y="62" width="48" height="76"/><path d="M12 82h22v36H12zM366 82h22v36h-22z"/></svg>
      <span class="sede-pin"><i></i><b></b></span>
      <div class="sede2-in"><span class="kicker">¿Dónde se juega?</span><h3>${esc(sede.nombre || "Sede a confirmar")}</h3><p>${esc(sede.direccion || "")}</p>
        <ul class="sede2-ch">${canchas.length ? `<li><b>${canchas.length}</b>canchas</li>` : ""}${D.horario ? `<li>${esc(D.horario)}</li>` : ""}</ul>
        <span class="btn sec sede2-b">Cómo llegar ↗</span></div></a>`;
    return `${hero}
      ${miEquipoHtml()}
      ${cifrasHtml(ps)}
      ${vivos.length ? `<h2 class="titulo-sec">En vivo ahora</h2><div class="res-grid">${vivos.map(tarjetaLista).join("")}</div>` : ""}
      <h2 class="titulo-sec">Últimos resultados</h2>
      ${ult.length ? `<div class="res-grid">${ult.map(tarjetaResultado).join("")}</div>` : vacio("Todavía no hay resultados cargados.")}
      ${llaves().some((c) => campeonDe(c)) ? `<h2 class="titulo-sec">Campeones</h2><div class="camp-grid">${camps}</div>` : ""}
      ${sedeHtml}`;
  }

  const mapsLink = () => {
    const sd = D.sede || {};
    return sd.comoLlegar || ("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([sd.nombre, sd.direccion].filter(Boolean).join(", ") + ", Argentina"));
  };

  function canchasLista() {
    const s = D.sede && D.sede.canchas && D.sede.canchas.length ? D.sede.canchas : [...new Set(partidos().map((p) => p.cancha).filter(Boolean))];
    return s.slice().sort(natural);
  }

  const estadoFx = { dia: null, vista: "hora", eq: "" };

  function vistaFixture() {
    const dias = [...new Set(partidos().map((p) => p.fecha).filter(Boolean))].sort();
    if (!dias.length) return vacio("Todavía no hay partidos cargados.");
    if (!dias.includes(estadoFx.dia)) estadoFx.dia = dias[0];

    const tabs = dias.map((d) => `<button class="chip ${d === estadoFx.dia ? "on" : ""}" data-dia="${esc(d)}">${esc(fechaCorta(d))}</button>`).join("");
    if (!["hora", "cancha"].includes(estadoFx.vista)) estadoFx.vista = "hora";
    const etq = { hora: "Por hora", cancha: "Por cancha" };
    const seg = ["hora", "cancha"].map((v) => `<button class="${estadoFx.vista === v ? "on" : ""}" data-vista="${v}">${etq[v]}</button>`).join("");
    const opts = `<option value="">Todos los equipos</option>` + equipos().slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
      .map((e) => `<option value="${esc(e.id)}" ${e.id === estadoFx.eq ? "selected" : ""}>${esc(e.nombre)}</option>`).join("");

    const delDia = partidos().filter((p) => p.fecha === estadoFx.dia);
    const visibles = delDia.filter((p) => !estadoFx.eq || p.local === estadoFx.eq || p.visitante === estadoFx.eq);

    let cuerpo;
    if (!visibles.length) cuerpo = vacio("Ese equipo no juega este día.");
    else if (estadoFx.vista === "cancha") {
      const cols = [...new Set(visibles.map((p) => p.cancha))].sort(natural);
      cuerpo = cols.map((c) => `<section class="bloque"><h2 class="titulo-sec">${esc(c)}</h2><div class="res-grid">${visibles.filter((p) => p.cancha === c).sort(porFecha).map((p) => marcador(p, { sin: "cancha", veedor: true, detalle: true })).join("")}</div></section>`).join("");
    } else {
      const horas = [...new Set(visibles.map((p) => p.hora))].sort();
      cuerpo = horas.map((h) => `<section class="hora-blq"><div class="hora-n"><b>${esc(h)}</b></div><div class="res-grid">${visibles.filter((p) => p.hora === h).sort((a, b) => natural(a.cancha, b.cancha)).map((p) => marcador(p, { sin: "hora", veedor: true, detalle: true })).join("")}</div></section>`).join("");
    }

    return `<p class="kicker">${esc(D.horario || "")}</p><h2 class="titulo-pag">Fixture</h2>
      <div class="ctrl"><div class="filtros">${tabs}</div><div class="seg">${seg}</div><select class="sel" data-eq="1">${opts}</select></div>${cuerpo}`;
  }

  function vistaZonas() {
    const zs = zonas();
    if (!zs.length) return vacio("Todavía no hay equipos cargados.");
    const clas = D.clasificacion || [];
    const tono = (pos) => { const c = clas.find((x) => pos >= x.desde && pos <= x.hasta); return c ? c.tono || "oro" : ""; };
    const leyenda = clas.map((c) => `<span class="ley"><i class="q-${esc(c.tono || "oro")}"></i>${esc(c.copa)}</span>`).join("");

    const bloques = zs.map((z) => {
      const filas = tablaZona(z).map((f, i) => {
        const e = equipo(f.id);
        return `<tr><td class="pos q-${tono(i + 1)}">${i + 1}</td>
          <td class="izq"><a class="celda-eq" href="#/equipo/${esc(f.id)}">${badge(e, "chico")}<span>${esc(e.nombre)}</span>${paisTag(e)}${cabezaTag(e)}</a></td>
          <td>${f.pj}</td><td>${f.pg}</td><td>${f.pe}</td><td>${f.pp}</td><td>${f.gf}</td><td>${f.gc}</td><td>${signo(f.dg)}</td><td>${f.ro}-${f.am}-${f.az}</td><td class="pts">${f.pts}</td></tr>`;
      }).join("");
      return `<section class="zona"><h3 class="zona-t"><span>ZONA</span><em>${esc(z)}</em></h3><div class="tabla-wrap"><table>
        <thead><tr><th>#</th><th class="izq">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>FP</th><th>Pts</th></tr></thead>
        <tbody>${filas}</tbody></table></div></section>`;
    }).join("");

    return `<div class="zonas-cab"><div><p class="kicker">Fase de grupos</p><h2 class="titulo-pag">Zonas</h2></div><div class="leyendas">${leyenda}</div></div>
      <div class="zonas-grid">${bloques}</div>
      <p class="leyenda">Desempate: puntos · diferencia de gol · fair play (menos rojas, después amarillas, después azules) · orden alfabético. La columna FP muestra rojas-amarillas-azules.</p>`;
  }

  const estadoCopa = { i: 0 };

  function slotHtml(s) {
    return s.eq ? `${badge(s.eq, "chico")}<span class="n">${esc(s.eq.nombre)}</span>${paisTag(s.eq)}`
      : `<span class="n tbd">${esc(s.texto)}</span>`;
  }

  function cruceHtml(c) {
    const rc = resolverCruce(c), p = rc.p;
    const ok = p && jugado(p), gan = ok ? ganadorId(p) : null, pe = (p && p.penales) || {};
    const fila = (s, g, pen, id) => {
      const cls = ok && gan ? (gan === id ? "gana" : "pierde") : "";
      const link = s.eq ? `href="#/equipo/${esc(s.eq.id)}"` : "";
      return `<a class="fe ${cls}" ${link}>${slotHtml(s)}<span class="gl">${g == null ? "" : esc(g)}${pen != null ? `<i>(${esc(pen)})</i>` : ""}</span></a>`;
    };
    return `<article class="celda cruce">
      <div class="res-top"><span>${esc(c.nombre || "")}</span>${ok ? '<span class="tag">FINAL</span>' : ""}</div>
      ${fila(rc.local, ok ? p.golesLocal : null, pe.local, p ? p.local : null)}
      ${fila(rc.visitante, ok ? p.golesVisitante : null, pe.visitante, p ? p.visitante : null)}
      ${p ? `<p class="veedor">${esc(fechaCorta(p.fecha))} · ${esc(p.hora)} · ${esc(p.cancha)}</p>` : ""}
    </article>`;
  }

  function vistaCopas() {
    const ll = llaves();
    if (!ll.length) return vacio("Las llaves se publican cuando termine la fase de zonas.");
    const i = Math.min(estadoCopa.i, ll.length - 1), copa = ll[i];
    const tabs = ll.map((c, k) => `<button class="chip ${k === i ? "on" : ""}" data-copa="${k}">${esc(c.copa)}</button>`).join("");
    const cols = copa.rondas.map((r) => `<div class="rcol"><h3>${esc(r.nombre)}</h3><div class="rcruces">${r.cruces.map(cruceHtml).join("")}</div></div>`).join("");
    const e = campeonDe(copa);
    const camp = `<div class="rcol"><h3>Campeón</h3><div class="rcruces"><div class="campeon ${e ? "" : "tbd"}"><span class="copa-ico">🏆</span>${e ? badge(e, "grande") : ""}<h3>${e ? esc(e.nombre) : "Por definirse"}</h3><span class="kicker">${esc(copa.copa)}</span></div></div></div>`;
    return `<p class="kicker">Eliminatorias</p><h2 class="titulo-pag">Copas</h2>
      <div class="filtros">${tabs}</div><div class="bracket">${cols}${camp}</div>`;
  }

  function vistaEquipos() {
    if (!equipos().length) return vacio("Todavía no hay equipos cargados.");
    return `<p class="kicker">${equipos().length} equipos · ${zonas().length} zonas</p><h2 class="titulo-pag">Equipos participantes</h2>` + zonas().map((z) =>
      `<section class="eqz"><div class="eqz-z"><span>ZONA</span><em>${esc(z)}</em></div><div class="eqz-l">` + equipos().filter((e) => e.zona === z).map((e) => {
        const nj = jugadores().filter((j) => j.equipo === e.id).length;
        return `<a class="eqf" href="#/equipo/${esc(e.id)}">${badge(e, "med")}<div class="eqf-t"><h3>${esc(e.nombre)}</h3><p>${e.cabeza ? "Cabeza de serie " + esc(e.cabeza) + " · " : ""}${esc(e.pais || "")}${e.pais ? " · " : ""}${nj} jugadores</p></div><span class="eqf-f">→</span></a>`;
      }).join("") + `</div></section>`).join("");
  }

  function fotoGrande(j) {
    if (j && j.foto) return `<img class="foto" src="${esc(j.foto)}" alt="${esc(j.nombre)}">`;
    return `<span class="badge grande" style="margin:0 auto .6rem;display:flex">${esc(iniciales(j ? j.nombre : "?"))}</span>`;
  }

  function vistaEquipo(id) {
    const e = equipo(id);
    if (!e) return vacio("No encontré ese equipo.");
    const plantel = jugadores().filter((j) => j.equipo === id);
    const f = e.zona ? tablaZona(e.zona).find((x) => x.id === id) : null;
    const jug = plantel.map((j) => `<a class="tarjeta" href="#/jugador/${esc(j.id)}">${fotoGrande(j)}<h3>${esc(j.nombre)}</h3>
      <p>${j.numero != null ? `<span class="dorsal">#${esc(j.numero)}</span> · ` : ""}${golesTotal(j.id)} goles</p></a>`).join("");
    const part = partidos().filter((p) => p.local === id || p.visitante === id).sort(porFecha).map(tarjetaLista).join("");
    return `<a class="volver" href="#/equipos">← Equipos</a>
      <div class="ficha">${badge(e, "grande")}<div><h2>${esc(e.nombre)}</h2>
      <p>${e.zona ? "Zona " + esc(e.zona) : ""}${e.pais ? " · " + esc(e.pais) : ""}${f ? ` · ${f.pts} pts · ${f.pj} PJ · DG ${signo(f.dg)}` : ""}</p></div></div>
      <h2 class="titulo-sec">Plantel</h2>${plantel.length ? `<div class="grid">${jug}</div>` : vacio("Sin jugadores cargados.")}
      <h2 class="titulo-sec">Partidos</h2>${part ? `<div class="res-grid">${part}</div>` : vacio("Sin partidos.")}`;
  }

  function vistaJugador(id) {
    const j = jugador(id);
    if (!j) return vacio("No encontré ese jugador.");
    const e = equipo(j.equipo);
    const g = partidos().filter((p) => jugado(p) && (p.goles || []).some((x) => x.j === id)).sort(porFecha);
    const tarj = partidos().filter(jugado).flatMap((p) => p.tarjetas || []).filter((x) => x.j === id);
    const am = tarj.filter((t) => !esRoja(t) && !esAzul(t)).length, ro = tarj.filter(esRoja).length;
    const mvps = partidos().filter((p) => jugado(p) && p.mvp === id).length;
    const goles = golesTotal(id);
    const foto = j.foto ? `<img class="foto" src="${esc(j.foto)}" alt="${esc(j.nombre)}">` : `<span class="figu-ini">${esc(iniciales(j.nombre))}</span>`;
    return `<a class="volver" href="#/equipo/${esc(j.equipo)}">← ${esc(e ? e.nombre : "Equipo")}</a>
      <div class="figu-wrap"><article class="figu">
        <div class="figu-top"><span class="figu-n">${j.numero != null ? "#" + esc(j.numero) : "COPA PRIDE"}</span>${e ? badge(e, "med") : ""}</div>
        <div class="figu-foto">${foto}</div>
        <h2>${esc(j.nombre)}</h2>
        <p class="figu-eq">${e ? esc(e.nombre) : ""}</p>
        <ul class="figu-st"><li><b>${goles}</b>goles</li><li><b>${mvps}</b>jugador del partido</li><li><b>${am}</b>amarillas</li>${ro ? `<li><b>${ro}</b>rojas</li>` : ""}</ul>
        <div class="figu-pie"><span>2026 · 3ª edición</span><span>by Liga Pride</span></div>
      </article></div>
      <h2 class="titulo-sec">Partidos con gol</h2>${g.length ? `<div class="res-grid">${g.map(tarjetaResultado).join("")}</div>` : vacio("Todavía no convirtió.")}`;
  }

  const estadoEst = { tab: "goleadores" };

  function estSeccion(tab) {
    const barra = (pct) => `<i class="barra"><b style="width:${Math.max(4, Math.min(100, pct)).toFixed(1)}%"></b></i>`;
    const eqLink = (e) => e ? `<a class="celda-eq" href="#/equipo/${esc(e.id)}">${badge(e, "chico")}<span>${esc(e.nombre)}</span></a>` : "";
    let cuerpo = "", nota = "";

    if (tab === "goleadores") {
      const lista = rankear(goleadores(), (x) => x.goles + "|" + x.pj).filter((x) => x.rank <= 15).slice(0, 15);
      const max = lista.length ? lista[0].goles : 1;
      const fila = (x) => { const j = jugador(x.id), e = j ? equipo(j.equipo) : null; return { x, j, e }; };
      const pod = lista.slice(0, 3).map(fila);
      const orden = [pod[1], pod[0], pod[2]].filter(Boolean);
      const podio = pod.length ? `<div class="podio">${orden.map(({ x, j, e }) => `<a class="pd p${pod.indexOf(orden.find((o) => o.x === x)) + 1}" href="#/jugador/${esc(x.id)}">
          <span class="pd-rk">${x.rank}</span>${badge(e, "grande")}<b class="pd-n">${esc(j ? j.nombre : "?")}</b><small>${e ? esc(e.nombre) : ""} · ${x.pj} PJ</small><em>${x.goles}<u>goles</u></em></a>`).join("")}</div>` : "";
      const resto = lista.slice(3).map((x) => { const { j, e } = fila(x); return `<li><span class="rk">${x.rank}</span><div class="li-main"><a href="#/jugador/${esc(x.id)}">${esc(j ? j.nombre : "?")}</a><small>${e ? esc(e.nombre) : ""} · ${x.pj} PJ</small></div>${barra(x.goles / max * 100)}<b>${x.goles}</b></li>`; }).join("");
      cuerpo = lista.length ? podio + (resto ? `<ol class="rank barras">${resto}</ol>` : "") : vacio("Todavía no hay goles cargados.");
      nota = (D.estadisticasSoloZona ? "Cuenta solo la fase de zonas" : "Cuenta todo el torneo (zonas, cuartos, semis, final y 3er puesto)") + ". Los goles de las definiciones por penales no suman. Si empatan en goles, va primero el que jugó menos partidos; si siguen iguales, comparten el puesto.";
    } else if (tab === "valla") {
      const vr = rankear(valla(), (x) => x.prom.toFixed(6) + "|" + x.dist + "|" + x.gr).filter((x) => x.rank <= 10);
      const peor = vr.reduce((m, x) => Math.max(m, x.prom), 0) || 1;
      cuerpo = vr.length ? `<ol class="rank barras valla-l">${vr.map((x) => { const e = equipo(x.id);
        return `<li><span class="rk">${x.rank}</span><div class="li-main"><span>${arqueroDe(x.id)}</span><small>${eqLink(e)}</small></div>${barra((1 - x.prom / (peor * 1.2)) * 100)}<div class="vl-n"><b>${promTxt(x.prom)}</b><small>${x.gr} GR · ${x.pj} PJ</small></div></li>`; }).join("")}</ol>` : vacio("Sin datos todavía.");
      nota = "Promedio = goles recibidos por el equipo ÷ partidos jugados; gana el más bajo y el premio es para el arquero titular del equipo (el que más partidos atajó). Cuenta todo el torneo. No cuentan los penales de definición ni los partidos por W.O., y los equipos que abandonan no figuran. Si empatan, va primero el que llegó más lejos y después el que recibió menos goles en total.";
    } else if (tab === "fairplay") {
      const fp = rankear(fairPlay().slice(0, 10), (x) => x.pts);
      cuerpo = fp.length ? `<ol class="rank fp-l">${fp.map((x) => { const e = equipo(x.id);
        return `<li><span class="rk">${x.rank}</span><div class="li-main">${eqLink(e)}</div><span class="tarj"><i class="t-r">${x.ro}</i><i class="t-a">${x.am}</i><i class="t-z">${x.az}</i></span></li>`; }).join("")}</ol>` : vacio("Sin datos todavía.");
      nota = "Menos rojas primero, después menos amarillas y después menos azules. Orden de las cajitas: roja, amarilla, azul.";
    } else if (tab === "mvp") {
      const cnt = {};
      partidos().filter((p) => p.mvp && jugado(p)).forEach((p) => { cnt[p.mvp] = (cnt[p.mvp] || 0) + 1; });
      const lista = rankear(Object.keys(cnt).map((id) => ({ id, n: cnt[id] })), (x) => String(x.n)).slice(0, 10);
      cuerpo = lista.length ? `<ol class="rank">${lista.map((x) => { const j = jugador(x.id), e = j ? equipo(j.equipo) : null;
        return `<li><span class="rk">${x.rank}</span><div class="li-main"><a href="#/jugador/${esc(x.id)}">${esc(j ? j.nombre : "?")}</a><small>${e ? eqLink(e) : ""}</small></div><b>${x.n}</b></li>`; }).join("")}</ol>` : vacio("Todavía no hay jugadores del partido cargados.");
      nota = "El jugador del partido lo eligen los equipos y se anota en la planilla. Cuenta cuántas veces fue elegido.";
    } else if (tab === "suspendidos") {
      const susp = (D.suspendidos || []).map((s, k) => {
        const j = jugador(s.j), e = j ? equipo(j.equipo) : null;
        return `<li><span class="rk">${k + 1}</span><div class="li-main"><a href="#/jugador/${esc(s.j)}">${j && j.numero != null ? "#" + esc(j.numero) + " " : ""}${esc(j ? j.nombre : "?")}</a><small>${e ? esc(e.nombre) : ""}${s.motivo ? " · " + esc(s.motivo) : ""}</small></div></li>`;
      }).join("");
      cuerpo = susp ? `<ol class="rank">${susp}</ol>` : vacio("No hay suspendidos.");
      nota = "La organización confirma cada sanción.";
    } else {
      const vs = veedoresStats(), max = vs.length ? Math.max(1, vs[0].partidos) : 1;
      cuerpo = vs.length ? `<ol class="rank barras">${vs.map((x, i) => {
        const e = equipo(x.id);
        return `<li><span class="rk">${i + 1}</span><div class="li-main">${eqLink(e)}<small>${x.fechas} ${x.fechas === 1 ? "fecha" : "fechas"}</small></div>${barra(x.partidos / max * 100)}<b>${x.partidos}</b></li>`; }).join("")}</ol>` : vacio("Todavía no hay veedores cargados.");
      nota = "Cuenta los partidos que veedó cada equipo (jugados o en vivo, sin los W.O.). Los que todavía no veedaron ninguno figuran con 0.";
    }
    return { cuerpo, nota };
  }

  function vistaEstadisticas() {
    const S = [["goleadores", "Goleadores"], ["valla", "Valla menos vencida"], ["fairplay", "Fair play"], ["mvp", "Jugador del partido"], ["suspendidos", "Suspendidos"], ["veedores", "Veedores"]];
    const sec = Object.fromEntries(S.map(([k, t]) => { const r = estSeccion(k); return [k, `<section class="est-sec" id="est-${k}"><h3 class="titulo-sec">${t}</h3><div class="est-cuerpo">${r.cuerpo}<p class="leyenda">${r.nota}</p></div></section>`]; }));
    const ir = S.map(([k, t]) => `<button class="chip" data-ir="est-${k}">${t}</button>`).join("");
    return `<p class="kicker">Los números de la Copa</p><h2 class="titulo-pag">Estadísticas</h2>
      ${sec.goleadores}
      <div class="est-duo">${sec.valla}${sec.fairplay}</div>
      <div class="est-duo">${sec.mvp}${sec.veedores}</div>
      <div class="est-duo">${sec.suspendidos}</div>`;
  }

  function vistaHistorial() {
    const h = D.historial || [];
    if (!h.length) return vacio("Todavía no hay ediciones cargadas.");
    const norm = (t) => String(t || "").trim().toLowerCase();
    const celda = (rol, nombre) => {
      const e = (D.equipos || []).concat(D.equiposHistoricos || []).find((q) => norm(q.nombre) === norm(nombre));
      const pend = !nombre || /^\(completar\)$/i.test(nombre);
      return `<div class="hc${rol === "Campeón" ? " camp" : ""}"><small>${rol}</small>${e && !pend ? badge(e, "chico") : ""}<span>${esc(nombre || "(completar)")}</span></div>`;
    };
    const franja = (clase, titulo, c) => `<div class="hf ${clase}"><h4>${titulo}</h4><div class="hist2">${celda("Campeón", c && c.campeon)}${celda("Subcampeón", c && c.subcampeon)}</div></div>`;
    return `<h2 class="titulo-pag">Historial</h2>` + h.map((x) => `<div class="card ed"><div class="ed-anio">${esc(x.anio)}</div><div class="ed-cuerpo">
      <div class="hist-cab"><h3>${esc(x.edicion)}</h3></div>
      ${franja("oro", "Copa de Oro", x.oro)}
      ${franja("plata", "Copa de Plata", x.plata)}
      <div class="hist2 hg"><div class="hc"><small>Goleador</small>${(() => { const e = (D.equipos || []).concat(D.equiposHistoricos || []).find((q) => norm(q.nombre) === norm(x.goleadorEquipo)); return e ? badge(e, "chico") : ""; })()}<span>${esc(x.goleador || "(completar)")}</span>${x.goleadorEquipo ? `<em class="hq">${esc(x.goleadorEquipo)}</em>` : ""}</div></div>
      ${x.notas ? `<p class="nota">${esc(x.notas)}</p>` : ""}</div></div>`).join("");
  }

  /* ---------------- compartir resultado (imagen para redes) ---------------- */
  function cargarImg(src) {
    return new Promise((ok) => { if (!src) return ok(null); const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  }
  async function compartirPartido(id) {
    const p = partidos().find((x) => x.id === id);
    if (!p) return;
    try { await document.fonts.load("100px 'Bebas Neue'"); } catch (e) { /* sin fuente */ }
    const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"), DISP = "'Bebas Neue','Anton',Impact,'Arial Narrow',sans-serif", TXT = "'Archivo','Helvetica Neue',Arial,sans-serif";
    const el = equipo(p.local), ev = equipo(p.visitante);
    const [logo, bl, bv] = await Promise.all([cargarImg("img/logo-copa.png"), cargarImg(el && el.escudo), cargarImg(ev && ev.escudo)]);
    let g = x.createRadialGradient(W / 2, 0, 50, W / 2, 0, 1100); g.addColorStop(0, "#2c2314"); g.addColorStop(1, "#080706");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.strokeStyle = "rgba(200,147,42,.14)"; x.lineWidth = 4;
    x.beginPath(); x.arc(W / 2, 700, 230, 0, 7); x.moveTo(0, 700); x.lineTo(W, 700); x.stroke();
    const rg = x.createLinearGradient(0, 0, W, 0); ["#e40303", "#ff8c00", "#ffed00", "#008026", "#004dff", "#750787"].forEach((cc, i) => rg.addColorStop(i / 5, cc));
    x.fillStyle = rg; x.fillRect(0, 0, W, 16); x.fillRect(0, H - 16, W, 16);
    if (logo) { const lw = 340, lh = lw * logo.height / logo.width; x.drawImage(logo, (W - lw) / 2, 60, lw, lh); }
    x.textAlign = "center"; x.fillStyle = "#e6bd5e"; x.font = `54px ${DISP}`;
    x.fillText((faseLabel(p) + " · " + fechaCorta(p.fecha)).toUpperCase(), W / 2, 470);
    const lado = (e, img, cx, nombre) => {
      if (img) { const s = 220, r = Math.min(s / img.width, s / img.height); x.drawImage(img, cx - img.width * r / 2, 640 - img.height * r / 2, img.width * r, img.height * r); }
      else { x.fillStyle = "#c8932a"; x.beginPath(); x.arc(cx, 640, 110, 0, 7); x.fill(); x.fillStyle = "#111"; x.font = `110px ${DISP}`; x.fillText(iniciales(nombre), cx, 678); }
      x.fillStyle = "#f5f2ea"; x.font = `62px ${DISP}`; x.textAlign = "center";
      const w = x.measureText(nombre.toUpperCase()).width; if (w > 340) x.font = `${Math.floor(62 * 340 / w)}px ${DISP}`;
      x.fillText(nombre.toUpperCase(), cx, 840);
    };
    lado(el, bl, 200, el ? el.nombre : "Local"); lado(ev, bv, 880, ev ? ev.nombre : "Visitante");
    x.fillStyle = "#e6bd5e"; x.font = `190px ${DISP}`; x.textAlign = "center";
    x.fillText(`${p.golesLocal} - ${p.golesVisitante}`, W / 2, 700);
    const pen = p.penales && p.penales.local != null ? `(pen. ${p.penales.local}-${p.penales.visitante})` : "";
    if (pen) { x.font = `46px ${DISP}`; x.fillStyle = "#a8a398"; x.fillText(pen, W / 2, 770); }
    const lista = (id, cx) => {
      const m = {};
      (p.goles || []).filter((q) => q.e === id).forEach((q) => { const j = jugador(q.j); const k = j ? j.nombre : "?"; m[k] = (m[k] || 0) + 1; });
      x.fillStyle = "#d9d4c6"; x.font = `34px ${TXT}`; x.textAlign = "center";
      Object.keys(m).slice(0, 7).forEach((k, i) => { const t = "⚽ " + k + (m[k] > 1 ? " ×" + m[k] : ""); x.font = `34px ${TXT}`; const w = x.measureText(t).width; if (w > 480) x.font = `${Math.floor(34 * 480 / w)}px ${TXT}`; x.fillText(t, cx, 930 + i * 46); });
    };
    lista(p.local, 270); lista(p.visitante, 810);
    if (p.mvp && jugador(p.mvp)) { x.fillStyle = "#e6bd5e"; x.font = `40px ${TXT}`; x.textAlign = "center"; x.fillText("⭐ Jugador del partido: " + jugador(p.mvp).nombre, W / 2, 1255); }
    x.fillStyle = "#a8a398"; x.font = `32px ${TXT}`; x.fillText("copapride.netlify.app  ·  Juntxs por el deporte  ·  By Liga Pride", W / 2, 1310);
    const blob = await new Promise((r) => c.toBlob(r, "image/png"));
    if (!blob) return;
    const f = new File([blob], "copa-pride-resultado.png", { type: "image/png" });
    try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: "Copa Pride" }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = "copa-pride-resultado.png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
  }

  /* ---------------- router ---------------- */
  function render(mantener) {
    normalizar();
    const hash = location.hash || "#/inicio";
    const [, pagina, arg] = hash.split("/");
    let html;
    switch (pagina) {
      case "fixture": html = vistaFixture(); break;
      case "zonas": html = vistaZonas(); break;
      case "copas": html = vistaCopas(); break;
      case "equipos": html = vistaEquipos(); break;
      case "equipo": html = vistaEquipo(arg); break;
      case "jugador": html = vistaJugador(arg); break;
      case "estadisticas": html = vistaEstadisticas(); break;
      case "historial": html = vistaHistorial(); break;
      default: html = vistaInicio();
    }
    document.getElementById("app").innerHTML = html;
    const tk = document.getElementById("ticker");
    if (tk) { const h = cintaHtml(); if (tk._h !== h) { tk._h = h; tk.innerHTML = h; } tk.hidden = !h; }
    tickCuenta();
    const activa = { equipo: "equipos", jugador: "equipos" }[pagina] || pagina || "inicio";
    document.querySelectorAll("#nav a, #tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.p === activa));
    const mas = document.getElementById("mas");
    if (mas) { mas.open = false; mas.classList.toggle("on", ["equipos", "estadisticas", "historial"].includes(activa)); }
    if (!mantener) window.scrollTo(0, 0);
  }

  /* ---------------- resultados en vivo (Google Sheets) ---------------- */
  const num = (v) => (v === "" || v == null ? null : Number(v));
  function aplicarRemoto(r) {
    if (!r || !r.partidos) return false;
    let cambio = false;
    partidos().forEach((p) => {
      const x = r.partidos[p.id];
      if (!x || !x.estado) return;
      if (p.manual) return;   // resultado cargado a mano en data.js: la planilla en vivo no lo pisa
      const nuevo = {
        estado: x.estado, golesLocal: num(x.gl), golesVisitante: num(x.gv),
        goles: x.goles || [], tarjetas: x.tarjetas || [], veedor: x.veedor || p.veedor, veedorEq: x.veedorEq || p.veedorEq, mvp: x.mvp || p.mvp,
        penales: num(x.pl) != null && num(x.pv) != null ? { local: num(x.pl), visitante: num(x.pv) } : undefined
      };
      const antes = JSON.stringify([p.estado, p.golesLocal, p.golesVisitante, p.goles, p.tarjetas, p.veedor, p.veedorEq, p.mvp, p.penales]);
      Object.assign(p, nuevo);
      if (antes !== JSON.stringify([p.estado, p.golesLocal, p.golesVisitante, p.goles, p.tarjetas, p.veedor, p.veedorEq, p.mvp, p.penales])) cambio = true;
    });
    return cambio;
  }

  async function cargarRemoto() {
    if (!D.api) return;
    try {
      const res = await fetch(D.api + (D.api.indexOf("?") >= 0 ? "&" : "?") + "accion=estado&t=" + Date.now());
      const r = await res.json();
      if (r && r.ok && aplicarRemoto(r)) render(true);
    } catch (e) { /* sin conexión: queda lo último que se vio */ }
  }

  function iniciarRemoto() {
    if (!D.api) return;
    cargarRemoto();
    setInterval(() => { if (!document.hidden) cargarRemoto(); }, (D.refrescoSeg || 20) * 1000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) cargarRemoto(); });
  }

  function iniciar() {
    document.title = (D.nombre || "Liga") + " " + (D.edicion || "") + (D.numeroEdicion ? " · " + D.numeroEdicion : "");
    const poner = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    poner("logoTitulo", ((D.nombre || "") + " " + (D.edicion || "")).trim());
    poner("logoSub", D.subtitulo || "");
    poner("introAnio", D.edicion || "");
    poner("introNro", D.numeroEdicion || "");
    poner("pieLema", D.lema || "");
    poner("pieSub", D.subtitulo || "");
    const aviso = document.getElementById("aviso");
    if (aviso) aviso.hidden = !D.ejemplo;
    // Todo cargó bien: se esconde el cartel de "faltan archivos".
    const falta = document.getElementById("falta");
    if (falta && window.LIGA_DATA) falta.style.display = "none";
    const app = document.getElementById("app");
    app.addEventListener("click", (ev) => {
      const t = ev.target.closest("[data-dia],[data-vista],[data-copa],[data-est],[data-ir],[data-comp]");
      if (!t) return;
      if (t.dataset.comp) { compartirPartido(t.dataset.comp); return; }
      if (t.dataset.ir) { const x = document.getElementById(t.dataset.ir); if (x) x.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      if (t.dataset.dia) estadoFx.dia = t.dataset.dia;
      if (t.dataset.vista) estadoFx.vista = t.dataset.vista;
      if (t.dataset.est) estadoEst.tab = t.dataset.est;
      if (t.dataset.copa != null && t.dataset.copa !== "") estadoCopa.i = Number(t.dataset.copa);
      render(true);
    });
    app.addEventListener("change", (ev) => {
      if (ev.target.matches("[data-eq]")) { estadoFx.eq = ev.target.value; render(true); }
      if (ev.target.matches("[data-mi]")) { try { localStorage.setItem("copaMiEq", ev.target.value); } catch (e) { /* sin storage */ } render(true); }
    });
    window.addEventListener("hashchange", () => render(false));
    setInterval(tickCuenta, 1000);
    render(false);
    iniciarRemoto();
  }

  if (typeof window !== "undefined") {
    window.CopaApp = { D, partidos, equipos, jugadores, equipo, jugador, normalizar, aplicarRemoto, faseLabel, resolverSlot, enVivo, jugado, esRoja, esAzul, fechaLarga, fechaCorta, ganadorId };
  }
  if (typeof document !== "undefined" && document.getElementById("app")) iniciar();
  if (typeof module !== "undefined") {
    module.exports = {
      setData: (d) => { Object.keys(D).forEach((k) => delete D[k]); Object.assign(D, d); },
      tablaZona, goleadores, valla, distancia, fairPlay, campeonDe, resolverSlot, ganadorId, zonaCompleta, rankingGeneral, buscarCruce, normalizar, aplicarRemoto,
      vistas: { vistaInicio, vistaFixture, vistaZonas, vistaCopas, vistaEquipos, vistaEquipo, vistaJugador, vistaEstadisticas, vistaHistorial },
      estadoFx, estadoCopa
    };
  }
})();
