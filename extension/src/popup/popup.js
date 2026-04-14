const PROVIDERS_CONFIG = [
  {
    id: 'openai',
    name: 'OpenAI',
    apiKeyRequired: true,
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ],
    defaultModel: 'gpt-4o'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    apiKeyRequired: true,
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    models: [
      { id: 'openai/gpt-4o', name: 'GPT-4o' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
      { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
      { id: 'mistralai/mixtral-8x7b-instruct', name: 'Mixtral 8x7B' },
      { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B' }
    ],
    defaultModel: 'openai/gpt-4o'
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    apiKeyRequired: false,
    baseUrl: 'http://localhost:11434',
    models: [
      { id: 'llama3.2', name: 'Llama 3.2' },
      { id: 'llama3.1', name: 'Llama 3.1' },
      { id: 'llama3', name: 'Llama 3' },
      { id: 'mistral', name: 'Mistral' },
      { id: 'mixtral', name: 'Mixtral' },
      { id: 'codellama', name: 'Code Llama' },
      { id: 'phi3', name: 'Phi-3' },
      { id: 'qwen2.5', name: 'Qwen 2.5' }
    ],
    defaultModel: 'llama3.2'
  },
  {
    id: 'custom',
    name: 'API Custom',
    apiKeyRequired: false,
    baseUrl: '',
    models: [
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ],
    defaultModel: 'gpt-4'
  }
];

const providerSelect = document.getElementById('provider');
const apiKeyInput = document.getElementById('api-key');
const baseUrlInput = document.getElementById('base-url');
const baseUrlGroup = document.getElementById('base-url-group');
const modelInput = document.getElementById('model');
const modelGroup = document.getElementById('model-group');
const customInstructionsInput = document.getElementById('custom-instructions');
const apiKeyGroup = document.getElementById('api-key-group');
const testBtn = document.getElementById('test-btn');
const statusDiv = document.getElementById('status');
const form = document.getElementById('settings-form');

function validateEndpoint(endpoint, { allowHttpLocalhost = false } = {}) {
  let parsedUrl;

  try {
    parsedUrl = new URL(endpoint);
  } catch {
    throw new Error('Base URL invalida. Use uma URL absoluta.');
  }

  const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(parsedUrl.hostname);
  const isHttps = parsedUrl.protocol === 'https:';
  const isAllowedHttp = allowHttpLocalhost && parsedUrl.protocol === 'http:' && isLocalhost;

  if (!isHttps && !isAllowedHttp) {
    throw new Error('Use HTTPS para endpoints remotos. HTTP e permitido apenas para localhost.');
  }

  return parsedUrl.toString();
}

function getProviderConfig(providerId) {
  return PROVIDERS_CONFIG.find(p => p.id === providerId) || PROVIDERS_CONFIG[0];
}

function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.classList.remove('hidden', 'error', 'success');
  statusDiv.classList.add(isError ? 'error' : 'success');

  setTimeout(() => {
    statusDiv.classList.add('hidden');
  }, 3000);
}

function updateFormVisibility() {
  const provider = providerSelect.value;
  const config = getProviderConfig(provider);

  if (config.apiKeyRequired) {
    apiKeyGroup.classList.remove('hidden');
  } else {
    apiKeyGroup.classList.add('hidden');
    apiKeyInput.value = '';
  }

  if (provider === 'ollama') {
    baseUrlGroup.classList.add('hidden');
  } else {
    baseUrlGroup.classList.remove('hidden');
  }

  modelGroup.classList.remove('hidden');
}

async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve(result.settings || {});
    });
  });
}

async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings }, resolve);
  });
}

function populateForm(settings) {
  const provider = settings.provider || 'openai';
  const config = getProviderConfig(provider);

  providerSelect.value = provider;
  apiKeyInput.value = settings.apiKey || '';

  if (provider === 'ollama') {
    baseUrlInput.value = config.baseUrl;
    baseUrlGroup.classList.add('hidden');
  } else {
    baseUrlInput.value = settings.baseUrl || config.baseUrl;
    baseUrlGroup.classList.remove('hidden');
  }

  modelInput.value = settings.model || config.defaultModel;

  customInstructionsInput.value = settings.customInstructions || '';
  updateFormVisibility();
}

async function handleProviderChange() {
  const provider = providerSelect.value;
  const config = getProviderConfig(provider);
  modelInput.value = config.defaultModel;
  updateFormVisibility();
}

async function handleTestConnection() {
  const provider = providerSelect.value;
  const config = getProviderConfig(provider);

  let baseUrl;

  try {
    baseUrl = provider === 'ollama'
      ? validateEndpoint(config.baseUrl, { allowHttpLocalhost: true })
      : validateEndpoint(baseUrlInput.value || config.baseUrl, { allowHttpLocalhost: provider === 'custom' });
  } catch (error) {
    showStatus(`✗ ${error.message}`, true);
    return;
  }

  const settings = {
    provider,
    apiKey: apiKeyInput.value,
    baseUrl,
    model: modelInput.value
  };

  testBtn.disabled = true;
  testBtn.textContent = 'Testando...';

  try {
    if (provider === 'ollama') {
      const response = await fetch(`${settings.baseUrl}/api/tags`);
      if (response.ok) {
        showStatus('✓ Conexão com Ollama estabelecida!', false);
      } else {
        showStatus('✗ Ollama não está respondendo', true);
      }
    } else if (settings.apiKey || provider === 'custom') {
      const testPrompt = 'Olá, responda apenas "OK".';

      const headers = {
        'Content-Type': 'application/json'
      };

      if (provider === 'openai') {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      } else if (provider === 'openrouter') {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
        headers['HTTP-Referer'] = chrome.runtime.getURL('/');
        headers['X-Title'] = 'Escreve.AI Test';
      }

      const body = {
        model: settings.model,
        messages: [{ role: 'user', content: testPrompt }],
        max_completion_tokens: 10
      };

      const response = await fetch(settings.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (response.ok) {
        showStatus('✓ Conexão bem-sucedida!', false);
      } else {
        const error = await response.json().catch(() => ({}));
        showStatus(`✗ Erro: ${error.error?.message || response.status}`, true);
      }
    } else {
      showStatus('✗ API Key é obrigatória para este provider', true);
    }
  } catch (error) {
    showStatus(`✗ Erro de conexão: ${error.message}`, true);
  }

  testBtn.disabled = false;
  testBtn.textContent = 'Testar Conexão';
}

async function handleSubmit(event) {
  event.preventDefault();

  const provider = providerSelect.value;
  const config = getProviderConfig(provider);

  let baseUrl;

  try {
    baseUrl = provider === 'ollama'
      ? validateEndpoint(config.baseUrl, { allowHttpLocalhost: true })
      : validateEndpoint(baseUrlInput.value || config.baseUrl, { allowHttpLocalhost: provider === 'custom' });
  } catch (error) {
    showStatus(`✗ ${error.message}`, true);
    return;
  }

  const settings = {
    provider,
    apiKey: apiKeyInput.value,
    baseUrl,
    model: modelInput.value,
    customInstructions: customInstructionsInput.value
  };

  try {
    await saveSettings(settings);
    showStatus('✓ Configurações salvas!', false);
  } catch (error) {
    showStatus('✗ Erro ao salvar', true);
  }
}

providerSelect.addEventListener('change', handleProviderChange);
testBtn.addEventListener('click', handleTestConnection);
form.addEventListener('submit', handleSubmit);

(async () => {
  const settings = await loadSettings();
  populateForm(settings);
})();
