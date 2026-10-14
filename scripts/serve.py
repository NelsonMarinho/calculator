#!/usr/bin/env python3
"""Local preview serving only public app files. Production must use HTTPS."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse

ROOT = Path(__file__).resolve().parents[1]

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.webmanifest': 'application/manifest+json', '.js': 'text/javascript'}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def public_file(self):
        path = unquote(urlsplit(self.path).path).lstrip('/') or 'index.html'
        target = (ROOT / path).resolve()
        allowed = path in ('index.html', 'manifest.webmanifest', 'sw.js') or path.startswith('assets/')
        if not allowed or not target.is_relative_to(ROOT) or not target.is_file():
            self.send_error(404)
            return False
        return True

    def do_GET(self):
        if self.public_file():
            super().do_GET()

    def do_HEAD(self):
        if self.public_file():
            super().do_HEAD()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8080)
    parser.add_argument('--dist', action='store_true', help='Servir o build de produção em dist')
    args = parser.parse_args()
    if args.dist:
        ROOT = ROOT / 'dist'
    if not (ROOT / 'index.html').is_file():
        raise SystemExit('Execute npm run build antes de iniciar a prévia.')
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print(f'Abra http://localhost:{args.port} no notebook. Android precisa do endereço HTTPS publicado.', flush=True)
    server.serve_forever()
