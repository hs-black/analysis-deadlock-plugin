"""Compatibility entry point: build the reviewed knowledge and catalog from pinned assets."""
import pathlib, subprocess, sys
if len(sys.argv) != 2:
    raise SystemExit("Usage: python tools/make-data.py <downloaded assets directory>; or npm run sync-knowledge")
raise SystemExit(subprocess.call(["node", str(pathlib.Path(__file__).with_name("build-knowledge.cjs")), sys.argv[1]]))
