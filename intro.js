/* Intro: la pelota cae entre la C y la P, rebota tres veces, festeja (confeti) y aparece "by Liga Pride".
   Se va sola a los ~6 segundos o con un toque. Sin sonido. */
(function () {
  var intro = document.getElementById("intro");
  if (!intro) return;
  var cerrar = function () { var e = document.getElementById("intro"); if (e) e.remove(); };
  intro.addEventListener("click", cerrar);

  var reducido = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducido) { intro.classList.add("sin-mov"); setTimeout(cerrar, 2500); return; }
  setTimeout(cerrar, 6100);

  /* confeti con los colores del orgullo */
  var cont = document.getElementById("ilConfeti");
  if (!cont) return;
  var cols = ["#e40303", "#ff8c00", "#ffed00", "#008026", "#24408e", "#732982", "#e6bd5e", "#ffffff"];
  for (var i = 0; i < 40; i++) {
    var p = document.createElement("i");
    var ang = (Math.PI * 2 * i) / 40 + Math.random() * 0.4;
    var d = 90 + Math.random() * 140;
    p.style.setProperty("--dx", Math.cos(ang) * d + "px");
    p.style.setProperty("--dy", Math.sin(ang) * d * 0.8 - 50 + "px");
    p.style.setProperty("--r", Math.round(Math.random() * 720 - 360) + "deg");
    p.style.background = cols[i % cols.length];
    p.style.animationDelay = (2.4 + Math.random() * 0.12) + "s";
    cont.appendChild(p);
  }
})();
