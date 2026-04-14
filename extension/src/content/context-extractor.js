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

export function buildContextPrompt(context, customInstructions) {
  let prompt = `Tipo do campo: ${context.type}`;
  
  if (context.placeholder) prompt += `\nPlaceholder: ${context.placeholder}`;
  if (context.label) prompt += `\nLabel: ${context.label}`;
  if (context.name) prompt += `\nNome do campo: ${context.name}`;
  if (context.value) prompt += `\nTexto atual: ${context.value}`;
  prompt += `\nTítulo da página: ${context.pageTitle}`;
  prompt += `\nURL: ${context.url}`;
  if (customInstructions) prompt += `\n\nInstruções do usuário: ${customInstructions}`;
  
  prompt += '\n\nGere o texto apropriado para este campo:';
  
  return prompt;
}
