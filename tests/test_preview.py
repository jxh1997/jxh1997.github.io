import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from mkdocs.commands.build import build

from scripts.preview import PreviewBuilder


class PreviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.docs = self.root / "docs"
        self.docs.mkdir()
        (self.docs / "index.md").write_text("# Home\n\nOriginal text.\n")
        (self.docs / "other.md").write_text("# Other\n\nKeep this page.\n")
        (self.docs / "map.html").write_text("<h1>Map</h1>")
        self.config = self.root / "mkdocs.yml"
        self.config.write_text("site_name: Test\nplugins: []\nnav:\n  - index.md\n  - other.md\n")
        self.builder = PreviewBuilder(self.config, self.root / "cache")
        self.build = patch("scripts.preview.build", wraps=build).start()
        self.addCleanup(patch.stopall)

    def run_build(self):
        self.builder()
        return self.build.call_args.kwargs["dirty"]

    def test_content_and_html_updates_reuse_unchanged_pages(self):
        self.assertFalse(self.run_build())
        other = self.root / "cache/site/other/index.html"
        original_time = other.stat().st_mtime_ns
        self.assertTrue(self.run_build())
        (self.docs / "index.md").write_text("# Home\n\nUpdated text.\n")
        self.assertTrue(self.run_build())
        rendered = (self.root / "cache/site/index.html").read_text()
        self.assertIn("Updated text.", rendered)
        self.assertIn('href="other/"', rendered)
        self.assertEqual(other.stat().st_mtime_ns, original_time)
        (self.docs / "map.html").write_text("<h1>New map</h1>")
        self.assertTrue(self.run_build())
        self.assertEqual((self.root / "cache/site/map.html").read_text(), "<h1>New map</h1>")
        # A fresh process can reuse the same successful build.
        self.builder = PreviewBuilder(self.config, self.root / "cache")
        self.assertTrue(self.run_build())

    def test_structural_and_global_changes_invalidate_cache(self):
        self.assertFalse(self.run_build())
        (self.docs / "added.markdown").write_text("# Added\n")
        self.assertFalse(self.run_build())
        (self.docs / "added.markdown").unlink()
        self.assertFalse(self.run_build())
        self.assertFalse((self.root / "cache/site/added/index.html").exists())
        (self.docs / "map.html").unlink()
        self.assertFalse(self.run_build())
        self.assertFalse((self.root / "cache/site/map.html").exists())
        (self.docs / "index.md").write_text("---\ntitle: Updated title\n---\n# Home\n")
        self.assertFalse(self.run_build())
        (self.docs / "other.md").write_text("# Changed heading\n")
        self.assertFalse(self.run_build())
        self.config.write_text(self.config.read_text().replace("Test", "New site"))
        self.assertFalse(self.run_build())

    def test_failed_build_invalidates_success_marker(self):
        self.run_build()
        self.build.side_effect = RuntimeError("Interrupted build")
        with self.assertRaises(RuntimeError):
            self.builder()
        self.assertFalse((self.root / "cache/state.json").exists())
        self.build.side_effect = None
        self.assertFalse(self.run_build())


if __name__ == "__main__":
    unittest.main()
