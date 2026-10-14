# Deploy na Vercel

O projeto está preparado para hospedagem estática. `vercel.json` define o build, a pasta publicada e os cabeçalhos HTTP, conforme a [documentação oficial de configuração](https://vercel.com/docs/project-configuration/vercel-json).

## 1. Enviar a preparação ao GitHub

No terminal do notebook, dentro da pasta do projeto:

```bash
git add -A
git commit -m "build: preparar deploy estático na Vercel"
git push origin main
```

## 2. Importar o projeto

1. Entre na Vercel e selecione **Add New → Project**.
2. Escolha a integração com GitHub e importe **NelsonMarinho/calculator**.
3. Confira as configurações abaixo; os valores de build e saída já estão definidos em `vercel.json`.
4. Clique em **Deploy**.

| Campo | Valor |
|---|---|
| Framework Preset | Other |
| Root Directory | Raiz do repositório (`./`) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | Sem comando; definido como string vazia no arquivo |
| Node.js | 24.x, definido em `package.json` |
| Variáveis de ambiente | Nenhuma necessária |
| Production Branch | `main` |

A integração com GitHub pode gerar novos deploys a partir dos próximos pushes ([documentação da Vercel](https://vercel.com/docs/git/vercel-for-github)). Use o domínio de produção exibido no painel para instalar o app; evite alternar entre URLs temporárias de preview.

## 3. Conferir o app publicado

- Abra o endereço HTTPS de produção no notebook e no celular.
- Confira se aparece **Pronto para usar offline**.
- Instale pelo botão do app ou pelo menu do navegador Android.
- Faça um registro, feche e reabra para conferir a persistência.
- Depois do preparo inicial, ative o modo avião e confira que o app abre e mostra os registros.
- Abra `/manifest.webmanifest`, `/sw.js` e os ícones para conferir que são servidos corretamente. Caminhos inexistentes devem continuar retornando 404; não há uma reescrita geral para HTML.

Se tiver dados no HTML antigo ou em localhost, exporte **Espelho → Backup** e restaure no endereço de produção. Os dados são locais por endereço/navegador; o deploy não os transfere automaticamente. Uma mudança de domínio também exige transferência por backup.

## O que o build faz

```bash
npm run build
```

O comando verifica a sintaxe e os arquivos, executa os 28 testes e gera `dist` com 11 arquivos públicos. O HTML original, os scripts, os testes, a documentação e os arquivos locais não entram na pasta publicada.

O `sw.js` gerado recebe uma versão de cache derivada do conteúdo dos arquivos. Uma alteração nos arquivos públicos muda essa versão; um build idêntico mantém a mesma versão. O arquivo fonte continua intacto. A nova versão do app aguarda o botão **Atualizar**, já presente na interface.

Os cabeçalhos configurados revalidam os arquivos no navegador e impedem cache do `sw.js` na CDN da Vercel. O acesso offline continua usando o cache explícito do service worker ([referência de cache da Vercel](https://vercel.com/docs/caching/cache-control-headers)).

## Limites da validação feita aqui

O build e os testes foram executados localmente. Os testes de cache usam simulação. Esta preparação não criou um projeto na conta Vercel nem publicou um endereço. A instalação real no Android e os cabeçalhos do endereço publicado devem ser conferidos após o deploy.
