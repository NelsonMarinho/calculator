# Minha Jornada

Aplicativo de controle de jornada, banco de horas e espelho mensal, preparado para uso no navegador do notebook e instalação como PWA no Android.

Repositório: [NelsonMarinho/calculator](https://github.com/NelsonMarinho/calculator).

## Executar no notebook

```bash
python3 scripts/serve.py
```

Abra **http://localhost:8080**. O aplicativo não precisa de instalação de dependências para funcionar. Node.js 18 ou superior é usado somente nas verificações; a integração contínua usa Node.js 24.

## Recursos

- Registro da próxima batida com confirmação do horário.
- Jornadas com intervalo ou contínuas, histórico e banco de horas.
- Interface responsiva para celular e notebook.
- Instalação pelo navegador, cache offline e atualização do aplicativo.
- Exportação do espelho, lembretes de calendário e backup/restauração.
- Dados locais por aparelho, navegador e endereço; sem sincronização automática.

Consulte [LEIA-ME.md](LEIA-ME.md) para instalação no Android, transferência de dados do HTML antigo e limitações dos alertas. A instalação e o modo offline precisam de HTTPS ou localhost de desenvolvimento.

## Primeiro envio ao GitHub

O repositório `NelsonMarinho/calculator` deve existir e estar vazio. Se for criá-lo no GitHub, deixe desmarcadas as opções para adicionar README, licença ou `.gitignore`: esses arquivos do projeto serão enviados no primeiro commit.

No terminal do notebook, dentro da pasta do projeto:

```bash
bash scripts/primeiro-envio.sh
```

O script verifica acesso ao remoto, identidade do Git e testes; inicia a branch `main`, prepara o primeiro commit, configura `origin` e envia os arquivos. Ele para caso encontre histórico local ou remoto e não usa envio forçado. Se o GitHub solicitar autenticação, use o mecanismo de autenticação do Git já configurado no notebook.

Se ainda não configurou a autoria dos commits, use seu nome e email:

```bash
git config --global user.name "Seu nome"
git config --global user.email "seu-email@example.com"
```

Os arquivos locais de configuração, credenciais, backups pessoais, dependências, logs e pacotes gerados foram excluídos pelo `.gitignore`. O HTML original foi mantido no versionamento como referência para comparação dos cálculos.

Neste ambiente de edição, a pasta `.git` está somente para leitura e a conexão do terminal ao GitHub está indisponível. Portanto, o repositório nesta pasta ainda não foi inicializado e o envio deve ser executado no terminal do notebook.

Se o push falhar após criar o commit por falta de autenticação ou conexão, resolva o acesso e execute:

```bash
git push -u origin main
```

Se o remoto já tiver arquivos, clone-o numa pasta separada e integre os arquivos do projeto ao histórico existente. Não use `--force` para solucionar esse caso.

## Verificações

```bash
npm run check
npm test
python3 -m py_compile scripts/serve.py scripts/package.py
```

O workflow [Verificar aplicativo](.github/workflows/ci.yml) executa as verificações em pushes e pull requests. Ele usa as ações oficiais [checkout](https://github.com/actions/checkout) e [setup-node](https://github.com/actions/setup-node). Não publica o site.

Os 22 testes verificam cálculos, comparação com o HTML original, backups e service worker em ambiente simulado. A renderização visual e a instalação em aparelhos Android ainda precisam de validação real.

## Preparar a publicação

```bash
python3 scripts/package.py
```

O comando gera `minha-jornada-pwa.zip` com apenas os arquivos públicos. Extraia o pacote numa hospedagem estática com HTTPS, preservando as pastas. O ZIP é gerado a partir do código versionado e não é incluído nos commits.

Antes de cada nova publicação, atualize `VERSION` em `sw.js` para que os dispositivos recebam a nova versão.

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
sw.js                      Cache offline
scripts/                   Prévia, verificações, pacote e primeiro envio
tests/                     Testes automatizados
.github/workflows/ci.yml    Verificações no GitHub
```
