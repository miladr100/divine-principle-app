# Princípio Divino

Aplicativo de leitura da 7ª edição de 2014 do Princípio Divino, para Android e iOS.

O texto fica no aparelho. A leitura, a pesquisa, o áudio, os destaques e as notas funcionam sem servidor.

## Estrutura

- `mobile` — app Expo com React Native e TypeScript
- `server` — API Express preparada para sincronizar dados do leitor no MongoDB. O app ainda não chama essa API

No mobile:

- Navegação com React Navigation
- Leitura em WebView, com seleção de trecho, notas de rodapé e referências bíblicas
- SQLite para destaques, notas e progresso
- Áudio com `expo-speech`
- Configurações com Zustand e AsyncStorage

## O que o app faz

- Início com a reflexão do dia
- Índice por parte, capítulo, seção e subseção
- Leitura contínua, com troca de seção sem recarregar a tela
- Introdução de capítulo mostra o nome do capítulo
- Cores editoriais: só vermelho, vermelho e azul, até amarelo, ou texto integral
- Aparência claro, azul e escuro, e tamanho da fonte
- Versículo bíblico em itálico, com recuo e a referência na mesma linha ou logo abaixo
- Toque no parágrafo para ouvir dali; velocidade da voz e opção de seguir para a próxima seção
- Rolagem automática de 0,25x a 3x. O dedo na tela pausa a rolagem e soltar continua. No fim da seção, para ou segue
- Busca na seção aberta e busca no livro
- Destaque, nota e compartilhamento de um trecho
- Meu Estudo, com a contagem do que foi guardado

## Rodar o app

O mobile usa Yarn.

```bash
cd mobile
yarn
yarn start
```

Para gerar o aplicativo Android, com ícone e recursos nativos:

```bash
cd mobile
yarn android
```

A checagem de tipos:

```bash
cd mobile
yarn typecheck
```

## Conteúdo do livro

O texto estruturado está em `mobile/src/data/principioDivino2014.json`. Cada nó é uma parte, capítulo, seção ou subseção. Cada parágrafo tem um identificador estável, a cor editorial e as referências bíblicas.

## API

A API é opcional para a leitura.

```bash
cd server
cp .env.example .env
yarn
yarn dev
```

Defina `MONGODB_URI` no `.env`. A API sobe em `http://localhost:4000` e expõe `GET /health` e `/api/sync/:userId`.
