export class AIClient {
  validateEndpoint(endpoint, { allowHttpLocalhost = false } = {}) {
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

  async generate(prompt, settings, systemPrompt) {
    const { provider, apiKey, baseUrl, model } = settings;

    switch (provider) {
      case 'openai':
        return this.callOpenAI(prompt, apiKey, baseUrl, model, systemPrompt);
      case 'openrouter':
        return this.callOpenRouter(prompt, apiKey, baseUrl, model, systemPrompt);
      case 'ollama':
        return this.callOllama(prompt, baseUrl, model, systemPrompt);
      case 'custom':
        return this.callCustomAPI(prompt, apiKey, baseUrl, model, systemPrompt);
      default:
        throw new Error(`Provider não suportado: ${provider}`);
    }
  }

  async callOpenAI(prompt, apiKey, baseUrl, model, systemPrompt) {
    if (!apiKey) {
      throw new Error('API Key não configurada. Abra o popup para configurar.');
    }

    const endpoint = this.validateEndpoint(baseUrl || 'https://api.openai.com/v1/chat/completions');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  async callOpenRouter(prompt, apiKey, baseUrl, model, systemPrompt) {
    if (!apiKey) {
      throw new Error('API Key não configurada. Abra o popup para configurar.');
    }

    const endpoint = this.validateEndpoint(baseUrl || 'https://openrouter.ai/api/v1/chat/completions');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': chrome.runtime.getURL('/'),
        'X-Title': 'Escreve.AI'
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  async callOllama(prompt, baseUrl, model, systemPrompt) {
    const validatedBaseUrl = this.validateEndpoint(baseUrl || 'http://localhost:11434', {
      allowHttpLocalhost: true
    });
    const endpoint = `${validatedBaseUrl.replace(/\/$/, '')}/api/generate`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'llama3.2',
        prompt: `${systemPrompt}\n\n${prompt}`,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.status}. Verifique se o Ollama está rodando em ${endpoint}`);
    }

    const data = await response.json();
    return data.response.trim();
  }

  async callCustomAPI(prompt, apiKey, baseUrl, model, systemPrompt) {
    if (!baseUrl) {
      throw new Error('Base URL não configurada para o provider Custom.');
    }

    const endpoint = this.validateEndpoint(baseUrl, { allowHttpLocalhost: true });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Custom API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }
}
