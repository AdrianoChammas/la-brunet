/*
 * La Brunet — funções puras (sem DOM), usadas pelo site e pelos testes.
 */
(function (global) {
  "use strict";

  var WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  var IFOOD_SEARCH = "https://www.ifood.com.br/busca?q=";

  function formatBRL(value) {
    var cents = Math.round(Number(value) * 100);
    var negative = cents < 0;
    cents = Math.abs(cents);
    var reais = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    var centavos = String(cents % 100).padStart(2, "0");
    return (negative ? "-" : "") + "R$ " + reais + "," + centavos;
  }

  function parseHM(hm) {
    var parts = String(hm).split(":");
    return Number(parts[0]) * 60 + Number(parts[1] || 0);
  }

  // "06:00" -> "6h", "21:30" -> "21h30"
  function shortHM(hm) {
    var min = parseHM(hm);
    var h = Math.floor(min / 60);
    var m = min % 60;
    return h + "h" + (m ? String(m).padStart(2, "0") : "");
  }

  function hoursFor(hours, weekday) {
    for (var i = 0; i < hours.days.length; i++) {
      if (hours.days[i].day === weekday) return hours.days[i];
    }
    return null;
  }

  /*
   * Estado da loja num instante: { open, label, until }.
   * Considera só o horário do dia (a loja não atravessa a meia-noite).
   */
  function getStatus(hours, date) {
    var today = hoursFor(hours, date.getDay());
    var now = date.getHours() * 60 + date.getMinutes();
    if (today) {
      var open = parseHM(today.open);
      var close = parseHM(today.close);
      if (now >= open && now < close) {
        return { open: true, label: "Aberto agora · até " + shortHM(today.close), until: today.close };
      }
      if (now < open) {
        return { open: false, label: "Fechado · abre hoje às " + shortHM(today.open), until: today.open };
      }
    }
    for (var offset = 1; offset <= 7; offset++) {
      var wd = (date.getDay() + offset) % 7;
      var next = hoursFor(hours, wd);
      if (next) {
        var when = offset === 1 ? "amanhã" : WEEKDAYS[wd];
        return { open: false, label: "Fechado · abre " + when + " às " + shortHM(next.open), until: next.open };
      }
    }
    return { open: false, label: "Fechado", until: null };
  }

  /*
   * Agrupa dias com o mesmo horário para a tabela: "Segunda a sábado".
   * Retorna [{ label, open, close, days: [..] }] começando na segunda.
   */
  function groupHours(hours) {
    var order = [1, 2, 3, 4, 5, 6, 0];
    var groups = [];
    order.forEach(function (wd) {
      var h = hoursFor(hours, wd);
      var key = h ? h.open + "-" + h.close : "closed";
      var last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.days.push(wd);
      } else {
        groups.push({ key: key, days: [wd], open: h ? h.open : null, close: h ? h.close : null });
      }
    });
    return groups.map(function (g) {
      var first = WEEKDAYS[g.days[0]];
      var last = WEEKDAYS[g.days[g.days.length - 1]];
      var label = g.days.length === 1 ? first : g.days.length === 2 ? first + " e " + last : first + " a " + last;
      label = label.charAt(0).toUpperCase() + label.slice(1);
      return {
        label: label,
        days: g.days,
        open: g.open,
        close: g.close,
        text: g.open ? shortHM(g.open) + " às " + shortHM(g.close) : "Fechado"
      };
    });
  }

  /* ---------- Links externos ---------- */

  function onlyDigits(s) { return String(s || "").replace(/\D/g, ""); }

  function whatsappLink(number, text) {
    return "https://wa.me/" + onlyDigits(number) + "?text=" + encodeURIComponent(text);
  }

  /* Página da loja no iFood; sem link configurado, a busca pelo nome. */
  function ifoodLink(store) {
    var url = store.ifoodUrl && String(store.ifoodUrl).trim();
    if (url && /^https:\/\/([a-z0-9-]+\.)*ifood\.com\.br\//i.test(url)) return url;
    return IFOOD_SEARCH + encodeURIComponent(store.name);
  }

  /* ---------- Busca ---------- */

  function normalize(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }

  function searchProducts(products, query, categoryId) {
    var q = normalize(query);
    var terms = q ? q.split(/\s+/) : [];
    return products.filter(function (p) {
      if (categoryId && categoryId !== "todos" && p.cat !== categoryId) return false;
      if (!terms.length) return true;
      var hay = normalize(p.name + " " + p.desc + " " + (p.tags || []).join(" "));
      return terms.every(function (t) { return hay.indexOf(t) !== -1; });
    });
  }

  global.LBLib = {
    WEEKDAYS: WEEKDAYS,
    formatBRL: formatBRL,
    parseHM: parseHM,
    shortHM: shortHM,
    hoursFor: hoursFor,
    getStatus: getStatus,
    groupHours: groupHours,
    whatsappLink: whatsappLink,
    ifoodLink: ifoodLink,
    normalize: normalize,
    searchProducts: searchProducts
  };
})(typeof window !== "undefined" ? window : globalThis);
