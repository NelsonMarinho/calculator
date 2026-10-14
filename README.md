# Jornada de Trabalho — v8

**O aplicativo é o HTML `calculador-jornada-v8.html`.** Ele é a fonte do visual, dos cálculos e dos fluxos. A geração da PWA usa esse arquivo diretamente; `index.html` é sua versão preparada para instalação. Não edite `index.html` manualmente.

A aparência clara/escura, as três abas, as quatro batidas e o avanço automático do teclado da v8 foram mantidos. A antiga interface modular foi removida da publicação.

## Executar e publicar

Use Node.js 24 para as verificações e a geração do app:

```bash
npm run build
python3 scripts/serve.py --dist
```

Abra **http://localhost:8080**. Para servir a cópia local sem build de produção, execute `npm run prepare:app` e depois `python3 scripts/serve.py`.

A Vercel já está configurada: **Other**, build `npm run build`, saída `dist`, sem dependências de produção nem variáveis de ambiente. Veja [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md).

## Instalação e dados

A aba **Ajustes → Aplicativo** contém instalação, estado do acesso offline e atualização. O app conserva os ícones e funciona offline depois do primeiro carregamento por HTTPS.

Os registros permanecem na chave `jornada4`, por aparelho/navegador/endereço. Use **Espelho → Backup/Restaurar backup** para transferi-los. O app não sincroniza dispositivos automaticamente.

Os alertas do app dependem de ele continuar aberto. Para lembretes com o app fechado, exporte os lembretes para o calendário, conforme o fluxo da v8.

## Ajustes técnicos feitos na v8

- Aviso quando o armazenamento local falha.
- Validação do backup antes de substituir os registros.
- Configuração padrão de dias da semana sem compartilhar o array editável.
- Notificações via service worker quando a PWA está ativa no Android.
- Rótulos e botões “Agora” sem sobreposição em telas pequenas; ajustes em duas colunas no celular.

Esses ajustes não acrescentam os fluxos antigos de jornada contínua, bloqueio de entrada, botão de próxima batida ou confirmação manual obrigatória.

## Verificação

```bash
npm run check
npm test
```

Há **27 testes automatizados** de cálculos da v8, backups, geração do app e cache simulado. O build testa que o CSS e o JavaScript inline publicados correspondem aos do HTML v8.

Também foram feitas **24 verificações no Chrome real**, incluindo teclado com avanço automático, quatro batidas, histórico, reabertura, backup inválido, modo offline e telas de 320, 360, 390 e 1440 pixels. As aparências clara/escura foram inspecionadas. Isso não substitui a instalação num aparelho Android físico.

Para repetir a verificação opcional com Playwright instalado e uma prévia rodando na porta 8085:

```bash
CHROME_PATH=/caminho/do/chrome node scripts/browser-check.cjs
```

`JORNADA_URL` permite apontar para outra prévia; `JORNADA_SCREENSHOTS` escolhe a pasta de imagens. Playwright é uma ferramenta opcional de desenvolvimento, não uma dependência do app ou do build da Vercel.

## Organização

- `calculador-jornada-v8.html`: arquivo principal a editar.
- `scripts/prepare.cjs`: prepara `index.html` sem substituir o CSS/JavaScript da v8.
- `assets/css/pwa.css`: ajustes pontuais para instalação e telas pequenas.
- `assets/js/pwa.js`: instalação, estado offline e atualização.
- `manifest.webmanifest`, `sw.js`, `assets/icons/`: recursos da PWA.
- `scripts/build.cjs`: gera `dist` e a versão de cache a partir do conteúdo.
- `tests/`: verificação automatizada.

Para gerar um pacote manual para outra hospedagem, execute `python3 scripts/package.py`. Ele também gera a publicação a partir da v8 e inclui somente os oito arquivos públicos. Mais detalhes em [LEIA-ME.md](LEIA-ME.md).
