# Princípio Divino — React Native + MongoDB

MVP inicial do aplicativo **Princípio Divino** para iOS e Android.

## Arquitetura

- **Mobile:** React Native com Expo + TypeScript
- **Navegação:** React Navigation
- **Leitor:** `react-native-webview` para permitir seleção precisa de texto, referências clicáveis e destaque inline
- **Offline:** SQLite (`expo-sqlite`)
- **Áudio:** `expo-speech` (TTS por parágrafo)
- **Estado/configurações:** Zustand + AsyncStorage
- **Backend:** Node.js + Express + TypeScript
- **Banco remoto:** MongoDB / MongoDB Atlas

## Funcionalidades já preparadas no MVP

- Home com Princípio do Dia, continuar leitura e progresso
- Índice hierárquico (Parte > Capítulo > Seção)
- Leitura vertical contínua
- Modo de cores: vermelho / vermelho+azul / +amarelo / texto integral
- Alternância para mostrar/ocultar cores editoriais
- Destaque pessoal em uma única cor (rosa)
- Seleção de trecho para destacar, salvar, adicionar nota ou compartilhar
- Pesquisa textual local
- Áudio por parágrafo; toque em outro parágrafo reinicia dali
- Continuação automática para a próxima seção configurável
- Velocidade de voz configurável
- Salva ponto exato da leitura
- Progresso por transição de seção
- Referências bíblicas clicáveis em modal
- Área “Meu Estudo”
- Estrutura para 365 reflexões diárias
- Sincronização futura com MongoDB

## Rodar o mobile

```bash
cd mobile
npm install
npx expo start
```

## Rodar o backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Configure `MONGODB_URI` no `.env`.

## Importação do livro

O app foi preparado para receber o conteúdo estruturado em JSON/SQLite. O arquivo `mobile/src/data/bookSeed.ts` contém somente uma amostra de estrutura. O próximo passo é converter a 7ª edição de 2014 para:

- parte
- capítulo
- seção
- subseção
- parágrafo
- cor editorial (`red`, `blue`, `yellow`, `white`)
- referências bíblicas

Cada parágrafo recebe um ID permanente para áudio, retomada de leitura, notas e destaques.
