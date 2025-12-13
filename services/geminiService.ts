
import { GoogleGenAI, Type } from "@google/genai";
import { CollectionPoint, OptimizedRoute, BinStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const optimizeRouteWithAI = async (points: CollectionPoint[]): Promise<OptimizedRoute> => {
  // Simplificar os dados enviados para a IA para focar no essencial e reduzir alucinações
  const simplifiedPoints = points.map(p => ({
    id: p.id,
    address: p.address,
    status: p.status,
    lat: p.lat,
    lng: p.lng
  }));

  const prompt = `
    Atue como um sistema logístico inteligente de gestão de resíduos.
    Tenho a seguinte lista de pontos de coleta com coordenadas (lat/lng) e status:
    ${JSON.stringify(simplifiedPoints)}

    Tarefa:
    1. Crie uma rota lógica (Problema do Caixeiro Viajante) priorizando pontos com status 'Cheio' e 'Transbordando'.
    2. Pontos 'Vazio' devem ser ignorados.
    3. Estime o tempo da rota e a economia de distância considerando a geografia.
    4. Gere uma explicação ('reasoning').

    REGRAS CRÍTICAS DE RESPOSTA:
    - No campo 'orderedIds', retorne APENAS os IDs exatos dos pontos na ordem de visita.
    - No campo 'reasoning' (explicação), **SEMPRE use o ENDEREÇO (address) do ponto para se referir a ele, NUNCA use o ID**. Exemplo: "Comece pela Rua Augusta..." e NÃO "Comece pelo ponto 3...".
    - Responda estritamente no formato JSON definido.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            orderedIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedTime: { type: Type.STRING },
            distanceSaved: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    // Mapear os IDs de volta para os objetos originais
    const sortedPoints = (result.orderedIds || [])
      .map((id: string) => points.find(p => p.id === id))
      .filter((p: CollectionPoint | undefined): p is CollectionPoint => p !== undefined);

    // Fallback caso a IA não retorne IDs válidos ou a lista esteja vazia
    if (sortedPoints.length === 0) {
        throw new Error("IA não retornou rota válida");
    }

    return {
      points: sortedPoints,
      estimatedTime: result.estimatedTime || "30 min",
      distanceSaved: result.distanceSaved || "2 km",
      reasoning: result.reasoning || "Rota otimizada baseada na prioridade de volume e proximidade geográfica."
    };
  } catch (error) {
    console.error("Erro ao otimizar:", error);
    
    // Fallback Local: Ordena por urgência simples
    const fallbackPoints = points
        .filter(p => p.status === BinStatus.FULL || p.status === BinStatus.OVERFLOWING)
        .sort((a, b) => {
            // Prioridade simples: Transbordando > Cheio
            if (a.status === BinStatus.OVERFLOWING && b.status !== BinStatus.OVERFLOWING) return -1;
            if (b.status === BinStatus.OVERFLOWING && a.status !== BinStatus.OVERFLOWING) return 1;
            return 0;
        });

    return {
      points: fallbackPoints,
      estimatedTime: "Calculado localmente (Modo Offline)",
      distanceSaved: "N/A",
      reasoning: "Sistema offline: Rota gerada priorizando apenas status crítico (Transbordando > Cheio)."
    };
  }
};

export const predictZoneStatus = async (points: CollectionPoint[]): Promise<CollectionPoint[]> => {
  const prompt = `
    Analise estes pontos de coleta e forneça uma PREVISÃO de volume para as próximas 24 horas.
    Considere: Áreas residenciais geram mais lixo orgânico fim de semana.
    
    Dados atuais: ${JSON.stringify(points.map(p => ({ id: p.id, type: p.type, status: p.status, region: p.region })))}

    Retorne um JSON onde as chaves são os IDs e os valores são strings curtas de previsão (ex: "Tendência de alta", "Estável", "Crítico em 4h").
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const predictions = JSON.parse(response.text || '{}');
    
    return points.map(p => ({
      ...p,
      predictedLevel: predictions[p.id] || "Análise indisponível"
    }));

  } catch (error) {
    return points.map(p => ({ ...p, predictedLevel: "Estável (Sem dados)" }));
  }
};

export const chatWithEcoBot = async (history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `Você é o EcoBot, um assistente virtual amigável do app reColeta.
        Seu objetivo é ajudar moradores com:
        1. Dúvidas sobre separação de lixo (reciclável vs orgânico).
        2. Horários de coleta (invente horários realistas baseados no contexto).
        3. Reportar problemas.
        
        Seja conciso, use emojis e mantenha um tom comunitário e encorajador.
        Se perguntarem sobre pontos, diga que podem ver no mapa.`
      },
      history: history
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    return "Desculpe, estou com dificuldade de conexão. Tente novamente mais tarde! 🌱";
  }
};

export const generateEcoTip = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Gere uma citação curta e inspiradora sobre natureza/sustentabilidade de uma pessoa real famosa (cite o autor) OU um fato curioso sobre reciclagem. Máximo 25 palavras. Não use markdown (negrito/itálico).",
    });
    
    let text = response.text || "Na natureza nada se cria, nada se perde, tudo se transforma. - Lavoisier";
    
    // Limpeza de artefatos comuns de Markdown que a IA possa ignorar
    text = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^"|"$/g, '').trim();
    
    return text;
  } catch (e) {
    return "A natureza não faz nada em vão. - Aristóteles";
  }
};
