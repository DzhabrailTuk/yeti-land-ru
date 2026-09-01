/* YETI · карта точек с фирменными пинами
   Пин — синяя капля с толстой обводкой, в кружке наверху логотип йети.

   Как это устроено. Обычные метки (ymaps.Placemark) Яндекс рисует только
   сайтам с ключом JS API — без ключа они молча не появляются. Поэтому пины
   мы рисуем сами: обычные <div> с нашей вёрсткой кладём в слой карты
   («overlaps»), а координаты пересчитываем проекцией карты. Слой двигается
   вместе с картой сам, поэтому пины держатся за свои места при перетаскивании
   и зуме. Ключ при этом не нужен, но с ключом всё работает так же — просто
   без предупреждения в консоли браузера.

   Движок карты выбирается в js/config.js → map.provider:
     "yandex" (по умолчанию) — тайлы Яндекс.Карт + наши пины;
     "osm"    — тайлы OpenStreetMap через Leaflet + наши пины
                (запасной вариант, если Яндекс где-то недоступен);
     "widget" — обычный виджет Яндекса в <iframe>: стандартные метки-капли,
                свои пины невозможны. Сюда же уходим, если движок не поднялся.

   Страница вызывает только это:
     YETI.map.sync({ host, points, selected, onSelect })
   host      — пустой <div>, куда встанет карта;
   points    — список из data/points.js;
   selected  — выбранная точка или null («все точки»);
   onSelect  — вызывается, когда кликнули по пину. */
window.YETI = window.YETI || {};

