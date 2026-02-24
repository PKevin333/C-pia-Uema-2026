import { GoogleGenAI } from "@google/genai";
import { dbService } from "./databaseService";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export const geminiService = {
  async checkUserQuota() {
    const user = JSON.parse(localStorage.getItem('reurb_current_user') || '{}');
    if (!user.id) return { allowed: false, error: "Usuário não autenticado." };
    
    const usage = user.quota?.used || 0;
    const limit = user.quota?.limit || 0;

    if (usage >= limit) {
      return { allowed: false, error: "Limite de tokens atingido. Contate o administrador." };
    }
    return { allowed: true, userId: user.id };
  },

  async analyzeDocument(content: string) {
    const quotaCheck = await this.checkUserQuota();
    if (!quotaCheck.allowed) return `ERRO_QUOTA:${quotaCheck.error}`;

    const prompt = `Você é um consultor jurídico especialista em REURB (Lei Federal 13.465/2017). 
    Analise o texto abaixo e forneça sugestões de melhorias técnicas ou correções legais em no máximo 3 parágrafos curtos:
    
    "${content}"`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { 
          temperature: 0.2,
          maxOutputTokens: 800
        },
      });

      dbService.users.updateQuota(quotaCheck.userId!, 500);
      return response.text;
    } catch (error: any) {
      return this.handleAiError(error);
    }
  },

  async applySmartEdit(currentContent: string, instruction: string) {
    const quotaCheck = await this.checkUserQuota();
    if (!quotaCheck.allowed) throw new Error(`ERRO_QUOTA:${quotaCheck.error}`);

    const prompt = `Você é um editor assistente de REURB. 
    Modifique o HTML abaixo seguindo EXATAMENTE esta instrução: "${instruction}". 
    Retorne APENAS o código HTML final atualizado, sem nenhuma explicação adicional. 
    
    CONTEÚDO ATUAL: 
    ${currentContent}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { temperature: 0.1 },
      });

      dbService.users.updateQuota(quotaCheck.userId!, 300);

      let cleanedHtml = response.text || "";
      cleanedHtml = cleanedHtml.replace(/```html/g, "").replace(/```/g, "").trim();
      return cleanedHtml;
    } catch (error: any) {
      throw new Error(this.handleAiError(error));
    }
  },

  handleAiError(error: any): string {
    console.error("[Gemini Error]:", error);
    if (error.message?.includes("429")) return "ERRO_SISTEMA: O servidor de IA está ocupado. Tente em instantes.";
    if (error.message?.includes("API key not found")) return "ERRO_SISTEMA: Chave de API não configurada. Verifique o arquivo .env.";
    return "Erro inesperado na IA. Verifique sua conexão e chave de API.";
  }
};
