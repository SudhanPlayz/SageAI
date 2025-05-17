import { generateText } from "ai";
import { getModel } from "ai/core/model";
import { SageAISettings, SageCommand } from "main";
import { Modal } from "obsidian";
import { EXPLAIN_PROMPT } from "ai/core/prompts";

const explain = async (
	settings: SageAISettings,
	text: string,
	onProgress: (text: string) => void,
) => {
	const prompt = EXPLAIN_PROMPT.replace("{text}", text);

	generateText({
		model: getModel(settings),
		prompt: prompt,
		onStepFinish: (step) => {
			onProgress(step.text);
		},
	});
};

const typeText = (element: HTMLElement, text: string) => {
	element.empty();
	const chars = text.split("");
	chars.forEach((char, index) => {
		const span = element.createSpan();
		span.setText(char);
		span.classList.add("typing-char");
		span.style.setProperty("--delay", `${index * 0.005}s`);
	});
};

export const ExplainCommand: SageCommand = {
	id: "sageai-explain",
	name: "Explain",
	editorCallback: async (app, editor, view) => {
		const selection = editor.getSelection();

		const modal = new Modal(app.app);
		modal.setTitle("Explanation");
		const contentEl = modal.contentEl;
		contentEl.addClass("typing-text");
		modal.open();

		await explain(app.settings, selection, (text) => {
			typeText(contentEl, text);
		});
	},
	icon: "💡",
};
