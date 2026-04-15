import {
  getPlaceholder,
  getLabel,
  getInputType,
  getValue
} from './dom-utils.js';

function sanitizePageUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.origin}${parsedUrl.pathname}`;
  } catch {
    return '';
  }
}

export function extractContext(element) {
  return {
    placeholder: getPlaceholder(element),
    label: getLabel(element),
    type: getInputType(element),
    name: element.name || element.id || '',
    value: getValue(element),
    pageTitle: document.title,
    url: sanitizePageUrl(window.location.href),
    isContentEditable: element.isContentEditable || false
  };
}

export function buildContextPrompt(context, customInstructions, mode = 'generate') {
  let prompt = '';

  if (mode === 'correct') {
    // ─── CORRIGIR: Só ortografia e gramática ───
    prompt = `TEXTO PARA CORRIGIR:\n${context.value}\n\n`;
    prompt += `Tipo do campo: ${context.type}`;
    if (context.placeholder) prompt += `\nPlaceholder: ${context.placeholder}`;
    if (context.label) prompt += `\nLabel: ${context.label}`;
    prompt += `\nTítulo da página: ${context.pageTitle}`;
    if (customInstructions) prompt += `\n\nInstruções adicionais: ${customInstructions}`;

  } else if (mode === 'improve') {
    // ─── MELHORAR: Pegar a ideia do usuário e melhorar o texto ───
    prompt = `══════════════════════\n`;
    prompt += `TEXTO ORIGINAL DO USUÁRIO (esta é a ideia dele — PRESERVE-A):\n`;
    prompt += `──────────────────────\n`;
    prompt += `${context.value}\n`;
    prompt += `──────────────────────\n\n`;
    prompt += `TAREFA: Pegue o texto acima, entenda a ideia e intenção do usuário, e reescreva de forma melhorada.\n`;
    prompt += `NÃO descarte o texto. NÃO escreva algo diferente. MELHORE o que o usuário escreveu.\n\n`;
    prompt += `Contexto para entender o cenário:\n`;
    prompt += `- Tipo do campo: ${context.type}`;
    if (context.placeholder) prompt += `\n- Placeholder: ${context.placeholder}`;
    if (context.label) prompt += `\n- Label: ${context.label}`;
    prompt += `\n- Página: ${context.pageTitle}`;
    if (context.platform) prompt += `\n- Plataforma: ${context.platform}`;
    if (context.pageContext) {
      prompt += `\n\nContexto da página (apenas para entender o cenário, NÃO use como base do texto):\n${context.pageContext.substring(0, 1000)}`;
    }
    if (customInstructions) prompt += `\n\nInstruções extras: ${customInstructions}`;

  } else {
    // ─── GERAR: Gerar texto/resposta com base no contexto ───
    prompt = `INFORMAÇÕES DO CAMPO:\n`;
    prompt += `Tipo: ${context.type}`;
    if (context.placeholder) prompt += `\nPlaceholder: ${context.placeholder}`;
    if (context.label) prompt += `\nLabel: ${context.label}`;
    if (context.name) prompt += `\nNome do campo: ${context.name}`;
    prompt += `\nTítulo da página: ${context.pageTitle}`;
    prompt += `\nURL: ${context.url}`;
    if (context.platform) prompt += `\nPlataforma detectada: ${context.platform}`;

    // Se tem texto no campo, é contexto para responder (ex: email sendo respondido)
    if (context.value && context.value.trim().length > 0) {
      prompt += `\n\n───────────────────────\n`;
      prompt += `CONTEÚDO NO CAMPO (este é o texto/mensagem que o usuário quer RESPONDER):\n`;
      prompt += context.value;
      prompt += `\n───────────────────────`;
    }

    // Contexto extraído da página ao redor
    if (context.pageContext && context.pageContext.trim().length > 0) {
      prompt += `\n\nCONTEXTO DA PÁGINA (conteúdo visível ao redor do campo):\n`;
      prompt += context.pageContext.substring(0, 2000);
    }

    if (customInstructions) prompt += `\n\nInstruções do usuário: ${customInstructions}`;

    prompt += `\n\n══════════════════════\n`;
    prompt += `TAREFA: Gere o texto apropriado para este campo. `;

    if (context.value && context.value.trim().length > 0) {
      prompt += `O conteúdo do campo acima é uma mensagem/texto recebido — gere uma RESPOSTA inteligente e adequada. `;
      prompt += `NÃO copie nem reescreva o texto original. Crie uma RESPOSTA NOVA.`;
    } else if (context.pageContext && context.pageContext.trim().length > 50) {
      prompt += `Use o contexto da página para gerar um texto relevante e contextualizado.`;
    } else {
      prompt += `Gere um texto útil baseado no tipo de campo e placeholder.`;
    }
  }

  return prompt;
}