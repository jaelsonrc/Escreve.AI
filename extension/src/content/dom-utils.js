export function isValidInput(element) {
  if (!element) return false;
  
  const isInput = element.tagName === 'INPUT' && 
                  ['text', 'search', 'email', 'url', 'tel'].includes(element.type);
  const isTextarea = element.tagName === 'TEXTAREA';
  const isContentEditable = element.isContentEditable && 
                            element.getAttribute('contenteditable') !== 'false';
  
  const isSensitive = element.type === 'password' || 
                     element.autocomplete === 'off';
  
  return (isInput || isTextarea || isContentEditable) && !isSensitive;
}

export function getInputType(element) {
  if (element.isContentEditable) return 'contenteditable';
  return element.type || element.tagName.toLowerCase();
}

export function getPlaceholder(element) {
  return element.placeholder || 
         element.getAttribute('aria-placeholder') || 
         '';
}

export function getLabel(element) {
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

export function getValue(element) {
  if (element.isContentEditable) {
    return element.textContent || '';
  }
  return element.value || '';
}

export function getCursorPosition(element) {
  if (element.isContentEditable) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      return selection.getRangeAt(0).startOffset;
    }
    return 0;
  }
  return {
    start: element.selectionStart,
    end: element.selectionEnd
  };
}

export function setCursorPosition(element, position) {
  if (element.isContentEditable) {
    const range = document.createRange();
    const selection = window.getSelection();
    range.setStart(element.firstChild || element, position);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    element.selectionStart = position;
    element.selectionEnd = position;
  }
}

export function insertTextAtCursor(element, text) {
  if (element.isContentEditable) {
    document.execCommand('insertText', false, text);
  } else {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    
    element.value = value.substring(0, start) + text + value.substring(end);
    element.selectionStart = element.selectionEnd = start + text.length;
    
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
