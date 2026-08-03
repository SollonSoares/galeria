from __future__ import annotations

import json
import os
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import quote, unquote

ROOT_DIR = Path(__file__).resolve().parent
IMAGES_DIR = ROOT_DIR / "imagens"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

SUPPORTED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".avif",
    ".tiff", ".tif", ".ico"
}


class GalleryHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path == "/api/images":
            self._send_images_json()
            return

        if self.path.startswith("/imagens/"):
            self._serve_image()
            return

        if self.path in {"/", "/index.html"}:
            self._serve_file("index.html")
            return

        if self.path == "/style.css":
            self._serve_file("style.css")
            return

        if self.path == "/script.js":
            self._serve_file("script.js")
            return

        self.send_error(404, "Not found")

    def _serve_file(self, filename: str) -> None:
        file_path = ROOT_DIR / filename
        if not file_path.exists():
            self.send_error(404, "Not found")
            return

        content = file_path.read_bytes()
        mime_type = "text/html; charset=utf-8" if filename.endswith(".html") else "text/css; charset=utf-8" if filename.endswith(".css") else "application/javascript; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _serve_image(self) -> None:
        relative_path = unquote(self.path[len("/imagens/"):])
        file_path = (IMAGES_DIR / relative_path).resolve()
        if not file_path.exists() or not file_path.is_file() or file_path.parent != IMAGES_DIR.resolve():
            self.send_error(404, "Imagem não encontrada")
            return

        content = file_path.read_bytes()
        mime_type = "image/jpeg" if file_path.suffix.lower() in {".jpg", ".jpeg"} else "image/png" if file_path.suffix.lower() == ".png" else "image/gif" if file_path.suffix.lower() == ".gif" else "image/webp" if file_path.suffix.lower() == ".webp" else "image/bmp" if file_path.suffix.lower() == ".bmp" else "image/svg+xml" if file_path.suffix.lower() == ".svg" else "image/avif" if file_path.suffix.lower() == ".avif" else "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _send_images_json(self) -> None:
        images = []
        if IMAGES_DIR.exists():
            for file_path in sorted(IMAGES_DIR.iterdir(), key=lambda item: item.name.lower()):
                if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_EXTENSIONS:
                    images.append({
                        "name": file_path.name,
                        "url": f"/imagens/{quote(file_path.name)}"
                    })

        payload = json.dumps(images).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format: str, *args) -> None:
        return


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8000), GalleryHandler)
    print("Servidor iniciado em http://127.0.0.1:8000")
    server.serve_forever()
