"""Servidor local de desenvolvimento, sem cache.

Uso:  py tests/serve.py [porta]
Depois abra http://localhost:8417/ (site) e http://localhost:8417/tests/ (testes).
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8417
    handler = partial(NoCacheHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    print(f"La Brunet em http://localhost:{port}/")
    server.serve_forever()


if __name__ == "__main__":
    main()
