from pathlib import Path
import tempfile
import unittest

from generate_images_manifest import build_manifest


class GenerateImagesManifestTest(unittest.TestCase):
    def test_build_manifest_lists_supported_images_and_ignores_others(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            images_dir = root / "imagens"
            images_dir.mkdir()

            (images_dir / "foto1.jpg").write_bytes(b"img")
            (images_dir / "foto2.png").write_bytes(b"img")
            (images_dir / "ignore.txt").write_text("ignore", encoding="utf-8")

            output_path = root / "images.json"
            manifest = build_manifest(images_dir, output_path)

            self.assertEqual(manifest, ["foto1.jpg", "foto2.png"])
            self.assertTrue(output_path.exists())
            self.assertEqual(output_path.read_text(encoding="utf-8"), '["foto1.jpg", "foto2.png"]\n')


if __name__ == "__main__":
    unittest.main()
