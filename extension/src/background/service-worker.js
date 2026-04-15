import { AIClient } from './ai-client.js';
import { Storage } from '../shared/storage.js';
import { buildContextPrompt } from '../content/context-extractor.js';

const aiClient = new AIClient();
const storage = new Storage();

const SYSTEM_PROMPT_GENERATE = `Você é um assistente de escrita inteligente embutido em uma extensão de navegador.

## SEU PAPEL

Você é integrado diretamente em campos de texto de qualquer site (email, chat, formulários, etc).
Você analisa o CONTEXTO da página e do campo para gerar texto útil e contextual.

## COMPORTAMENTO POR CENÁRIO

### Se há um texto/mensagem no campo (email recebido, mensagem de chat, post):
- Esse texto é uma MENSAGEM QUE O USUÁRIO RECEBEU
- Você deve gerar uma RESPOSTA inteligente a essa mensagem
- NÃO copie nem reescreva a mensagem original
- Crie uma resposta profissional, educada e contextual
- Use o tom adequado (formal para emails corporativos, natural para chats)

### Se o campo está vazio:
- Use o placeholder, label, título da página e contexto ao redor
- Gere um texto novo e adequado ao campo

### Se é um email (plataforma: email):
- Gere uma resposta profissional e educada
- Inclua saudação adequada (Prezado(a), Boa tarde, etc.)
- Inclua fechamento adequado (Atenciosamente, Cordialmente, etc.)
- Seja objetivo e claro

### Se é um chat (plataforma: chat):
- Gere uma resposta natural e direta
- Sem formalidades excessivas

### Se é um formulário:
- Preencha com conteúdo objetivo e relevante

## REGRAS ABSOLUTAS

- NUNCA explique o que está fazendo
- NUNCA use markdown, aspas ou formatação especial
- Retorne APENAS o texto pronto para uso
- Seja natural, profissional e direto
- Corrija ortografia e gramática automaticamente
- Em português do Brasil (pt-BR)

## PRIORIDADE

1. Entender o contexto corretamente
2. Gerar RESPOSTA (não cópia!) quando há mensagem recebida
3. Clareza e naturalidade
4. Tom adequado ao cenário`;

const SYSTEM_PROMPT_CORRECT = `Você é um corretor de texto ortográfico e gramatical em português do Brasil.

## SUA TAREFA

1. Corrija APENAS erros de ortografia e gramática
2. NÃO mude o estilo, voz ou ideias do autor
3. NÃO altere o conteúdo ou significado
4. Mantenha o formato original (parágrafos, quebras de linha)
5. Retorne APENAS o texto corrigido, sem comentários

## O QUE CORRIGIR

- Erros de grafia
- Concordância (verbal e nominal)
- Regência verbal e nominal
- Colocação pronominal
- Pontuação
- Acentuação

## IMPORTANTE

- Se não houver erros, retorne o texto EXATAMENTE como está
- Preserve maiúsculas, minúsculas e pontuação original
- Não adicione nem remova conteúdo
- Não mude o tom ou formalidade`;

