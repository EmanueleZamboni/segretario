"""Ogni modulo locale importato dal server deve essere nel COPY del Dockerfile.

12/11/2026: drive.py nuovo non era nella lista del COPY; i test passavano (girano dal repo), sul server il container
moriva all'avvio con ImportError e il Segretario è rimasto giù ~15 minuti."""

import ast
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    local = {p.stem for p in ROOT.glob("*.py")}
    docker = (ROOT / "Dockerfile").read_text(encoding="utf-8")
    copied = set(re.findall(r"([\w.]+)\.py", " ".join(l for l in docker.splitlines() if l.startswith("COPY"))))
    seen, todo = set(), ["server"]
    while todo:
        m = todo.pop()
        if m in seen:
            continue
        seen.add(m)
        for n in ast.walk(ast.parse((ROOT / f"{m}.py").read_text(encoding="utf-8"))):
            if isinstance(n, ast.Import):
                names = [a.name.split(".")[0] for a in n.names]
            elif isinstance(n, ast.ImportFrom) and n.module and not n.level:
                names = [n.module.split(".")[0]]
            else:
                names = []
            todo += [x for x in names if x in local]
    mancano = sorted(seen - copied)
    assert not mancano, f"moduli non copiati nell'immagine: {mancano}"
    print("DOCKERFILE OK")


if __name__ == "__main__":
    main()


def test_dockerfile():
    main()
