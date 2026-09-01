/* YETI · касса: онлайн-оплата и электронный чек по 54-ФЗ

   Здесь только браузерная половина. Секретный ключ кассы в браузер не попадает
   никогда — он живёт на сервере хостинга. Схема такая:

     сайт → свой сервер (createUrl) → касса → страница оплаты банка
     банк → гость возвращается на сайт (?paid=…)
     касса → свой сервер (вебхук) → заказ отмечен оплаченным

   Сервер обязан пересчитать сумму сам, по своей копии меню: всё, что пришло
   из браузера, гость может подделать. Поэтому вместе с чеком отправляем
   состав корзины (id, объём, допы, количество) — по нему и считать.

   Настройки — в js/config.js → YETI.config.kassa.
   Пока provider = "off", сайт работает как раньше: заказ оформляется,
   деньги не списываются. Что нужно для включения — см. KASSA.md. */
window.YETI = window.YETI || {};

(function () {
  "use strict";

  /* Заказ, который ждёт возврата из банка. Переживает переход на страницу
     оплаты и обратно — иначе после возврата нечего было бы показать. */
  var PEND = "yeti-pay-v1";

  function cfg() {
    return (window.YETI.config && window.YETI.config.kassa) || {};
  }

  /** Подключена ли настоящая касса. */
  function on() {
    var p = cfg().provider;
    return !!p && p !== "off";
  }

  /* ── Ожидающий заказ ─────────────────────────────────────────────────── */

  function remember(order) {
    try {
      localStorage.setItem(PEND, JSON.stringify(order));
    } catch (e) {}
  }

  function recall() {
    try {
      return JSON.parse(localStorage.getItem(PEND)) || null;
    } catch (e) {
      return null;
    }
  }

  function forget() {
    try {
      localStorage.removeItem(PEND);
    } catch (e) {}
  }

  /* ── Чек ─────────────────────────────────────────────────────────────── */

  /** Позиции чека по 54-ФЗ: строка корзины = позиция, цена за одну штуку. */
  function receipt(order) {
    var O = window.YETI.order;
    var c = cfg();
    return {
      customer: {
        email: order.mail,
        phone: order.phone ? "+" + order.phone : "",
      },
      items: order.cart.map(function (l) {
        var extras = (l.extras || []).map(function (id) {
          var e = O.EXTRAS.find(function (x) {
            return x.id === id;
          });
          return e ? e.label : id;
        });
        var title =
          l.name +
          (l.vol ? " " + l.vol + " мл" : "") +
          (extras.length ? " + " + extras.join(", ") : "");
        return {
          description: title.slice(0, 128),
          quantity: l.qty,
          amount: {
            value: (l.price + O.extrasSum(l.extras)).toFixed(2),
            currency: c.currency || "RUB",
          },
          vat_code: c.vat || 1,
          payment_subject: "commodity",
          payment_mode: "full_payment",
        };
      }),
    };
  }

  /** Адрес, куда банк вернёт гостя после оплаты. */
  function returnUrl(orderId) {
    var base = cfg().returnUrl || location.origin + location.pathname;
    return base + (base.indexOf("?") >= 0 ? "&" : "?") + "paid=" + encodeURIComponent(orderId);
  }

  /** Что уходит на свой сервер. Денег и ключей здесь нет — только заказ. */
  function payload(order) {
    var c = cfg();
    return {
      provider: c.provider,
      orderId: order.id,
      /* Сумма — для сверки. Считать заново на сервере, по составу ниже. */
      amount: { value: order.sum.toFixed(2), currency: c.currency || "RUB" },
      method: order.pay /* "sbp" | "card" */,
      returnUrl: returnUrl(order.id),
      description: ("YETI · " + order.code + " · " + order.point.name).slice(0, 128),
      cart: order.cart.map(function (l) {
        return { id: l.id, vol: l.vol, qty: l.qty, extras: l.extras || [] };
      }),
      pickup: {
        pointId: order.point.id,
        point: order.point.name,
        address: order.point.address,
        time: order.time,
        code: order.code,
      },
      guest: { name: order.name, phone: order.phone, email: order.mail },
      comment: order.comment || "",
      receipt: receipt(order),
    };
  }

  /* ── Оплата ──────────────────────────────────────────────────────────── */

  /** Создаёт платёж на своём сервере и уводит гостя на страницу банка.
      Ответ сервера: { id, url } — url это ссылка оплаты от кассы. */
  function start(order) {
    var url = cfg().createUrl;
    if (!url) return Promise.reject(new Error("не указан адрес кассы"));
    return fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload(order)),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("касса ответила " + r.status);
        return r.json();
      })
      .then(function (data) {
        var pay = data && (data.url || data.confirmationUrl || data.confirmation_url);
        if (!pay) throw new Error("касса не дала ссылку на оплату");
        remember({ order: order, id: data.id || order.id });
        location.assign(pay);
        return pay;
      });
  }

  /** Гость вернулся из банка? Возвращает отложенный заказ или null.
      Сам факт возврата ничего не доказывает — адрес можно открыть руками,
      поэтому оплату подтверждает check() на своём сервере. */
  function returned() {
    var q = new URLSearchParams(location.search);
    if (!q.has("paid")) return null;
    var flag = q.get("paid");
    var pend = recall();
    forget();
    clean(q);
    if (!pend) return null;
    return { ok: flag !== "fail" && flag !== "0", id: pend.id, order: pend.order };
  }

  /** Убирает ?paid=… из адресной строки, чтобы обновление не повторяло экран. */
  function clean(q) {
    if (!history.replaceState) return;
    q.delete("paid");
    var rest = q.toString();
    history.replaceState(null, "", location.pathname + (rest ? "?" + rest : "") + location.hash);
  }

  /** Спрашивает свой сервер, прошла ли оплата: { paid: true }.
      Без statusUrl в настройках проверять нечем — верим возврату из банка. */
  function check(id) {
    var url = cfg().statusUrl;
    if (!url || !id) return Promise.resolve(true);
    return fetch(url + (url.indexOf("?") >= 0 ? "&" : "?") + "id=" + encodeURIComponent(id))
      .then(function (r) {
        return r.ok ? r.json() : { paid: false };
      })
      .then(function (d) {
        return !!(d && d.paid);
      })
      .catch(function () {
        return false;
      });
  }

  YETI.pay = {
    on: on,
    receipt: receipt,
    payload: payload,
    start: start,
    returned: returned,
    check: check,
  };
})();
