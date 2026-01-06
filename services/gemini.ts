
import { GoogleGenAI, Type } from "@google/genai";
import { Category, ShoppingItem, AISuggestion } from "../types";

// Always use the environment variable directly as per guidelines.
export const getForgottenSuggestions = async (currentItems: ShoppingItem[]): Promise<AISuggestion[]> => {
  // Creating a new instance right before the call to ensure the latest API key is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const itemNames = currentItems.map(item => item.name).join(", ");
  const prompt = `Com base na seguinte lista de compras atual: [${itemNames || 'lista vazia'}].
    Sugira 5 itens adicionais que o usuário possa ter esquecido de comprar. 
    Considere combinações comuns e itens básicos de casa.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { 
                type: Type.STRING,
                enum: Object.values(Category),
              },
              reason: { type: Type.STRING }
            },
            required: ["name", "category", "reason"]
          }
        }
      }
    });

    // Accessing .text property directly as per latest SDK guidelines.
    const text = response.text;
    if (!text) return [];
    
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as AISuggestion[]) : [];
  } catch (error: any) {
    // Handling potential invalid API key errors gracefully.
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_INVALID");
    }
    console.error("Erro na API Gemini:", error);
    throw error;
  }
};

export const autoCategorizeItems = async (items: ShoppingItem[]): Promise<{ id: string, category: Category }[]> => {
  // Initializing the SDK with the required configuration.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  if (items.length === 0) return [];

  const itemsToProcess = items.map(i => ({ id: i.id, name: i.name }));
  const prompt = `Classifique estes itens de supermercado nas categorias: ${Object.values(Category).join(", ")}.
    Itens: ${JSON.stringify(itemsToProcess)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: { type: Type.STRING, enum: Object.values(Category) }
            },
            required: ["id", "category"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as { id: string, category: Category }[]) : [];
  } catch (error: any) {
    console.error("Erro na categorização:", error);
    throw error;
  }
};
