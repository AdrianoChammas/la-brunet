/* Testes de lib.js e da consistência de data.js. Abra tests/index.html num servidor local. */
(function () {
  "use strict";

  var L = window.LBLib;
  var D = window.LB_DATA;
  var results = [];

  function test(name, fn) {
    try {
      fn();
      results.push({ name: name, ok: true });
    } catch (e) {
      results.push({ name: name, ok: false, error: e.message });
    }
  }

  function eq(actual, expected, msg) {
    var a = JSON.stringify(actual), b = JSON.stringify(expected);
    if (a !== b) throw new Error((msg ? msg + ": " : "") + "esperado " + b + ", recebido " + a);
  }

  function ok(cond, msg) { if (!cond) throw new Error(msg || "condição falsa"); }

  // Loja de teste com horário fixo, independente do data.js.
  var store = {
    name: "La Brunet",
    pricesAreSample: false,
    hours: {
      confirmed: true,
      days: [
        { day: 0, open: "07:00", close: "13:00" },
        { day: 2, open: "06:00", close: "21:00" },
        { day: 3, open: "06:00", close: "21:00" },
        { day: 4, open: "06:00", close: "21:00" },
        { day: 5, open: "06:00", close: "21:00" },
        { day: 6, open: "06:00", close: "21:00" }
      ]
    },
    orders: { leadHours: 24, windowDays: 14, slotMinutes: 30, slotMarginMinutes: 60 }
  };
  var products = [
    { id: "a", name: "Pão A", desc: "Crocante", price: 1.2, unit: "unidade", tags: ["vegano"] },
    { id: "b", name: "Bolo B", desc: "Chocolate", price: 120, unit: "kg (mínimo 2 kg)", tags: ["encomenda"], min: 2 },
    { id: "c", name: "Coxinha", desc: "Frango com catupiry", price: 9.9, unit: "unidade", tags: [] }
  ];

  // 2026-10-14 é uma quarta-feira.
  var WED_10H = new Date(2026, 9, 14, 10, 0);

  /* ---------- Formatação ---------- */

  test("formatBRL formata reais com vírgula e milhar", function () {
    eq(L.formatBRL(0), "R$ 0,00");
    eq(L.formatBRL(1.2), "R$ 1,20");
    eq(L.formatBRL(1234.5), "R$ 1.234,50");
    eq(L.formatBRL(0.1 + 0.2), "R$ 0,30");
  });

  test("parseHM, formatHM e shortHM", function () {
    eq(L.parseHM("06:30"), 390);
    eq(L.formatHM(390), "06:30");
    eq(L.shortHM("21:00"), "21h");
    eq(L.shortHM("07:30"), "7h30");
  });

  test("formatPhone e validatePhone", function () {
    eq(L.formatPhone("11987654321"), "(11) 98765-4321");
    eq(L.formatPhone("1129776777"), "(11) 2977-6777");
    ok(L.validatePhone("(11) 98765-4321"));
    ok(L.validatePhone("+55 11 2977-6777"));
    ok(!L.validatePhone("98765-4321"), "sem DDD deve falhar");
  });

  /* ---------- Horários ---------- */

  test("getStatus: aberto durante o expediente", function () {
    var s = L.getStatus(store.hours, WED_10H);
    ok(s.open);
    eq(s.label, "Aberto agora · até 21h");
  });

  test("getStatus: antes de abrir", function () {
    var s = L.getStatus(store.hours, new Date(2026, 9, 14, 5, 15));
    ok(!s.open);
    eq(s.label, "Fechado · abre hoje às 6h");
  });

  test("getStatus: depois de fechar abre amanhã", function () {
    var s = L.getStatus(store.hours, new Date(2026, 9, 14, 21, 0));
    ok(!s.open, "21h em ponto já está fechado");
    eq(s.label, "Fechado · abre amanhã às 6h");
  });

  test("getStatus: pula o dia fechado (segunda)", function () {
    var s = L.getStatus(store.hours, new Date(2026, 9, 18, 14, 0)); // domingo 14h
    eq(s.label, "Fechado · abre terça às 6h");
  });

  test("groupHours agrupa dias iguais e marca fechado", function () {
    var g = L.groupHours(store.hours);
    eq(g.map(function (x) { return x.label + ": " + x.text; }), [
      "Segunda: Fechado",
      "Terça a sábado: 6h às 21h",
      "Domingo: 7h às 13h"
    ]);
  });

  test("groupHours do data.js cobre os 7 dias", function () {
    var days = [];
    L.groupHours(D.store.hours).forEach(function (g) { days = days.concat(g.days); });
    eq(days.sort(), [0, 1, 2, 3, 4, 5, 6]);
  });

  /* ---------- Encomendas: dias e horários ---------- */

  test("slotsFor respeita antecedência de 24h", function () {
    var tomorrow = new Date(2026, 9, 15);
    var slots = L.slotsFor(store, tomorrow, WED_10H);
    eq(slots[0], "10:00", "primeiro horário amanhã é 24h depois");
    eq(slots[slots.length - 1], "20:00", "último é 1h antes de fechar");
  });

  test("slotsFor não oferece hoje nem dia fechado", function () {
    eq(L.slotsFor(store, new Date(2026, 9, 14), WED_10H), []);
    eq(L.slotsFor(store, new Date(2026, 9, 19), WED_10H), [], "segunda fechada");
  });

  test("availableDates começa amanhã e pula segundas", function () {
    var dates = L.availableDates(store, WED_10H).map(L.isoDate);
    eq(dates[0], "2026-10-15");
    ok(dates.indexOf("2026-10-19") === -1, "segunda não aparece");
    ok(dates.indexOf("2026-10-28") !== -1, "dentro da janela de 14 dias");
    ok(dates.indexOf("2026-10-29") === -1, "fora da janela");
  });

  test("availableDates: pedido às 20h30 pula para depois de amanhã", function () {
    var late = new Date(2026, 9, 14, 20, 30);
    eq(L.slotsFor(store, new Date(2026, 9, 15), late), [], "amanhã já não cabe 24h");
    eq(L.isoDate(L.availableDates(store, late)[0]), "2026-10-16");
  });

  test("isoDate e parseIsoDate fazem ida e volta", function () {
    var d = new Date(2026, 0, 5);
    eq(L.isoDate(d), "2026-01-05");
    eq(L.parseIsoDate("2026-01-05").getTime(), d.getTime());
  });

  /* ---------- Carrinho ---------- */

  test("cartAdd soma e remove ao zerar", function () {
    var c = L.cartAdd({}, "a", 1);
    c = L.cartAdd(c, "a", 2);
    eq(c, { a: 3 });
    c = L.cartAdd(c, "a", -3);
    eq(c, {});
  });

  test("cartAdd não altera o carrinho original", function () {
    var c = { a: 1 };
    L.cartAdd(c, "a", 1);
    eq(c, { a: 1 });
  });

  test("cartSet limita e limpa valores inválidos", function () {
    eq(L.cartSet({ a: 1 }, "a", 0), {});
    eq(L.cartSet({}, "a", "abc"), {});
    eq(L.cartSet({}, "a", 5000), { a: 999 });
  });

  test("cartTotal e cartCount ignoram itens inexistentes", function () {
    var c = { a: 10, c: 3, fantasma: 4 };
    eq(L.cartCount(c, products), 13);
    eq(L.cartTotal(c, products), 41.7);
  });

  /* ---------- Validação e mensagem ---------- */

  function goodOrder() {
    return { cart: { a: 2, b: 2 }, date: "2026-10-15", time: "15:00", name: "Ana", phone: "11987654321", notes: "" };
  }

  test("validateOrder aceita pedido completo", function () {
    eq(L.validateOrder(goodOrder(), store, products, WED_10H), {});
  });

  test("validateOrder aponta cada campo faltando", function () {
    var e = L.validateOrder({ cart: {}, date: null, time: null, name: "", phone: "123" }, store, products, WED_10H);
    eq(Object.keys(e).sort(), ["cart", "date", "name", "phone"]);
  });

  test("validateOrder exige mínimo do bolo", function () {
    var o = goodOrder();
    o.cart = { b: 1 };
    ok(/mínimo de 2 kg/.test(L.validateOrder(o, store, products, WED_10H).cart));
  });

  test("validateOrder recusa horário que já passou da antecedência", function () {
    var o = goodOrder();
    o.time = "08:00";
    ok(L.validateOrder(o, store, products, WED_10H).time);
  });

  test("buildOrderMessage traz itens, total, retirada e contato", function () {
    var o = goodOrder();
    o.notes = "Bolo de brigadeiro";
    var m = L.buildOrderMessage(o, store, products);
    ok(m.indexOf("• 2 × Pão A (unidade) — R$ 2,40") !== -1, "linha do pão");
    ok(m.indexOf("Total estimado: R$ 242,40") !== -1, "total");
    ok(m.indexOf("Retirada: quinta, 15 de outubro, às 15h00") !== -1, "retirada");
    ok(m.indexOf("Telefone: (11) 98765-4321") !== -1, "telefone");
    ok(m.indexOf("Observações: Bolo de brigadeiro") !== -1, "observações");
    ok(m.indexOf("referência") === -1, "sem aviso quando preço é real");
  });

  test("buildOrderMessage avisa quando preços são de referência", function () {
    var s = Object.assign({}, store, { pricesAreSample: true });
    ok(L.buildOrderMessage(goodOrder(), s, products).indexOf("Valores do site são de referência") !== -1);
  });

  test("whatsappLink codifica o texto", function () {
    eq(L.whatsappLink("+55 (11) 99999-0000", "Olá & tchau"), "https://wa.me/5511999990000?text=Ol%C3%A1%20%26%20tchau");
  });

  /* ---------- Busca ---------- */

  test("searchProducts ignora acentos e combina termos", function () {
    eq(L.searchProducts(products, "pao", null).map(function (p) { return p.id; }), ["a"]);
    eq(L.searchProducts(products, "FRANGO catupiry", null).map(function (p) { return p.id; }), ["c"]);
    eq(L.searchProducts(products, "vegano", "todos").map(function (p) { return p.id; }), ["a"]);
    eq(L.searchProducts(products, "", null).length, 3);
  });

  /* ---------- Dados do site ---------- */

  test("data.js: ids únicos e categorias válidas", function () {
    var ids = {}, cats = {};
    D.categories.forEach(function (c) { cats[c.id] = true; });
    D.products.forEach(function (p) {
      ok(!ids[p.id], "id repetido: " + p.id);
      ids[p.id] = true;
      ok(cats[p.cat], "categoria inválida em " + p.id);
      ok(typeof p.price === "number" && p.price > 0, "preço inválido em " + p.id);
      ok(p.name && p.desc && p.unit, "campos faltando em " + p.id);
    });
  });

  test("data.js: destaques têm foto e toda categoria tem item", function () {
    D.products.filter(function (p) { return p.featured; }).forEach(function (p) { ok(p.img, "destaque sem foto: " + p.id); });
    D.categories.forEach(function (c) {
      ok(D.products.some(function (p) { return p.cat === c.id; }), "categoria vazia: " + c.id);
    });
  });

  test("data.js: galeria tem texto alternativo", function () {
    D.gallery.forEach(function (g) { ok(g.alt && g.alt.length > 5, "foto sem alt: " + g.src); });
  });

  /* ---------- Saída ---------- */

  var failed = results.filter(function (r) { return !r.ok; });
  document.getElementById("results").innerHTML = results.map(function (r) {
    return '<li class="' + (r.ok ? "ok" : "fail") + '">' + (r.ok ? "✓ " : "✗ ") + r.name + (r.ok ? "" : " — " + r.error) + "</li>";
  }).join("");
  var summary = document.querySelector("[data-summary]");
  summary.textContent = failed.length ? failed.length + " de " + results.length + " testes falharam" : "Todos os " + results.length + " testes passaram";
  summary.className = failed.length ? "fail" : "ok";
  window.LB_TEST_RESULTS = { total: results.length, failed: failed };
})();
