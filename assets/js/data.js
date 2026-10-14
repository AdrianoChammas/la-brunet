/*
 * La Brunet — dados do site.
 *
 * Tudo que é informação comercial fica aqui, para a loja revisar num lugar só.
 * Campos marcados com "confirmed: false" ainda precisam ser confirmados pela
 * La Brunet antes de o site ir ao ar (ver README.md, seção "Antes de publicar").
 */
(function (global) {
  "use strict";

  var IMG = function (id, w) {
    return "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&q=75&w=" + (w || 900);
  };

  var store = {
    name: "La Brunet",
    tagline: "Padaria, confeitaria e café em Santana",
    address: {
      street: "Rua Pedro Doll, 115",
      district: "Santana",
      city: "São Paulo",
      state: "SP",
      zip: "02404-000"
    },
    phone: { display: "(11) 2977-6777", tel: "+551129776777" },
    // Link da página da La Brunet no iFood (ex.:
    // "https://www.ifood.com.br/delivery/sao-paulo-sp/la-brunet-santana/...").
    // Enquanto for null, os botões abrem a busca do iFood por "La Brunet".
    ifoodUrl: null,
    // Número de WhatsApp da loja no formato internacional, só dígitos
    // (ex.: "5511999999999"). Enquanto for null, o contato mostra só o telefone.
    whatsapp: null,
    instagram: null,
    email: null,
    rating: { value: "4,3", count: "4.800+", source: "Google" },
    parking: "Estacionamento gratuito com manobrista",
    // Horário de referência. Dias: 0 = domingo … 6 = sábado.
    // "confirmed: false" exibe o aviso "horário a confirmar".
    hours: {
      confirmed: false,
      days: [
        { day: 0, open: "07:00", close: "20:00" },
        { day: 1, open: "06:00", close: "21:00" },
        { day: 2, open: "06:00", close: "21:00" },
        { day: 3, open: "06:00", close: "21:00" },
        { day: 4, open: "06:00", close: "21:00" },
        { day: 5, open: "06:00", close: "21:00" },
        { day: 6, open: "06:00", close: "21:00" }
      ]
    },
    // Enquanto true, os preços aparecem como valores de referência.
    pricesAreSample: true
  };

  var categories = [
    { id: "paes", label: "Pães", intro: "Fermentação longa, casca que estala e miolo aberto." },
    { id: "salgados", label: "Salgados", intro: "Assados e fritos durante o dia, para o balcão ou para levar." },
    { id: "confeitaria", label: "Confeitaria", intro: "Bolos, tortas e doces finos da nossa vitrine." },
    { id: "cafe", label: "Café da manhã", intro: "Na chapa, no prato e na xícara." },
    { id: "pizzas", label: "Pizzas", intro: "Massa da casa, forno quente, à noite e no fim de semana." },
    { id: "bebidas", label: "Bebidas", intro: "Cafés, chás gelados e sucos da fruta." },
    { id: "festas", label: "Encomendas & festas", intro: "Para aniversários, reuniões e cafés do escritório. Sob encomenda pelo telefone (11) 2977-6777." }
  ];

  // price em reais; unit descreve a unidade vendida.
  var products = [
    // Pães
    { id: "pao-frances", cat: "paes", name: "Pão francês", desc: "O de todo dia, saindo em fornadas ao longo do dia.", price: 1.2, unit: "unidade", tags: ["vegano"], featured: false },
    { id: "fermentacao-natural", cat: "paes", name: "Pão de fermentação natural", desc: "Levain, 36 horas de fermentação, casca escura e miolo úmido.", price: 28, unit: "unidade (700 g)", tags: ["vegano"], featured: true, img: IMG("1590301157172-7ba48dd1c2b2") },
    { id: "baguete", cat: "paes", name: "Baguete tradicional", desc: "Farinha, água, sal e tempo. Fina, crocante e leve.", price: 12, unit: "unidade", tags: ["vegano"], featured: false, img: IMG("1568471173242-461f0a730452") },
    { id: "integral-sementes", cat: "paes", name: "Integral de sementes", desc: "Trigo integral, girassol, linhaça e gergelim.", price: 22, unit: "unidade (600 g)", tags: ["vegano"], featured: false, img: IMG("1608198093002-ad4e005484ec") },
    { id: "pao-de-batata", cat: "paes", name: "Pão de batata", desc: "Massa macia de batata, recheado de requeijão ou de frango com catupiry.", price: 9.5, unit: "unidade", tags: [], featured: false },
    { id: "brioche", cat: "paes", name: "Brioche da casa", desc: "Manteiga e ovos, para torrada francesa ou para o lanche.", price: 26, unit: "unidade", tags: [], featured: false },

    // Salgados
    { id: "pao-de-queijo", cat: "salgados", name: "Pão de queijo", desc: "Polvilho e queijo meia-cura, crocante por fora e puxa-puxa por dentro.", price: 4.5, unit: "unidade", tags: ["sem glúten"], featured: true, img: IMG("1559141680-d0bd7bc5af84") },
    { id: "coxinha", cat: "salgados", name: "Coxinha de frango", desc: "Massa de batata e frango desfiado temperado na casa.", price: 9, unit: "unidade", tags: [], featured: false },
    { id: "esfiha", cat: "salgados", name: "Esfiha aberta", desc: "Carne, queijo ou escarola. Assada no forno de lastro.", price: 8, unit: "unidade", tags: [], featured: false },
    { id: "empada", cat: "salgados", name: "Empada de palmito", desc: "Massa podre amanteigada e recheio cremoso.", price: 10, unit: "unidade", tags: ["vegetariano"], featured: false },
    { id: "quiche", cat: "salgados", name: "Quiche lorraine", desc: "Bacon, queijo e creme, em fatia generosa.", price: 16, unit: "fatia", tags: [], featured: false },

    // Confeitaria
    { id: "croissant", cat: "confeitaria", name: "Croissant de manteiga", desc: "Folhado em camadas, laminado à mão com manteiga.", price: 12, unit: "unidade", tags: [], featured: true, img: IMG("1555507036-ab1f4038808a") },
    { id: "bolo-chocolate", cat: "confeitaria", name: "Bolo de chocolate belga", desc: "Camadas de massa úmida e ganache de chocolate meio amargo.", price: 19, unit: "fatia", tags: [], featured: true, img: IMG("1517427294546-5aa121f68e8a") },
    { id: "torta-morango", cat: "confeitaria", name: "Torta de morango", desc: "Pão de ló, creme de baunilha e morangos frescos.", price: 18, unit: "fatia", tags: [], featured: false, img: IMG("1602663491496-73f07481dbea") },
    { id: "cheesecake", cat: "confeitaria", name: "Cheesecake de frutas vermelhas", desc: "Base de biscoito amanteigado e calda da casa.", price: 18, unit: "fatia", tags: [], featured: false, img: IMG("1524351199678-941a58a3df50") },
    { id: "sonho", cat: "confeitaria", name: "Sonho de creme", desc: "Massa fofinha, creme de baunilha e açúcar de confeiteiro.", price: 8.5, unit: "unidade", tags: [], featured: false },
    { id: "bolo-vegano", cat: "confeitaria", name: "Bolo vegano de cenoura", desc: "Sem leite e sem ovos, com cobertura de chocolate 70%.", price: 14, unit: "fatia", tags: ["vegano"], featured: false },

    // Café da manhã
    { id: "pao-na-chapa", cat: "cafe", name: "Pão na chapa", desc: "Pão francês com manteiga, tostado na chapa.", price: 8, unit: "porção", tags: ["vegetariano"], featured: false },
    { id: "misto-quente", cat: "cafe", name: "Misto quente", desc: "Presunto e queijo derretido no pão de forma da casa.", price: 16, unit: "porção", tags: [], featured: false, img: IMG("1528735602780-2552fd46c7af") },
    { id: "ovos-mexidos", cat: "cafe", name: "Ovos mexidos com torradas", desc: "Ovos cremosos, ciboulette e torradas de fermentação natural.", price: 24, unit: "prato", tags: ["vegetariano"], featured: false },
    { id: "cafe-completo", cat: "cafe", name: "Café da manhã La Brunet", desc: "Cesta de pães, frios, frutas, iogurte com granola, suco e café.", price: 54, unit: "por pessoa", tags: [], featured: true, img: IMG("1531856396526-a0c8d7bd628b") },
    { id: "tapioca", cat: "cafe", name: "Tapioca", desc: "Queijo coalho, ou banana com canela.", price: 15, unit: "unidade", tags: ["sem glúten"], featured: false },

    // Pizzas
    { id: "pizza-margherita", cat: "pizzas", name: "Margherita", desc: "Molho de tomate, muçarela, manjericão e azeite.", price: 72, unit: "grande, 8 pedaços", tags: ["vegetariano"], featured: false, img: IMG("1574071318508-1cdbab80d002") },
    { id: "pizza-calabresa", cat: "pizzas", name: "Calabresa", desc: "Calabresa fatiada, cebola roxa e azeitonas.", price: 68, unit: "grande, 8 pedaços", tags: [], featured: false },
    { id: "pizza-portuguesa", cat: "pizzas", name: "Portuguesa", desc: "Presunto, ovos, cebola, ervilha e muçarela.", price: 76, unit: "grande, 8 pedaços", tags: [], featured: false },
    { id: "pizza-vegana", cat: "pizzas", name: "Vegana de legumes", desc: "Abobrinha, berinjela, tomate-cereja e queijo vegetal.", price: 74, unit: "grande, 8 pedaços", tags: ["vegano"], featured: false },

    // Bebidas
    { id: "espresso", cat: "bebidas", name: "Espresso", desc: "Grãos especiais, extração curta.", price: 7, unit: "xícara", tags: ["vegano"], featured: false },
    { id: "cappuccino", cat: "bebidas", name: "Cappuccino", desc: "Espresso, leite vaporizado e espuma.", price: 13, unit: "xícara", tags: [], featured: false, img: IMG("1550731358-491ded4af838") },
    { id: "cha-gelado", cat: "bebidas", name: "Chá gelado da casa", desc: "Chá preto, limão e hortelã, feito todos os dias.", price: 12, unit: "copo 400 ml", tags: ["vegano"], featured: false, img: IMG("1556679343-c7306c1976bc") },
    { id: "suco-laranja", cat: "bebidas", name: "Suco de laranja", desc: "Espremido na hora.", price: 12, unit: "copo 400 ml", tags: ["vegano"], featured: false },

    // Encomendas & festas
    { id: "bolo-inteiro", cat: "festas", name: "Bolo de aniversário", desc: "Recheios: brigadeiro, ninho com morango, doce de leite ou chocolate belga.", price: 120, unit: "kg (mínimo 2 kg)", tags: ["encomenda"], featured: false },
    { id: "cento-salgados", cat: "festas", name: "Cento de salgadinhos", desc: "Coxinha, risoles, bolinha de queijo e quibe, fritos na hora.", price: 95, unit: "cento", tags: ["encomenda"], featured: false },
    { id: "cento-docinhos", cat: "festas", name: "Cento de docinhos", desc: "Brigadeiro, beijinho e bicho de pé, em forminhas.", price: 140, unit: "cento", tags: ["encomenda"], featured: false },
    { id: "pao-metro", cat: "festas", name: "Pão de metro recheado", desc: "Frios, salada e molho da casa. Serve cerca de 15 pessoas.", price: 160, unit: "metro", tags: ["encomenda"], featured: false },
    { id: "cesta-cafe", cat: "festas", name: "Cesta de café da manhã", desc: "Para presentear: pães, bolo, frios, frutas, geleia e café.", price: 189, unit: "cesta (2 pessoas)", tags: ["encomenda"], featured: false }
  ];

  var gallery = [
    { src: IMG("1509440159596-0249088772ff", 1400), alt: "Pães rústicos com sementes e ramos de trigo sobre a mesa", size: "wide" },
    { src: IMG("1537734796389-e1fc293cf856", 900), alt: "Mãos segurando uma bola de massa de pão", size: "tall" },
    { src: IMG("1530610476181-d83430b64dcd", 900), alt: "Croissants recém-assados no balcão", size: "" },
    { src: IMG("1534432182912-63863115e106", 900), alt: "Vitrine com doces, tortas e folhados", size: "" },
    { src: IMG("1543233604-3baca4d35513", 900), alt: "Xícara de café sobre livros", size: "tall" },
    { src: IMG("1620921592619-652411a0d01a", 1400), alt: "Pão de fermentação natural fatiado sobre tábua", size: "wide" },
    { src: IMG("1595801105145-795f1927c0fc", 900), alt: "Farinha caindo sobre a massa", size: "" },
    { src: IMG("1609590981063-d495e2914ce4", 900), alt: "Folhados e pães doces servidos na mesa", size: "" }
  ];

  global.LB_DATA = {
    store: store,
    categories: categories,
    products: products,
    gallery: gallery,
    img: IMG
  };
})(window);
