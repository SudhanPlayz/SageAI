import { generateText } from "ai";
import { getModel } from "ai/core/model";
import { SUMMARIZE_PROMPT } from "ai/core/prompts";
import { SageAISettings, SageCommand } from "main";

const summarize = async (settings: SageAISettings, text: string) => {
	const prompt = SUMMARIZE_PROMPT.replace("{text}", text);

	const model = getModel(settings);
	if (!model) {
		throw new Error(
			"No model configured. Please set up a model in settings.",
		);
	}

	const { text: summary } = await generateText({
		model,
		prompt: prompt,
	});
	return summary;
};

export const SummarizeCommand: SageCommand = {
	id: "sageai-summarize",
	name: "Summarize",
	editorCallback: async (app, editor, view) => {
		if (!view || !view.file) {
			return;
		}

		let textToSummarize = editor.getSelection();
		if (!textToSummarize) {
			textToSummarize = editor.getValue();
		}

		if (!textToSummarize.trim()) {
			return;
		}

		const summary = await summarize(app.settings, textToSummarize);

		if (editor.getSelection()) {
			editor.replaceSelection(summary);
		} else {
			editor.setValue(summary);
		}
	},
};
