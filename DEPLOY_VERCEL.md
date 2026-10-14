# Deploy da v8 na Vercel

O build usa **`calculador-jornada-v8.html` como app**, preservando seu CSS e JavaScript. A integração acrescenta instalação/offline e uma seção em Ajustes. O `index.html` anterior foi substituído pela cópia gerada da v8.

## Enviar para o GitHub

```bash
git add -A
git commit -m "feat: publicar HTML v8 como aplicativo instalável"
git push origin main
```

## Configuração do projeto

| Campo | Valor |
|---|---|
| Framework Preset | Other |
| Root Directory | Raiz do repositório (`./`) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | Vazio, definido em `vercel.json` |
| Node.js | 24.x |
| Variáveis de ambiente | Nenhuma |
| Production Branch | `main` |

Se o repositório já está conectado à Vercel, o push pode iniciar o deploy automaticamente. Caso contrário, use **Add New → Project** para importar `NelsonMarinho/calculator`. A configuração segue a [documentação oficial da Vercel](https://vercel.com/docs/project-configuration/vercel-json).

## Build

`npm run build` gera `index.html` a partir da v8, verifica os arquivos, executa 27 testes e gera `dist` com oito arquivos públicos. Somente a v8 preparada, CSS de integração, JavaScript da PWA, manifesto, service worker e ícones entram na publicação. O cache recebe uma versão calculada pelo conteúdo.

## Depois de publicar

1. Abra o domínio de produção e confira o visual da v8.
2. Na aba Ajustes, confira **Pronto para usar offline**.
3. Se já instalou uma versão anterior no mesmo domínio, use **Atualizar aplicativo** quando a nova versão estiver pronta.
4. Confira as quatro batidas e o avanço automático do teclado; feche e reabra para confirmar a persistência.
5. Instale no Android e reabra em modo avião após o preparo inicial.

Use sempre o domínio de produção para manter os dados no mesmo endereço. Caso mude de domínio, transfira-os por backup. A instalação real em Android deve ser validada no aparelho.
