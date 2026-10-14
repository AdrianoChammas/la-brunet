/*
 * La Brunet — comportamento da página.
 * Depende de data.js (LB_DATA) e lib.js (LBLib).
 */
(function () {
  "use strict";

  var D = window.LB_DATA;
  var L = window.LBLib;
  var store = D.store;
  var products = D.products;
  var byId = {};
  products.forEach(function (p) { byId[p.id] = p; });

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Armazenamento local (tolerante a falhas) ---------- */

  var storage = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* modo privado */ }
    }
  };

  var KEYS = { cart: "labrunet.cart", orders: "labrunet.orders", contact: "labrunet.contact" };

  /* ---------- Estado ---------- */

  var state = {
    cart: sanitizeCart(storage.get(KEYS.cart, {})),
    date: null,
    time: null,
    category: "todos",
    query: "",
    tickets: storage.get(KEYS.orders, []),
    triedSubmit: false
  };

  function sanitizeCart(c) {
    var out = {};
    if (c && typeof c === "object") {
      Object.keys(c).forEach(function (id) {
        var q = Math.floor(Number(c[id]));
        if (byId[id] && q > 0) out[id] = Math.min(q, 999);
      });
    }
    return out;
  }

  function now() { return new Date(); }

  /* ---------- Aviso ---------- */

  var toastEl = $("[data-toast]");
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2600);
  }

  /* ---------- Horários e "aberto agora" ---------- */

  function renderStatus() {
    var st = L.getStatus(store.hours, now());
    var suffix = store.hours.confirmed ? "" : " *";
    $$("[data-status-label]").forEach(function (el) { el.textContent = st.label + suffix; });
    $$("[data-status], [data-status-pill]").forEach(function (el) {
      el.classList.toggle("is-open", st.open);
      el.classList.toggle("is-closed", !st.open);
    });
  }

  function renderHours() {
    var tbody = $("[data-hours] tbody");
    var today = now().getDay();
    tbody.innerHTML = L.groupHours(store.hours).map(function (g) {
      var isToday = g.days.indexOf(today) !== -1;
      return '<tr' + (isToday ? ' class="is-today"' : "") + '><th scope="row">' + esc(g.label) + "</th><td>" + esc(g.text) + "</td></tr>";
    }).join("");
    $("[data-hours-note]").hidden = !!store.hours.confirmed;
  }

  /* ---------- Cabeçalho, menu e navegação ---------- */

  var top = $("[data-top]");
  var hero = $("#inicio");

  function onScroll() {
    var solid = window.scrollY > hero.offsetHeight - top.offsetHeight - 10;
    top.classList.toggle("is-solid", solid || document.body.classList.contains("is-locked"));
    updateDock();
  }

  var drawer = $("#drawer");
  var openBtn = $("[data-menu-open]");
  var lastFocus = null;

  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    document.body.classList.add("is-locked");
    openBtn.setAttribute("aria-expanded", "true");
    void drawer.offsetWidth; // aplica o estado inicial antes da transição
    drawer.classList.add("is-open");
    $("[data-menu-close]").focus();
  }

  function closeDrawer(restoreFocus) {
    if (drawer.hidden) return;
    drawer.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    openBtn.setAttribute("aria-expanded", "false");
    setTimeout(function () { drawer.hidden = true; }, 320);
    if (restoreFocus !== false && lastFocus) lastFocus.focus();
  }

  openBtn.addEventListener("click", openDrawer);
  $("[data-menu-close]").addEventListener("click", function () { closeDrawer(); });
  drawer.addEventListener("click", function (e) {
    if (e.target === drawer) closeDrawer();
    if (e.target.closest("[data-drawer-link]")) closeDrawer(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDrawer();
    if (e.key === "Tab" && !drawer.hidden) {
      var f = $$("a, button", drawer);
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Destaca no menu a seção visível.
  function setupScrollSpy() {
    if (!("IntersectionObserver" in window)) return;
    var links = $$("[data-nav]");
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute("aria-current"); });
        var a = map[en.target.id];
        if (a) a.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["fornada", "cardapio", "historia", "encomendas", "galeria", "visite"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  function setupReveal() {
    var items = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    items.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(el);
    });
  }

  /* ---------- Controles de quantidade ---------- */

  function priceHTML(p) {
    return '<span class="price">' + L.formatBRL(p.price) + (store.pricesAreSample ? "*" : "") + "</span>";
  }

  function ctrlHTML(id, label) {
    var q = state.cart[id] || 0;
    var p = byId[id];
    if (!q) {
      var round = label === "+";
      return '<button class="add' + (round ? " add--round" : "") + '" type="button" data-add="' + id + '" aria-label="Adicionar ' + esc(p.name) + ' à encomenda">' +
        '<svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg>' + (round ? "" : label || "Adicionar") + "</button>";
    }
    return '<span class="qty" role="group" aria-label="Quantidade de ' + esc(p.name) + '">' +
      '<button type="button" data-dec="' + id + '" aria-label="Diminuir"><svg class="ico" aria-hidden="true"><use href="#i-minus"/></svg></button>' +
      "<output>" + q + "</output>" +
      '<button type="button" data-inc="' + id + '" aria-label="Aumentar"><svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg></button>' +
      "</span>";
  }

  function refreshCtrls(id, focusAttr) {
    $$('[data-ctrl="' + id + '"]').forEach(function (slot) {
      var hadFocus = slot.contains(document.activeElement);
      slot.innerHTML = ctrlHTML(id, slot.getAttribute("data-label"));
      if (hadFocus) {
        var target = slot.querySelector(focusAttr ? "[" + focusAttr + "]" : "button") || slot.querySelector("button");
        if (target) target.focus();
      }
    });
  }

  function changeQty(id, delta, focusAttr) {
    var p = byId[id];
    var current = state.cart[id] || 0;
    var step = delta;
    // Itens com mínimo (ex.: bolo em kg) começam no mínimo.
    if (current === 0 && delta > 0 && p.min) step = p.min;
    if (current + delta < (p.min || 1) && delta < 0) step = -current;
    state.cart = L.cartAdd(state.cart, id, step);
    commitCart();
    refreshCtrls(id, focusAttr);
    if (current === 0 && step > 0) {
      toast(p.name + " adicionado à encomenda");
      var bag = $("[data-bag-link]");
      bag.classList.remove("is-bumped");
      void bag.offsetWidth;
      bag.classList.add("is-bumped");
    }
  }

  function commitCart() {
    storage.set(KEYS.cart, state.cart);
    renderBag();
    renderCart();
    renderSummary();
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-add], [data-inc], [data-dec]");
    if (!b) return;
    if (b.hasAttribute("data-add")) changeQty(b.getAttribute("data-add"), 1, "data-inc");
    else if (b.hasAttribute("data-inc")) changeQty(b.getAttribute("data-inc"), 1, "data-inc");
    else changeQty(b.getAttribute("data-dec"), -1, "data-dec");
  });

  /* ---------- Destaques ---------- */

  function renderFeatured() {
    var list = products.filter(function (p) { return p.featured; });
    var cat = {};
    D.categories.forEach(function (c) { cat[c.id] = c.label; });
    $("[data-featured]").innerHTML = list.map(function (p, i) {
      return '<article class="feature reveal' + (i === 0 ? " feature--hero" : "") + '">' +
        '<div class="feature__media"><img src="' + p.img + '" alt="' + esc(p.name) + '" loading="lazy" width="900" height="675">' +
        '<span class="feature__tag">' + esc(cat[p.cat]) + "</span></div>" +
        '<div class="feature__body"><h3 class="feature__name">' + esc(p.name) + '</h3><p class="feature__desc">' + esc(p.desc) + "</p>" +
        '<div class="feature__foot"><span>' + priceHTML(p) + "<small>" + esc(p.unit) + "</small></span>" +
        '<span data-ctrl="' + p.id + '">' + ctrlHTML(p.id) + "</span></div></div></article>";
    }).join("");
  }

  /* ---------- Cardápio ---------- */

  function renderChips() {
    var all = [{ id: "todos", label: "Tudo" }].concat(D.categories);
    $("[data-chips]").innerHTML = all.map(function (c) {
      var sel = c.id === state.category;
      return '<button class="chip" type="button" role="tab" aria-selected="' + sel + '" tabindex="' + (sel ? 0 : -1) + '" data-cat="' + c.id + '">' + esc(c.label) + "</button>";
    }).join("");
  }

  function itemHTML(p) {
    var tags = (p.tags || []).map(function (t) {
      return '<span class="tag' + (t === "encomenda" ? " tag--encomenda" : "") + '">' + esc(t) + "</span>";
    }).join("");
    var thumb = p.img
      ? '<span class="item__thumb"><img src="' + p.img.replace("w=900", "w=200") + '" alt="" loading="lazy" width="72" height="72"></span>'
      : '<span class="item__thumb item__thumb--empty" aria-hidden="true">' + esc(p.name.charAt(0)) + "</span>";
    return '<article class="item">' + thumb +
      '<div class="item__main"><div class="item__line"><h4 class="item__name">' + esc(p.name) + '</h4><span class="item__dots" aria-hidden="true"></span></div>' +
      '<p class="item__desc">' + esc(p.desc) + "</p>" +
      '<div class="item__meta"><span class="item__unit">' + esc(p.unit) + "</span>" + tags + "</div></div>" +
      '<div class="item__side">' + priceHTML(p) + '<span data-ctrl="' + p.id + '" data-label="+">' + ctrlHTML(p.id, "+") + "</span></div></article>";
  }

  function renderMenu() {
    var found = L.searchProducts(products, state.query, state.category);
    var root = $("[data-menu]");
    if (!found.length) {
      root.innerHTML = '<div class="menu__empty"><strong>Nada por aqui.</strong>Tente outra palavra ou veja <button class="link" type="button" data-reset-search style="background:none;border:0;padding:0">o cardápio completo</button>.</div>';
      return;
    }
    root.innerHTML = D.categories.map(function (c) {
      var items = found.filter(function (p) { return p.cat === c.id; });
      if (!items.length) return "";
      return '<section class="menu-cat" aria-labelledby="cat-' + c.id + '"><header class="menu-cat__head"><h3 class="menu-cat__title" id="cat-' + c.id + '">' + esc(c.label) + "</h3>" +
        '<p class="menu-cat__intro">' + esc(c.intro) + '</p></header><div class="menu-items">' + items.map(itemHTML).join("") + "</div></section>";
    }).join("");
  }

  function setCategory(id, focus) {
    state.category = id;
    renderChips();
    renderMenu();
    if (focus) {
      var chip = $('[data-cat="' + id + '"]');
      chip.focus();
      chip.scrollIntoView({ inline: "center", block: "nearest" });
    }
  }

  $("[data-chips]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]");
    if (b) setCategory(b.getAttribute("data-cat"));
  });
  $("[data-chips]").addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    var ids = ["todos"].concat(D.categories.map(function (c) { return c.id; }));
    var i = ids.indexOf(state.category) + (e.key === "ArrowRight" ? 1 : -1);
    setCategory(ids[(i + ids.length) % ids.length], true);
    e.preventDefault();
  });

  var searchTimer;
  $("[data-search]").addEventListener("input", function (e) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      state.query = e.target.value;
      renderMenu();
    }, 120);
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest("[data-reset-search]")) return;
    $("[data-search]").value = "";
    state.query = "";
    setCategory("todos");
  });

  /* ---------- Encomenda: itens ---------- */

  function renderBag() {
    var count = L.cartCount(state.cart, products);
    var badge = $("[data-bag-count]");
    badge.hidden = count === 0;
    badge.textContent = count;
    $("[data-bag-link]").setAttribute("aria-label", count ? "Encomendar, " + count + " itens" : "Encomendar");
    $("[data-dock-count]").textContent = count + (count === 1 ? " item" : " itens");
    $("[data-dock-total]").textContent = L.formatBRL(L.cartTotal(state.cart, products));
    updateDock();
  }

  function renderCart() {
    var lines = L.cartLines(state.cart, products);
    var root = $("[data-cart]");
    if (!lines.length) {
      var quick = ["pao-de-queijo", "croissant", "bolo-inteiro", "cento-salgados", "fermentacao-natural"];
      root.innerHTML = '<div class="cart-empty"><strong>Sua encomenda está vazia.</strong>' +
        "<span>Adicione itens pelo cardápio ou comece por um destes:</span>" +
        '<div class="cart-quick">' + quick.map(function (id) {
          return '<button type="button" data-add="' + id + '"><svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg>' + esc(byId[id].name) + "</button>";
        }).join("") + '</div><a class="link" href="#cardapio">Ver o cardápio completo</a></div>';
    } else {
      root.innerHTML = '<div class="cart-lines">' + lines.map(function (l) {
        return '<div class="cart-line"><div><span class="cart-line__name">' + esc(l.product.name) + '</span><span class="cart-line__unit">' +
          L.formatBRL(l.product.price) + " · " + esc(l.product.unit) + "</span></div>" +
          '<div class="cart-line__right"><span data-ctrl="' + l.id + '">' + ctrlHTML(l.id) + '</span><span class="cart-line__sub">' + L.formatBRL(l.subtotal) + "</span></div></div>";
      }).join("") + '</div><p class="cart-more"><a class="link" href="#cardapio">+ Adicionar mais itens</a></p>';
    }
    markSteps();
  }

  /* ---------- Encomenda: dia e horário ---------- */

  function renderDays() {
    var days = L.availableDates(store, now());
    if (state.date && !days.some(function (d) { return L.isoDate(d) === state.date; })) {
      state.date = null;
      state.time = null;
    }
    $("[data-days]").innerHTML = days.map(function (d, i) {
      var iso = L.isoDate(d);
      var sel = iso === state.date;
      var wd = L.describeDate(d).split(",")[0];
      var focusable = sel || (!state.date && i === 0);
      return '<button class="day" type="button" role="radio" aria-checked="' + sel + '" tabindex="' + (focusable ? 0 : -1) + '" data-date="' + iso + '" aria-label="' + esc(L.describeDateLong(d)) + '">' +
        '<span class="day__wd">' + wd + '</span><span class="day__d">' + d.getDate() + '</span><span class="day__m">' + L.describeDate(d).split(" ").pop() + "</span></button>";
    }).join("");
  }

  function renderSlots() {
    var root = $("[data-slots]");
    if (!state.date) {
      root.innerHTML = '<p class="muted">Escolha o dia primeiro.</p>';
      return;
    }
    var slots = L.slotsFor(store, L.parseIsoDate(state.date), now());
    if (state.time && slots.indexOf(state.time) === -1) state.time = null;
    root.innerHTML = slots.map(function (t, i) {
      var sel = t === state.time;
      var focusable = sel || (!state.time && i === 0);
      return '<button class="slot" type="button" role="radio" aria-checked="' + sel + '" tabindex="' + (focusable ? 0 : -1) + '" data-time="' + t + '">' + t.replace(":", "h") + "</button>";
    }).join("");
  }

  function radioKeys(container, attr, onPick) {
    container.addEventListener("keydown", function (e) {
      var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in keys)) return;
      var items = $$("[" + attr + "]", container);
      var i = items.indexOf(document.activeElement);
      if (i === -1) return;
      var next = items[(i + keys[e.key] + items.length) % items.length];
      e.preventDefault();
      onPick(next.getAttribute(attr));
      var el = container.querySelector("[" + attr + '="' + next.getAttribute(attr) + '"]');
      if (el) el.focus();
    });
  }

  function pickDate(iso) {
    state.date = iso;
    renderDays();
    renderSlots();
    clearError("date");
    renderSummary();
  }

  function pickTime(t) {
    state.time = t;
    renderSlots();
    clearError("time");
    renderSummary();
  }

  $("[data-days]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-date]");
    if (b) pickDate(b.getAttribute("data-date"));
  });
  $("[data-slots]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-time]");
    if (b) pickTime(b.getAttribute("data-time"));
  });
  radioKeys($("[data-days]"), "data-date", pickDate);
  radioKeys($("[data-slots]"), "data-time", pickTime);

  /* ---------- Encomenda: dados, resumo e envio ---------- */

  var form = $("[data-order-form]");
  var nameInput = form.elements.name;
  var phoneInput = form.elements.phone;
  var notesInput = form.elements.notes;

  var savedContact = storage.get(KEYS.contact, null);
  if (savedContact) {
    nameInput.value = savedContact.name || "";
    phoneInput.value = savedContact.phone || "";
  }

  phoneInput.addEventListener("input", function () {
    var atEnd = phoneInput.selectionStart === phoneInput.value.length;
    var formatted = L.formatPhone(phoneInput.value);
    if (atEnd) phoneInput.value = formatted;
    if (state.triedSubmit) validate(false);
    markSteps();
  });
  phoneInput.addEventListener("blur", function () { phoneInput.value = L.formatPhone(phoneInput.value); });
  nameInput.addEventListener("input", function () { if (state.triedSubmit) validate(false); markSteps(); });

  function currentOrder() {
    return {
      cart: state.cart,
      date: state.date,
      time: state.time,
      name: nameInput.value,
      phone: phoneInput.value,
      notes: notesInput.value
    };
  }

  function clearError(field) {
    var el = $('[data-error="' + field + '"]');
    if (el) el.textContent = "";
  }

  function validate(focusFirst) {
    var errors = L.validateOrder(currentOrder(), store, products, now());
    ["cart", "date", "time", "name", "phone"].forEach(function (f) {
      $('[data-error="' + f + '"]').textContent = errors[f] || "";
    });
    nameInput.setAttribute("aria-invalid", errors.name ? "true" : "false");
    phoneInput.setAttribute("aria-invalid", errors.phone ? "true" : "false");
    if (focusFirst) {
      var firstField = ["cart", "date", "time", "name", "phone"].filter(function (f) { return errors[f]; })[0];
      if (firstField === "name") nameInput.focus();
      else if (firstField === "phone") phoneInput.focus();
      else if (firstField) {
        var stepEl = $('[data-error="' + firstField + '"]').closest(".step");
        stepEl.scrollIntoView({ behavior: "smooth", block: "center" });
        var btn = stepEl.querySelector("button");
        if (btn) btn.focus({ preventScroll: true });
      }
    }
    return errors;
  }

  function markSteps() {
    var lines = L.cartLines(state.cart, products);
    var done = {
      1: lines.length > 0,
      2: !!state.date,
      3: !!state.time,
      4: nameInput.value.trim().length >= 2 && L.validatePhone(phoneInput.value)
    };
    $$(".step").forEach(function (s) { s.classList.toggle("is-done", !!done[s.getAttribute("data-step")]); });
  }

  function renderSummary() {
    var count = L.cartCount(state.cart, products);
    $("[data-sum-items]").textContent = count ? count + (count === 1 ? " item" : " itens") : "Nenhum item";
    $("[data-sum-when]").textContent = state.date
      ? L.describeDateLong(L.parseIsoDate(state.date)) + (state.time ? ", " + state.time.replace(":", "h") : " · escolha o horário")
      : "—";
    $("[data-sum-total]").textContent = L.formatBRL(L.cartTotal(state.cart, products)) + (store.pricesAreSample ? "*" : "");
    markSteps();
  }

  function renderSubmitMode() {
    var label = $("[data-submit-label]");
    var note = $("[data-submit-note]");
    var icon = $("[data-submit] use");
    if (store.whatsapp) {
      label.textContent = "Enviar pelo WhatsApp";
      icon.setAttribute("href", "#i-wa");
      note.textContent = "Abre o WhatsApp com o pedido pronto. A loja confirma a disponibilidade e o valor final.";
    } else {
      label.textContent = "Copiar pedido e ligar";
      icon.setAttribute("href", "#i-copy");
      note.textContent = "Copiamos o pedido para você e mostramos o telefone da loja, (11) 2977-6777, para confirmar.";
    }
    if (store.pricesAreSample) note.textContent += " *Valores de referência.";
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    state.triedSubmit = true;
    var errors = validate(true);
    if (Object.keys(errors).length) {
      toast("Falta pouco: confira os campos marcados.");
      return;
    }
    var order = currentOrder();
    var message = L.buildOrderMessage(order, store, products);
    var ticket = {
      id: Date.now().toString(36),
      createdAt: new Date().toISOString(),
      cart: Object.assign({}, order.cart),
      date: order.date,
      time: order.time,
      total: L.cartTotal(order.cart, products),
      message: message
    };
    state.tickets = [ticket].concat(state.tickets).slice(0, 20);
    storage.set(KEYS.orders, state.tickets);
    storage.set(KEYS.contact, { name: order.name.trim(), phone: L.formatPhone(order.phone) });

    if (store.whatsapp) {
      window.open(L.whatsappLink(store.whatsapp, message), "_blank", "noopener");
      toast("Pedido aberto no WhatsApp. É só enviar!");
    } else {
      copyText(message).then(function (ok) {
        toast(ok ? "Pedido copiado. Ligue (11) 2977-6777 para confirmar." : "Ligue (11) 2977-6777 para confirmar o pedido.");
      });
    }

    // Limpa a encomenda atual; nome e telefone ficam guardados.
    state.cart = {};
    state.date = null;
    state.time = null;
    state.triedSubmit = false;
    notesInput.value = "";
    commitCart();
    renderDays();
    renderSlots();
    renderSummary();
    renderTickets(true);
  });

  /* ---------- Encomendas salvas neste aparelho ---------- */

  function renderTickets(highlightFirst) {
    var root = $("[data-tickets]");
    if (!state.tickets.length) {
      root.innerHTML = '<li class="tickets__empty">Nenhuma encomenda feita deste aparelho ainda.</li>';
      return;
    }
    root.innerHTML = state.tickets.map(function (t) {
      var when = L.describeDateLong(L.parseIsoDate(t.date)) + ", " + String(t.time).replace(":", "h");
      var items = Object.keys(t.cart).filter(function (id) { return byId[id]; }).map(function (id) {
        return t.cart[id] + "× " + byId[id].name;
      }).join(" · ");
      var wa = store.whatsapp
        ? '<a href="' + esc(L.whatsappLink(store.whatsapp, "Olá! Sobre a minha encomenda para " + when + ":")) + '" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-wa"/></svg>Falar sobre ela</a>'
        : '<a href="tel:' + store.phone.tel + '"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg>Ligar para a loja</a>';
      return '<li class="ticket" data-ticket="' + esc(t.id) + '"><div class="ticket__top"><span class="ticket__when">Retirada ' + esc(when) + '</span><span class="ticket__total">' + L.formatBRL(t.total) + "</span></div>" +
        '<p class="ticket__items">' + esc(items) + "</p>" +
        '<div class="ticket__actions"><button type="button" data-ticket-repeat="' + esc(t.id) + '">Repetir pedido</button>' +
        '<button type="button" data-ticket-copy="' + esc(t.id) + '"><svg class="ico" aria-hidden="true"><use href="#i-copy"/></svg>Copiar</button>' + wa +
        '<button type="button" data-ticket-remove="' + esc(t.id) + '" aria-label="Remover esta encomenda da lista">Remover</button></div></li>';
    }).join("");
    if (highlightFirst) {
      var first = root.querySelector(".ticket");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function findTicket(id) {
    return state.tickets.filter(function (t) { return t.id === id; })[0];
  }

  $("[data-tickets]").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var t;
    if (b.hasAttribute("data-ticket-repeat")) {
      t = findTicket(b.getAttribute("data-ticket-repeat"));
      if (!t) return;
      state.cart = sanitizeCart(t.cart);
      commitCart();
      products.forEach(function (p) { refreshCtrls(p.id); });
      toast("Itens de volta na encomenda. Escolha o novo dia.");
      $('[data-step="2"]').scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (b.hasAttribute("data-ticket-copy")) {
      t = findTicket(b.getAttribute("data-ticket-copy"));
      if (t) copyText(t.message).then(function (ok) { toast(ok ? "Pedido copiado." : "Não foi possível copiar."); });
    } else if (b.hasAttribute("data-ticket-remove")) {
      var id = b.getAttribute("data-ticket-remove");
      state.tickets = state.tickets.filter(function (x) { return x.id !== id; });
      storage.set(KEYS.orders, state.tickets);
      renderTickets();
      toast("Encomenda removida da lista.");
    }
  });

  /* ---------- Barra fixa do celular ---------- */

  var dock = $("[data-dock]");
  var orderSection = $("#encomendas");
  function updateDock() {
    var count = L.cartCount(state.cart, products);
    var r = orderSection.getBoundingClientRect();
    var inOrder = r.top < window.innerHeight * 0.9 && r.bottom > 0;
    var show = count > 0 && !inOrder && window.scrollY > 200;
    dock.hidden = false;
    dock.classList.toggle("is-visible", show);
    dock.setAttribute("aria-hidden", show ? "false" : "true");
    $("[data-dock-link]").tabIndex = show ? 0 : -1;
  }

  /* ---------- Galeria ---------- */

  var lightbox = $("[data-lightbox]");
  function renderGallery() {
    $("[data-gallery]").innerHTML = D.gallery.map(function (g, i) {
      var cls = g.size ? " shot--" + g.size : "";
      return '<button class="shot reveal' + cls + '" type="button" data-shot="' + i + '" aria-label="Ampliar foto: ' + esc(g.alt) + '">' +
        '<img src="' + g.src + '" alt="' + esc(g.alt) + '" loading="lazy"></button>';
    }).join("");
  }
  $("[data-gallery]").addEventListener("click", function (e) {
    var b = e.target.closest("[data-shot]");
    if (!b) return;
    var g = D.gallery[Number(b.getAttribute("data-shot"))];
    $("[data-lightbox-img]").src = g.src.replace(/w=\d+/, "w=1800");
    $("[data-lightbox-img]").alt = g.alt;
    $("[data-lightbox-cap]").textContent = g.alt;
    if (typeof lightbox.showModal === "function") lightbox.showModal();
    else window.open(g.src, "_blank", "noopener");
  });
  $("[data-lightbox-close]").addEventListener("click", function () { lightbox.close(); });
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) lightbox.close(); });

  /* ---------- Mapa sob demanda ---------- */

  $("[data-map-load]").addEventListener("click", function () {
    var q = encodeURIComponent(store.address.street + ", " + store.address.district + ", " + store.address.city + " - " + store.address.state);
    var map = $("[data-map]");
    map.innerHTML = '<iframe title="Mapa: La Brunet, ' + esc(store.address.street) + '" src="https://www.google.com/maps?q=' + q + '&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
  });

  /* ---------- Contato por WhatsApp (quando configurado) ---------- */

  if (store.whatsapp) {
    $("[data-wa-contact]").hidden = false;
    $("[data-wa-href]").href = L.whatsappLink(store.whatsapp, "Olá, La Brunet!");
  }

  /* ---------- Início ---------- */

  $("[data-price-note]").hidden = !store.pricesAreSample;
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  renderStatus();
  renderHours();
  renderFeatured();
  renderChips();
  renderMenu();
  renderBag();
  renderCart();
  renderDays();
  renderSlots();
  renderSummary();
  renderSubmitMode();
  renderTickets();
  renderGallery();
  setupReveal();
  setupScrollSpy();
  onScroll();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  setInterval(function () { renderStatus(); renderDays(); renderSlots(); }, 60 * 1000);
  // O menu pode ser deixado aberto num celular girado para paisagem.
  window.matchMedia("(min-width: 1000px)").addEventListener("change", function (mq) { if (mq.matches) closeDrawer(false); });
})();
