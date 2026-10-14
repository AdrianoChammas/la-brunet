/*
 * La Brunet — funções puras (sem DOM), usadas pelo site e pelos testes.
 */
(function (global) {
  "use strict";

  var WEEKDAYS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  var WEEKDAYS_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

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

  function formatHM(minutes) {
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
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

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, n) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
  }

  function isoDate(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }

  function parseIsoDate(iso) {
    var p = String(iso).split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function describeDate(date) {
    return WEEKDAYS_SHORT[date.getDay()] + ", " + date.getDate() + " " + MONTHS_SHORT[date.getMonth()];
  }

  function describeDateLong(date) {
    return WEEKDAYS[date.getDay()] + ", " + date.getDate() + " de " +
      ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"][date.getMonth()];
  }

  /* Horários de retirada de um dia, respeitando a antecedência mínima. */
  function slotsFor(store, date, now) {
    var h = hoursFor(store.hours, date.getDay());
    if (!h) return [];
    var cfg = store.orders;
    var first = parseHM(h.open) + cfg.slotMarginMinutes;
    var last = parseHM(h.close) - cfg.slotMarginMinutes;
    var earliest = new Date(now.getTime() + cfg.leadHours * 3600 * 1000);
    var day = startOfDay(date);
    var slots = [];
    for (var m = first; m <= last; m += cfg.slotMinutes) {
      var at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(m / 60), m % 60);
      if (at >= earliest) slots.push(formatHM(m));
    }
    return slots;
  }

  /* Dias em que ainda há algum horário de retirada disponível. */
  function availableDates(store, now) {
    var days = [];
    var today = startOfDay(now);
    for (var i = 0; i <= store.orders.windowDays; i++) {
      var d = addDays(today, i);
      if (slotsFor(store, d, now).length) days.push(d);
    }
    return days;
  }

  /* ---------- Carrinho (objeto { id: quantidade }) ---------- */

  function cartAdd(cart, id, qty) {
    var next = Object.assign({}, cart);
    next[id] = (next[id] || 0) + (qty || 1);
    if (next[id] <= 0) delete next[id];
    return next;
  }

  function cartSet(cart, id, qty) {
    var next = Object.assign({}, cart);
    qty = Math.floor(Number(qty));
    if (!qty || qty <= 0) delete next[id];
    else next[id] = Math.min(qty, 999);
    return next;
  }

  function productIndex(products) {
    var idx = {};
    products.forEach(function (p) { idx[p.id] = p; });
    return idx;
  }

  function cartLines(cart, products) {
    var idx = productIndex(products);
    return Object.keys(cart)
      .filter(function (id) { return idx[id] && cart[id] > 0; })
      .map(function (id) {
        var p = idx[id];
        return { id: id, product: p, qty: cart[id], subtotal: Math.round(p.price * cart[id] * 100) / 100 };
      });
  }

  function cartCount(cart, products) {
    return cartLines(cart, products).reduce(function (n, l) { return n + l.qty; }, 0);
  }

  function cartTotal(cart, products) {
    return Math.round(cartLines(cart, products).reduce(function (n, l) { return n + l.subtotal; }, 0) * 100) / 100;
  }

  /* ---------- Pedido ---------- */

  function onlyDigits(s) { return String(s || "").replace(/\D/g, ""); }

  function validatePhone(phone) {
    var d = onlyDigits(phone);
    if (d.indexOf("55") === 0 && d.length >= 12) d = d.slice(2);
    return d.length === 10 || d.length === 11;
  }

  function formatPhone(phone) {
    var d = onlyDigits(phone).slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  /*
   * Valida um pedido { cart, date (ISO), time, name, phone, notes }.
   * Retorna um objeto { campo: mensagem } — vazio quando está tudo certo.
   */
  function validateOrder(order, store, products, now) {
    var errors = {};
    var lines = cartLines(order.cart || {}, products);
    if (!lines.length) {
      errors.cart = "Escolha pelo menos um item do cardápio.";
    } else {
      lines.forEach(function (l) {
        if (l.product.min && l.qty < l.product.min) {
          errors.cart = l.product.name + ": pedido mínimo de " + l.product.min + " " + (l.product.unit.split(" ")[0]) + ".";
        }
      });
    }
    if (!order.date) {
      errors.date = "Escolha o dia da retirada.";
    } else if (!order.time) {
      errors.time = "Escolha o horário da retirada.";
    } else if (slotsFor(store, parseIsoDate(order.date), now).indexOf(order.time) === -1) {
      errors.time = "Esse horário não está mais disponível. Escolha outro.";
    }
    if (!order.name || String(order.name).trim().length < 2) {
      errors.name = "Diga seu nome.";
    }
    if (!validatePhone(order.phone)) {
      errors.phone = "Informe um telefone com DDD.";
    }
    return errors;
  }

  function buildOrderMessage(order, store, products) {
    var lines = cartLines(order.cart, products);
    var date = parseIsoDate(order.date);
    var out = [];
    out.push("Olá, " + store.name + "! Gostaria de fazer uma encomenda.");
    out.push("");
    lines.forEach(function (l) {
      out.push("• " + l.qty + " × " + l.product.name + " (" + l.product.unit + ") — " + formatBRL(l.subtotal));
    });
    out.push("");
    out.push("Total estimado: " + formatBRL(cartTotal(order.cart, products)));
    out.push("Retirada: " + describeDateLong(date) + ", às " + order.time.replace(":", "h"));
    out.push("Nome: " + String(order.name).trim());
    out.push("Telefone: " + formatPhone(order.phone));
    if (order.notes && String(order.notes).trim()) {
      out.push("Observações: " + String(order.notes).trim());
    }
    if (store.pricesAreSample) {
      out.push("");
      out.push("(Valores do site são de referência; aguardo a confirmação do total.)");
    }
    return out.join("\n");
  }

  function whatsappLink(number, text) {
    return "https://wa.me/" + onlyDigits(number) + "?text=" + encodeURIComponent(text);
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
    formatHM: formatHM,
    shortHM: shortHM,
    hoursFor: hoursFor,
    getStatus: getStatus,
    groupHours: groupHours,
    isoDate: isoDate,
    parseIsoDate: parseIsoDate,
    describeDate: describeDate,
    describeDateLong: describeDateLong,
    slotsFor: slotsFor,
    availableDates: availableDates,
    cartAdd: cartAdd,
    cartSet: cartSet,
    cartLines: cartLines,
    cartCount: cartCount,
    cartTotal: cartTotal,
    validatePhone: validatePhone,
    formatPhone: formatPhone,
    validateOrder: validateOrder,
    buildOrderMessage: buildOrderMessage,
    whatsappLink: whatsappLink,
    normalize: normalize,
    searchProducts: searchProducts
  };
})(typeof window !== "undefined" ? window : globalThis);
