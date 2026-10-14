# Jornada de Trabalho — HTML v8 instalável

A versão publicada é gerada diretamente de `calculador-jornada-v8.html`. Para mudar o app, edite esse arquivo e execute `npm run build`. Não altere a cópia gerada `index.html`.

## Notebook e celular

No notebook, com Node.js 24 e Python 3:

```bash
npm run build
python3 scripts/serve.py --dist
```

Abra http://localhost:8080. No celular, abra o endereço HTTPS de produção, acesse **Ajustes → Aplicativo → Instalar aplicativo**, ou use “Instalar app”/“Adicionar à tela inicial” no menu de um navegador compatível.

Aguarde **Pronto para usar offline** antes de usar sem conexão. O app possui ícones normais e adaptáveis aos formatos do Android. Instalação e aparência do ícone dependem do navegador/aparelho; a entrega é uma PWA instalada pelo navegador.

## Fluxos da v8

O visual claro/escuro e os fluxos do seu HTML foram mantidos: quatro batidas, teclado com confirmação automática e avanço para os próximos campos, resumo, espelho, ajustes, alertas e exportações. A integração de instalação fica em Ajustes.

A v8 não inclui os controles de jornada contínua e o bloqueio de entrada das versões anteriores. Registros antigos continuam armazenados; um dia com apenas duas batidas permanece incompleto até conter as quatro marcações usadas pela v8. A atualização não inventa horários para completar esses dias.

## Dados e backups

Os dados continuam na chave `jornada4`, no armazenamento local de cada navegador e endereço. Não há sincronização automática entre celular e notebook. A publicação não transfere dados de localhost ou de outro domínio; exporte um backup e restaure no endereço publicado.

A leitura e restauração verificam a estrutura, as datas, os horários e as configurações antes de usar os dados. Se houver falha de armazenamento, o app avisa para exportar um backup antes de fechar. Não apague dados do navegador sem guardar um backup.

O app e o calendário mantêm o comportamento de alertas da v8: notificações dependem do app aberto e podem ser suspensas pelo Android. Use a exportação de lembretes do calendário para lembretes fora do app.

## Publicação e atualização

Na Vercel, consulte [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md). O build gera oito arquivos públicos em `dist` e calcula automaticamente a versão do cache. A nova versão aguarda **Ajustes → Aplicativo → Atualizar aplicativo**.

Para outra hospedagem HTTPS:

```bash
python3 scripts/package.py
```

O comando usa Node.js para gerar o app antes de montar `minha-jornada-pwa.zip`. Extraia o pacote preservando as pastas.

## Verificação feita

Os 27 testes automatizados cobrem cálculos, virada de meia-noite, tolerância, folgas, backups, falhas de gravação, preservação do HTML v8 no build e cache simulado. As 24 verificações em Chrome real cobrem fluxo de teclado, quatro batidas, persistência, histórico, rejeição de backup inválido, abertura offline e ausência de rolagem horizontal em telas de 320 a 1440 pixels. Também foram inspecionadas imagens das telas claras e escuras.

A instalação em um Android físico ainda deve ser conferida após o deploy. Os cálculos e as mensagens seguem seu HTML e são estimativas para acompanhamento pessoal, conforme a observação presente na v8.
