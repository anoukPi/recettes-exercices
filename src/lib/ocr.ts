import { createWorker } from 'tesseract.js';

const MIN_WIDTH = 1600;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire cette image."));
    };
    img.src = url;
  });
}

/** Agrandit si besoin (l'OCR est nettement plus fiable avec du texte assez
 * grand) et étire le contraste en niveaux de gris — améliore la lecture de
 * Tesseract sans aller jusqu'au noir/blanc pur, plus robuste sur une photo
 * avec un éclairage inégal. */
async function preprocessForOcr(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const scale = img.width < MIN_WIDTH ? MIN_WIDTH / img.width : 1;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponible.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  const gray = new Uint8ClampedArray(data.length / 4);
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[i / 4] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }

  const range = Math.max(1, max - min);
  for (let i = 0; i < data.length; i += 4) {
    const stretched = ((gray[i / 4] - min) / range) * 255;
    data[i] = stretched;
    data[i + 1] = stretched;
    data[i + 2] = stretched;
  }
  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Échec du traitement de l\'image.'))), 'image/png');
  });
}

/** Reconnaissance de texte (OCR) sur une photo de recette — tourne entièrement
 * dans le navigateur (Tesseract.js), gratuit mais moins fiable qu'un texte
 * propre : le résultat est à relire avant extraction, pas à prendre tel quel. */
export async function recognizeRecipePhoto(file: File): Promise<string> {
  const source = await preprocessForOcr(file).catch(() => file);
  const worker = await createWorker('fra');
  try {
    const {
      data: { text },
    } = await worker.recognize(source);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}
