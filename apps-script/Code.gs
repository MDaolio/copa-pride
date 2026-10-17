/**
 * COPA PRIDE · Resultados en vivo (Google Apps Script)
 *
 * Se pega en: Google Sheets -> Extensiones -> Apps Script.
 * Pasos completos en INSTALAR-EN-VIVO.txt.
 *
 * Cómo funciona:
 *  - La planilla guarda los resultados que cargan los veedores desde el celular.
 *  - La página pública lee esos resultados (lectura abierta, solo muestra datos).
 *  - Para ESCRIBIR hace falta el PIN de la jornada. El PIN lo genera el menú
 *    "Copa Pride -> Abrir jornada de hoy", sirve solo el día de hoy y se anula
 *    al cerrar la jornada o a la medianoche.
 */

var ZONA_HORARIA = "America/Argentina/Buenos_Aires";
var HOJA_PARTIDOS = "Partidos";
var HOJA_CONFIG = "Config";
var COLUMNAS = ["id", "estado", "golesLocal", "golesVisitante", "penLocal", "penVisitante",
                "goles", "tarjetas", "veedor", "lockHasta", "actualizado", "veedorEq"];
var MINUTOS_BLOQUEO = 25;      // un partido tomado por un veedor queda reservado este tiempo
var HORA_CIERRE_DEFAULT = "23:30";

/* ---------------- utilidades de fecha (se pueden pisar en las pruebas) ---------------- */
function ahora_() { return new Date(); }
function hoy_() { return Utilities.formatDate(ahora_(), ZONA_HORARIA, "yyyy-MM-dd"); }
function hora_() { return Utilities.formatDate(ahora_(), ZONA_HORARIA, "HH:mm"); }

/* ---------------- menú de la planilla ---------------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("Copa Pride")
    .addItem("Abrir jornada de hoy", "abrirJornada")
    .addItem("Cerrar jornada", "cerrarJornada")
    .addItem("Liberar todos los partidos", "liberarBloqueos")
    .addToUi();
}

function abrirJornada() {
  prepararHojas_();
  var pin = String(100000 + Math.floor(Math.random() * 900000));
  escribirConfig_({ pin: pin, fecha: hoy_(), abierta: "SI" });
  limpiarCache_();
  SpreadsheetApp.getUi().alert("Jornada abierta",
    "Fecha: " + hoy_() + "\n\nPIN para los veedores: " + pin +
    "\n\nPasáselo por WhatsApp. Sirve solo hoy (hasta las " + (leerConfig_().horaCierre || HORA_CIERRE_DEFAULT) +
    ") y se anula al cerrar la jornada.",
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function cerrarJornada() {
  prepararHojas_();
  escribirConfig_({ pin: "", abierta: "NO" });
  limpiarCache_();
  SpreadsheetApp.getUi().alert("Jornada cerrada",
    "Los veedores ya no pueden cargar resultados. El PIN anterior quedó anulado.",
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function liberarBloqueos() {
  var mapa = leerPartidos_();
  for (var id in mapa) {
    var r = mapa[id];
    if (Number(r.lockHasta) > 0) { r.lockHasta = 0; escribirFila_(r, r._fila); }
  }
  limpiarCache_();
}

/* ---------------- hojas ---------------- */
function hoja_(nombre) {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var h = libro.getSheetByName(nombre);
  if (!h) h = libro.insertSheet(nombre);
  return h;
}

function prepararHojas_() {
  var hp = hoja_(HOJA_PARTIDOS);
  if (hp.getLastRow() < 1) hp.appendRow(COLUMNAS);
  var hc = hoja_(HOJA_CONFIG);
  if (hc.getLastRow() < 1) {
    hc.appendRow(["pin", ""]);
    hc.appendRow(["fecha", ""]);
    hc.appendRow(["abierta", "NO"]);
    hc.appendRow(["horaCierre", HORA_CIERRE_DEFAULT]);
    hc.getRange(1, 2, 4, 1).setNumberFormat("@");
  }
}

function leerConfig_() {
  prepararHojas_();
  var vals = hoja_(HOJA_CONFIG).getDataRange().getValues();
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || ZONA_HORARIA;
  var c = {};
  for (var i = 0; i < vals.length; i++) {
    var k = String(vals[i][0]).replace(/\s+/g, "");
    if (!k) continue;
    var v = vals[i][1];
    if (v instanceof Date) v = Utilities.formatDate(v, tz, k === "horaCierre" ? "HH:mm" : "yyyy-MM-dd");
    c[k] = (v === null || v === undefined) ? "" : String(v).trim();
  }
  return c;
}

