/* =====================================================================
   JELLYFIN — Effets souris & header intelligent (complément du thème)
   ---------------------------------------------------------------------
   Ce script ajoute ce que le CSS seul ne peut pas faire :
     • Inclinaison 3D des cartes qui SUIT la souris (effet de profondeur)
     • Header qui se masque quand on descend, réapparaît quand on remonte
     • Révélation au scroll de secours (navigateurs sans animation-timeline)
   ---------------------------------------------------------------------
   COMMENT L'INSTALLER (la case "CSS personnalisé" de Jellyfin n'accepte
   pas le JS — il faut donc l'injecter une fois dans le client web) :

   Méthode A · Modifier index.html (serveur que tu administres)
     1. Sur le serveur, ouvre le fichier du client web :
        .../jellyfin-web/index.html
        (Linux paquet : /usr/share/jellyfin/web/index.html
         Docker        : /jellyfin/jellyfin-web/index.html)
     2. Copie jellyfin-effects.js à côté, dans le dossier web/.
     3. Avant la balise </body>, ajoute :
            <script src="jellyfin-effects.js" defer></script>
     4. Vide le cache du navigateur / recharge.

   Méthode B · Extension navigateur (sans toucher au serveur)
     Utilise une extension type "User JavaScript and CSS" / Tampermonkey,
     cible l'URL de ton Jellyfin, et colle ce fichier.

   Le script est sans danger : il se contente d'écouter la souris et le
   scroll, ne stocke rien, et se désactive sur écran tactile.
   ===================================================================== */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CAN_HOVER = window.matchMedia("(hover: hover)").matches;
  var MAX_TILT = 8;          // degrés d'inclinaison max (intensité élevée)
  var LIFT     = 8;          // élévation en px ajoutée par le tilt
  var SCALE    = 1.05;       // léger grossissement

  /* ------------------------------------------------------------------
     1. TILT 3D QUI SUIT LA SOURIS
     Délégation globale : marche même sur les cartes chargées plus tard
     (Jellyfin recharge le contenu en continu).
  ------------------------------------------------------------------ */
  function initTilt() {
    if (REDUCED || !CAN_HOVER) return;
    var current = null;
    var raf = null, nx = 0, ny = 0;

    function apply() {
      raf = null;
      if (!current) return;
      var rect = current.getBoundingClientRect();
      var px = (nx - rect.left) / rect.width  - 0.5;   // -0.5 → 0.5
      var py = (ny - rect.top)  / rect.height - 0.5;
      var rotY =  px * MAX_TILT * 2;
      var rotX = -py * MAX_TILT * 2;
      current.style.transform =
        "perspective(900px) rotateX(" + rotX.toFixed(2) + "deg) rotateY(" +
        rotY.toFixed(2) + "deg) translateY(-" + LIFT + "px) scale(" + SCALE + ")";
    }

    document.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var card = e.target.closest && e.target.closest(".card");
      var scal = card && card.querySelector(".cardScalable");
      if (scal !== current) {
        if (current) resetTilt(current);
        current = scal || null;
        if (current) {
          current.style.transition = "transform .12s ease-out";
          current.style.zIndex = "6";
        }
      }
      if (!current) return;
      nx = e.clientX; ny = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });

    document.addEventListener("pointerleave", function (e) {
      var card = e.target.closest && e.target.closest(".card");
      if (card && current && card.contains(current)) {
        resetTilt(current); current = null;
      }
    }, true);

    function resetTilt(el) {
      el.style.transition = "transform .5s cubic-bezier(.22,1,.36,1)";
      el.style.transform = "";
      el.style.zIndex = "";
    }
  }

  /* ------------------------------------------------------------------
     2. HEADER INTELLIGENT (masqué en descendant, visible en remontant)
     Jellyfin peut scroller via window OU un conteneur interne : on écoute
     en phase de capture pour attraper n'importe quel défilement.
  ------------------------------------------------------------------ */
  function initHeader() {
    var lastY = 0, ticking = false;

    function scrollTop(t) {
      if (t === document || t === window) return window.scrollY || 0;
      return (t && t.scrollTop) || window.scrollY || 0;
    }

    function onScroll(e) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var header = document.querySelector(".skinHeader");
        if (!header) return;
        var y = scrollTop(e.target);
        var goingDown = y > lastY;
        var delta = Math.abs(y - lastY);

        if (y > 12) header.classList.add("jf-header-shrink");
        else header.classList.remove("jf-header-shrink");

        if (delta > 6) {
          if (goingDown && y > 140) header.classList.add("jf-header-hidden");
          else if (!goingDown)      header.classList.remove("jf-header-hidden");
        }
        lastY = y < 0 ? 0 : y;
      });
    }

    document.addEventListener("scroll", onScroll, true);  // capture = tous les scrollers
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------
     3. RÉVÉLATION AU SCROLL — secours pour les navigateurs sans
        support des scroll-driven animations CSS (ex. anciennes versions).
  ------------------------------------------------------------------ */
  function initReveal() {
    if (REDUCED) return;
    if (CSS && CSS.supports && CSS.supports("animation-timeline: view()")) return; // déjà géré en CSS

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.style.transition = "opacity .6s ease, transform .6s cubic-bezier(.22,1,.36,1)";
          en.target.style.opacity = "1";
          en.target.style.transform = "none";
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });

    function watch(el) {
      if (el.__jfWatched) return;
      el.__jfWatched = true;
      el.style.opacity = "0";
      el.style.transform = "translateY(40px)";
      io.observe(el);
    }
    function scan(root) {
      (root.querySelectorAll ? root.querySelectorAll(".verticalSection") : [])
        .forEach(watch);
    }
    scan(document);

    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches(".verticalSection")) watch(n);
          scan(n);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------------ */
  function boot() { initTilt(); initHeader(); initReveal(); }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();

  // Réexpose pour un appel manuel éventuel
  window.JellyfinAuroraEffects = { boot: boot };
})();
