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

  // Horário fixo de teste, independente do data.js (segunda fechada).
  var hours = {
    confirmed: true,
    days: [
      { day: 0, open: "07:00", close: "13:00" },
      { day: 2, open: "06:00", close: "21:00" },
      { day: 3, open: "06:00", close: "21:00" },
      { day: 4, open: "06:00", close: "21:00" },
      { day: 5, open: "06:00", close: "21:00" },
      { day: 6, open: "06:00", close: "21:00" }
    ]
  };
  var products = [
    { id: "a", cat: "paes", name: "Pão A", desc: "Crocante", price: 1.2, unit: "unidade", tags: ["vegano"] },
    { id: "b", cat: "festas", name: "Bolo B", desc: "Chocolate", price: 120, unit: "kg", tags: ["encomenda"] },
    { id: "c", cat: "salgados", name: "Coxinha", desc: "Frango com catupiry", price: 9.9, unit: "unidade", tags: [] }
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

  test("parseHM e shortHM", function () {
    eq(L.parseHM("06:30"), 390);
    eq(L.shortHM("21:00"), "21h");
    eq(L.shortHM("07:30"), "7h30");
  });

  /* ---------- Horários ---------- */

  test("getStatus: aberto durante o expediente", function () {
    var s = L.getStatus(hours, WED_10H);
    ok(s.open);
    eq(s.label, "Aberto agora · até 21h");
  });

  test("getStatus: antes de abrir", function () {
    var s = L.getStatus(hours, new Date(2026, 9, 14, 5, 15));
    ok(!s.open);
    eq(s.label, "Fechado · abre hoje às 6h");
  });

  test("getStatus: depois de fechar abre amanhã", function () {
    var s = L.getStatus(hours, new Date(2026, 9, 14, 21, 0));
    ok(!s.open, "21h em ponto já está fechado");
    eq(s.label, "Fechado · abre amanhã às 6h");
  });

  test("getStatus: pula o dia fechado (segunda)", function () {
    var s = L.getStatus(hours, new Date(2026, 9, 18, 14, 0)); // domingo 14h
    eq(s.label, "Fechado · abre terça às 6h");
  });

  test("groupHours agrupa dias iguais e marca fechado", function () {
    var g = L.groupHours(hours);
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

  /* ---------- Links externos ---------- */

  test("ifoodLink usa a página configurada da loja", function () {
    var url = "https://www.ifood.com.br/delivery/sao-paulo-sp/la-brunet-santana/abc123";
    eq(L.ifoodLink({ name: "La Brunet", ifoodUrl: url }), url);
  });

  test("ifoodLink sem página configurada cai na busca pelo nome", function () {
    eq(L.ifoodLink({ name: "La Brunet", ifoodUrl: null }), "https://www.ifood.com.br/busca?q=La%20Brunet");
    eq(L.ifoodLink({ name: "La Brunet", ifoodUrl: "   " }), "https://www.ifood.com.br/busca?q=La%20Brunet");
  });

  test("ifoodLink recusa link que não é do iFood", function () {
    eq(L.ifoodLink({ name: "La Brunet", ifoodUrl: "https://exemplo.com/ifood.com.br/x" }), "https://www.ifood.com.br/busca?q=La%20Brunet");
    eq(L.ifoodLink({ name: "La Brunet", ifoodUrl: "javascript:alert(1)" }), "https://www.ifood.com.br/busca?q=La%20Brunet");
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

  test("searchProducts filtra por categoria", function () {
    eq(L.searchProducts(products, "", "festas").map(function (p) { return p.id; }), ["b"]);
    eq(L.searchProducts(products, "pao", "festas"), []);
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

  test("data.js: link do iFood gera endereço do iFood", function () {
    ok(/^https:\/\/www\.ifood\.com\.br\//.test(L.ifoodLink(D.store)));
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
