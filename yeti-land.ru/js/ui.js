/* YETI · поведение страницы
   Плавная прокрутка, горизонтальные ленты, подсветка меню, подгрузка фото.
   Ничего специфичного для меню тут нет — только работа с DOM.

   ctx — компонент страницы (в нём живут таймеры и флаги). */
window.YETI = window.YETI || {};

(function () {
  "use strict";

  var HEADER = 72; /* высота липкой шапки */

  /* ── Прокрутка ──────────────────────────────────────────────────────── */

  /** Плавно прокручивает к элементу или к абсолютной координате. */
  function smoothScrollTo(ctx, target, dur) {
    var start = window.scrollY;
    var end =
      typeof target === "number"
        ? Math.max(0, target)
        : Math.max(0, target.getBoundingClientRect().top + start - HEADER);
    var dist = end - start;
    if (Math.abs(dist) < 2) return;

    dur = dur || Math.min(1250, Math.max(520, Math.abs(dist) * 0.55));
    var token = (ctx._scrollId = (ctx._scrollId || 0) + 1);
    var ease = function (t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    var t0 = null;
    var step = function (ts) {
      if (token !== ctx._scrollId) return;
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      window.scrollTo(0, start + dist * ease(p));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ── Горизонтальные ленты с карточками ──────────────────────────────── */

  /** Ленты медленно едут сами, пока их не трогают. */
  function autoLoop(ctx) {
    if (ctx._auto) return;
    ctx._auto = true;

    var last = performance.now();
    var tick = function (now) {
      var dt = Math.min(48, now - last);
      last = now;
      document.querySelectorAll("[data-strip]").forEach(function (row) {
        var box = row.parentElement;
        if (!box || box.offsetParent === null) return;
        if (+(box.dataset.hold || 0) > now) return;
        var max = box.scrollWidth - box.clientWidth;
        if (max <= 2) return;

        var dir = box.dataset.dir === "-1" ? -1 : 1;
        var acc = box._acc;
        if (acc == null || Math.abs(acc - box.scrollLeft) > 4) acc = box.scrollLeft;
        acc += dir * dt * 0.022;
        if (acc >= max - 0.5) {
          acc = max;
          box.dataset.dir = "-1";
        } else if (acc <= 0.5) {
          acc = 0;
          box.dataset.dir = "1";
        }
        box._acc = acc;
        box.scrollLeft = acc;
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /** Ленту можно тащить мышкой и крутить колесом. */
  function initStrips() {
    document.querySelectorAll("[data-strip]").forEach(function (row) {
      var box = row.parentElement;
      if (!box || box.dataset.swipe) return;
      box.dataset.swipe = "1";
      box.style.cursor = "grab";
      box.style.touchAction = "pan-x";

      var down = false;
      var x0 = 0;
      var s0 = 0;
      /* Пока человек листает сам, автопрокрутка молчит. */
      var hold = function () {
        box.dataset.hold = String(performance.now() + 6000);
      };

      box.addEventListener("wheel", hold, { passive: true });
      box.addEventListener("touchstart", hold, { passive: true });
      box.addEventListener("pointerdown", function (e) {
        down = true;
        hold();
        x0 = e.clientX;
        s0 = box.scrollLeft;
        box.style.cursor = "grabbing";
      });
      box.addEventListener("pointermove", function (e) {
        if (!down) return;
        hold();
        box.scrollLeft = s0 - (e.clientX - x0) * 1.4;
      });

      var up = function () {
        down = false;
        box.style.cursor = "grab";
      };
      box.addEventListener("pointerup", up);
      box.addEventListener("pointercancel", up);
      box.addEventListener("pointerleave", up);
      box.addEventListener(
        "wheel",
        function (e) {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
          hold();
          box.scrollLeft += e.deltaY;
          e.preventDefault();
        },
        { passive: false }
      );
    });
  }

  /* ── Карусель категорий ─────────────────────────────────────────────── */

  function initCatRail() {
    var rail = document.querySelector("[data-catrail]");
    if (!rail || rail.dataset.ready) return;
    rail.dataset.ready = "1";

    var down = false;
    var moved = 0;
    var x0 = 0;
    var s0 = 0;

    rail.style.userSelect = "none";
    rail.querySelectorAll("a").forEach(function (a) {
      a.draggable = false;
    });
    rail.addEventListener("dragstart", function (e) {
      e.preventDefault();
    });
    rail.addEventListener("pointerdown", function (e) {
      down = true;
      moved = 0;
      x0 = e.clientX;
      s0 = rail.scrollLeft;
      rail.style.cursor = "grabbing";
      rail.style.scrollSnapType = "none";
    });
    rail.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - x0;
      if (Math.abs(dx) > 4) {
        moved = Math.abs(dx);
        if (rail.setPointerCapture && e.pointerType === "mouse") {
          try {
            rail.setPointerCapture(e.pointerId);
          } catch (err) {}
        }
        rail.scrollLeft = s0 - dx;
        e.preventDefault();
      }
    });

    var up = function () {
      down = false;
      rail.style.cursor = "grab";
      rail.style.scrollSnapType = "x proximity";
      setTimeout(function () {
        moved = 0;
      }, 60);
    };
    rail.addEventListener("pointerup", up);
    rail.addEventListener("pointercancel", up);
    rail.addEventListener("pointerleave", up);
    /* Если карусель тащили — клик по категории не считается. */
    rail.addEventListener(
      "click",
      function (e) {
        if (moved > 6) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );
    rail.addEventListener(
      "wheel",
      function (e) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        rail.scrollLeft += e.deltaY;
        e.preventDefault();
      },
      { passive: false }
    );
  }

  /** Подводит выбранную категорию к центру карусели. */
  function centerCat(sec) {
    var rail = document.querySelector("[data-catrail]");
    if (!rail) return;
    var a = rail.querySelector('a[href="#' + sec + '"]');
    if (!a) return;

    var ar = a.getBoundingClientRect();
    var rr = rail.getBoundingClientRect();
    var from = rail.scrollLeft;
    var dist = ar.left + ar.width / 2 - (rr.left + rr.width / 2);
    if (Math.abs(dist) < 2) return;

    var dur = 560;
    var t0 = performance.now();
    var ease = function (t) {
      return 1 - Math.pow(1 - t, 3);
    };
    var step = function (now) {
      var p = Math.min(1, (now - t0) / dur);
      rail.scrollLeft = from + dist * ease(p);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ── Фотографии ─────────────────────────────────────────────────────── */

  /** Заранее скачивает фото категории, чтобы лента открылась без пустот. */
  function warmCat(ctx, cat) {
    ctx._warm = ctx._warm || {};
    if (ctx._warm[cat]) return;
    ctx._warm[cat] = 1;
    YETI.menu.ITEMS.filter(function (x) {
      return x.cat === cat && x.photo;
    }).forEach(function (x) {
      var im = new Image();
      im.fetchPriority = "high";
      im.decoding = "async";
      im.src = x.photo;
    });
  }

  /** Подставляет настоящий src вместо прозрачной заглушки. */
  function hydrateImgs() {
    document.querySelectorAll("img[data-src]").forEach(function (img) {
      var real = img.getAttribute("data-src");
      if (!real || real.includes("{{")) return;
      if (img.getAttribute("src") === real) return;
      if (img.offsetParent === null && !img.closest("#pick")) return;
      img.setAttribute("src", real);
    });
  }

  /* ── Появление блоков и подсветка меню ──────────────────────────────── */

  /** Заголовки и карточки выезжают снизу, когда попадают в экран. */
  function revealOnScroll() {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.style.opacity = "1";
          en.target.style.transform = "none";
          io.unobserve(en.target);
        });
      },
      { rootMargin: "-8% 0px -12% 0px", threshold: 0.05 }
    );

    var revealed = [];
    document
      .querySelectorAll("section > h2, section > p, #new article, #pick a, footer > div > div")
      .forEach(function (el, i) {
        revealed.push(el);
        el.style.opacity = "0";
        el.style.transform = "translate3d(0,26px,0)";
        el.style.transition =
          "opacity .62s cubic-bezier(.22,.8,.24,1) " + (i % 6) * 55 + "ms, " +
          "transform .62s cubic-bezier(.22,.8,.24,1) " + (i % 6) * 55 + "ms";
        el.style.willChange = "opacity, transform";
        io.observe(el);
      });

    /* Страховка: если наблюдатель не сработал, всё равно показываем блоки. */
    setTimeout(function () {
      revealed.forEach(function (el) {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    }, 1400);
  }

  /** Подсвечивает в шапке пункт, до которого долистали. */
  function navSpy() {
    var links = Array.from(document.querySelectorAll("[data-navlink]"));
    var colors = YETI.config.colors;
    var spy = function () {
      var y = window.scrollY + 120;
      var cur = links[0];
      links.forEach(function (a) {
        var el = document.getElementById(a.dataset.navlink);
        if (el && el.offsetParent !== null && window.scrollY + el.getBoundingClientRect().top <= y) {
          cur = a;
        }
      });
      links.forEach(function (a) {
        var on = a === cur;
        a.style.background = on ? colors.blue : "#fff";
        a.style.color = on ? "#fff" : colors.ink;
      });
    };
    spy();
    window.addEventListener("scroll", spy, { passive: true });
    window.addEventListener("resize", spy);
  }

  YETI.ui = {
    smoothScrollTo: smoothScrollTo,
    autoLoop: autoLoop,
    initStrips: initStrips,
    initCatRail: initCatRail,
    centerCat: centerCat,
    warmCat: warmCat,
    hydrateImgs: hydrateImgs,
    revealOnScroll: revealOnScroll,
    navSpy: navSpy,
  };
})();
