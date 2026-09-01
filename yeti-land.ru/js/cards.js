/* YETI · карточки меню
   Раньше каждая лента (бабл ти, чай, матча, моти…) собиралась своим куском
   кода — десять почти одинаковых копий. Здесь один сборщик на всех.

   YETI.cards.chip(active, dark) — круглая кнопка-«таблетка» (категории,
     фильтры, объёмы, топпинги);
   YETI.cards.strip(items)      — карточки для горизонтальной ленты;
   YETI.cards.decorate(vals, ctx) — добавляет лентам оборот карточки
     (состав и КБЖУ) и обработчик переворота. */
window.YETI = window.YETI || {};

(function () {
  "use strict";

  var C = function () {
    return YETI.config.colors;
  };

  /* ── Кнопки-«таблетки» ──────────────────────────────────────────────── */

  function chip(active, dark) {
    var c = C();
    return (
      "min-height:44px;padding:0 16px;border-radius:999px;cursor:pointer;white-space:nowrap;" +
      "font-family:Unbounded;font-weight:700;font-size:13px;border:2px solid " +
      (dark ? "rgba(255,244,238,0.35)" : c.ink) +
      ";background:" +
      (active ? c.blue : "#fff") +
      ";color:" +
      (active ? "#fff" : c.ink) +
      ";transition:transform .12s ease"
    );
  }

  /* ── Лицевая сторона карточки ───────────────────────────────────────── */

  /** Цена: у напитков с двумя объёмами — «445 / 495 ₽», иначе «270 ₽». */
  function priceLabel(item) {
    return item.price650 ? item.price + " / " + item.price650 + " ₽" : item.price + " ₽";
  }

  var FIG =
    "margin:0;flex:0 0 auto;width:clamp(158px,46vw,230px);background:#fff;" +
    "border:2px solid #0E1A2B;border-radius:22px;overflow:hidden";
  var FRAME =
    "position:relative;aspect-ratio:1/1;border-bottom:2px solid #0E1A2B;" +
    "background:radial-gradient(circle at 50% 42%,#fff 0 28%,#DCEAFF 28% 100%);" +
    "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px";
  var RING =
    "width:86px;height:86px;border-radius:999px;border:5px solid #1580F0;" +
    "box-shadow:0 6px 16px rgba(21,128,240,0.2)";
  var LABEL =
    "font-family:Unbounded;font-weight:700;font-size:11px;letter-spacing:0.06em;" +
    "text-transform:uppercase;opacity:0.5";
  var IMG = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block";
  var CAP = "display:flex;flex-direction:column;align-items:flex-start;gap:0;padding:11px 14px 13px";

  /** Карточки одной ленты. items — уже отфильтрованный список позиций. */
  function strip(items) {
    return items.map(function (d, i) {
      return {
        key: String(i),
        itemId: d.id,
        src: d.photo,
        name: d.name,
        price: priceLabel(d),
        figStyle: FIG,
        frameStyle: FRAME,
        ringStyle: RING,
        labelStyle: LABEL,
        imgStyle: IMG,
        capStyle: CAP,
      };
    });
  }

  /* ── Оборот карточки: состав и КБЖУ ─────────────────────────────────── */

  /** Дополняет все поля вида *Strip оборотом и переворотом по тапу.
      ctx — компонент страницы: хранит, какая карточка сейчас открыта. */
  function decorate(vals, ctx) {
    var ITEMS = YETI.menu.ITEMS;
    var NUTRI = YETI.menu.NUTRI;
    var O = YETI.order;

    /* Кнопки объёма и «в корзину» на обороте карточки. */
    function orderBits(item, id) {
      if (!item) return { volOpts: [], volRowStyle: "display:none", addLabel: "", addStyle: "display:none", add: function () {} };
      var two = O.isDrink(item) && !!item.price650;
      var vol = two ? ctx.vol[id] || "500" : null;
      var opts = two
        ? ["500", "650"].map(function (v) {
            var on = vol === v;
            return {
              key: v,
              label: v + " мл",
              price: YETI.order.base(item, v) + " \u20bd",
              style:
                "flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;" +
                "justify-content:center;gap:0;height:44px;padding:0 6px;border-radius:14px;" +
                "cursor:pointer;color:#EAF2FF;box-sizing:border-box;border:2px solid " +
                (on ? "#1580F0" : "rgba(234,242,255,0.3)") +
                ";background:" + (on ? "#1580F0" : "transparent"),
              labelStyle:
                "font-weight:800;font-size:9px;letter-spacing:0.06em;line-height:1.1;opacity:" +
                (on ? 0.9 : 0.6),
              priceStyle:
                "font-family:Unbounded;font-weight:700;font-size:14px;line-height:1.05;white-space:nowrap",
              pick: function (e) {
                e.stopPropagation();
                ctx.vol[id] = v;
                ctx.forceUpdate();
              },
            };
          })
        : [];
      return {
        volOpts: opts,
        volRowStyle: two ? "display:flex;gap:6px;margin-top:auto;padding-top:10px;align-items:stretch" : "display:none",
        addLabel: "в корзину · " + O.base(item, vol) + " ₽",
        addStyle:
          "flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:100%;" +
          "height:32px;min-height:32px;max-height:32px;margin-top:" + (two ? "6px" : "auto") + ";padding:0 10px;" +
          "border-radius:999px;cursor:pointer;border:2px solid #1580F0;background:#1580F0;" +
          "color:#fff;font-family:Unbounded;font-weight:700;font-size:clamp(10px,2.8vw,11px);" +
          "white-space:nowrap;box-sizing:border-box",
        add: function (e) {
          e.stopPropagation();
          ctx.addToCart(item, vol);
        },
      };
    }

    Object.keys(vals).forEach(function (key) {
      if (!/Strip$/.test(key) || !Array.isArray(vals[key])) return;

      vals[key] = vals[key].map(function (d, i) {
        if (!d || !d.name) return d;

        var item =
          (d.itemId != null
            ? ITEMS.find(function (x) {
                return x.id === d.itemId;
              })
            : null) ||
          ITEMS.find(function (x) {
            return x.name === d.name;
          });
        var n = NUTRI[item ? item.cat : ""] || NUTRI.bubble;
        var id = key + "-" + i;
        var on = ctx.flipped[id];
        var num = function (own, fallback) {
          return item && own != null ? own : fallback;
        };

        return Object.assign({}, d, {
          cardId: id,
          slotStyle:
            "flex:0 0 auto;width:clamp(158px,46vw,230px);aspect-ratio:230/318;perspective:1200px",
          innerStyle:
            "position:relative;width:100%;height:100%;cursor:pointer;touch-action:manipulation;" +
            "transform-style:preserve-3d;transition:transform .26s cubic-bezier(.3,.8,.3,1);will-change:transform;" +
            "transform:rotateY(" + (on ? 180 : 0) + "deg)",
          figStyle:
            (d.figStyle || "").replace(
              /^margin:0;flex:0 0 auto;width:[^;]+;/,
              "margin:0;position:absolute;inset:0;display:flex;flex-direction:column;"
            ) + ";backface-visibility:hidden;-webkit-backface-visibility:hidden",
          backStyle:
            "position:absolute;inset:0;display:flex;flex-direction:column;padding:13px 12px;" +
            "background:#0E1A2B;color:#EAF2FF;border:2px solid #0E1A2B;border-radius:22px;" +
            "overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;" +
            "transform:rotateY(180deg)",
          badgeStyle:
            "position:absolute;right:8px;bottom:8px;display:inline-flex;align-items:center;" +
            "justify-content:center;width:26px;height:26px;border-radius:999px;background:#1580F0;" +
            "color:#fff;font-family:Unbounded;font-weight:700;font-size:12px;line-height:1",
          composition: item && item.desc ? item.desc : "Состав уточняется",
          volLabel: n.vol,
          nutrients: [
            { key: "kcal", val: String(num(item && item.kcal, n.kcal)), label: "ккал" },
            { key: "p", val: num(item && item.prot, n.p) + " г", label: "белки" },
            { key: "f", val: num(item && item.fat, n.f) + " г", label: "жиры" },
            { key: "c", val: num(item && item.carb, n.c) + " г", label: "углев." },
          ],
          flip: function (e) {
            var el = e.currentTarget;
            tapGuard(ctx, e, function () {
              flipCard(ctx, id, el);
            });
          },
          stop: function (e) {
            e.stopPropagation();
          },
        }, orderBits(item, id));
      });
    });
    return vals;
  }

  /** Убирает переворот со всех карточек и снимает паузу с автопрокрутки. */
  function closeAll(ctx) {
    ctx.flipped = {};
    clearTimeout(ctx._flipT);
    document.querySelectorAll('[data-flip="1"]').forEach(function (el) {
      el.removeAttribute("data-flip");
      el.style.setProperty("transform", "rotateY(0deg)", "important");
    });
    ctx._flipEl = null;
    ctx._flipId = null;
    document.querySelectorAll("[data-strip]").forEach(function (r) {
      if (r.parentElement) r.parentElement.dataset.hold = "0";
    });
  }

  /** Переворачивает карточку и подводит её к центру ленты. */
  function flipCard(ctx, id, inner) {
    if (ctx.flipped[id]) {
      closeAll(ctx);
      return;
    }
    ctx.flipped = {};
    ctx.flipped[id] = true;

    var row = inner.closest("[data-strip]");
    if (row) {
      var box = row.parentElement;
      var card = inner.parentElement;
      /* Пока карточка открыта, лента не уезжает сама. */
      if (box) box.dataset.hold = String(performance.now() + 3600000);
      if (box && card) {
        var target = card.offsetLeft - (box.clientWidth - card.offsetWidth) / 2;
        var max = box.scrollWidth - box.clientWidth;
        box.scrollTo({ left: Math.max(0, Math.min(max, target)), behavior: "smooth" });
      }
    }

    document.querySelectorAll('[data-flip="1"]').forEach(function (el) {
      el.removeAttribute("data-flip");
      el.style.setProperty("transform", "rotateY(0deg)", "important");
    });
    inner.setAttribute("data-flip", "1");
    inner.style.setProperty("transform", "rotateY(180deg)", "important");
    ctx._flipId = inner.getAttribute("data-cardid");
    ctx._flipEl = inner;
    clearTimeout(ctx._flipT);
  }

  /** Тап, а не протяжка: pointerdown запоминает точку, click решает.
      Браузер сам не шлёт click после листания, поэтому проверка мягкая:
      отсекаем только явную протяжку мышью. */
  /** Мгновенный тап: переворачиваем сразу на нажатии. Если палец после этого
      уехал больше чем на 12px — значит человек листает, и мы возвращаем
      карточку обратно. pointerup и click уже ничего не делают. */
  function tapGuard(ctx, e, run) {
    if (e.type !== "pointerdown") return;
    var sx = e.clientX;
    var sy = e.clientY;
    var undone = false;
    run();

    var cleanup = function () {
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", cleanup, true);
      window.removeEventListener("pointercancel", cancel, true);
    };
    var cancel = function () {
      if (!undone) {
        undone = true;
        run();
      }
      cleanup();
    };
    var move = function (ev) {
      if (undone) return;
      if (Math.abs(ev.clientX - sx) > 12 || Math.abs(ev.clientY - sy) > 12) cancel();
    };

    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", cleanup, true);
    window.addEventListener("pointercancel", cancel, true);
  }

  YETI.cards = { chip: chip, strip: strip, decorate: decorate, priceLabel: priceLabel, tapGuard: tapGuard };
})();