function escribirConfig_(cambios) {
  var hoja = hoja_(HOJA_CONFIG);
  var vals = hoja.getDataRange().getValues();
  for (var i = 0; i < vals.length; i++) {
    var k = String(vals[i][0]).replace(/\s+/g, "");
    if (cambios.hasOwnProperty(k)) {
      hoja.getRange(i + 1, 2).setNumberFormat("@");   // texto: no pierde ceros ni se vuelve fecha
      hoja.getRange(i + 1, 2).setValue(String(cambios[k]));
    }
  }
}

function leerPartidos_() {
  prepararHojas_();
  var vals = hoja_(HOJA_PARTIDOS).getDataRange().getValues();
  var mapa = {};
  for (var i = 1; i < vals.length; i++) {
    var r = {};
    for (var j = 0; j < COLUMNAS.length; j++) r[COLUMNAS[j]] = vals[i][j];
    if (r.id === "" || r.id === null || r.id === undefined) continue;
    r._fila = i + 1;
    mapa[String(r.id)] = r;
  }
  return mapa;
}

function escribirFila_(r, fila) {
  var hoja = hoja_(HOJA_PARTIDOS);
  var arr = COLUMNAS.map(function (c) { return (r[c] === undefined || r[c] === null) ? "" : r[c]; });
  if (fila) hoja.getRange(fila, 1, 1, COLUMNAS.length).setValues([arr]);
  else hoja.appendRow(arr);
}

function limpiarCache_() { CacheService.getScriptCache().remove("estado"); }

function parse_(txt) {
  if (!txt) return [];
  try { var v = JSON.parse(txt); return Array.isArray(v) ? v : []; } catch (e) { return []; }
}

/* ---------------- seguridad: PIN + jornada ---------------- */
function validar_(pin) {
  var c = leerConfig_();
  if (String(c.abierta || "").toUpperCase() !== "SI")
    return { ok: false, codigo: "cerrada", error: "La jornada está cerrada. La organización tiene que abrirla." };
  if (c.fecha !== hoy_())
    return { ok: false, codigo: "fecha", error: "La jornada de hoy no está abierta." };
  var cierre = c.horaCierre || HORA_CIERRE_DEFAULT;
  if (hora_() > cierre)
    return { ok: false, codigo: "hora", error: "La jornada ya cerró (" + cierre + ")." };
  if (!c.pin || !pin || String(pin).trim() !== c.pin) {
    Utilities.sleep(1200);   // frena los intentos de adivinar el PIN
    return { ok: false, codigo: "pin", error: "PIN incorrecto." };
  }
  return { ok: true };
}

