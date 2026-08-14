const fs = require('fs');
const path = require('path');

function createCarIcon() {
  const width = 64;
  const height = 64;
  const pixels = new Uint8ClampedArray(width * height * 4); // RGBA

  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    pixels[idx] = r;
    pixels[idx + 1] = g;
    pixels[idx + 2] = b;
    pixels[idx + 3] = a;
  }

  // 1. Desenha fundo quadrado arredondado com gradiente azul escuro -> azul royal
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Checa bordas arredondadas (raio 10)
      let inCorner = false;
      const r = 10;
      if (x < r && y < r && Math.hypot(x - r, y - r) > r) inCorner = true;
      if (x >= width - r && y < r && Math.hypot(x - (width - r), y - r) > r) inCorner = true;
      if (x < r && y >= height - r && Math.hypot(x - r, y - (height - r)) > r) inCorner = true;
      if (x >= width - r && y >= height - r && Math.hypot(x - (width - r), y - (height - r)) > r) inCorner = true;

      if (!inCorner) {
        // Gradiente azul tecnológico
        const t = (x + y) / (width + height);
        const red = Math.round(15 * (1 - t) + 37 * t);
        const green = Math.round(23 * (1 - t) + 99 * t);
        const blue = Math.round(42 * (1 - t) + 235 * t);
        setPixel(x, y, red, green, blue, 255);

        // Borda ciano brilhante
        if (x <= 1 || x >= width - 2 || y <= 1 || y >= height - 2) {
          setPixel(x, y, 56, 189, 248, 220);
        }
      }
    }
  }

  // 2. Desenha Silhueta do Carro Esportivo
  // Teto e Vidros
  for (let y = 18; y <= 27; y++) {
    const xStart = 20 + Math.round((27 - y) * 0.8);
    const xEnd = 44 - Math.round((27 - y) * 0.5);
    for (let x = xStart; x <= xEnd; x++) {
      setPixel(x, y, 14, 165, 233, 255); // Vidro ciano
    }
  }

  // Coluna do vidro central
  for (let y = 18; y <= 27; y++) {
    setPixel(32, y, 255, 255, 255, 255);
  }

  // Corpo / Lataria do Carro (Branco com brilho)
  for (let y = 28; y <= 38; y++) {
    for (let x = 8; x <= 55; x++) {
      // Cavidades das rodas (dianteira ~18, traseira ~44)
      const distWheelF = Math.hypot(x - 19, y - 38);
      const distWheelR = Math.hypot(x - 44, y - 38);
      if (distWheelF > 8 && distWheelR > 8) {
        setPixel(x, y, 255, 255, 255, 255);
      }
    }
  }

  // Faróis dianteiros e traseiros
  setPixel(8, 30, 250, 204, 21, 255); // Amarelo/Dourado farol
  setPixel(9, 30, 250, 204, 21, 255);
  setPixel(54, 30, 239, 68, 68, 255); // Vermelho lanterna
  setPixel(55, 30, 239, 68, 68, 255);

  // Rodas e Pneus (Preto e Ciano no miolo)
  function drawWheel(centerX, centerY) {
    for (let dy = -6; dy <= 6; dy++) {
      for (let dx = -6; dx <= 6; dx++) {
        const d = Math.hypot(dx, dy);
        if (d <= 6) {
          if (d <= 2) {
            setPixel(centerX + dx, centerY + dy, 56, 189, 248, 255); // Roda ciano
          } else if (d <= 5) {
            setPixel(centerX + dx, centerY + dy, 15, 23, 42, 255); // Pneu
          } else {
            setPixel(centerX + dx, centerY + dy, 100, 116, 139, 255); // Borda
          }
        }
      }
    }
  }

  drawWheel(19, 38);
  drawWheel(44, 38);

  // 3. Ferramenta / Chave Inglesa e Detalhes no Rodapé
  // Texto / Badge "OFICINA"
  for (let x = 12; x <= 52; x++) {
    setPixel(x, 48, 56, 189, 248, 200);
    setPixel(x, 49, 56, 189, 248, 255);
  }

  // Converte para formato .ICO
  // ICO Header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reservado
  header.writeUInt16LE(1, 2); // Tipo 1 = Icon
  header.writeUInt16LE(1, 4); // 1 imagem

  // Image Directory Entry (16 bytes)
  const entry = Buffer.alloc(16);
  entry.writeUInt8(width, 0); // Width
  entry.writeUInt8(height, 1); // Height
  entry.writeUInt8(0, 2); // Color count (0 = >=8bpp)
  entry.writeUInt8(0, 3); // Reservado
  entry.writeUInt16LE(1, 4); // Color planes
  entry.writeUInt16LE(32, 6); // Bits per pixel (32bpp RGBA)

  const imageSize = 40 + width * height * 4 + (width * height) / 8;
  entry.writeUInt32LE(imageSize, 8); // Size of image data
  entry.writeUInt32LE(6 + 16, 12); // Offset to image data

  // BMP Header (40 bytes)
  const bmpHeader = Buffer.alloc(40);
  bmpHeader.writeUInt32LE(40, 0); // Header size
  bmpHeader.writeInt32LE(width, 4); // Width
  bmpHeader.writeInt32LE(height * 2, 8); // Height (x2 for XOR + AND masks)
  bmpHeader.writeUInt16LE(1, 12); // Planes
  bmpHeader.writeUInt16LE(32, 14); // BPP
  bmpHeader.writeUInt32LE(0, 16); // Compression (0 = BI_RGB)
  bmpHeader.writeUInt32LE(width * height * 4, 20); // Image size
  bmpHeader.writeInt32LE(0, 24); // X pixels per meter
  bmpHeader.writeInt32LE(0, 28); // Y pixels per meter
  bmpHeader.writeUInt32LE(0, 32); // Colors used
  bmpHeader.writeUInt32LE(0, 36); // Important colors

  // Pixel Data (BGRA bottom-to-top)
  const pixelData = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcY = height - 1 - y; // Inverter eixo Y (BMP é bottom-up)
    for (let x = 0; x < width; x++) {
      const srcIdx = (srcY * width + x) * 4;
      const dstIdx = (y * width + x) * 4;
      pixelData[dstIdx] = pixels[srcIdx + 2]; // B
      pixelData[dstIdx + 1] = pixels[srcIdx + 1]; // G
      pixelData[dstIdx + 2] = pixels[srcIdx]; // R
      pixelData[dstIdx + 3] = pixels[srcIdx + 3]; // A
    }
  }

  // AND Mask (1 bit por pixel, tudo 0 para 32bpp alpha)
  const andMask = Buffer.alloc((width * height) / 8, 0);

  const finalIcoBuffer = Buffer.concat([header, entry, bmpHeader, pixelData, andMask]);
  fs.writeFileSync(path.join(__dirname, 'icon.ico'), finalIcoBuffer);
  
  // Cria pasta public se nao existir e salva lá também
  if (!fs.existsSync(path.join(__dirname, 'public'))) {
    fs.mkdirSync(path.join(__dirname, 'public'));
  }
  fs.writeFileSync(path.join(__dirname, 'public', 'favicon.ico'), finalIcoBuffer);
  fs.writeFileSync(path.join(__dirname, 'public', 'icon.ico'), finalIcoBuffer);

  console.log('✅ Arquivo icon.ico automotivo criado com sucesso!');
}

createCarIcon();
