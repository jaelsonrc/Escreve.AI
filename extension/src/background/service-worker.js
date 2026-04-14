import { AIClient } from './ai-client.js';
import { Storage } from '../shared/storage.js';
import { buildContextPrompt } from '../content/context-extractor.js';

const aiClient = new AIClient();
const storage = new Storage();

const SYSTEM_PROMPT = `Você é um assistente de geração de texto contextual embutido em uma extensão de navegador.

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
- CORRIJA erros de ortografia e gramática automaticamente
- Se o texto tiver erros, corrija e continue de forma coerente

## COMPORTAMENTO

- Campo vazio → gerar conteúdo completo
- Campo com texto → continuar, melhorar E corrigir erros
- Texto com erros → corrija e complete mantendo o sentido original

## CONTEXTO INTELIGENTE

Inferir automaticamente:

- Email → texto profissional
- Chat → resposta natural
- Formulário → objetivo
- Descrição → detalhado

## PRIORIDADE

1. Correção ortográfica e gramatical
2. Clareza
3. Naturalidade
4. Utilidade
5. Brevidade`;

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'GENERATE_TEXT') {
    try {
      const settings = await storage.getSettings();
      const prompt = buildContextPrompt(message.context, settings.customInstructions);
      const text = await aiClient.generate(prompt, settings, SYSTEM_PROMPT);
      
      sendResponse({ success: true, text });
    } catch (error) {
      console.error('Escreve.AI - AI Generation Error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  if (message.type === 'GET_SETTINGS') {
    const settings = await storage.getSettings();
    sendResponse({ settings });
  }
  
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Escreve.AI extension installed');
});