const SYSTEM_PROMPT_IMPROVE = `Você é um assistente especializado em melhorar textos em português do Brasil.

## REGRA FUNDAMENTAL

O usuário JÁ ESCREVEU um texto. Esse texto contém a IDEIA dele.
Sua tarefa é pegar EXATAMENTE essa ideia e reescrevê-la de forma melhor.
NUNCA descarte, ignore ou substitua a ideia do usuário.

## COMO FUNCIONA

1. LEIA com atenção o texto que o usuário escreveu
2. ENTENDA qual é a ideia, intenção e mensagem principal
3. REESCREVA o texto preservando 100% da ideia original
4. MELHORE a qualidade: gramática, clareza, fluidez, profissionalismo

## EXEMPLO DO COMPORTAMENTO ESPERADO

Texto do usuário: "oi presado quero informa que o relatorio ja foi feito e esta pronto pra enviar"
Resultado esperado: "Prezado, informo que o relatório já foi concluído e está pronto para envio."

Observe: mesma ideia, mesma intenção, mesmo conteúdo — apenas melhorado.

## O QUE FAZER

- Corrigir TODOS os erros de ortografia e gramática
- Melhorar fluidez e clareza das frases
- Adequar o tom ao contexto (formal, informal, técnico)
- Melhorar estrutura e organização do texto
- Enriquecer vocabulário quando apropriado
- Completar frases incompletas mantendo a direção original
- Se o texto tem saudação ou despedida, mantenha-as

## O QUE NUNCA FAZER

- NUNCA ignore o texto do usuário
- NUNCA escreva algo completamente diferente
- NUNCA mude a ideia central ou mensagem
- NUNCA adicione informações que o usuário não mencionou
- NUNCA use markdown, aspas ou formatação especial
- NUNCA adicione explicações sobre o que mudou
- NUNCA remova informações importantes do texto original

## REGRA DE SAÍDA

Retorne APENAS o texto melhorado, sem comentários, sem explicações.
O resultado deve parecer que o próprio usuário escreveu, só que melhor.`;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    console.log('SW: Mensagem inválida', message);
    return false;
  }

  console.log('SW: [1/6] Mensagem recebida:', message.type, '| modo:', message.mode);

  if (message.type === 'GENERATE_TEXT') {
    const context = message.context || {};
    const mode = message.mode || 'generate';

    console.log('SW: [2/6] Contexto recebido:', JSON.stringify({
      type: context.type,
      placeholder: context.placeholder,
      label: context.label,
      valueLen: context.value?.length || 0,
      pageContextLen: context.pageContext?.length || 0,
      platform: context.platform,
      pageTitle: context.pageTitle
    }));

    storage.getSettings().then(settings => {
      console.log('SW: [3/6] Settings:', JSON.stringify({
        provider: settings.provider,
        model: settings.model,
        hasApiKey: !!settings.apiKey,
        baseUrl: settings.baseUrl
      }));

      if (!settings.provider) {
        console.log('SW: Provider não configurado');
        sendResponse({ success: false, error: 'Provider não configurado. Abra o popup para configurar.' });
        return;
      }

      if (!settings.model) {
        console.log('SW: Modelo não configurado');
        sendResponse({ success: false, error: 'Modelo não configurado. Abra o popup para configurar.' });
        return;
      }

      if (settings.provider !== 'ollama' && !settings.apiKey) {
        console.log('SW: API Key não configurada para provider:', settings.provider);
        sendResponse({ success: false, error: `API Key não configurada para ${settings.provider}. Abra o popup.` });
        return;
      }

      let systemPrompt;
      if (mode === 'correct') {
        systemPrompt = SYSTEM_PROMPT_CORRECT;
      } else if (mode === 'improve') {
        systemPrompt = SYSTEM_PROMPT_IMPROVE;
      } else {
        systemPrompt = SYSTEM_PROMPT_GENERATE;
      }

      // Construir o prompt a partir do contexto usando buildContextPrompt
      const prompt = buildContextPrompt(context, settings.customInstructions || '', mode);
      console.log('SW: [4/6] Prompt construído (' + prompt.length + ' chars):', prompt.substring(0, 150) + '...');

      console.log('SW: [5/6] Chamando AI client...');
      aiClient.generate(prompt, settings, systemPrompt).then(text => {
        console.log('SW: [6/6] Texto gerado (' + (text?.length || 0) + ' chars):', text?.substring(0, 100));
        sendResponse({ success: true, text });
      }).catch(error => {
        console.error('SW: Erro ao gerar texto:', error.message, error.stack);
        sendResponse({ success: false, error: error.message || 'Erro ao gerar texto' });
      });
    }).catch(error => {
      console.error('SW: Erro ao carregar settings:', error.message);
      sendResponse({ success: false, error: 'Erro ao carregar configurações: ' + error.message });
    });

    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    storage.getSettings().then(settings => {
      sendResponse({ settings });
    });
    return true;
  }

  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Escreve.AI extension installed');
});