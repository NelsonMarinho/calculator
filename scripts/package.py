#!/usr/bin/env python3
"""Build from the v8 HTML and archive only the generated public files."""
import os
from pathlib import Path
import shutil
import subprocess
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
node = os.environ.get('NODE_BINARY') or shutil.which('node')
if not node:
    raise SystemExit('Node.js 24 é necessário. Execute npm run build e confira sua instalação do Node.')
subprocess.run([node, str(root / 'scripts/build.cjs')], cwd=root, check=True)
output = root / 'dist'
files = sorted(path for path in output.rglob('*') if path.is_file())
archive = root / 'minha-jornada-pwa.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED) as out:
    for path in files:
        out.write(path, path.relative_to(output))
with ZipFile(archive) as check:
    assert check.testzip() is None
    assert len(check.namelist()) == len(files)
print(f'{archive.name}: {len(files)} arquivos públicos, {archive.stat().st_size} bytes')
