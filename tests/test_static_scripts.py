"""The PWA loads i18n.js, knowledge.js and app.js as classic <script> tags.
They share one global scope, so if two files declare the same top-level
name, the browser rejects the second file completely (SyntaxError) and the
app shows an empty screen. This test catches that before it reaches users."""
import re
from collections import Counter
from pathlib import Path

STATIC = Path(__file__).resolve().parent.parent / "app" / "static"
SCRIPTS = ["i18n.js", "knowledge.js", "app.js"]
TOP_LEVEL = re.compile(r"^(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)", re.M)


def test_scripts_do_not_declare_the_same_global_name():
    names = Counter()
    for script in SCRIPTS:
        names.update(set(TOP_LEVEL.findall((STATIC / script).read_text(encoding="utf-8"))))
    duplicates = sorted(name for name, count in names.items() if count > 1)
    assert duplicates == []


def test_index_html_loads_the_scripts_in_order():
    html = (STATIC / "index.html").read_text(encoding="utf-8")
    positions = [html.index(f"/static/{script}") for script in SCRIPTS]
    assert positions == sorted(positions)
