(function() {
  'use strict';

  const BUTTONS_ID = 'escreve-ai-btns';

  let currentEl = null;
  let savedEl = null;
  let isProcessing = false;

  function init() {
    injectStyles();
    createButtons();
    addListeners();
    console.log('[Escreve.AI] Extensão carregada');
  }

  function log(msg) {
    console.log('[Escreve.AI]', msg);
  }

  function injectStyles() {
    if (document.getElementById('escreve-ai-css')) return;
    const css = document.createElement('style');
    css.id = 'escreve-ai-css';
    css.textContent = `
      #${BUTTONS_ID} {position:absolute;display:none;align-items:center;z-index:2147483647;gap:4px;}
      .escreve-btn {width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;transition:transform .2s;user-select:none;}
      .escreve-btn:hover {transform:scale(1.15);}
      .escreve-btn.correct {background:linear-gradient(135deg,#f59e0b,#d97706);}
      .escreve-btn.improve {background:linear-gradient(135deg,#10b981,#059669);}
      .escreve-btn.generate {background:linear-gradient(135deg,#667eea,#764ba2);}
      .escreve-btn.loading {opacity:0.5;pointer-events:none;animation:escreve-pulse 1s infinite;}
      @keyframes escreve-pulse {0%,100%{opacity:0.5;}50%{opacity:1;}}
    `;
    document.head.appendChild(css);
  }

  function createButtons() {
    if (document.getElementById(BUTTONS_ID)) return;
    const container = document.createElement('div');
    container.id = BUTTONS_ID;

    // mousedown + preventDefault impede que o input perca foco
    container.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    const btnC = document.createElement('button');
    btnC.className = 'escreve-btn correct';
    btnC.innerHTML = '✏️';
    btnC.title = 'Corrigir ortografia';
    btnC.addEventListener('click', (e) => { e.stopPropagation(); onBtnClick('correct'); });

    const btnI = document.createElement('button');
    btnI.className = 'escreve-btn improve';
    btnI.innerHTML = '✨';
    btnI.title = 'Melhorar texto';
    btnI.addEventListener('click', (e) => { e.stopPropagation(); onBtnClick('improve'); });

    const btnG = document.createElement('button');
    btnG.className = 'escreve-btn generate';
    btnG.innerHTML = '🪄';
    btnG.title = 'Gerar resposta com IA';
    btnG.addEventListener('click', (e) => { e.stopPropagation(); onBtnClick('generate'); });

    container.appendChild(btnC);
    container.appendChild(btnI);
    container.appendChild(btnG);
    document.body.appendChild(container);
  }

  function addListeners() {
    document.addEventListener('focus', onFocus, true);
    document.addEventListener('blur', onBlur, true);
  }

  function onFocus(e) {
    if (!isInput(e.target)) return;
    currentEl = e.target;
    savedEl = e.target;
    showBtns();
  }

  function onBlur(e) {
    if (e.target === currentEl) {
      if (isProcessing) return;
      setTimeout(() => {
        if (!isProcessing) {
          hideBtns();
          currentEl = null;
        }
      }, 200);
    }
  }

  function isInput(el) {
    if (!el) return false;
    const isText = el.tagName === 'INPUT' && ['text','search','email','url','tel'].includes(el.type);
    const isArea = el.tagName === 'TEXTAREA';
    const isCE = el.isContentEditable && el.getAttribute('contenteditable') !== 'false';
    const isBlocked = el.type === 'password' || el.autocomplete === 'off' || el.disabled || el.readOnly;
    return (isText || isArea || isCE) && !isBlocked;
  }

  function getElementValue(el) {
    if (!el) return '';
    if (el.isContentEditable) return el.textContent || '';
    return el.value || '';
  }

  function showBtns() {
    const btns = document.getElementById(BUTTONS_ID);
    if (!btns || !currentEl) return;

    const rect = currentEl.getBoundingClientRect();
    const val = getElementValue(currentEl);
    const hasText = val.trim().length > 0;

    btns.style.left = (rect.right + window.scrollX - 110) + 'px';
    btns.style.top = (rect.bottom + window.scrollY - 35) + 'px';

    // Se tem texto: mostra Corrigir + Melhorar + Gerar
    // Se não tem texto: mostra só Gerar
    btns.querySelector('.correct').style.display = hasText ? 'flex' : 'none';
    btns.querySelector('.improve').style.display = hasText ? 'flex' : 'none';
    btns.querySelector('.generate').style.display = 'flex'; // SEMPRE visível

    btns.style.display = 'flex';
  }

  function hideBtns() {
    const btns = document.getElementById(BUTTONS_ID);
    if (btns) btns.style.display = 'none';
  }

  function setButtonsLoading(loading) {
    const btns = document.getElementById(BUTTONS_ID);
    if (!btns) return;
    btns.querySelectorAll('.escreve-btn').forEach(btn => {
      if (loading) btn.classList.add('loading');
      else btn.classList.remove('loading');
    });
  }

  // =====================================================
  // EXTRAÇÃO DE CONTEXTO INTELIGENTE DA PÁGINA
  // =====================================================

  function extractPageContext(el) {
    const maxLen = 3000;
    let context = '';

    context = extractNearbyContext(el, maxLen);

    if (context.trim().length < 50) {
      context = extractVisibleContent(maxLen);
    }

    return context.trim();
  }

  function extractNearbyContext(el, maxLen) {
    let texts = [];
    let parent = el.parentElement;
    let depth = 0;

    while (parent && depth < 10) {
      const siblings = parent.children;
      for (let i = 0; i < siblings.length; i++) {
        const sib = siblings[i];
        if (sib === el || sib.id === BUTTONS_ID) continue;
        if (sib.querySelector && sib.querySelector('#' + BUTTONS_ID)) continue;

        const txt = getCleanText(sib);
        if (txt.length > 30) {
          texts.push(txt);
        }
      }
      if (texts.join('\n').length >= maxLen) break;
      parent = parent.parentElement;
      depth++;
    }

    return texts.join('\n').substring(0, maxLen);
  }

  function extractVisibleContent(maxLen) {
    const mainEl = document.querySelector('main, article, [role="main"]') || document.body;
    return getCleanText(mainEl).substring(0, maxLen);
  }

  function getCleanText(el) {
    if (!el) return '';
    const clone = el.cloneNode(true);
    clone.querySelectorAll('script, style, noscript, [hidden], [aria-hidden="true"]').forEach(x => x.remove());
    const text = clone.textContent || '';
    return text.replace(/\s+/g, ' ').trim();
  }

  function detectPlatform() {
    const url = window.location.hostname;
    const title = document.title.toLowerCase();

    if (url.includes('mail.google') || url.includes('outlook') || url.includes('mail')) return 'email';
    if (url.includes('slack') || url.includes('teams') || url.includes('discord') || url.includes('chat')) return 'chat';
    if (url.includes('linkedin')) return 'linkedin';
    if (url.includes('github') || url.includes('gitlab')) return 'code-platform';
    if (url.includes('trello') || url.includes('jira') || url.includes('asana')) return 'project-management';
    if (title.includes('email') || title.includes('e-mail')) return 'email';
    if (title.includes('chat') || title.includes('mensag')) return 'chat';
    return 'generic';
  }

  function getContext(el) {
    if (!el) return {};

    const fieldValue = getElementValue(el);
    const pageContext = extractPageContext(el);
    const platform = detectPlatform();

    return {
      placeholder: el.placeholder || '',
      label: getLabelFor(el),
      type: el.type || el.tagName.toLowerCase(),
      name: el.name || el.id || '',
      value: fieldValue,
      pageContext: pageContext,
      platform: platform,
      pageTitle: document.title,
      url: window.location.origin + window.location.pathname,
      isContentEditable: el.isContentEditable || false
    };
  }

  function getLabelFor(el) {
    if (!el) return '';
    if (el.id) {
      const lbl = document.querySelector('label[for="' + el.id + '"]');
      if (lbl) return lbl.textContent.trim();
    }
    let p = el.parentElement;
    while (p) {
      if (p.tagName === 'LABEL') return p.textContent.trim();
      p = p.parentElement;
    }
    return '';
  }

  function onBtnClick(mode) {
    const targetEl = currentEl || savedEl;

    if (!targetEl) {
      log('Sem elemento ativo');
      return;
    }

    if (!currentEl && savedEl) {
      currentEl = savedEl;
    }

    isProcessing = true;
    setButtonsLoading(true);
    log('Modo: ' + mode + ' | Elemento: ' + targetEl.tagName);

    const ctx = getContext(targetEl);

    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, function(settingsResp) {
      if (chrome.runtime.lastError) {
        log('Erro settings: ' + chrome.runtime.lastError.message);
        finishProcessing();
        return;
      }

      const s = settingsResp?.settings || {};

      if (!s.provider || !s.model || (s.provider !== 'ollama' && !s.apiKey)) {
        log('Configuração incompleta - abra o popup');
        finishProcessing();
        return;
      }

      chrome.runtime.sendMessage({
        type: 'GENERATE_TEXT',
        context: ctx,
        mode: mode
      }, function(resp) {
        if (chrome.runtime.lastError) {
          log('Erro SW: ' + chrome.runtime.lastError.message);
          finishProcessing();
          return;
        }

        if (resp && resp.success && resp.text) {
          log('Texto gerado (' + resp.text.length + ' chars)');
          insertText(targetEl, resp.text);
        } else if (resp && resp.error) {
          log('Erro: ' + resp.error);
        }
        finishProcessing();
      });
    });
  }

  function finishProcessing() {
    isProcessing = false;
    setButtonsLoading(false);
  }

  function insertText(el, text) {
    if (!el) return;
    try {
      el.focus();
      if (el.isContentEditable) {
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('insertText', false, text);
      } else {
        el.value = text;
        el.selectionStart = el.selectionEnd = text.length;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } catch (e) {
      log('Erro insert: ' + e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();