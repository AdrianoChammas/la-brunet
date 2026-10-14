# La Brunet — site

Site da **La Brunet**, padaria, confeitaria e café na Rua Pedro Doll, 115, em Santana (São Paulo).

Página única, estática (HTML, CSS e JavaScript puros, sem build), pronta para o GitHub Pages.

## O que tem

- **Abertura** com fotografia em tela cheia, marca, chamadas para o cardápio e para encomendas, e destaques da casa.
- **Cabeçalho fixo** com endereço, telefone e status "aberto agora / fecha às…" calculado pelo horário; menu em gaveta no celular.
- **Da fornada**: composição editorial com os cinco produtos em destaque.
- **Cardápio** completo por categoria (pães, salgados, confeitaria, café da manhã, pizzas, bebidas, encomendas & festas), com filtro por categoria, busca sem acento ("pao" acha "pão") e etiquetas vegano / sem glúten / vegetariano.
- **Encomendas** em quatro passos: itens (com quantidade e pedido mínimo, ex.: bolo a partir de 2 kg), dia, horário (respeitando antecedência mínima e o horário da loja) e dados do cliente. O pedido sai pronto pelo WhatsApp ou, sem WhatsApp configurado, é copiado e o cliente liga para a loja.
- **Suas encomendas neste aparelho**: histórico local para repetir um pedido, copiar ou falar com a loja.
- **A casa**: narrativa da marca e diferenciais.
- **Galeria** com ampliação das fotos.
- **Visite**: endereço, rota no Google Maps, tabela de horários com o dia de hoje destacado, contato e mapa que só carrega quando o visitante pede.
- Barra fixa no celular com o resumo da encomenda.
- Acessibilidade: navegação por teclado, foco visível, textos alternativos, `prefers-reduced-motion` respeitado.

## Estrutura

```
index.html              página
assets/css/styles.css   identidade visual e layout
assets/js/data.js       DADOS DA LOJA: endereço, horários, WhatsApp, cardápio, preços, galeria
assets/js/lib.js        funções puras (horários, carrinho, validação, mensagem do pedido)
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

- `tests/index.html` + `tests/lib.test.js`: 29 testes das funções de horário, carrinho, validação, mensagem do pedido, busca e da consistência dos dados. Abra http://localhost:8417/tests/ com o servidor rodando.
- `tests/check_site.py`: verificação estática do HTML (âncoras, ids, textos alternativos, ícones e arquivos referenciados).

```bash
py tests/check_site.py
```

## Antes de publicar

Algumas informações não puderam ser confirmadas em fontes públicas e estão marcadas no `data.js`:

| Item | Situação | Onde mudar |
| --- | --- | --- |
| WhatsApp da loja | não informado — o pedido é copiado e o cliente liga para (11) 2977-6777 | `store.whatsapp` |
| Horário de funcionamento | **de referência** — aparece com "*" e aviso "a confirmar" | `store.hours` e `confirmed: true` |
| Preços | **de referência** — aparecem com "*" e aviso | `price` de cada produto e `pricesAreSample: false` |
| Cardápio | itens típicos de padaria; confirmar com a loja | `products` |
| Fotos | ilustrativas, do Unsplash (licença livre); trocar por fotos da própria La Brunet | `IMG(...)` em `data.js` e `index.html` |
| Instagram / e-mail | não informados | `store.instagram`, `store.email` |
| Nota no Google | 4,3 com mais de 4.800 avaliações, segundo diretório público | `index.html` (abertura) |

Endereço e telefone foram obtidos em diretório público (Bendito Guia).

## Publicar no GitHub Pages

No repositório: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
