import { generateText } from "ai";
import { getModel } from "ai/core/model";
import { EDIT_PROMPT, GENERATE_PROMPT } from "ai/core/prompts";
import SageAI, { SageCommand } from "main";
import { Modal } from "obsidian";

const edit = async (app: SageAI, prompt: string, selected: string) => {
	const pt = selected
		? EDIT_PROMPT.replace("{prompt}", prompt).replace(
				"{selected}",
				selected,
			)
		: GENERATE_PROMPT.replace("{prompt}", prompt);

	const { text: edited } = await generateText({
		model: getModel(app.settings),
		prompt: pt,
	});

	return edited;
};

class PromptModal extends Modal {
	private prompt: string;
	private loading: boolean;
	private buttonEl: HTMLButtonElement;
	private loadingEl: HTMLElement;
	private isGenerateMode: boolean;

	constructor(
		app: SageAI,
		selection: string,
		replace: (text: string) => void,
	) {
		console.log(selection);
		super(app.app);
		this.prompt = "";
		this.loading = false;
		this.isGenerateMode = !selection;
		this.setTitle(
			this.isGenerateMode ? "✨ Generate with AI" : "✨ Edit with AI",
		);

		const doc = new DocumentFragment();

		doc.createEl("p", {
			cls: "modal-description",
			text: this.isGenerateMode
				? "Describe what you want to generate"
				: "Describe how you want to edit the selected text",
		});

		const inputContainer = doc.createEl("div", { cls: "input-container" });
		const textarea = inputContainer.createEl("textarea", {
			placeholder: this.isGenerateMode
				? "e.g., A list of 5 book recommendations..."
				: "e.g., Make this paragraph more concise",
			cls: "edit-prompt-input",
		});

		textarea.addEventListener("input", (e) => {
			this.prompt = (e.target as HTMLTextAreaElement).value;
			this.buttonEl.disabled = !this.prompt.trim();

			textarea.style.height = "auto";
			textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
		});

		textarea.dispatchEvent(new Event("input"));

		const buttonContainer = doc.createEl("div", {
			cls: "button-container",
		});
		this.buttonEl = buttonContainer.createEl("button", {
			text: this.isGenerateMode ? "Generate" : "Edit",
			cls: "edit-button",
		});
		this.buttonEl.disabled = true;

		this.loadingEl = buttonContainer.createEl("div", {
			text: "Processing...",
			cls: "loading-text",
		});
		this.loadingEl.style.display = "none";

		buttonContainer.createEl("div", {
			text: "Press Enter to submit",
			cls: "shortcut-hint",
		});

		this.buttonEl.addEventListener("click", async () =>
			this.submitPrompt(app, selection, replace),
		);

		this.modalEl.addEventListener("keydown", (e) => {
			if (
				e.key === "Enter" &&
				!e.shiftKey &&
				this.prompt.trim() &&
				!this.loading
			) {
				e.preventDefault();
				this.submitPrompt(app, selection, replace);
			}
		});

		this.setContent(doc);
	}

	private async submitPrompt(
		app: SageAI,
		selection: string,
		replace: (text: string) => void,
	) {
		if (this.loading || !this.prompt.trim()) return;

		this.setLoading(true);
		try {
			const edited = await edit(app, this.prompt, selection);
			replace(edited);
			this.close();
		} catch (error) {
			console.error("Error during edit:", error);
			this.contentEl.createEl("div", {
				text: "An error occurred. Please try again.",
				cls: "error-message",
			});
		} finally {
			this.setLoading(false);
		}
	}

	private setLoading(isLoading: boolean) {
		this.loading = isLoading;
		this.buttonEl.disabled = isLoading;
		this.buttonEl.setText(
			isLoading
				? "Processing..."
				: this.isGenerateMode
					? "Generate"
					: "Edit",
		);
		this.loadingEl.style.display = isLoading ? "block" : "none";
	}
}

export const EditCommand: SageCommand = {
	id: "sageai-edit",
	name: "Edit/Generate",
	editorCallback: async (app, editor, view) => {
		const selection = editor.getSelection();
		console.log("Selection", selection);

		const modal = new PromptModal(app, selection, (text) => {
			if (selection) {
				editor.replaceSelection(text);
			} else {
				const cursor = editor.getCursor();
				editor.replaceRange(text, cursor);
			}
		});
		modal.open();
	},
};
