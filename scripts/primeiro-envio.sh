#!/usr/bin/env bash
# Primeiro envio para um repositório remoto vazio. Nunca usa force push.
set -euo pipefail

project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
repo_url='https://github.com/NelsonMarinho/calculator.git'
cd -- "$project_root"

for tool in git node python3; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    printf 'Instale %s antes de continuar.\n' "$tool" >&2
    exit 1
  fi
done

if ! git config --get user.name >/dev/null || ! git config --get user.email >/dev/null; then
  printf 'Configure seu nome e email no Git antes de executar este script. Consulte README.md.\n' >&2
  exit 1
fi

if git rev-parse --show-toplevel >/dev/null 2>&1; then
  existing_root="$(git rev-parse --show-toplevel)"
  if [[ "$existing_root" != "$project_root" ]]; then
    printf 'Esta pasta já pertence a outro repositório. Não foi alterado.\n' >&2
    exit 1
  fi
  if git rev-parse --verify HEAD >/dev/null 2>&1; then
    printf 'Este projeto já possui commits. Use o fluxo normal de git add, commit e push.\n' >&2
    exit 1
  fi
  if ! git diff --cached --quiet; then
    printf 'Já existem arquivos preparados no índice. Revise-os antes do primeiro envio.\n' >&2
    exit 1
  fi
  if git remote get-url origin >/dev/null 2>&1; then
    if [[ "$(git remote get-url origin)" != "$repo_url" ]]; then
      printf 'O remote origin aponta para outro repositório. Não foi alterado.\n' >&2
      exit 1
    fi
  fi
fi

printf 'Verificando acesso ao repositório remoto…\n'
if ! remote_refs="$(git ls-remote "$repo_url")"; then
  printf 'Não foi possível acessar o GitHub. Confira a conexão, a existência do repositório e a autenticação do Git.\n' >&2
  exit 1
fi
if [[ -n "$remote_refs" ]]; then
  printf 'O repositório remoto já possui histórico. Clone-o em outra pasta antes de integrar estes arquivos; este script não sobrescreve histórico.\n' >&2
  exit 1
fi

node scripts/check.cjs
node --test tests/*.test.cjs
python3 -m py_compile scripts/serve.py scripts/package.py

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  git init -b main
else
  git symbolic-ref HEAD refs/heads/main
fi
if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$repo_url"
fi

git add -- .gitignore .gitattributes .github README.md LEIA-ME.md package.json \
  index.html manifest.webmanifest sw.js assets scripts tests calculador-jornada-v7.4.html
git diff --cached --check
git commit -m "feat: primeira versão da PWA Minha Jornada"
git push -u origin main
printf '\nPrimeiro envio concluído: https://github.com/NelsonMarinho/calculator\n'
