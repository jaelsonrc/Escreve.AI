# Escreve.AI - Implementação Técnica

## Visão Geral

Extensão Chrome Manifest V3 que adiciona um botão flutuante (✨) em campos de texto, gerando conteúdo contextual via IA com multi-provider (OpenAI, OpenRouter, Ollama).

## Arquitetura

```
┌─────────────────┐         chrome.runtime.sendMessage         ┌─────────────────┐
│  Content Script │ ─────────────────────────────────────────▶ │  Service Worker │
│  (content.js)   │                                           │(service-worker) │
└─────────────────┘                                           └─────────────────┘
        │                                                                  │
        │ 1. Detecta foco em input                                       │
        │ 2. Extrai contexto                                              │
        │ 3. Envia {type: 'GENERATE_TEXT', context}                      │
        │                                                                 │
        │                                                                 ▼
        │                                                        ┌─────────────────┐
        │                                                        │   AI Client    │
        │                                                        │ (ai-client.js) │
        │                                                        └─────────────────┘
        │                                                                  │
        ▼                                                                  │
┌─────────────────┐         chrome.runtime.sendMessage         │                 │
│  DOM Input Field │ ◀────────────────────────────────────────┘                 │
│                  │         5. Insere texto gerado                            │
└─────────────────┘
```

## Message Types

```javascript
// Content → Background
{ type: 'GENERATE_TEXT', context: {...} }
{ type: 'GET_SETTINGS' }

// Background → Content  
{ type: 'TEXT_GENERATED', text: string, success: boolean }
{ type: 'SETTINGS', settings: {...} }
```

## Content Script (content.js)

### Detecção de Inputs

```javascript
function isValidInput(element) {
  const isInput = element.tagName === 'INPUT' && 
                  ['text', 'search', 'email', 'url', 'tel'].includes(element.type);
  const isTextarea = element.tagName === 'TEXTAREA';
  const isContentEditable = element.isContentEditable && 
                            element.getAttribute('contenteditable') !== 'false';
  
  const isSensitive = element.type === 'password' || 
                     element.autocomplete === 'off';
  
  return (isInput || isTextarea || isContentEditable) && !isSensitive;
}
```

### Extração de Contexto

```javascript
function extractContext(element) {
  return {
    placeholder: getPlaceholder(element),
    label: getLabel(element),
    type: getInputType(element),
    name: element.name || element.id || '',
    value: getValue(element),
    pageTitle: document.title,
    url: window.location.href,
    isContentEditable: element.isContentEditable || false
  };
}
```

### Inserção de Texto

```javascript
function insertText(text) {
  if (element.isContentEditable) {
    document.execCommand('insertText', false, text);
  } else {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    element.value = value.substring(0, start) + text + value.substring(end);
    element.selectionStart = element.selectionEnd = start + text.length;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
```

## Service Worker (service-worker.js)

O service worker gerencia a comunicação entre o content script e os provedores de IA.

```javascript
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'GENERATE_TEXT') {
    const settings = await storage.getSettings();
    const prompt = buildContextPrompt(message.context, settings.customInstructions);
    const text = await aiClient.generate(prompt, settings, SYSTEM_PROMPT);
    sendResponse({ success: true, text });
  }
  return true;
});
```

## AI Client (ai-client.js)

### Providers Suportados

| Provider | Endpoint | Modelo Padrão |
|----------|----------|---------------|
| OpenAI | `https://api.openai.com/v1/chat/completions` | gpt-4 |
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | openai/gpt-4 |
| Ollama | `http://localhost:11434/api/generate` | llama3.2 |
| Custom | Definido pelo usuário | gpt-4 |

### Exemplo de Chamada OpenAI

```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    max_tokens: 500,
    temperature: 0.7
  })
});
```

## System Prompt

```
Você é um assistente de geração de texto contextual embutido em uma extensão de navegador.

Seu único objetivo é gerar conteúdo automaticamente com base no campo de entrada onde o usuário está focado.

## CONTEXTO

Você receberá:
- Tipo do campo
- Placeholder ou label
- Texto atual (se houver)
- Contexto da página
- Instruções personalizadas do usuário

## OBJETIVO

Gerar um texto completo, natural e útil que o usuário possa usar diretamente.

## REGRAS

- NÃO explique nada
- NÃO use introduções
- NÃO use aspas ou markdown
- Retorne apenas o texto
- Seja natural e direto

## COMPORTAMENTO

- Campo vazio → gerar conteúdo completo
- Campo com texto → continuar ou melhorar

## CONTEXTO INTELIGENTE

Inferir automaticamente:

- Email → texto profissional
- Chat → resposta natural
- Formulário → objetivo
- Descrição → detalhado

## PRIORIDADE

1. Clareza
2. Naturalidade
3. Utilidade
4. Brevidade
```

## Storage

Usa `chrome.storage.local` para persistir configurações:

```javascript
const DEFAULT_SETTINGS = {
  provider: 'openai',
  apiKey: '',
  baseUrl: '',
  model: 'gpt-4',
  customInstructions: ''
};
```

## Permissions (manifest.json)

```json
{
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "*://api.openai.com/*",
    "*://api.openrouter.ai/*",
    "*://localhost:11434/*"
  ]
}
```

## Fluxo de Detecção de Foco

```
1. document.addEventListener('focus', handleFocus, true)
2. handleFocus(event) → isValidInput(element)
3. Se válido → showButton(element)
4. showButton() → posiciona botão no canto inferior direito
5. button.addEventListener('click', handleButtonClick)
6. handleButtonClick() → chrome.runtime.sendMessage({type: 'GENERATE_TEXT', context})
```

## Limitações

- Não funciona em iframes cross-origin
- Não funciona em campos dentro de Shadow DOM
- Não suporta streaming de respostas
- Ícones devem ser PNG (Chrome não suporta SVG no manifest)

## Testes

Para testar localmente:
1. Carregar em `chrome://extensions/`
2. Ativar modo desenvolvedor
3. "Carregar sem compactação"
4. Selecionar pasta `extension/`

## Build

```bash
cd extension
npm install
npm run generate-icons
```
