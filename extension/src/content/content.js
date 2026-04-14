const FLOATING_BUTTON_ID = 'escreve-ai-floating-btn';
const STYLES_ID = 'escreve-ai-styles';

let button = null;
let currentElement = null;

const SENSITIVE_FIELD_PATTERN = /(senha|password|passcode|token|secret|cpf|cnpj|ssn|social security|cartao|card|cvv|cvc|iban|routing|swift|pix|otp|2fa|mfa|security code)/i;

function sanitizePageUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.origin}${parsedUrl.pathname}`;
  } catch {
    return '';
  }
}

function hasSensitiveMetadata(element) {
  const metadata = [
    element.name,
    element.id,
    element.placeholder,
    element.autocomplete,
    element.getAttribute('aria-label'),
    element.getAttribute('data-testid')
  ].filter(Boolean).join(' ');

  return SENSITIVE_FIELD_PATTERN.test(metadata);
}

function injectStyles() {
  if (document.getElementById(STYLES_ID)) return;
  
  const style = document.createElement('style');
  style.id = STYLES_ID;
  style.textContent = `
    #${FLOATING_BUTTON_ID} {
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      z-index: 2147483647;
      transition: transform 0.2s, opacity 0.2s;
    }
    #${FLOATING_BUTTON_ID}:hover {
      transform: scale(1.1);
    }
    #${FLOATING_BUTTON_ID}.visible {
      display: flex;
    }
    #${FLOATING_BUTTON_ID}.loading {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    #${FLOATING_BUTTON_ID}.success {
      background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
    }
    #${FLOATING_BUTTON_ID}.error {
      background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
    }
  `;
  document.head.appendChild(style);
}

function createButton() {
  if (button) return;
  
  button = document.createElement('button');
  button.id = FLOATING_BUTTON_ID;
  button.textContent = '✨';
  button.title = 'Gerar texto com IA';
  button.addEventListener('click', handleButtonClick);
  document.body.appendChild(button);
}

function isValidInput(element) {
  if (!element) return false;
  
  const isInput = element.tagName === 'INPUT' && 
                  ['text', 'search', 'email', 'url', 'tel'].includes(element.type);
  const isTextarea = element.tagName === 'TEXTAREA';
  const isContentEditable = element.isContentEditable && 
                            element.getAttribute('contenteditable') !== 'false';
  
  const isSensitive = element.type === 'password' || 
                     element.autocomplete === 'off' ||
                     element.disabled ||
                     element.readOnly ||
                     hasSensitiveMetadata(element);
  
  return (isInput || isTextarea || isContentEditable) && !isSensitive;
}

function getInputType(element) {
  if (element.isContentEditable) return 'contenteditable';
  return element.type || element.tagName.toLowerCase();
}

function getPlaceholder(element) {
  return element.placeholder || 
         element.getAttribute('aria-placeholder') || 
         '';
}

function getLabel(element) {
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent.trim();
  }
  
  let parent = element.parentElement;
  while (parent) {
    if (parent.tagName === 'LABEL') {
      return parent.textContent.trim();
    }
    parent = parent.parentElement;
  }
  
  return '';
}

function getValue(element) {
  if (element.isContentEditable) {
    return element.textContent || '';
  }
  return element.value || '';
}

function extractContext(element) {
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

function showButton(element) {
  if (!button) createButton();
  
  const rect = element.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  button.style.left = `${rect.right + scrollX - 40}px`;
  button.style.top = `${rect.bottom + scrollY - 40}px`;
  button.classList.add('visible');
  button.classList.remove('loading', 'success', 'error');
  button.textContent = '✨';
}

function hideButton() {
  if (button) {
    button.classList.remove('visible');
  }
}

function setButtonState(state) {
  if (!button) return;
  
  button.classList.remove('loading', 'success', 'error');
  
  switch (state) {
    case 'loading':
      button.classList.add('loading');
      button.textContent = '⏳';
      break;
    case 'success':
      button.classList.add('success');
      button.textContent = '✅';
      break;
    case 'error':
      button.classList.add('error');
      button.textContent = '❌';
      break;
    default:
      button.textContent = '✨';
  }
}

function insertText(text) {
  if (!currentElement) return;

  if (currentElement.isContentEditable) {
    document.execCommand('insertText', false, text);
  } else {
    const start = currentElement.selectionStart;
    const end = currentElement.selectionEnd;
    const value = currentElement.value;
    
    currentElement.value = value.substring(0, start) + text + value.substring(end);
    currentElement.selectionStart = currentElement.selectionEnd = start + text.length;
    
    currentElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

async function handleButtonClick(event) {
  event.preventDefault();
  event.stopPropagation();

  const focusedElement = document.activeElement;
  if (!focusedElement || !isValidInput(focusedElement)) return;

  const context = extractContext(focusedElement);
  
  setButtonState('loading');
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_TEXT',
      context
    });
    
    if (response.success && response.text) {
      insertText(response.text);
      setButtonState('success');
    } else {
      setButtonState('error');
    }
  } catch (error) {
    console.error('Escreve.AI Error:', error);
    setButtonState('error');
  }

  setTimeout(() => {
    if (button) {
      button.classList.remove('loading', 'success', 'error');
      button.textContent = '✨';
    }
  }, 1500);
}

function handleFocus(event) {
  const element = event.target;
  if (isValidInput(element)) {
    currentElement = element;
    showButton(element);
  }
}

function handleBlur(event) {
  const element = event.target;
  if (element === currentElement) {
    hideButton();
    currentElement = null;
  }
}

function handleInput(event) {
  const element = event.target;
  if (isValidInput(element) && element === document.activeElement) {
    showButton(element);
  }
}

injectStyles();

document.addEventListener('focus', handleFocus, true);
document.addEventListener('blur', handleBlur, true);
document.addEventListener('input', handleInput, true);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TEXT_INSERTED') {
    if (message.text && currentElement) {
      insertText(message.text);
    }
    sendResponse({ success: true });
  }
  return true;
});
