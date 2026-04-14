# Escreve.AI

Extensão Chrome Manifest V3 para geração contextual de texto com IA em campos de entrada da web.

O projeto adiciona um botão flutuante em campos compatíveis, coleta o contexto do campo em foco e envia a solicitação para um provider configurado pelo usuário, como OpenAI, OpenRouter ou Ollama local.

## Estado do projeto

O repositório está funcional para uso local em modo desenvolvedor e organizado para evolução incremental.

O código da extensão fica em `extension/`.

## Funcionalidades

- Geração contextual de texto em `input`, `textarea` e elementos `contenteditable`
- Suporte a múltiplos providers de IA
- Configuração local de provider, modelo e instruções personalizadas
- Compatível com Chrome via Manifest V3

## Estrutura do repositório

```text
docs/                        Documentação auxiliar
extension/                   Código da extensão Chrome
extension/src/background/    Comunicação com providers de IA
extension/src/content/       Integração com páginas e campos de texto
extension/src/popup/         Interface de configuração da extensão
extension/src/shared/        Constantes e persistência local
```

## Como rodar localmente

1. Instale Node.js 18+.
2. Entre em `extension/`.
3. Execute `npm install`.
4. Execute `npm run build` para gerar os ícones PNG.
5. Abra `chrome://extensions/`.
6. Ative o modo de desenvolvedor.
7. Clique em `Carregar sem compactação` e selecione `extension/`.

## Configuração

1. Abra o popup da extensão.
2. Escolha um provider.
3. Informe API key quando aplicável.
4. Defina o modelo.
5. Salve as configurações.

Providers previstos atualmente:

- OpenAI
- OpenRouter
- Ollama local
- Endpoint custom compatível com chat completions

## Como funciona

1. O content script detecta foco em campos compatíveis.
2. Um botão flutuante é exibido ao lado do campo.
3. Ao clicar no botão, a extensão coleta o contexto do campo.
4. O service worker monta o prompt e chama o provider configurado.
5. O texto retornado é inserido no campo atual.

## Privacidade e segurança

Pontos importantes para publicação pública:

- A extensão é injetada em todas as páginas por usar `<all_urls>` no content script.
- O texto do campo ativo, o título da página e a URL sanitizada da página podem ser enviados ao provider escolhido pelo usuário.
- Query string e hash da URL não são enviados para o modelo.
- Campos com aparência sensível, como senha, token, CPF, cartão e códigos de verificação, são ignorados pela lógica atual.
- Endpoints remotos precisam usar `HTTPS`. `HTTP` é aceito apenas para `localhost`.
- As credenciais ficam em `chrome.storage.local`, o que oferece persistência local, mas não é equivalente a um cofre criptográfico dedicado.

Se o projeto for publicado para uso amplo, as próximas melhorias mais importantes são:

1. Reduzir o escopo de execução da extensão por domínio ou por ativação explícita.
2. Minimizar ainda mais o contexto enviado ao provider.
3. Revisar a estratégia de armazenamento de API keys.
4. Adicionar testes automatizados para fluxos críticos e campos sensíveis.

## Auditoria rápida

Na revisão do código atual:

- não encontrei segredos hardcoded no repositório
- não encontrei uso de `eval` ou execução dinâmica semelhante
- encontrei riscos de privacidade e exposição acidental de dados por coleta ampla de contexto e armazenamento local de credenciais

Parte desses riscos foi reduzida no código com sanitização da URL, bloqueio adicional de campos sensíveis e validação de endpoints.

## Scripts

Em `extension/package.json`:

- `npm run generate-icons`
- `npm run build`

## Licença

MIT