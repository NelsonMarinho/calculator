# Minha Jornada

O app foi reestruturado como uma PWA: pode ser usado no navegador do notebook e instalado pela tela inicial no Android, em navegadores compatíveis. O HTML de referência atual é `calculador-jornada-v7.3.html`. A v7.3 tem o mesmo JavaScript da v7.4; a versão instalável preserva os cálculos e as melhorias para celular. Trocar o HTML de referência não troca automaticamente os arquivos da PWA publicados.

## Abrir no notebook

Na pasta do projeto, execute:

```bash
python3 scripts/serve.py
```

Abra **http://localhost:8080**. Aguarde o indicador **Pronto para usar offline**. Abrir `index.html` diretamente permite consultar a interface, mas não habilita instalação nem cache offline.

## Disponibilizar e instalar no Android

1. Extraia `minha-jornada-pwa.zip` e envie seu conteúdo a uma hospedagem de arquivos estáticos com **HTTPS**. Preserve a estrutura de pastas. O pacote contém apenas os arquivos públicos do aplicativo.
2. Abra o endereço HTTPS no Chrome ou Samsung Internet do celular, fora do navegador interno de aplicativos de mensagens.
3. Toque em **Instalar**. Se a opção automática não estiver disponível, use o menu do navegador: **Instalar app** ou **Adicionar à tela inicial**. A opção e o tipo de instalação variam conforme navegador e aparelho.
4. Aguarde **Pronto para usar offline** e abra o ícone na tela inicial. Após esse primeiro preparo, os cálculos e registros funcionam sem internet.

Não é necessário mudar a linguagem para atender notebook e celular. Esta entrega usa HTML, CSS e JavaScript, sem bibliotecas em produção. É uma instalação pelo navegador; o pacote não é um APK nem uma publicação na Play Store. A instalação requer HTTPS ou localhost de desenvolvimento ([requisitos da MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)).

## Registrar sua jornada

- Confira a data, o tipo de dia e o formato de jornada.
- O botão principal indica a próxima batida e abre o horário atual para você conferir e confirmar em **Definir**.
- Toque em qualquer campo para editar manualmente. O teclado não confirma sozinho ao digitar o quarto número.
- Cada alteração é salva automaticamente; o indicador informa quando uma gravação falha.
- Em **Espelho**, selecione o mês e consulte os registros. Toque numa linha para editar o dia. As exportações e o backup continuam disponíveis.
- Em **Ajustes**, configure a jornada semanal e os parâmetros de remuneração.

O bloqueio de entrada por descanso, os cálculos de jornada, tolerância, banco, adicionais e virada da meia-noite foram mantidos conforme o arquivo original.

## Seus dados

Os registros ficam no armazenamento local deste navegador e endereço. Não há conta, servidor de dados ou sincronização automática entre notebook e celular.

Antes de mudar do HTML antigo para o endereço publicado, exporte **Espelho → Backup** no app antigo. Abra a nova versão e use **Espelho → Restaurar backup**. Os backups antigos são aceitos e validados. Na mesma origem, a chave `jornada4` foi mantida para reaproveitar os registros existentes.

Faça backups para transferir dados entre aparelhos e antes de apagar dados do navegador. A restauração substitui os registros atuais e pede confirmação. Se aparecer **Não foi possível salvar**, exporte um backup antes de fechar o app.

Os alertas do app dependem de ele estar aberto; o Android pode suspender atividades com a tela bloqueada ou o app em segundo plano. Para lembretes fora do app, use **Lembretes no calendário** e importe o arquivo no seu calendário.

## Compatibilidade e validação

A instalação depende das capacidades do navegador, além da versão do Android ([documentação de instalação](https://web.dev/learn/pwa/installation)). Não foi estabelecida uma versão mínima de Android com testes em aparelhos reais. Use um navegador atualizado e confira instalação, exportação e acesso offline no aparelho de destino.

A interface adapta celular e notebook, oferece alvos de toque maiores, confirmação explícita de horários, navegação pelo histórico, tratamento do botão Voltar no teclado de horas e foco contido no diálogo. Há estilos alternativos para navegadores sem suporte ao seletor CSS `:has()`.

Os 28 testes automatizados cobrem cálculos, comparação de 48 cenários com a versão original, leitura de backup antigo, validação de dados e comportamento do service worker em ambiente simulado. Sintaxe, referências locais e dimensões dos ícones também foram verificadas.

Neste ambiente, a abertura de servidores locais e do navegador de testes foi bloqueada pelas permissões de sockets. Por isso, a renderização visual, a instalação real no Android e o cache offline em um navegador real permanecem sem validação. O cache foi testado por simulação, não em aparelhos.

Para executar as verificações (Node.js 24):

```bash
npm run check
npm test
```

Verificação no aparelho após publicar:

1. Instale e confirme que abre fora da aba do navegador.
2. Registre um dia, feche e reabra; confira a persistência.
3. Ative o modo avião e reabra; confira os cálculos e o espelho.
4. Abra o teclado de horas, digite e cancele; confira que o valor não mudou. Use Voltar para fechar o teclado.
5. Exporte um backup e restaure em outro navegador ou aparelho.
6. Confira se há rolagem horizontal indesejada em telas pequenas e se botões e valores continuam legíveis.

## Organização e atualizações

- `index.html`: interface e metadados.
- `assets/css/app.css`: estilos responsivos.
- `assets/js/core.js`: funções de tempo e cálculo independentes da interface.
- `assets/js/storage.js`: leitura, gravação e validação de backups.
- `assets/js/app.js`: interface, eventos e exportações.
- `assets/js/pwa.js`: instalação, estado offline e atualização.
- `manifest.webmanifest`, `sw.js`, `assets/icons/`: instalação e cache.
- `scripts/`: verificação e prévia local.
- `tests/`: testes automatizados sem dependências externas.

Na Vercel, `npm run build` gera `dist` e uma versão do cache calculada a partir do conteúdo, automaticamente. Para publicar o ZIP manualmente em outra hospedagem, altere `VERSION` em `sw.js`, regenere o ZIP e publique todos os arquivos juntos. Configure o servidor para revalidar `sw.js`, preferencialmente com `Cache-Control: no-cache`. O usuário recebe **Atualizar** quando a nova versão termina de baixar. O app salva os registros antes de recarregar e aguarda a confirmação ou o cancelamento de um horário ainda em edição.

O service worker limita o cache à pasta do app, funciona em subdiretórios e remove somente caches antigos com o prefixo deste projeto.

Para deploy pela integração com GitHub, consulte [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md).
