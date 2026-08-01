from __future__ import annotations

import json
import os
from email.parser import BytesParser
from email.policy import default
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote

ROOT_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = (ROOT_DIR.parent / "uploads").resolve()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class GalleryHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def do_GET(self) -> None:
        if self.path == "/api/images":
            self._handle_list_images()
            return

        super().do_GET()

    def translate_path(self, path: str) -> str:
        if path.startswith("/uploads/"):
            relative_path = unquote(path[len("/uploads/"):])
            return str((UPLOAD_DIR / relative_path).resolve())

        return super().translate_path(path)

    def do_POST(self) -> None:
        if self.path == "/upload":
            self._handle_upload()
            return

        self.send_error(404, "Not found")

    def _handle_list_images(self) -> None:
        supported_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".avif"}

        images: list[str] = []
        for images_dir in (ROOT_DIR / "imagens", UPLOAD_DIR):
            if images_dir.exists():
                images.extend(
                    file.name for file in images_dir.iterdir()
                    if file.is_file() and file.suffix.lower() in supported_extensions
                )

        images = sorted(set(images))
        self._send_json(200, {"images": images})

    def _handle_upload(self) -> None:
        content_type = self.headers.get("Content-Type", "")
        content_length = int(self.headers.get("Content-Length", "0"))

        if not content_type.startswith("multipart/form-data"):
            self._send_json(400, {"error": "Content-Type inválido para upload"})
            return

        raw_body = self.rfile.read(content_length)
        message = BytesParser(policy=default).parsebytes(
            f"Content-Type: {content_type}\r\n\r\n".encode("utf-8") + raw_body
        )

        image_part = None
        for part in message.iter_parts():
            filename = part.get_filename()
            if filename:
                image_part = part
                break

        if image_part is None:
            self._send_json(400, {"error": "Nenhuma imagem foi enviada"})
            return

        original_name = os.path.basename(image_part.get_filename())
        target_path = UPLOAD_DIR / original_name

        if target_path.exists():
            stem = Path(original_name).stem
            suffix = Path(original_name).suffix
            counter = 1
            while True:
                candidate = UPLOAD_DIR / f"{stem}_{counter}{suffix}"
                if not candidate.exists():
                    target_path = candidate
                    break
                counter += 1

        content = image_part.get_payload(decode=True)
        if content is None:
            self._send_json(400, {"error": "Conteúdo da imagem indisponível"})
            return

        with target_path.open("wb") as destination:
            destination.write(content)

        self._send_json(200, {
            "message": "Imagem enviada com sucesso",
            "filename": target_path.name,
        })

    def _send_json(self, status_code: int, payload: dict) -> None:
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8000), GalleryHandler)
    print(f"Servidor em execução em http://127.0.0.1:8000")
    print(f"Pasta externa de destino: {UPLOAD_DIR}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
        server.server_close()
