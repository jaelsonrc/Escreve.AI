# Ícones da Extensão

A extensão requer ícones PNG nos seguintes tamanhos:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

## Opção 1: Usar os SVGs como referência

Os arquivos SVG (`icon16.svg`, `icon48.svg`, `icon128.svg`) podem ser usados como referência visual para criar os PNGs.

## Opção 2: Converter SVGs para PNG

Use uma ferramenta online como:
- https://cloudconvert.com/svg-to-png
- https://www.iloveimg.com/resize-image/resize-svg

## Opção 3: Gerar via linha de comando

Se você tem ImageMagick instalado:

```bash
convert icon16.svg -resize 16x16 icon16.png
convert icon48.svg -resize 48x48 icon48.png
convert icon128.svg -resize 128x128 icon128.png
```

## Opção 4: Gerar via script Node.js

```javascript
const sharp = require('sharp');
const fs = require('fs');

async function generateIcons() {
  const sizes = [16, 48, 128];
  
  for (const size of sizes) {
    await sharp(`icon${size}.svg`)
      .resize(size, size)
      .png()
      .toFile(`icon${size}.png`);
  }
}

generateIcons();
```
