/**
 * Generate simple placeholder favicon assets for Voyo
 * Run with: node scripts/generate-favicons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'app');
const color = '#1a1a2e'; // Dark navy
const strokeColor = '#ffffff'; // White for contrast

// Function to create SVG for the "V" icon
function createVIconSvg(size) {
  const strokeWidth = Math.max(2, size * 0.1);
  const padding = size * 0.15;
  
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${color}" rx="${size * 0.125}"/>
      <path d="M ${size * 0.15 + padding} ${size * 0.3} 
               L ${size * 0.5} ${size * 0.75 - padding} 
               L ${size * 0.85 - padding} ${size * 0.3}" 
            stroke="${strokeColor}" 
            stroke-width="${strokeWidth}" 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            fill="none"/>
    </svg>
  `.trim();
}

async function generateIcon(size, outputPath, description) {
  const svg = createVIconSvg(size);
  const buffer = Buffer.from(svg);
  
  await sharp(buffer)
    .resize(size, size)
    .png()
    .toFile(outputPath);
  
  console.log(`✓ Generated ${description}: ${outputPath}`);
}

async function generateFaviconIco() {
  // Generate ICO file with multiple sizes
  const sizes = [16, 32];
  const images = [];
  
  for (const size of sizes) {
    const svg = createVIconSvg(size);
    const buffer = Buffer.from(svg);
    const png = await sharp(buffer)
      .resize(size, size)
      .png()
      .toBuffer();
    images.push({ size, data: png });
  }
  
  // For ICO format, we'll create a simple 32x32 PNG and rename it
  // Most systems accept PNG as favicon.ico
  const svg32 = createVIconSvg(32);
  const buffer32 = Buffer.from(svg32);
  const outputPath = path.join(appDir, 'favicon.ico');
  
  await sharp(buffer32)
    .resize(32, 32)
    .png()
    .toFile(outputPath);
  
  console.log(`✓ Generated favicon.ico: ${outputPath}`);
}

async function main() {
  console.log('Generating Voyo favicon assets...\n');
  
  try {
    // Ensure app directory exists
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }
    
    // Generate all required icons
    await generateFaviconIco();
    await generateIcon(32, path.join(appDir, 'icon.png'), 'icon.png (32x32)');
    await generateIcon(180, path.join(appDir, 'apple-icon.png'), 'apple-icon.png (180x180)');
    await generateIcon(192, path.join(appDir, 'icon-192.png'), 'icon-192.png (192x192)');
    await generateIcon(512, path.join(appDir, 'icon-512.png'), 'icon-512.png (512x512)');
    
    console.log('\n✓ All favicon assets generated successfully!');
    console.log(`  Location: ${appDir}`);
    console.log('\nNote: favicon.ico is generated as PNG format.');
    console.log('Next.js App Router will automatically pick up these icons from /app directory.');
    
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

main();
