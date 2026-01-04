
import { GoogleGenAI, Type } from "@google/genai";
import { Category, ShoppingItem, AISuggestion } from "../types";

export const getForgottenSuggestions = async (currentItems: ShoppingItem[]): Promise<AISuggestion[]> => {
  const itemNames = currentItems.map(item => item.name).join(", ");
  
  const prompt = `
    Com base na seguinte lista de compras atual: [${itemNames}].
    Sugira 5 itens adicionais que o usuário possa ter esquecido de comprar. 
    Considere combinações comuns (ex: se tem café, talvez falte açúcar ou leite).
    Retorne as sugestões em formato JSON seguindo o esquema fornecido.
  `;

  try {
    // Initializing GoogleGenAI directly with process.env.API_KEY as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
                description: "A categoria correta para o item."
              },
              reason: { type: Type.STRING, description: "Breve explicação do porquê sugeriu este item" }
            },
            required: ["name", "category", "reason"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as AISuggestion[];
  } catch (error) {
    console.error("Erro ao obter sugestões do Gemini:", error);
    return [];
  }
};

export const autoCategorizeItems = async (items: ShoppingItem[]): Promise<{ id: string, category: Category }[]> => {
  const itemsToProcess = items.map(i => ({ id: i.id, name: i.name }));
  const prompt = `
    Classifique os seguintes itens de supermercado nas categorias corretas.
    Categorias disponíveis: ${Object.values(Category).join(", ")}.
    
    Itens: ${JSON.stringify(itemsToProcess)}
    
    Retorne apenas um array JSON de objetos com { "id": string, "category": string }.
  `;

  try {
    // Initializing GoogleGenAI directly with process.env.API_KEY as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    return JSON.parse(text) as { id: string, category: Category }[];
  } catch (error) {
    console.error("Erro ao auto-categorizar:", error);
    return [];
  }
};
