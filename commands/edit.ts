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

	const model = getModel(app.settings);
	if (!model) {
		throw new Error(
			"No model configured. Please set up a model in settings.",
		);
	}

	try {
		const { text: edited } = await generateText({
			model,
			prompt: pt,
		});

		return edited;
	} catch (error) {
		console.error("AI generation error:", error);
		throw new Error(
			"Failed to generate text. Please check your connection and try again.",
		);
	}
};

class PromptModal extends Modal {
	private prompt: string;
	private loading: boolean;
	private buttonEl: HTMLButtonElement;
	private loadingEl: HTMLElement;
	private errorEl: HTMLElement;
	private isGenerateMode: boolean;
	private textarea: HTMLTextAreaElement;
	private inputContainer: HTMLElement;

	constructor(
		app: SageAI,
		selection: string,
		replace: (text: string) => void,
	) {
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
				? "Describe what you'd like me to generate for you. Be specific about style, format, and length for better results."
				: "Tell me how you'd like to transform the selected text. Try to be specific about the changes you want made.",
		});

		this.inputContainer = doc.createEl("div", { cls: "input-container" });
		this.textarea = this.inputContainer.createEl("textarea", {
			placeholder: this.isGenerateMode
				? "e.g., Write a concise summary of the key points from my meeting notes..."
				: "e.g., Rewrite this to be more concise and professional",
			cls: "edit-prompt-input",
		});

		this.textarea.addEventListener("input", (e) => {
			this.prompt = (e.target as HTMLTextAreaElement).value;
			this.buttonEl.disabled = !this.prompt.trim();
			this.updateCharCount();

			this.textarea.classList.add("edit-prompt-input");
		});

		if (this.isGenerateMode) {
			const suggestionContainer = doc.createEl("div", {
				cls: "prompt-suggestions",
			});

			const suggestions = [
				"Write a list of 5 key points",
				"Create a detailed outline",
				"Draft an email response",
				"Generate a table comparing...",
				"Create a bulleted summary",
			];

			suggestions.forEach((suggestion) => {
				const suggestionEl = suggestionContainer.createEl("div", {
					cls: "prompt-suggestion",
					text: suggestion,
				});

				suggestionEl.addEventListener("click", () => {
					this.textarea.value = suggestion;
					this.prompt = suggestion;
					this.buttonEl.disabled = false;
					this.updateCharCount();
					this.textarea.focus();
				});
			});
		}

		const buttonContainer = doc.createEl("div", {
			cls: "button-container",
		});
		this.buttonEl = buttonContainer.createEl("button", {
			text: this.isGenerateMode ? "Generate" : "Edit",
			cls: "edit-button",
		});
		this.buttonEl.disabled = true;

		this.loadingEl = buttonContainer.createEl("div", {
			text: "Processing your request...",
			cls: "loading-text",
		});
		this.loadingEl.classList.add("hidden");

		buttonContainer.createEl("div", {
			text: "Press Enter to submit",
			cls: "shortcut-hint",
		});

		this.errorEl = doc.createEl("div", {
			cls: "error-message",
		});
		this.errorEl.classList.add("hidden");

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

	onOpen() {
		super.onOpen();
		setTimeout(() => this.textarea.focus(), 10);
	}

	private updateCharCount() {
		const count = this.prompt.length;
		this.inputContainer.setAttribute(
			"data-char-count",
			`${count} characters`,
		);
	}

	private async submitPrompt(
		app: SageAI,
		selection: string,
		replace: (text: string) => void,
	) {
		if (this.loading || !this.prompt.trim()) return;

		this.setLoading(true);
		this.hideError();

		try {
			const edited = await edit(app, this.prompt, selection);
			replace(edited);
			this.showSuccessNotification();
			this.close();
		} catch (error) {
			console.error("Error during edit:", error);
			this.showError(
				error instanceof Error
					? error.message
					: "An error occurred. Please try again.",
			);
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
		this.loadingEl.classList.toggle("hidden", isLoading);
	}

	private showError(message: string) {
		this.errorEl.setText(message);
		this.errorEl.classList.remove("hidden");
	}

	private hideError() {
		this.errorEl.classList.add("hidden");
	}

	private showSuccessNotification() {
		const notification = document.createElement("div");
		notification.classList.add("success-notification");
		notification.textContent = this.isGenerateMode
			? "Text successfully generated!"
			: "Text successfully edited!";
		document.body.appendChild(notification);

		setTimeout(() => {
			notification.classList.add("hiding");
			setTimeout(() => {
				document.body.removeChild(notification);
			}, 300);
		}, 3000);
	}
}

export const EditCommand: SageCommand = {
	id: "sageai-edit",
	name: "Edit/Generate",
	editorCallback: async (app, editor, view) => {
		const selection = editor.getSelection();

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
