import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Transcribes handwritten notes from multiple images.
 * @param imagesBase64 Array of base64 strings (raw data, without the data:image/... prefix)
 * @param mimeType The mime type of the images (e.g., 'image/jpeg')
 */
export const transcribeNotes = async (imagesBase64: string[], mimeType: string = 'image/jpeg'): Promise<string> => {
  try {
    // Prepare parts: multiple images + one text prompt
    // Explicitly type the array to accept both image data and text
    const parts: ({ inlineData: { mimeType: string; data: string } } | { text: string })[] = imagesBase64.map(img => ({
      inlineData: {
        mimeType: mimeType,
        data: img
      }
    }));

    // Add the prompt as the last part
    parts.push({
      text: `Actúa como un experto transcriptor de documentos académicos y caligrafía. 
      
      Instrucciones:
      1. Analiza estas imágenes que corresponden a los mismos apuntes (pueden ser varias páginas o varias tomas de la misma página).
      2. Tu objetivo es extraer TODO el texto visible y convertirlo en un formato digital limpio.
      3. Si hay solapamientos entre las fotos, úsalos para confirmar el texto.
      4. ESTRUCTURA EL TEXTO: Usa formato claro con títulos, viñetas (-) para listas, y párrafos bien separados.
      5. Ignora elementos que no sean parte del apunte (dedos, mesa, sombras).
      6. Si algo es ilegible, marca la zona como [ilegible].
      
      IMPORTANTE: Devuelve el texto listo para ser impreso en un documento formal. No incluyas saludos, ni introducciones como "Aquí está la transcripción". Solo el contenido del apunte.`
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        role: 'user',
        parts: parts
      }
    });

    return response.text || "No se pudo extraer texto de las imágenes.";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw new Error("Error al procesar las imágenes. Asegúrate de que sean claras.");
  }
};