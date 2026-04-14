# Escreve.AI - Chrome Extension

Assistente de geração de texto contextual com IA para qualquer campo de texto no navegador.

## 🚀 Instalação

1. Clone ou baixe este projeto
2. Abra o Chrome e navegue até `chrome://extensions/`
3. Ative o **Modo do desenvolvedor** (switch no canto superior direito)
4. Clique em **Carregar sem compactação**
5. Selecione a pasta `extension/`

## ⚙️ Configuração

1. Clique no ícone da extensão na barra de ferramentas do Chrome
2. Selecione o provider de IA:
   - **OpenAI**: Requer API Key da OpenAI
   - **OpenRouter**: Requer API Key do OpenRouter
   - **Ollama**: Para uso local (não requer API Key)
   - **Custom**: Para APIs compatíveis com OpenAI
3. Configure a API Key e Base URL conforme necessário
4. Clique em **Testar Conexão** para verificar
5. Clique em **Salvar**

## 🎯 Uso

1. Navegue até qualquer página com campos de texto
2. Clique em qualquer campo de texto (`input`, `textarea`, `contenteditable`)
3. O botão ✨ aparecerá no canto inferior direito do campo
4. Clique no botão para gerar texto automaticamente
5. O texto será inserido no campo

## 📁 Estrutura do Projeto

```
extension/
├── manifest.json
├── src/
│   ├── content/
│   │   ├── content.js      # Content script principal
│   │   ├── content.css     # Estilos do botão flutuante
│   │   ├── dom-utils.js    # Utilitários DOM
│   │   └── context-extractor.js
│   ├── background/
│   │   ├── service-worker.js  # Service worker
│   │   └── ai-client.js      # Cliente multi-provider
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   └── shared/
│       ├── constants.js
│       └── storage.js
└── assets/
    └── icons/
```

## 🔌 Providers Suportados

| Provider | API Key | Base URL Padrão |
|----------|---------|-----------------|
| OpenAI | ✅ Obrigatório | https://api.openai.com/v1/chat/completions |
| OpenRouter | ✅ Obrigatório | https://openrouter.ai/api/v1/chat/completions |
| Ollama | ❌ Não | http://localhost:11434 |
| Custom | Opcional | Definida pelo usuário |

## 🛡️ Segurança

- API Keys são armazenadas localmente em `chrome.storage.local`
- Nunca são compartilhadas com terceiros
- Não são incluídas no código fonte

## 📋 Requisitos

- Google Chrome 88+ (Manifest V3)
- Conexão com internet (para APIs externas)
- API Key do provider escolhido

## 🐛 Troubleshooting

### Botão não aparece
- Verifique se a extensão está habilitada
- Verifique se o campo é um `input`, `textarea` ou `contenteditable`
- Campos de senha (`type="password"`) são ignorados

### Erro de conexão
- Verifique sua API Key
- Verifique a Base URL
- Para Ollama, certifique-se que está rodando localmente

## 📄 Licença

MIT
