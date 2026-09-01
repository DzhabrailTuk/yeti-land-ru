/* YETI · заказ с самовывозом
   Корзина, оформление, код выдачи. Хранится в браузере гостя (localStorage),
   так что заказ не теряется при обновлении страницы.

   YETI.order.* — чистые функции без DOM: их вызывает логика страницы.
   Правки цен и позиций — в data/menu.js, точки — в data/points.js. */
window.YETI = window.YETI || {};

(function () {
  "use strict";

  var KEY = "yeti-cart-v2";
  var PICK = "yeti-point-v1";

  /* ── Допы к напитку ─────────────────────────────────────────────────────
     Выбираются в корзине. Цена прибавляется к позиции. */
  var EXTRAS = [
    { id: "tapioca", label: "тапиока", price: 60 },
    { id: "popping", label: "попинг-боба", price: 70 },
    { id: "jelly", label: "желе", price: 50 },
    { id: "cheese", label: "чиз-крем", price: 80 },
  ];

  /* Категории, у которых есть объёмы и допы (еда — без них). */
  var DRINKS = ["bubble", "tea", "matcha", "cheese", "icecoffee", "colddrink", "coffee", "lemon"];

  function isDrink(item) {
    return item && DRINKS.indexOf(item.cat) >= 0;
  }

  /* ── Цены ───────────────────────────────────────────────────────────── */

  /** Цена позиции за выбранный объём. */
  function base(item, vol) {
    if (!item) return 0;
    return vol === "650" && item.price650 ? item.price650 : item.price;
  }

  function extrasSum(ids) {
    return (ids || []).reduce(function (a, id) {
      var e = EXTRAS.find(function (x) {
        return x.id === id;
      });
      return a + (e ? e.price : 0);
    }, 0);
  }

  function lineSum(line) {
    return (line.price + extrasSum(line.extras)) * line.qty;
  }

  function total(cart) {
    return cart.reduce(function (a, l) {
      return a + lineSum(l);
    }, 0);
  }

  function count(cart) {
    return cart.reduce(function (a, l) {
      return a + l.qty;
    }, 0);
  }

  function money(n) {
    return n + " ₽";
  }

  /* ── Корзина ────────────────────────────────────────────────────────── */

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  function save(cart) {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch (e) {}
  }

  function loadPoint(points) {
    try {
      var id = Number(localStorage.getItem(PICK));
      return (
        points.find(function (p) {
          return p.id === id;
        }) || null
      );
    } catch (e) {
      return null;
    }
  }

  function savePoint(p) {
    try {
      if (p) localStorage.setItem(PICK, String(p.id));
      else localStorage.removeItem(PICK);
    } catch (e) {}
  }

  /** Добавляет позицию. Одинаковые (позиция + объём + допы) складываются. */
  function add(cart, item, vol) {
    var v = isDrink(item) && item.price650 ? vol || "500" : null;
    var key = item.id + "|" + (v || "-") + "|";
    var same = cart.find(function (l) {
      return l.key === key;
    });
    if (same) {
      same.qty += 1;
      return cart.slice();
    }
    return cart.concat({
      key: key,
      id: item.id,
      name: item.name,
      photo: item.photo || "",
      vol: v,
      price: base(item, v),
      qty: 1,
      extras: [],
      drink: isDrink(item),
    });
  }

  function bump(cart, key, delta) {
    return cart
      .map(function (l) {
        return l.key === key ? Object.assign({}, l, { qty: l.qty + delta }) : l;
      })
      .filter(function (l) {
        return l.qty > 0;
      });
  }

  function drop(cart, key) {
    return cart.filter(function (l) {
      return l.key !== key;
    });
  }

  /** Включает/выключает доп у позиции. Ключ пересобирается, чтобы
      одинаковые наборы складывались, а разные жили отдельно. */
  function toggleExtra(cart, key, extraId) {
    return cart.map(function (l) {
      if (l.key !== key) return l;
      var has = l.extras.indexOf(extraId) >= 0;
      var next = has
        ? l.extras.filter(function (x) {
            return x !== extraId;
          })
        : l.extras.concat(extraId);
      next.sort();
      return Object.assign({}, l, { extras: next, key: l.id + "|" + (l.vol || "-") + "|" + next.join(",") });
    });
  }

  /** Меняет объём у позиции корзины и пересчитывает цену. */
  function setVol(cart, key, vol, items) {
    return cart.map(function (l) {
      if (l.key !== key) return l;
      var item = items.find(function (x) {
        return x.id === l.id;
      });
      return Object.assign({}, l, {
        vol: vol,
        price: base(item, vol),
        key: l.id + "|" + vol + "|" + l.extras.join(","),
      });
    });
  }

  /* ── Время по Самаре ────────────────────────────────────────────────── */

  /** Минуты с начала суток в Самаре (UTC+4) — не по часам телефона гостя. */
  function samaraMinutes() {
    var now = new Date();
    var utc = now.getTime() + now.getTimezoneOffset() * 60000;
    var sam = new Date(utc + 4 * 3600000);
    return sam.getHours() * 60 + sam.getMinutes();
  }

  function hhmm(m) {
    m = ((m % 1440) + 1440) % 1440;
    return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  }

  function mins(hm) {
    var a = hm.split(":");
    return Number(a[0]) * 60 + Number(a[1]);
  }

  /** Часы работы точки в минутах. Закрытие после полуночи считается как +24ч. */
  function hoursOf(p) {
    var a = (p.hours || "10:00–22:00").split("–");
    var open = mins(a[0]);
    var close = mins(a[1]);
    if (close <= open) close += 1440;
    return { open: open, close: close };
  }

  /** «открыто» / «закроется через 40 мин» / «закрыто». */
  function pointState(p) {
    var h = hoursOf(p);
    var cur = samaraMinutes();
    if (cur < h.open) cur += 1440;
    if (cur < h.open || cur >= h.close) return { key: "closed", label: "закрыто" };
    var left = h.close - cur;
    if (left <= 60) return { key: "soon", label: "закроется через " + left + " мин" };
    return { key: "open", label: "открыто до " + hhmm(h.close) };
  }

  /** Слоты по 10 минут: от «сейчас + 20 мин» до закрытия точки. */
  function slots(p) {
    var h = hoursOf(p);
    var t = samaraMinutes() + 20;
    if (t < h.open) t = h.open;
    t = Math.ceil(t / 10) * 10;
    var out = [];
    for (; t <= h.close - 10 && out.length < 40; t += 10) out.push(t);
    return out;
  }

  /** «~15 мин» — ближайшая готовность. */
  function asapLabel() {
    return hhmm(samaraMinutes() + 15);
  }

  /* ── Оформление ─────────────────────────────────────────────────────── */

  /* Пароль для кассы: слово + две цифры. Слово проще произнести вслух в шуме,
     цифры разводят одинаковые слова в один день. Слова короткие и «вкусные». */
  var WORDS = [
    "МАНГО", "ТАРО", "КОКОС", "ЛАЙМ", "МАТЧА", "ВИШНЯ", "ДЫНЯ", "ПЛОМБИР",
    "ЛИЧИ", "МАЛИНА", "БАНАН", "АРБУЗ", "ФИСТАШКА", "КАРАМЕЛЬ",
  ];

  function code() {
    var w = WORDS[Math.floor(Math.random() * WORDS.length)];
    return w + " " + String(10 + Math.floor(Math.random() * 90));
  }

  var PAYS = [
    { id: "sbp", label: "СБП", note: "по QR из приложения банка" },
    { id: "card", label: "Карта", note: "Мир, Visa, Mastercard" },
  ];

  /* ── Телефон ────────────────────────────────────────────────────────────
     В поле телефона живут только цифры: буквы, пробелы и любые другие знаки
     туда не попадают. Скобки, дефисы и «+7» рисует маска — гость их не
     набирает. */

  /** Оставляет от строки только цифры. */
  function digits(v) {
    return String(v == null ? "" : v).replace(/\D/g, "");
  }

  /** Ввод телефона → «+7 (996) 884-08-08».
      prev — что было в поле до нажатия клавиши: нужно, чтобы backspace по
      скобке или дефису стирал цифру, а не залипал на месте. */
  function phoneMask(next, prev) {
    var d = digits(next);
    if (prev != null && String(next).length < String(prev).length && d === digits(prev))
      d = d.slice(0, -1);
    if (!d) return "";
    if (d.charAt(0) === "8") d = "7" + d.slice(1);
    else if (d.charAt(0) !== "7") d = "7" + d;
    d = d.slice(0, 11);

    var rest = d.slice(1);
    var out = "+7";
    if (rest) out += " (" + rest.slice(0, 3);
    if (rest.length >= 3) out += ")";
    if (rest.length > 3) out += " " + rest.slice(3, 6);
    if (rest.length > 6) out += "-" + rest.slice(6, 8);
    if (rest.length > 8) out += "-" + rest.slice(8, 10);
    return out;
  }

  /** Номер набран целиком: 11 цифр российского формата. */
  function phoneOk(v) {
    var d = digits(v);
    return d.length === 11 && d.charAt(0) === "7";
  }

  /** Номер для кассы и SMS, без украшений: 79968840808. */
  function phoneRaw(v) {
    return digits(v).slice(0, 11);
  }

  function emailOk(v) {
    return /^[^\s@]+@[^\s@]+\.[a-zа-я]{2,}$/i.test((v || "").trim());
  }

  YETI.order = {
    EXTRAS: EXTRAS,
    PAYS: PAYS,
    isDrink: isDrink,
    base: base,
    extrasSum: extrasSum,
    lineSum: lineSum,
    total: total,
    count: count,
    money: money,
    load: load,
    save: save,
    loadPoint: loadPoint,
    savePoint: savePoint,
    add: add,
    bump: bump,
    drop: drop,
    toggleExtra: toggleExtra,
    setVol: setVol,
    samaraMinutes: samaraMinutes,
    hhmm: hhmm,
    pointState: pointState,
    slots: slots,
    asapLabel: asapLabel,
    code: code,
    digits: digits,
    phoneMask: phoneMask,
    phoneOk: phoneOk,
    phoneRaw: phoneRaw,
    emailOk: emailOk,
  };
})();