function nombreVeedor_(v) {
  return String(v || "").replace(/[^\wÁÉÍÓÚÜÑáéíóúüñ .'-]/g, "").trim().substring(0, 30);
}

function err_(msg, codigo) { return { ok: false, error: msg, codigo: codigo || "datos" }; }

/* ---------------- lectura pública ---------------- */
function publico_(r) {
  return {
    estado: r.estado, gl: r.golesLocal, gv: r.golesVisitante, pl: r.penLocal, pv: r.penVisitante,
    goles: parse_(r.goles), tarjetas: parse_(r.tarjetas), veedor: r.veedor || "", veedorEq: r.veedorEq || "",
    lock: Number(r.lockHasta) > ahora_().getTime(), t: r.actualizado
  };
}

function estadoJson_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get("estado");
  if (hit) return hit;
  var mapa = leerPartidos_(), out = {};
  for (var id in mapa) { if (mapa[id].estado) out[id] = publico_(mapa[id]); }
  var json = JSON.stringify({ ok: true, partidos: out, ahora: ahora_().getTime() });
  cache.put("estado", json, 8);
  return json;
}

/* ---------------- escritura (solo veedores con PIN) ---------------- */
function login_(d) {
  if (!nombreVeedor_(d.veedor)) return err_("Poné tu nombre.");
  return { ok: true, fecha: hoy_() };
}

function tomar_(d) {
  var id = String(d.id || ""), nombre = nombreVeedor_(d.veedor);
  if (!/^[A-Za-z0-9_-]{1,20}$/.test(id)) return err_("Partido inválido.");
  if (!nombre) return err_("Poné tu nombre.");
  var mapa = leerPartidos_(), r = mapa[id] || { id: id }, ts = ahora_().getTime();
  var ocupado = r.veedor && Number(r.lockHasta) > ts && r.veedor !== nombre;
  if (ocupado && !d.forzar)
    return { ok: false, ocupado: true, por: r.veedor, codigo: "ocupado", error: "Lo está cargando " + r.veedor + "." };
  r.veedor = nombre;
  if (/^e\d{1,3}$/.test(String(d.veedorEq || ""))) r.veedorEq = String(d.veedorEq);
  r.lockHasta = ts + MINUTOS_BLOQUEO * 60000;
  if (!r.estado) {
    r.estado = "EN_JUEGO"; r.golesLocal = 0; r.golesVisitante = 0; r.goles = "[]"; r.tarjetas = "[]";
  }
  r.actualizado = ahora_().toISOString();
  escribirFila_(r, r._fila);
  limpiarCache_();
  return { ok: true, partido: publico_(r) };
}

function entero_(x, max) {
  if (x === null || x === undefined || x === "") return null;
  var n = Number(x);
  if (!isFinite(n) || n < 0 || n > max || Math.floor(n) !== n) return NaN;
  return n;
}

function listaValida_(lista, max, conTipo) {
  if (!Array.isArray(lista) || lista.length > max) return null;
  var out = [];
  for (var i = 0; i < lista.length; i++) {
    var x = lista[i] || {};
    var j = String(x.j === undefined || x.j === null ? "" : x.j), e = String(x.e || "");
    if (j.length > 20 || !/^[A-Za-z0-9_-]{1,20}$/.test(e) || (j && !/^[A-Za-z0-9_-]+$/.test(j))) return null;
    var item = { j: j, e: e };
    if (conTipo) { if (x.t !== "A" && x.t !== "R" && x.t !== "Z") return null; item.t = x.t; }
    out.push(item);
  }
  return out;
}

function guardar_(d) {
  var id = String(d.id || ""), nombre = nombreVeedor_(d.veedor);
  var estado = d.estado;
  if (estado !== "EN_JUEGO" && estado !== "FINAL") return err_("Estado inválido.");
  var gl = entero_(d.gl, 99), gv = entero_(d.gv, 99);
  var pl = entero_(d.pl, 99), pv = entero_(d.pv, 99);
  if (gl === null || gv === null || isNaN(gl) || isNaN(gv) || isNaN(pl) || isNaN(pv)) return err_("Marcador inválido.");
  var goles = listaValida_(d.goles || [], 99, false), tarjetas = listaValida_(d.tarjetas || [], 60, true);
  if (!goles || !tarjetas) return err_("Detalle de goles o tarjetas inválido.");

  var mapa = leerPartidos_(), r = mapa[id];
  if (!r || r.veedor !== nombre)
    return { ok: false, codigo: "lock", error: "Ya no tenés este partido. Volvé a tomarlo desde la lista." };

  r.estado = estado;
  r.golesLocal = gl; r.golesVisitante = gv;
  r.penLocal = pl === null ? "" : pl; r.penVisitante = pv === null ? "" : pv;
  r.goles = JSON.stringify(goles); r.tarjetas = JSON.stringify(tarjetas);
  r.lockHasta = estado === "FINAL" ? 0 : ahora_().getTime() + MINUTOS_BLOQUEO * 60000;
  r.actualizado = ahora_().toISOString();
  escribirFila_(r, r._fila);
  limpiarCache_();
  return { ok: true, partido: publico_(r) };
}

function liberar_(d) {
  var id = String(d.id || ""), nombre = nombreVeedor_(d.veedor);
  var mapa = leerPartidos_(), r = mapa[id];
  if (r && r.veedor === nombre) { r.lockHasta = 0; escribirFila_(r, r._fila); limpiarCache_(); }
  return { ok: true };
}

/* ---------------- puntos de entrada de la web ---------------- */
function respuesta_(obj) {
  return ContentService.createTextOutput(typeof obj === "string" ? obj : JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var accion = e && e.parameter && e.parameter.accion;
  if (accion === "estado") return respuesta_(estadoJson_());
  return respuesta_({ ok: true, mensaje: "Copa Pride en vivo" });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var d;
    try { d = JSON.parse(e.postData.contents); } catch (x) { return respuesta_(err_("Pedido inválido.")); }
    // El PIN y la jornada se validan ANTES de tomar el candado, así un PIN
    // incorrecto (que espera 1 segundo a propósito) no traba a los demás veedores.
    var v = validar_(d.pin);
    if (!v.ok) return respuesta_(v);
    lock.waitLock(15000);
    switch (d.accion) {
      case "login": return respuesta_(login_(d));
      case "tomar": return respuesta_(tomar_(d));
      case "guardar": return respuesta_(guardar_(d));
      case "liberar": return respuesta_(liberar_(d));
      default: return respuesta_(err_("Acción desconocida."));
    }
  } catch (ex) {
    return respuesta_({ ok: false, codigo: "error", error: "Error del servidor, probá de nuevo." });
  } finally {
    try { lock.releaseLock(); } catch (x2) { /* no estaba tomado */ }
  }
}
