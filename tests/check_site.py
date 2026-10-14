"""Verificação estática do site La Brunet.

Uso:  py tests/check_site.py

Confere no index.html: âncoras internas que apontam para ids existentes,
ids únicos, imagens com alt, links externos com rel="noopener", arquivos
locais referenciados que existem, e que os <use href="#..."> têm símbolo.
"""
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent


class Collector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.anchors = []
        self.uses = []
        self.imgs = []
        self.external = []
        self.local_refs = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.append(a["id"])
        href = a.get("href")
        if tag == "a" and href:
            if href.startswith("#"):
                self.anchors.append(href[1:])
            elif href.startswith("http"):
                self.external.append((href, a.get("target"), a.get("rel") or ""))
        if tag == "use" and href:
            self.uses.append(href[1:])
        if tag == "img":
            self.imgs.append(a)
        for key in ("src", "href"):
            v = a.get(key)
            if v and not re.match(r"^(https?:|#|tel:|mailto:|data:)", v) and tag in ("script", "link", "img"):
                self.local_refs.append(v)


def main():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    c = Collector()
    c.feed(html)
    errors = []

    dup = {i for i in c.ids if c.ids.count(i) > 1}
    if dup:
        errors.append(f"ids repetidos: {sorted(dup)}")

    ids = set(c.ids)
    for a in c.anchors:
        if a and a not in ids:
            errors.append(f"âncora #{a} não tem destino")

    for u in c.uses:
        if u not in ids:
            errors.append(f"<use href=#{u}> sem símbolo")

    for img in c.imgs:
        if "alt" not in img:
            errors.append(f"imagem sem alt: {img.get('src')}")

    for href, target, rel in c.external:
        if target == "_blank" and "noopener" not in rel:
            errors.append(f"link externo sem noopener: {href}")

    for ref in c.local_refs:
        if not (ROOT / ref).exists():
            errors.append(f"arquivo não encontrado: {ref}")

    # Ícones usados pelo JavaScript também precisam existir.
    js = (ROOT / "assets/js/app.js").read_text(encoding="utf-8")
    for icon in set(re.findall(r'#(i-[a-z]+)', js)):
        if icon not in ids:
            errors.append(f"app.js usa ícone inexistente: {icon}")

    # Seletores data-* usados pelo JavaScript precisam existir no HTML.
    for attr in set(re.findall(r'\$\("\[(data-[a-z-]+)\]', js)):
        if attr not in html:
            errors.append(f"app.js procura [{attr}], que não está no HTML")

    checks = 8
    if errors:
        print(f"FALHOU ({len(errors)} problemas):")
        for e in errors:
            print("  -", e)
        sys.exit(1)
    print(f"OK: {checks} verificações, {len(c.ids)} ids, {len(c.anchors)} âncoras, {len(c.imgs)} imagens, {len(c.local_refs)} arquivos locais.")


if __name__ == "__main__":
    main()