(function () {
  "use strict";

  /* Капля пина: круг сверху, остриё внизу по центру. */
  var PIN_PATH =
    "M23 56.5C23 56.5 43.5 33 43.5 22A20.5 20.5 0 1 0 2.5 22C2.5 33 23 56.5 23 56.5Z";
  var PIN_W = 46;
  var PIN_H = 58;

  /* Сколько ждём появления пинов, прежде чем уйти на виджет. */
  var PINS_TIMEOUT = 2500;

  var instances = new WeakMap();
  var loaders = {};

  function cfg() {
    return YETI.config.map;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch];
    });
  }

  /** Один раз подгружает внешний скрипт (и стили к нему, если нужны). */
  function loadOnce(name, src, cssHref) {
    if (loaders[name]) return loaders[name];
    loaders[name] = new Promise(function (resolve, reject) {
      if (cssHref) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = cssHref;
        document.head.appendChild(link);
      }
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        reject(new Error("не удалось загрузить " + name));
      };
      document.head.appendChild(s);
    });
    return loaders[name];
  }

  /* ── Ссылки на Яндекс.Карты ─────────────────────────────────────────── */

  function pointMarks(points) {
    return points
      .map(function (p) {
        return p.lon + "," + p.lat + ",pm2blm";
      })
      .join("~");
  }

  /** Куда ведёт кнопка «открыть в Яндекс.Картах». */
  function externalLink(points, selected) {
    if (selected && selected.orgId) {
      return "https://yandex.ru/maps/org/yeti/" + selected.orgId + "/";
    }
    var c = cfg();
    var ll = selected ? selected.lon + "," + selected.lat : c.center[1] + "," + c.center[0];
    var z = selected ? c.pointZoom : c.zoom;
    return "https://yandex.ru/maps/?ll=" + ll + "&z=" + z + "&pt=" + pointMarks(points) + "&l=map";
  }

  /** Адрес виджета — запасной вариант, когда своих пинов нарисовать нельзя. */
  function widgetLink(points, selected) {
    var c = cfg();
    var ll = selected ? selected.lon + "," + selected.lat : c.center[1] + "," + c.center[0];
    var z = selected ? c.pointZoom : c.zoom;
    return (
      "https://yandex.ru/map-widget/v1/?ll=" + ll + "&z=" + z +
      "&pt=" + pointMarks(points) + "&l=map&lang=" + c.lang
    );
  }

  /* ── Пин ────────────────────────────────────────────────────────────── */

  function pinHtml(point) {
    return (
      '<div class="yeti-pin" data-point="' + esc(point.id) + '" data-active="0">' +
      '<svg class="yeti-pin__body" viewBox="0 0 ' + PIN_W + " " + PIN_H + '" aria-hidden="true">' +
      '<path class="yeti-pin__shape" d="' + PIN_PATH + '"/>' +
      "</svg>" +
      '<span class="yeti-pin__logo"><img src="' + esc(YETI.config.pinLogo) + '" alt="" /></span>' +
      '<span class="yeti-pin__label">' + esc(point.name) + "</span>" +
      "</div>"
    );
  }

  /** Обёртка пина: её left/top — это остриё капли, то есть само место. */
  function pinSlot(point, onSelect) {
    var slot = document.createElement("div");
    slot.className = "yeti-pin-slot";
    slot.title = point.name + " · " + point.address;
    slot.innerHTML = pinHtml(point);
    slot.addEventListener("click", function (e) {
      e.stopPropagation();
      if (onSelect) onSelect(point);
    });
    return slot;
  }

  /* ── Движок 1: Яндекс.Карты ─────────────────────────────────────────── */

  var yandex = {
    load: function () {
      if (window.ymaps && window.ymaps.Map) return Promise.resolve();
      var c = cfg();
      var params = ["lang=" + c.lang];
      if (c.apiKey) params.push("apikey=" + encodeURIComponent(c.apiKey));
      return loadOnce("yandex", "https://api-maps.yandex.ru/2.1/?" + params.join("&")).then(
        function () {
          return new Promise(function (resolve) {
            window.ymaps.ready(resolve);
          });
        }
      );
    },

    create: function (host, points, onSelect, nodes) {
      var c = cfg();
      var map = new ymaps.Map(
        host,
        { center: c.center, zoom: c.zoom, controls: ["zoomControl", "geolocationControl"] },
        { suppressMapOpenBlock: true }
      );

      /* Колесо мыши над картой меняет масштаб; страница при этом стоит. */
      if (c.scrollZoom) map.behaviors.enable("scrollZoom");
      else map.behaviors.disable("scrollZoom");

      /* Слой пинов внутри карты — он ездит и масштабируется вместе с тайлами. */
      var pane = map.panes.get("overlaps");
      var layer = document.createElement("div");
      layer.className = "yeti-pins";
      pane.getElement().appendChild(layer);

      var slots = points.map(function (p) {
        var slot = pinSlot(p, onSelect);
        layer.appendChild(slot);
        nodes.set(p.id, slot.querySelector(".yeti-pin"));
        return { point: p, el: slot };
      });

      /* Пересчитать пиксельные позиции пинов под текущий вид карты. */
      function place() {
        var projection = map.options.get("projection");
        var zoom = pane.getZoom();
        slots.forEach(function (s) {
          var xy = pane.toClientPixels(
            projection.toGlobalPixels([s.point.lat, s.point.lon], zoom)
          );
          s.el.style.left = xy[0] + "px";
          s.el.style.top = xy[1] + "px";
        });
      }

      place();
      /* Карта сдвигает слой сама; нам остаётся ловить смену системы координат. */
      pane.events.add(["clientpixelschange", "actionend"], place);
      map.events.add(["sizechange", "boundschange"], place);

      return {
        destroy: function () {
          layer.remove();
          map.destroy();
        },
        /* Выбрали точку — подъезжаем к ней; сняли выбор — плавно
           возвращаемся к общему виду на всю Самару. */
        focus: function (selected) {
          if (selected) {
            map.setCenter([selected.lat, selected.lon], c.pointZoom, { duration: 600 });
          } else if (points.length) {
            map.setBounds(
              ymaps.util.bounds.fromPoints(
                points.map(function (p) {
                  return [p.lat, p.lon];
                })
              ),
              { checkZoomRange: true, zoomMargin: 56, duration: 600 }
            );
          }
        },
      };
    },
  };

  /* ── Движок 2: OpenStreetMap через Leaflet (запасной) ───────────────── */

  var osm = {
    load: function () {
      if (window.L && window.L.map) return Promise.resolve();
      var c = cfg().osm;
      return loadOnce("leaflet", c.script, c.styles);
    },

    create: function (host, points, onSelect, nodes) {
      var c = cfg();
      var map = L.map(host, {
        scrollWheelZoom: !!c.scrollZoom,
        zoomControl: true,
        attributionControl: true,
      }).setView(c.center, c.zoom);

      L.tileLayer(c.osm.tiles, {
        maxZoom: c.osm.maxZoom,
        attribution: c.osm.attribution,
      }).addTo(map);

      points.forEach(function (p) {
        var marker = L.marker([p.lat, p.lon], {
          title: p.name + " · " + p.address,
          icon: L.divIcon({
            html: pinHtml(p),
            className: "yeti-pin-icon", /* без белой рамки Leaflet, см. styles/map.css */
            iconSize: [PIN_W, PIN_H],
            iconAnchor: [PIN_W / 2, PIN_H],
          }),
        }).addTo(map);

        marker.on("click", function () {
          if (onSelect) onSelect(p);
        });

        var el = marker.getElement();
        if (el) nodes.set(p.id, el.querySelector(".yeti-pin") || el);
      });

      return {
        destroy: function () {
          map.remove();
        },
        focus: function (selected) {
          if (selected) {
            map.flyTo([selected.lat, selected.lon], c.pointZoom, { duration: 0.7 });
          } else if (points.length) {
            map.flyToBounds(
              points.map(function (p) {
                return [p.lat, p.lon];
              }),
              { padding: [42, 42], duration: 0.7 }
            );
          }
        },
      };
    },
  };

  var ENGINES = { yandex: yandex, osm: osm };

  /** Какой движок брать по настройкам. */
  function pickEngine() {
    var name = cfg().provider || "yandex";
    return ENGINES[name] ? name : "widget";
  }

  /* ── Запасной вариант: виджет Яндекса в <iframe> ────────────────────── */

  function syncFrame(host, points, selected) {
    var frame = host.querySelector("iframe");
    if (!frame) {
      host.innerHTML = "";
      frame = document.createElement("iframe");
      frame.className = "yeti-map__frame";
      frame.title = "Точки YETI на Яндекс.Картах";
      frame.setAttribute("allow", "geolocation");
      frame.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      host.appendChild(frame);
      host.setAttribute("data-ready", "1");
    }
    var url = widgetLink(points, selected);
    if (frame.dataset.url === url) return;
    frame.dataset.url = url;
    frame.src = url;
  }

  function fallbackToFrame(host, reason) {
    var inst = instances.get(host);
    if (inst && inst.destroy) {
      try {
        inst.destroy();
      } catch (e) {}
    }
    console.warn("[yeti-map]", reason, "— показываю виджет Яндекса");
    instances.set(host, "frame");
    syncFrame(host, host.__yeti.points, host.__yeti.selected);
  }

  /* ── Точка входа ────────────────────────────────────────────────────── */

  /** Подсвечивает выбранный пин и уводит к нему карту. */
  function apply(inst, selected) {
    var id = selected ? selected.id : null;
    if (inst.selectedId === id) return;
    inst.selectedId = id;
    inst.nodes.forEach(function (el, pointId) {
      el.setAttribute("data-active", id === pointId ? "1" : "0");
    });
    inst.focus(selected);
  }

  function sync(opts) {
    var host = opts.host;
    if (!host) return;
    /* Состояние страницы могло смениться, пока грузилась карта. */
    host.__yeti = opts;

    var inst = instances.get(host);
    if (inst === "loading") return;
    if (inst === "frame") {
      syncFrame(host, opts.points, opts.selected);
      return;
    }
    if (inst) {
      apply(inst, opts.selected);
      return;
    }

    var name = pickEngine();
    if (name === "widget") {
      instances.set(host, "frame");
      syncFrame(host, opts.points, opts.selected);
      return;
    }

    instances.set(host, "loading");
    var engine = ENGINES[name];
    engine
      .load()
      .then(function () {
        var nodes = new Map();
        var created = engine.create(host, opts.points, opts.onSelect, nodes);
        created.nodes = nodes;
        /* false, а не null — чтобы первый apply() подогнал охват под точки. */
        created.selectedId = false;
        instances.set(host, created);
        host.setAttribute("data-ready", "1");
        apply(created, host.__yeti.selected);

        /* Если пинов почему-то нет — лучше виджет, чем пустая карта. */
        setTimeout(function () {
          if (instances.get(host) !== created || created.nodes.size) return;
          fallbackToFrame(host, "пины не появились");
        }, PINS_TIMEOUT);
      })
      .catch(function (err) {
        fallbackToFrame(host, err.message);
      });
  }

  YETI.map = {
    sync: sync,
    externalLink: externalLink,
    widgetLink: widgetLink,
    pinHtml: pinHtml,
  };
})();
