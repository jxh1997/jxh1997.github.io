"""Persistent MkDocs preview with conservative cache invalidation."""

import argparse
import hashlib
import json
import logging
import re
from importlib.metadata import version
from pathlib import Path

from mkdocs.commands.build import build
from mkdocs.config import load_config
from mkdocs.livereload import LiveReloadServer
from mkdocs.utils import is_markdown_file


ROOT = Path(__file__).resolve().parents[1]
LOG = logging.getLogger("mkdocs.preview")


class PreviewBuilder:
    def __init__(self, config_file, cache_dir, address="127.0.0.1:8000", clean=False):
        self.config_file = Path(config_file)
        self.cache_dir = Path(cache_dir)
        self.address = address
        self.clean = clean
        self.config = None

    def __call__(self):
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        state_file = self.cache_dir / "state.json"
        try:
            previous = json.loads(state_file.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            previous = {}

        config = load_config(
            config_file=str(self.config_file),
            site_dir=str(self.cache_dir / "site"),
            dev_addr=self.address,
        )
        config.site_url = f"http://{self.address}/"
        files = {}
        docs = Path(config.docs_dir)
        for path in sorted(docs.rglob("*")):
            if not path.is_file():
                continue
            name = path.relative_to(docs).as_posix()
            stat = path.stat()
            stamp = [stat.st_mtime_ns, stat.st_size]
            cached = previous.get("files", {}).get(name, {})
            if cached.get("stamp") == stamp:
                files[name] = cached
                continue
            if not is_markdown_file(name):
                files[name] = {"stamp": stamp, "metadata": ""}
                continue
            source = path.read_text(encoding="utf-8-sig")
            frontmatter = re.match(r"\A---\s*\n.*?\n(?:---|\.\.\.)\s*(?:\n|$)", source, re.S)
            heading = re.search(r"^(?:#\s+.+|[^\n]+\n=+\s*)$", source, re.M)
            metadata = (frontmatter[0] if frontmatter else "") + (heading[0] if heading else "")
            files[name] = {"stamp": stamp, "metadata": metadata}

        dependencies = {
            name: version(name)
            for name in ("mkdocs", "mkdocs-material", "Markdown", "pymdown-extensions", "Jinja2", "Pygments")
        }
        inputs = [self.config_file.read_text(encoding="utf-8"), self.address,
                  Path(__file__).read_text(encoding="utf-8"), dependencies,
                  [(name, data["metadata"]) for name, data in files.items()]]
        custom_dir = config.theme.get("custom_dir")
        if custom_dir:
            inputs.append([(str(p), p.read_bytes().hex()) for p in sorted(Path(custom_dir).rglob("*")) if p.is_file()])
        fingerprint = hashlib.sha256(json.dumps(inputs, ensure_ascii=False).encode()).hexdigest()
        dirty = not self.clean and previous.get("fingerprint") == fingerprint
        # Other plugins can add cross-page dependencies that this cache cannot infer.
        dirty = dirty and not config.plugins and not config.strict
        LOG.info("Preview: %s build", "incremental" if dirty else "full")
        # An interrupted or failed build must not leave a reusable success marker.
        state_file.unlink(missing_ok=True)
        build(config, serve_url=config.site_url, dirty=dirty)
        pending = state_file.with_suffix(".tmp")
        pending.write_text(json.dumps({"fingerprint": fingerprint, "files": files}, ensure_ascii=False), encoding="utf-8")
        pending.replace(state_file)
        self.clean = False
        self.config = config


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--clean", action="store_true", help="Force a full initial build")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)-7s - %(message)s")
    address = f"127.0.0.1:{args.port}"
    builder = PreviewBuilder(ROOT / "mkdocs.yml", ROOT / ".cache/preview", address, args.clean)
    builder()
    config = builder.config
    server = LiveReloadServer(builder, "127.0.0.1", args.port, root=str(builder.cache_dir / "site"))
    server.watch(config.docs_dir)
    server.watch(str(builder.config_file))
    custom_dir = config.theme.get("custom_dir")
    if custom_dir:
        server.watch(custom_dir)
    try:
        server.serve()
    except KeyboardInterrupt:
        LOG.info("Stopping preview")
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
