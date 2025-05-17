import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOllama } from "ollama-ai-provider";
import { APIProvider, SageAISettings } from "main";
import { createGroq } from "@ai-sdk/groq";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";

export const getModel = (settings: SageAISettings) => {
	let openRouter;
	let googleGenerativeAI;
	let ollama;
	let groq;
	let anthropic;
	let openai;
	let mistral;
	let xai;

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

		case APIProvider.GROQ:
			groq = createGroq({
				apiKey: settings.apiKey,
			});
			return groq(settings.model);

		case APIProvider.ANTHROPIC:
			anthropic = createAnthropic({
				apiKey: settings.apiKey,
			});
			return anthropic(settings.model);

		case APIProvider.MISTRAL:
			mistral = createMistral({
				apiKey: settings.apiKey,
			});
			return mistral(settings.model);

		case APIProvider.OPENAI:
			openai = createOpenAI({
				apiKey: settings.apiKey,
			});
			return openai(settings.model);

		case APIProvider.XAI:
			xai = createXai({
				apiKey: settings.apiKey,
			});
			return xai(settings.model);
	}
};
