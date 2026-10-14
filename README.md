# Minha Jornada

Aplicativo de controle de jornada, banco de horas e espelho mensal, preparado para uso no navegador do notebook e instalação como PWA no Android.

Repositório: [NelsonMarinho/calculator](https://github.com/NelsonMarinho/calculator).

## Executar no notebook

```bash
python3 scripts/serve.py
```

Abra **http://localhost:8080**. O aplicativo não precisa de dependências de produção. Para verificações e build, use Node.js 24.

## Deploy na Vercel

Consulte [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md) para enviar a configuração ao GitHub e importar o projeto na Vercel.

A configuração em `vercel.json` usa **Other**, `npm run build` e a saída **dist**. Não há variáveis de ambiente necessárias nem instalação de dependências. O build executa as verificações e gera somente os arquivos públicos, com versão automática do cache offline.

```bash
npm run build
```

A integração com GitHub pode publicar os próximos pushes, conforme a [documentação oficial da Vercel](https://vercel.com/docs/git/vercel-for-github).

## Recursos e dados

- Registro da próxima batida com confirmação do horário.
- Jornadas com intervalo ou contínuas, histórico e banco de horas.
- Interface responsiva para celular e notebook.
- Instalação pelo navegador, cache offline e atualização do aplicativo.
- Exportação do espelho, lembretes de calendário e backup/restauração.
- Dados locais por aparelho, navegador e endereço; sem sincronização automática.

Consulte [LEIA-ME.md](LEIA-ME.md) para instalação no Android, transferência de dados do HTML antigo e limitações dos alertas. A instalação e o modo offline precisam de HTTPS ou localhost de desenvolvimento. Para transferir seus registros ao domínio publicado, exporte um backup no app antigo e restaure na versão publicada.

## Desenvolvimento

```bash
git clone https://github.com/NelsonMarinho/calculator.git
cd calculator
npm run check
npm test
```

Os 28 testes verificam cálculos, comparação com o HTML original, backups, service worker em ambiente simulado e a geração do deploy. A instalação em aparelhos Android e a renderização visual precisam de validação real.

O workflow [Verificar aplicativo](.github/workflows/ci.yml) executa o build completo em pushes e pull requests, usando as ações oficiais [checkout](https://github.com/actions/checkout) e [setup-node](https://github.com/actions/setup-node).

O `.gitignore` exclui configurações locais, credenciais, backups pessoais, dependências, logs, `dist` e pacotes gerados. O HTML de referência é `calculador-jornada-v7.3.html`. Ele continua versionado para comparar os cálculos; o app publicado é gerado a partir de `index.html` e `assets/`. O script `scripts/primeiro-envio.sh` fica disponível para iniciar um remoto vazio; depois do primeiro envio, use o fluxo normal de commits e pushes.

## Publicação manual em outra hospedagem

```bash
python3 scripts/package.py
```

Esse comando gera `minha-jornada-pwa.zip` com os arquivos públicos. Para essa modalidade, atualize `VERSION` em `sw.js` antes de uma nova publicação, pois o ZIP usa o service worker fonte. Na Vercel, a versão é calculada automaticamente durante o build.

## Estrutura

```text
index.html                 Interface
assets/css/app.css         Estilos responsivos
assets/js/core.js          Cálculos de jornada
assets/js/storage.js       Armazenamento e validação de backups
assets/js/app.js           Navegação, eventos e exportações
assets/js/pwa.js           Instalação e atualização
assets/icons/              Ícones de instalação
manifest.webmanifest       Configuração da PWA
sw.js                      Cache offline fonte
vercel.json                Build e cabeçalhos da Vercel
scripts/build.cjs          Geração de dist e versão do cache
scripts/                   Prévia, verificações, pacote e primeiro envio
tests/                     Testes automatizados
.github/workflows/ci.yml    Verificações no GitHub
dist/                      Saída gerada para deploy (não versionada)
```
