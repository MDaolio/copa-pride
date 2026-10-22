/* Mascotas del festejo de gol: dibujos originales en SVG, por id de equipo.
   Cada mascota tiene dos poses: "corre" (de costado, mirando a la derecha) y "sienta" (de frente).
   Para sumar otra alcanza con agregar sus dos dibujos acá. */
(function () {
  "use strict";

  /* Pata que corre: se dibuja colgando desde la cadera (0,0) y la anima el CSS. */
  const pata = (cls, x, y, largo, ancho, color, pie) =>
    `<g transform="translate(${x} ${y})"><g class="mc-pata ${cls}"><rect x="${-ancho / 2}" y="0" width="${ancho}" height="${largo}" rx="${ancho / 2}" fill="${color}"/><ellipse cx="${ancho * 0.35}" cy="${largo}" rx="${ancho * 0.95}" ry="${ancho * 0.55}" fill="${pie}"/></g></g>`;

  /* ---------------- Aguará guazú ---------------- */
  const NAR = "#d9692a", NAR_OSC = "#b9521c", NEGRO = "#1b120c", CREMA = "#fff4e2";

  const AGUARA_CORRE = `<svg viewBox="0 0 200 140" aria-hidden="true">
    <g class="mc-cola-corre"><path d="M50 60 C34 52 20 50 4 56 C12 62 22 66 30 68 C38 70 46 68 52 66 Z" fill="${NAR_OSC}"/>
      <path d="M4 56 C10 60 16 63 22 65 C18 58 12 54 4 56 Z" fill="${CREMA}"/></g>
    ${pata("p-tras-lejos", 58, 74, 52, 7, "#0d0906", "#0d0906")}
    ${pata("p-del-lejos", 128, 74, 52, 7, "#0d0906", "#0d0906")}
    <ellipse cx="90" cy="64" rx="46" ry="21" fill="${NAR}"/>
    <path d="M60 76 C80 86 110 86 128 76 C112 80 80 80 60 76 Z" fill="${CREMA}" opacity=".7"/>
    <ellipse cx="60" cy="68" rx="18" ry="15" fill="${NAR_OSC}"/>
    <path d="M104 46 C112 40 124 34 134 36 C130 44 120 50 108 54 Z" fill="${NAR}"/>
    <path d="M86 45 C100 40 118 30 134 30 C134 36 124 40 112 46 C104 50 94 50 86 45 Z" fill="${NEGRO}"/>
    ${pata("p-tras-cerca", 64, 76, 54, 8, NEGRO, NEGRO)}
    ${pata("p-del-cerca", 122, 76, 54, 8, NEGRO, NEGRO)}
    <g class="mc-cabeza-corre">
      <path d="M140 30 L134 2 L152 24 Z" fill="${NAR_OSC}"/><path d="M141 26 L137 8 L149 23 Z" fill="${CREMA}"/>
      <path d="M150 28 L156 0 L164 26 Z" fill="${NAR_OSC}"/><path d="M152 25 L156 6 L161 24 Z" fill="${CREMA}"/>
      <ellipse cx="150" cy="40" rx="20" ry="15" fill="${NAR}"/>
      <path d="M156 36 C170 36 184 40 190 46 C184 52 168 54 156 50 Z" fill="${CREMA}"/>
      <path d="M170 47 C178 48 186 48 191 46 C188 53 176 56 166 53 Z" fill="${NEGRO}"/>
      <ellipse cx="190" cy="45" rx="4" ry="3.2" fill="${NEGRO}"/>
      <path class="mc-lengua" d="M172 53 C174 62 180 64 183 58 C181 55 178 54 172 53 Z" fill="#ff7b93"/>
      <path d="M150 37 Q155 33 160 37" stroke="${NEGRO}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="146" cy="47" rx="4" ry="2.2" fill="#ff8f8f" opacity=".6"/>
    </g>
  </svg>`;

  const AGUARA_SIENTA = `<svg viewBox="0 0 120 160" aria-hidden="true">
    <g class="mc-cola"><path d="M84 132 C110 128 116 102 106 84 C101 76 94 79 97 88 C101 102 95 117 79 122 Z" fill="${NAR_OSC}"/>
      <path d="M106 84 C101 76 94 79 97 88 C98 92 99 96 99 100 C106 98 110 92 106 84 Z" fill="${CREMA}"/></g>
    <g class="mc-cuerpo">
      <ellipse cx="60" cy="116" rx="27" ry="31" fill="${NAR}"/>
      <ellipse cx="38" cy="138" rx="13" ry="12" fill="${NAR_OSC}"/><ellipse cx="82" cy="138" rx="13" ry="12" fill="${NAR_OSC}"/>
      <ellipse cx="33" cy="152" rx="10" ry="5" fill="${NEGRO}"/><ellipse cx="87" cy="152" rx="10" ry="5" fill="${NEGRO}"/>
      <path d="M38 94 C44 78 76 78 82 94 C74 88 66 87 60 91 C54 87 46 88 38 94 Z" fill="${NEGRO}"/>
      <ellipse cx="60" cy="104" rx="11" ry="15" fill="${CREMA}"/>
      <rect x="47" y="104" width="9" height="49" rx="4.5" fill="${NEGRO}"/><rect x="64" y="104" width="9" height="49" rx="4.5" fill="${NEGRO}"/>
      <ellipse cx="51" cy="153" rx="7" ry="4" fill="${NEGRO}"/><ellipse cx="69" cy="153" rx="7" ry="4" fill="${NEGRO}"/>
    </g>
    <g class="mc-cabeza">
      <g class="mc-oreja-i"><path d="M44 52 L28 8 L59 40 Z" fill="${NAR_OSC}"/><path d="M44 47 L33 17 L53 39 Z" fill="${CREMA}"/></g>
      <g class="mc-oreja-d"><path d="M76 52 L92 8 L61 40 Z" fill="${NAR_OSC}"/><path d="M76 47 L87 17 L67 39 Z" fill="${CREMA}"/></g>
      <ellipse cx="60" cy="58" rx="24" ry="20" fill="${NAR}"/>
      <path d="M38 62 C40 72 48 76 54 74 C48 70 44 66 38 62 Z M82 62 C80 72 72 76 66 74 C72 70 76 66 82 62 Z" fill="${CREMA}"/>
      <path d="M48 64 C50 84 70 84 72 64 C66 70 54 70 48 64 Z" fill="${CREMA}"/>
      <path d="M50 74 C54 86 66 86 70 74 C66 79 54 79 50 74 Z" fill="${NEGRO}"/>
      <path class="mc-lengua" d="M56 80 C56 88 64 88 64 80 Z" fill="#ff7b93"/>
      <ellipse cx="60" cy="68" rx="5.5" ry="4" fill="${NEGRO}"/><ellipse cx="58.5" cy="66.8" rx="1.6" ry="1" fill="#fff" opacity=".75"/>
      <g class="mc-ojos"><ellipse cx="50" cy="55" rx="4.3" ry="5.4" fill="${NEGRO}"/><ellipse cx="70" cy="55" rx="4.3" ry="5.4" fill="${NEGRO}"/>
        <circle cx="51.6" cy="53.2" r="1.7" fill="#fff"/><circle cx="71.6" cy="53.2" r="1.7" fill="#fff"/>
        <circle cx="48.8" cy="57" r=".8" fill="#fff"/><circle cx="68.8" cy="57" r=".8" fill="#fff"/></g>
      <ellipse cx="43" cy="64" rx="4" ry="2.3" fill="#ff8f8f" opacity=".6"/><ellipse cx="77" cy="64" rx="4" ry="2.3" fill="#ff8f8f" opacity=".6"/>
    </g>
  </svg>`;

  /* ---------------- Huemul ---------------- */
  const MAR = "#8a6a46", MAR_OSC = "#6b4f33", MAR_CLARO = "#e3cfab", ASTA = "#efe2c4", HUE_NEGRO = "#211813";

  const asta = (lado) => `<path d="M0 0 C${2 * lado} -10 ${4 * lado} -20 ${3 * lado} -30 M${3 * lado} -14 C${9 * lado} -16 ${13 * lado} -22 ${14 * lado} -28 M${3.4 * lado} -24 C${7 * lado} -28 ${8 * lado} -34 ${7 * lado} -38" stroke="${ASTA}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;

  const HUEMUL_CORRE = `<svg viewBox="0 0 200 140" aria-hidden="true">
    <g class="mc-cola-corre"><ellipse cx="44" cy="56" rx="9" ry="6" fill="${MAR_OSC}"/><ellipse cx="42" cy="59" rx="6" ry="3.6" fill="#fff"/></g>
    ${pata("p-tras-lejos", 60, 74, 52, 6, "#4f3a25", HUE_NEGRO)}
    ${pata("p-del-lejos", 126, 74, 52, 6, "#4f3a25", HUE_NEGRO)}
    <ellipse cx="90" cy="64" rx="45" ry="20" fill="${MAR}"/>
    <path d="M60 74 C80 84 110 84 128 74 C112 80 80 80 60 74 Z" fill="${MAR_CLARO}"/>
    <ellipse cx="60" cy="66" rx="17" ry="15" fill="${MAR_OSC}"/>
    <path d="M110 52 C116 40 126 32 138 32 C140 42 132 54 120 62 Z" fill="${MAR}"/>
    <path d="M122 58 C128 50 134 42 138 36 C140 46 134 56 126 62 Z" fill="${MAR_CLARO}"/>
    ${pata("p-tras-cerca", 66, 76, 54, 7, MAR_OSC, HUE_NEGRO)}
    ${pata("p-del-cerca", 120, 76, 54, 7, MAR_OSC, HUE_NEGRO)}
    <g class="mc-cabeza-corre">
      <g transform="translate(146 22)">${asta(-1)}</g><g transform="translate(152 22)">${asta(1)}</g>
      <ellipse cx="136" cy="30" rx="11" ry="5" fill="${MAR_OSC}" transform="rotate(-25 136 30)"/>
      <ellipse cx="148" cy="34" rx="15" ry="13" fill="${MAR}"/>
      <path d="M152 30 C166 30 178 36 182 44 C176 50 162 50 152 44 Z" fill="${MAR}"/>
      <path d="M150 33 C160 36 170 40 180 45" stroke="${HUE_NEGRO}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M160 46 C168 49 176 49 182 45 C180 52 168 54 160 50 Z" fill="${MAR_CLARO}"/>
      <ellipse cx="182" cy="43" rx="3.6" ry="3" fill="${HUE_NEGRO}"/>
      <ellipse cx="150" cy="31" rx="3.4" ry="3.8" fill="${HUE_NEGRO}"/><circle cx="151.2" cy="29.8" r="1.2" fill="#fff"/>
      <ellipse cx="146" cy="41" rx="3.6" ry="2" fill="#ff8f8f" opacity=".5"/>
    </g>
  </svg>`;

  const HUEMUL_SIENTA = `<svg viewBox="0 0 120 160" aria-hidden="true">
    <g class="mc-cuerpo">
      <ellipse cx="60" cy="118" rx="27" ry="29" fill="${MAR}"/>
      <ellipse cx="37" cy="139" rx="13" ry="11" fill="${MAR_OSC}"/><ellipse cx="83" cy="139" rx="13" ry="11" fill="${MAR_OSC}"/>
      <ellipse cx="32" cy="151" rx="8" ry="4.5" fill="${HUE_NEGRO}"/><ellipse cx="88" cy="151" rx="8" ry="4.5" fill="${HUE_NEGRO}"/>
      <ellipse cx="60" cy="104" rx="13" ry="16" fill="${MAR_CLARO}"/>
      <rect x="48" y="106" width="7.5" height="47" rx="3.7" fill="${MAR_OSC}"/><rect x="64.5" y="106" width="7.5" height="47" rx="3.7" fill="${MAR_OSC}"/>
      <path d="M47 150 h10 v5 h-10 Z M63 150 h10 v5 h-10 Z" fill="${HUE_NEGRO}"/>
    </g>
    <g class="mc-cabeza">
      <g transform="translate(50 36)">${asta(-1)}</g><g transform="translate(70 36)">${asta(1)}</g>
      <g class="mc-oreja-i"><ellipse cx="30" cy="48" rx="15" ry="7" fill="${MAR_OSC}" transform="rotate(-18 30 48)"/><ellipse cx="31" cy="48" rx="10" ry="3.6" fill="${MAR_CLARO}" transform="rotate(-18 31 48)"/></g>
      <g class="mc-oreja-d"><ellipse cx="90" cy="48" rx="15" ry="7" fill="${MAR_OSC}" transform="rotate(18 90 48)"/><ellipse cx="89" cy="48" rx="10" ry="3.6" fill="${MAR_CLARO}" transform="rotate(18 89 48)"/></g>
      <ellipse cx="60" cy="58" rx="21" ry="21" fill="${MAR}"/>
      <path d="M60 72 L60 50 M60 50 C56 46 53 42 51 38 M60 50 C64 46 67 42 69 38" stroke="${HUE_NEGRO}" stroke-width="4.2" fill="none" stroke-linecap="round" opacity=".85"/>
      <ellipse cx="60" cy="78" rx="12" ry="9" fill="${MAR_CLARO}"/>
      <ellipse cx="60" cy="74" rx="6" ry="4.2" fill="${HUE_NEGRO}"/><ellipse cx="58.4" cy="72.8" rx="1.6" ry="1" fill="#fff" opacity=".7"/>
      <path d="M55 82 Q60 86 65 82" stroke="${HUE_NEGRO}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <g class="mc-ojos"><ellipse cx="49" cy="58" rx="4.4" ry="5.4" fill="${HUE_NEGRO}"/><ellipse cx="71" cy="58" rx="4.4" ry="5.4" fill="${HUE_NEGRO}"/>
        <circle cx="50.6" cy="56.2" r="1.7" fill="#fff"/><circle cx="72.6" cy="56.2" r="1.7" fill="#fff"/>
        <circle cx="47.6" cy="60" r=".9" fill="#fff"/><circle cx="69.6" cy="60" r=".9" fill="#fff"/></g>
      <ellipse cx="42" cy="68" rx="4" ry="2.3" fill="#ff8f8f" opacity=".55"/><ellipse cx="78" cy="68" rx="4" ry="2.3" fill="#ff8f8f" opacity=".55"/>
    </g>
  </svg>`;


  /* ---------------- Dogo argentino ---------------- */
  const BLANCO = "#fbfbf8", SOMBRA = "#dfe4ea", ROSA = "#f4a6b4", DOGO_NEGRO = "#1d1d22", COLLAR = "#2f8fe0", CHAPITA = "#f2c14e";

  const DOGO_CORRE = `<svg viewBox="0 0 200 140" aria-hidden="true">
    <g class="mc-cola-corre"><path d="M48 58 C36 52 22 46 8 46 C20 52 32 60 46 66 Z" fill="${SOMBRA}"/></g>
    ${pata("p-tras-lejos", 58, 76, 42, 10, SOMBRA, SOMBRA)}
    ${pata("p-del-lejos", 126, 76, 42, 10, SOMBRA, SOMBRA)}
    <ellipse cx="90" cy="64" rx="47" ry="25" fill="${BLANCO}"/>
    <path d="M52 74 C70 90 112 90 132 76 C112 84 74 84 52 74 Z" fill="${SOMBRA}"/>
    <ellipse cx="60" cy="68" rx="20" ry="18" fill="${BLANCO}"/>
    <path d="M48 62 C52 74 62 80 72 80" stroke="${SOMBRA}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M112 44 C118 36 128 30 140 30 C144 44 138 58 126 66 Z" fill="${BLANCO}"/>
    <path d="M124 34 C130 44 136 52 140 58" stroke="${COLLAR}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="138" cy="62" r="4.2" fill="${CHAPITA}"/>
    ${pata("p-tras-cerca", 64, 78, 44, 11, BLANCO, BLANCO)}
    ${pata("p-del-cerca", 120, 78, 44, 11, BLANCO, BLANCO)}
    <g class="mc-cabeza-corre">
      <path d="M134 22 C128 22 124 30 128 38 C132 34 136 30 140 28 Z" fill="${ROSA}" opacity=".9"/>
      <ellipse cx="150" cy="36" rx="22" ry="19" fill="${BLANCO}"/>
      <path d="M156 30 C172 28 186 32 190 40 C190 50 182 56 166 56 C158 56 152 50 152 44 Z" fill="${BLANCO}"/>
      <path d="M166 56 C174 56 184 54 189 48" stroke="${SOMBRA}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <ellipse cx="189" cy="37" rx="5" ry="4.2" fill="${DOGO_NEGRO}"/><ellipse cx="187.6" cy="35.6" rx="1.4" ry=".9" fill="#fff" opacity=".7"/>
      <path class="mc-lengua" d="M168 54 C168 66 178 68 180 58 C178 55 174 54 168 54 Z" fill="#ff7b93"/>
      <ellipse cx="152" cy="29" rx="8" ry="7" fill="${DOGO_NEGRO}" opacity=".9"/>
      <path d="M148 30 Q153 26 158 30" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M134 18 C126 14 120 22 124 32 C128 30 132 26 138 24 Z" fill="${SOMBRA}"/>
      <ellipse cx="160" cy="46" rx="4" ry="2.2" fill="#ff8f8f" opacity=".55"/>
    </g>
  </svg>`;

  const DOGO_SIENTA = `<svg viewBox="0 0 120 160" aria-hidden="true">
    <g class="mc-cola"><path d="M84 140 C100 138 108 126 106 110 C105 104 100 105 100 110 C100 122 94 130 82 132 Z" fill="${SOMBRA}"/></g>
    <g class="mc-cuerpo">
      <ellipse cx="60" cy="116" rx="31" ry="32" fill="${BLANCO}"/>
      <ellipse cx="34" cy="138" rx="15" ry="13" fill="${SOMBRA}"/><ellipse cx="86" cy="138" rx="15" ry="13" fill="${SOMBRA}"/>
      <ellipse cx="29" cy="151" rx="11" ry="5.5" fill="${BLANCO}"/><ellipse cx="91" cy="151" rx="11" ry="5.5" fill="${BLANCO}"/>
      <path d="M44 100 C50 112 70 112 76 100" stroke="${SOMBRA}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="44" y="104" width="13" height="48" rx="6.5" fill="${BLANCO}" stroke="${SOMBRA}" stroke-width="1.5"/><rect x="63" y="104" width="13" height="48" rx="6.5" fill="${BLANCO}" stroke="${SOMBRA}" stroke-width="1.5"/>
      <path d="M47 151 v-4 M50.5 152 v-5 M54 151 v-4 M66 151 v-4 M69.5 152 v-5 M73 151 v-4" stroke="${SOMBRA}" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M36 86 C46 94 74 94 84 86" stroke="${COLLAR}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="60" cy="97" r="5.4" fill="${CHAPITA}"/><circle cx="60" cy="97" r="2.4" fill="#d79a1c"/>
    </g>
    <g class="mc-cabeza">
      <g class="mc-oreja-i"><path d="M38 40 C28 36 20 44 22 56 C24 62 30 62 34 56 C36 50 38 46 42 44 Z" fill="${BLANCO}" stroke="${SOMBRA}" stroke-width="1.5"/><path d="M34 44 C28 44 26 50 27 55 C30 56 32 52 34 48 Z" fill="${ROSA}"/></g>
      <g class="mc-oreja-d"><path d="M82 40 C92 36 100 44 98 56 C96 62 90 62 86 56 C84 50 82 46 78 44 Z" fill="${BLANCO}" stroke="${SOMBRA}" stroke-width="1.5"/><path d="M86 44 C92 44 94 50 93 55 C90 56 88 52 86 48 Z" fill="${ROSA}"/></g>
      <ellipse cx="60" cy="56" rx="27" ry="24" fill="${BLANCO}"/>
      <path d="M50 38 C54 42 56 46 58 50 M70 38 C66 42 64 46 62 50" stroke="${SOMBRA}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="44" cy="74" rx="10" ry="8" fill="${BLANCO}"/><ellipse cx="76" cy="74" rx="10" ry="8" fill="${BLANCO}"/>
      <path d="M36 76 C40 84 50 86 56 82 M84 76 C80 84 70 86 64 82" stroke="${SOMBRA}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path class="mc-lengua" d="M54 80 C54 92 66 92 66 80 Z" fill="#ff7b93"/><path d="M60 82 v6" stroke="#e35d78" stroke-width="1.2"/>
      <path d="M48 76 Q54 82 60 76 Q66 82 72 76" stroke="${DOGO_NEGRO}" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M60 70 v6" stroke="${DOGO_NEGRO}" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="60" cy="67" rx="7.5" ry="5.4" fill="${DOGO_NEGRO}"/><ellipse cx="62" cy="68.4" rx="2.4" ry="1.4" fill="${ROSA}"/><ellipse cx="57.6" cy="65.4" rx="2" ry="1.1" fill="#fff" opacity=".7"/>
      <ellipse cx="71" cy="53" rx="9" ry="8" fill="${DOGO_NEGRO}" opacity=".9"/>
      <g class="mc-ojos"><ellipse cx="49" cy="54" rx="4.4" ry="5.4" fill="${DOGO_NEGRO}"/><ellipse cx="71" cy="54" rx="4.4" ry="5.4" fill="#000"/>
        <circle cx="50.6" cy="52.2" r="1.8" fill="#fff"/><circle cx="72.6" cy="52.2" r="1.8" fill="#fff"/>
        <circle cx="47.8" cy="56" r=".9" fill="#fff"/><circle cx="69.8" cy="56" r=".9" fill="#fff"/></g>
      <ellipse cx="40" cy="64" rx="4.2" ry="2.4" fill="#ff8f8f" opacity=".55"/><ellipse cx="80" cy="64" rx="4.2" ry="2.4" fill="#ff8f8f" opacity=".55"/>
    </g>
  </svg>`;

  window.MASCOTAS_COPA = {
    e1: { corre: AGUARA_CORRE, sienta: AGUARA_SIENTA, brisa: "#ffe2b8" },   // Aguará Guazú
    e5: { corre: DOGO_CORRE, sienta: DOGO_SIENTA, brisa: "#cfe9ff" },       // DOGOS F5
    e11: { corre: HUEMUL_CORRE, sienta: HUEMUL_SIENTA, brisa: "#f1e3c6" }   // Huemules
  };
})();
