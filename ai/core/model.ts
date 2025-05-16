import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOllama } from "ollama-ai-provider";
import { APIProvider, SageAISettings } from "main";

export const getModel = (settings: SageAISettings) => {
	let openRouter;
	let googleGenerativeAI;
	let ollama;

	switch (settings.apiProvider) {
		case APIProvider.OPENROUTER:
			openRouter = createOpenRouter({
				apiKey: settings.apiKey,
				headers: {
					"HTTP-Referer": "https://sudhan.pro",
					"X-Title": "Sage AI",
				},
			});
			return openRouter(settings.model);

		case APIProvider.GOOGLE_GENAI:
			googleGenerativeAI = createGoogleGenerativeAI({
				apiKey: settings.apiKey,
			});
			return googleGenerativeAI(settings.model);

		case APIProvider.OLLAMA:
			ollama = createOllama({
				baseURL: settings.baseURL || "http://localhost:11434",
			});
			return ollama(settings.model);
	}
};
