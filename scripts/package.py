#!/usr/bin/env python3
"""Produce an archive containing only the public static application."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
files = [root / name for name in ('index.html', 'manifest.webmanifest', 'sw.js')]
files += sorted(path for path in (root / 'assets').rglob('*') if path.is_file())
archive = root / 'minha-jornada-pwa.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED) as out:
    for path in files:
        out.write(path, path.relative_to(root))
with ZipFile(archive) as check:
    assert check.testzip() is None
    assert len(check.namelist()) == len(files)
print(f'{archive.name}: {len(files)} arquivos públicos, {archive.stat().st_size} bytes')
