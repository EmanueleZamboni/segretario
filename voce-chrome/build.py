"""Costruisce l'estensione Chrome della Voce a partire dalla pagina del Segretario, così la grafica ha UNA sola
fonte (voce.html, voce_scena.js, voce_logica.js). Esegui: python voce-chrome/build.py

Produce in voce-chrome/: overlay.css (gli stili della pagina, già scoperti su #voce-root), overlay.html (il markup
dentro #voce-root) e content.js (markup + scena + logica + driver di claude.ai + pannelli), più icon128.png."""

from __future__ import annotations

import json
import re
import struct
import zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
html = (ROOT / "voce.html").read_text(encoding="utf-8")

css = re.search(r"<style>(.*?)</style>", html, re.S).group(1)
# la pagina ha un body suo; dentro claude.ai il body è loro: via le regole globali
css = re.sub(r"\n\*\{box-sizing:border-box\}html,body\{height:100%\}\nbody\{[^}]*\}", "\n", css)
css = css.replace(":root{", "#voce-root{", 1).replace(":root:", "#voce-root:")
css += """
#voce-richiamo{position:fixed;right:14px;bottom:14px;z-index:2147482999;appearance:none;border:1px solid rgba(82,255,106,.6);background:rgba(0,0,0,.7);
 color:#52ff6a;padding:8px 12px;border-radius:999px;font:700 10px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.22em;cursor:pointer;
 box-shadow:0 0 14px -4px #52ff6a;opacity:.85}
#voce-richiamo:hover{opacity:1}
"""

markup = re.search(r'(<div id="voce-root".*?)\n</div>\n<script', html, re.S).group(1) + "\n</div>"
markup = markup.replace('data-look="verde"', 'data-look="verde" data-host="claude"', 1)
pannelli = re.search(r'<script nonce="\{\{NONCE\}\}">\n(/\* I pannelli.*?)</script>', html, re.S).group(1)

scena = (ROOT / "voce_mesh.js").read_text(encoding="utf-8") + "\n" + (ROOT / "voce_testa.js").read_text(encoding="utf-8") + "\n" + (ROOT / "voce_scena.js").read_text(encoding="utf-8")
logica = (ROOT / "voce_logica.js").read_text(encoding="utf-8")
driver = (HERE / "driver.js").read_text(encoding="utf-8")

versione = json.loads((HERE / "manifest.json").read_text(encoding="utf-8"))["version"]
content = f"""/* Generato da voce-chrome/build.py: non modificare a mano. Fonte: voce.html, voce_scena.js, voce_logica.js, driver.js */
window.VOCE_VERSIONE = "v{versione}";
(() => {{
  if (document.getElementById("voce-root")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = {json.dumps(markup)};
  const root = wrap.firstElementChild;
  root.hidden = true;  // parte nascosta: la chat è quella di sempre finché Ema non preme VOCE
  document.body.appendChild(root);
}})();
{driver}
{scena}
{logica}
{pannelli}
(() => {{ window.VoceDriver.bottoneRichiamo(); }})();
"""
(HERE / "overlay.css").write_text(css, encoding="utf-8")
(HERE / "overlay.html").write_text(markup, encoding="utf-8")
(HERE / "content.js").write_text(content, encoding="utf-8")


def png(size: int, colore=(82, 255, 106)) -> bytes:
    """Un'icona minima: un cerchio verde su nero, senza dipendenze."""
    raw = bytearray()
    c = size / 2
    for y in range(size):
        raw.append(0)
        for x in range(size):
            d = ((x + .5 - c) ** 2 + (y + .5 - c) ** 2) ** .5
            a = max(0, min(1, (c * .78 - d) + .5))
            ring = max(0, min(1, 1 - abs(d - c * .62) / 3))
            r, g, b = [max(0, min(255, int(v * min(1.0, a * .35 + ring * .9)))) for v in colore]
            raw += bytes((r, g, b, 255))
    def chunk(t, data):
        return struct.pack(">I", len(data)) + t + data + struct.pack(">I", zlib.crc32(t + data) & 0xffffffff)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b""))


(HERE / "icon128.png").write_bytes(png(128))
print("estensione pronta in", HERE)
