import { createWorker } from 'tesseract.js';

/** Reconnaissance de texte (OCR) sur une photo de recette — tourne entièrement
 * dans le navigateur (Tesseract.js), gratuit mais moins fiable qu'un texte
 * propre : le résultat est à relire avant extraction, pas à prendre tel quel. */
export async function recognizeRecipePhoto(file: File): Promise<string> {
  const worker = await createWorker('fra');
  try {
    const {
      data: { text },
    } = await worker.recognize(file);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}
