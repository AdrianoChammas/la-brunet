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

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function now() { return new Date(); }

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
    ["fornada", "cardapio", "historia", "delivery", "galeria", "visite"].forEach(function (id) {
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

  /* ---------- iFood ---------- */

  function setupIfoodLinks() {
    var url = L.ifoodLink(store);
    $$("[data-ifood]").forEach(function (a) { a.href = url; });
  }

  function priceHTML(p) {
    var from = p.from ? '<span class="price__from">a partir de</span>' : "";
    return '<span class="price">' + from + L.formatBRL(p.price) + (store.pricesAreSample ? "*" : "") + "</span>";
  }

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
        '<div class="feature__foot"><span>' + priceHTML(p) + "<small>" + esc(p.unit) + "</small></span></div></div></article>";
    }).join("");
  }

  /* ---------- Cardápio ---------- */

  var state = { category: "todos", query: "" };

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
      ? '<span class="item__thumb"><img src="' + (p.thumb || p.img) + '" alt="" loading="lazy" width="72" height="72"></span>'
      : '<span class="item__thumb item__thumb--empty" aria-hidden="true">' + esc(p.name.charAt(0)) + "</span>";
    return '<article class="item">' + thumb +
      '<div class="item__main"><div class="item__line"><h4 class="item__name">' + esc(p.name) + '</h4><span class="item__dots" aria-hidden="true"></span></div>' +
      '<p class="item__desc">' + esc(p.desc) + "</p>" +
      '<div class="item__meta"><span class="item__unit">' + esc(p.unit) + "</span>" + tags + "</div></div>" +
      '<div class="item__side">' + priceHTML(p) + "</div></article>";
  }

  // Itens com "sub" viram subgrupos com título dentro da categoria.
  function groupsHTML(items) {
    var groups = [];
    items.forEach(function (p) {
      var last = groups[groups.length - 1];
      if (last && last.sub === (p.sub || "")) last.items.push(p);
      else groups.push({ sub: p.sub || "", items: [p] });
    });
    return groups.map(function (g) {
      var head = g.sub && groups.length > 1 ? '<h4 class="menu-sub">' + esc(g.sub) + "</h4>" : "";
      return head + '<div class="menu-items">' + g.items.map(itemHTML).join("") + "</div>";
    }).join("");
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
        '<p class="menu-cat__intro">' + esc(c.intro) + "</p></header>" + groupsHTML(items) + "</section>";
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

  /* ---------- Barra fixa do celular (atalho para o iFood) ---------- */

  var dock = $("[data-dock]");
  var deliverySection = $("#delivery");
  function updateDock() {
    var r = deliverySection.getBoundingClientRect();
    var inDelivery = r.top < window.innerHeight && r.bottom > 0;
    var show = window.scrollY > hero.offsetHeight * 0.8 && !inDelivery;
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

  setupIfoodLinks();
  renderStatus();
  renderHours();
  renderFeatured();
  renderChips();
  renderMenu();
  renderGallery();
  setupReveal();
  setupScrollSpy();
  onScroll();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  setInterval(renderStatus, 60 * 1000);
  // O menu pode ser deixado aberto num celular girado para paisagem.
  window.matchMedia("(min-width: 1000px)").addEventListener("change", function (mq) { if (mq.matches) closeDrawer(false); });
})();
