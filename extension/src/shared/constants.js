export const PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-4',
    requiresApiKey: true,
    defaultBaseUrl: 'https://api.openai.com/v1/chat/completions'
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultModel: 'openai/gpt-4',
    requiresApiKey: true,
    defaultBaseUrl: 'https://openrouter.ai/api/v1/chat/completions'
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    defaultModel: 'llama3.2',
    requiresApiKey: false,
    defaultBaseUrl: 'http://localhost:11434'
  },
  custom: {
    id: 'custom',
    name: 'API Custom',
    defaultModel: 'gpt-4',
    requiresApiKey: false,
    defaultBaseUrl: ''
  }
};

export const DEFAULT_SETTINGS = {
  provider: 'openai',
  apiKey: '',
  baseUrl: '',
  model: 'gpt-4',
  customInstructions: ''
};

export const MESSAGE_TYPES = {
  GENERATE_TEXT: 'GENERATE_TEXT',
  TEXT_GENERATED: 'TEXT_GENERATED',
  TEXT_INSERTED: 'TEXT_INSERTED',
  GET_SETTINGS: 'GET_SETTINGS',
  SETTINGS: 'SETTINGS'
};
