const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'assets', 'icons');

const sizes = [16, 48, 128];

async function generateIcons() {
  console.log('Gerando ícones...');

  for (const size of sizes) {
    const svgPath = path.join(iconsDir, `icon${size}.svg`);
    const pngPath = path.join(iconsDir, `icon${size}.png`);

    if (!fs.existsSync(svgPath)) {
      console.error(`SVG não encontrado: ${svgPath}`);
      continue;
    }

    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      console.log(`✓ Gerado: icon${size}.png`);
    } catch (error) {
      console.error(`✗ Erro ao gerar icon${size}.png:`, error.message);
    }
  }

  console.log('Ícones gerados com sucesso!');
}

generateIcons();
