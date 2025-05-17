import { EditCommand } from "commands/edit";
import { ExplainCommand } from "commands/explain";
import { SummarizeCommand } from "commands/summarize";
import { addRibbon } from "lib/ribbon";
import { SettingsTab } from "lib/settings";
import Storage from "lib/storage";
import {
	Command,
	Editor,
	Hotkey,
	MarkdownFileInfo,
	MarkdownView,
	Plugin,
	WorkspaceLeaf,
} from "obsidian";
import { VIEW_TYPE_AGENT, AgentView } from "ui";

export enum APIProvider {
	OPENROUTER = "openrouter",
	GOOGLE_GENAI = "google-genai",
	OLLAMA = "ollama",
}

export interface SageAISettings {
	apiKey: string;
	apiProvider: APIProvider;
	model: string;
	baseURL?: string;
	hideThoughtProcess: boolean;
}

export interface SageCommand {
	id: string;
	name: string;
	callback?: (app: SageAI) => void;
	editorCallback?: (app: SageAI, editor: Editor, view: MarkdownView) => void;
	icon?: string;
	checkCallback?: (app: SageAI, checking: boolean) => boolean;
	hotkeys?: Hotkey[];
	editorCheckCallback?: (
		app: SageAI,
		checking: boolean,
		editor: Editor,
		ctx: MarkdownView | MarkdownFileInfo,
	) => boolean;
}

const DEFAULT_SETTINGS: SageAISettings = {
	apiProvider: APIProvider.OPENROUTER,
	apiKey: "",
	model: "gpt-4o-mini",
	hideThoughtProcess: true,
};

const commands = [SummarizeCommand, ExplainCommand, EditCommand];

export default class SageAI extends Plugin {
	settings: SageAISettings;
	storage: Storage;

	async onload() {
		await this.loadSettings();
		this.storage = new Storage(this.app);
		addRibbon(this);

		this.registerView(VIEW_TYPE_AGENT, (leaf) => new AgentView(leaf, this));

		this.addCommand({
			id: "sage-ai-activate-view",
			name: "Activate View",
			callback: () => this.activateView(),
		});

		for (const command of commands) {
			const commandOptions: Command = {
				id: command.id,
				name: command.name,
			};

			if (command.editorCallback) {
				commandOptions.editorCallback = (
					editor: Editor,
					view: MarkdownView,
				) => {
					if (command.editorCallback) {
						return command.editorCallback(this, editor, view);
					}
				};
			}

			if (command.callback) {
				commandOptions.callback = () => {
					if (command.callback) {
						return command.callback(this);
					}
				};
			}

			if (command.icon) {
				commandOptions.icon = command.icon;
			}

			if (command.checkCallback) {
				commandOptions.checkCallback = (checking: boolean) => {
					if (command.checkCallback) {
						return command.checkCallback(this, checking);
					}
					return false;
				};
			}

			if (command.hotkeys) {
				commandOptions.hotkeys = command.hotkeys;
			}

			if (command.editorCheckCallback) {
				commandOptions.editorCheckCallback = (
					checking: boolean,
					editor: Editor,
					ctx: MarkdownView | MarkdownFileInfo,
				) => {
					if (command.editorCheckCallback) {
						return command.editorCheckCallback(
							this,
							checking,
							editor,
							ctx,
						);
					}
					return false;
				};
			}

			this.addCommand(commandOptions);
		}

		this.addSettingTab(new SettingsTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_AGENT);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				leaf = rightLeaf;
				await leaf.setViewState({
					type: VIEW_TYPE_AGENT,
					active: true,
				});
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}
