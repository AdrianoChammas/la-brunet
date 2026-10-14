# La Brunet — site

Site da **La Brunet**, padaria, confeitaria e café na Rua Pedro Doll, 115, em Santana (São Paulo).

Página única, estática (HTML, CSS e JavaScript puros, sem build), pronta para o GitHub Pages.

## O que tem

- **Abertura** com fotografia em tela cheia, marca, chamadas para o cardápio e para o delivery no iFood, e destaques da casa.
- **Cabeçalho fixo** com endereço, telefone e status "aberto agora / fecha às…" calculado pelo horário; menu em gaveta no celular.
- **Da fornada**: composição editorial com os cinco produtos em destaque.
- **Cardápio** completo por categoria (pães, salgados, confeitaria, café da manhã, pizzas, bebidas, encomendas & festas), com filtro por categoria, busca sem acento ("pao" acha "pão") e etiquetas vegano / sem glúten / vegetariano.
- **Delivery**: os pedidos são feitos no iFood. O botão "Pedir no iFood" aparece no cabeçalho, na abertura, no menu do celular, no cardápio, na seção Delivery e no contato. Bolos inteiros e itens de festa são encomendados pelo telefone.
- **A casa**: narrativa da marca e diferenciais.
- **Galeria** com ampliação das fotos.
- **Visite**: endereço, rota no Google Maps, tabela de horários com o dia de hoje destacado, contato e mapa que só carrega quando o visitante pede.
- Barra fixa no celular com atalho para o iFood.
- Acessibilidade: navegação por teclado, foco visível, textos alternativos, `prefers-reduced-motion` respeitado.

## Estrutura

```
index.html              página
assets/css/styles.css   identidade visual e layout
assets/js/data.js       DADOS DA LOJA: endereço, horários, link do iFood, WhatsApp, cardápio, preços, galeria
assets/js/lib.js        funções puras (horários, links do iFood e WhatsApp, busca)
assets/js/app.js        comportamento da página
assets/img/favicon.svg  ícone
tests/                  testes e servidor local
```

Para mudar produtos, preços, horários ou contatos, edite só `assets/js/data.js`.

## Rodar localmente

```bash
py tests/serve.py
```

Abra http://localhost:8417/ (site) e http://localhost:8417/tests/ (testes).

## Testes

- `tests/index.html` + `tests/lib.test.js`: testes das funções de horário, links do iFood e WhatsApp, busca e da consistência dos dados. Abra http://localhost:8417/tests/ com o servidor rodando.
- `tests/check_site.py`: verificação estática do HTML (âncoras, ids, textos alternativos, ícones e arquivos referenciados).

```bash
py tests/check_site.py
```

## Antes de publicar

Algumas informações não puderam ser confirmadas em fontes públicas e estão marcadas no `data.js`:

| Item | Situação | Onde mudar |
| --- | --- | --- |
| **Link do iFood** | **não informado** — os botões abrem a busca do iFood por "La Brunet" | `store.ifoodUrl` |
| WhatsApp da loja | não informado — o contato mostra só o telefone | `store.whatsapp` |
| Horário de funcionamento | **de referência** — aparece com "*" e aviso "a confirmar" | `store.hours` e `confirmed: true` |
| Preços | **de referência** — aparecem com "*" e aviso | `price` de cada produto e `pricesAreSample: false` |
| Cardápio | itens típicos de padaria; confirmar com a loja | `products` |
| Fotos | ilustrativas, do Unsplash (licença livre); trocar por fotos da própria La Brunet | `IMG(...)` em `data.js` e `index.html` |
| Instagram / e-mail | não informados | `store.instagram`, `store.email` |
| Nota no Google | 4,3 com mais de 4.800 avaliações, segundo diretório público | `index.html` (abertura) |

Endereço e telefone foram obtidos em diretório público (Bendito Guia).

## Publicar no GitHub Pages

No repositório: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
