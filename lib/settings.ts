import SageAI, { APIProvider } from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class SettingsTab extends PluginSettingTab {
	plugin: SageAI;

	constructor(app: App, plugin: SageAI) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("API provider")
			.setDesc("Select which AI provider to use")
			.addDropdown((dropdown) =>
				dropdown
					.addOption(APIProvider.OPENROUTER, "OpenRouter")
					.addOption(APIProvider.GOOGLE_GENAI, "Google Gemini")
					.addOption(APIProvider.OLLAMA, "Ollama")
					.addOption(APIProvider.GROQ, "Groq")
					.addOption(APIProvider.ANTHROPIC, "Anthropic")
					.addOption(APIProvider.MISTRAL, "Mistral")
					.addOption(APIProvider.OPENAI, "OpenAI")
					.addOption(APIProvider.XAI, "XAI")
					.setValue(this.plugin.settings.apiProvider)
					.onChange(async (value) => {
						this.plugin.settings.apiProvider = value as APIProvider;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (this.plugin.settings.apiProvider !== APIProvider.OLLAMA) {
			new Setting(containerEl)
				.setName("API key")
				.setDesc("Enter your API key for the selected provider")
				.addText((text) =>
					text
						.setPlaceholder("Enter your API key")
						.setValue(this.plugin.settings.apiKey)
						.onChange(async (value) => {
							this.plugin.settings.apiKey = value;
							await this.plugin.saveSettings();
						}),
				);
		}

		new Setting(containerEl)
			.setName("Model")
			.setDesc("Enter the model name to use (e.g. gpt-4, gpt-4o-mini)")
			.addText((text) =>
				text
					.setPlaceholder("Enter model name")
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value;
						await this.plugin.saveSettings();
					}),
			);

		if (this.plugin.settings.apiProvider === APIProvider.OLLAMA) {
			new Setting(containerEl)
				.setName("Base URL")
				.setDesc(
					"Enter the base URL for Ollama (default: http://localhost:11434)",
				)
				.addText((text) =>
					text
						.setPlaceholder("http://localhost:11434")
						.setValue(this.plugin.settings.baseURL || "")
						.onChange(async (value) => {
							this.plugin.settings.baseURL = value;
							await this.plugin.saveSettings();
						}),
				);
		}

		new Setting(containerEl)
			.setName("Hide thought process")
			.setDesc("Hide the AI's thought process and tool usage details")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.hideThoughtProcess)
					.onChange(async (value) => {
						this.plugin.settings.hideThoughtProcess = value;
						await this.plugin.saveSettings();
					}),
			);

		const fundingEl = containerEl.createDiv("sage-funding");
		const fundingContainer = fundingEl.createDiv("sage-funding-container");

		const header = fundingContainer.createDiv("sage-funding-header");
		const sparklesIcon = header.createEl("div", {
			cls: "lucide lucide-sparkles",
		});
		sparklesIcon.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
				<path d="M20 3v4"></path>
				<path d="M22 5h-4"></path>
				<path d="M4 17v2"></path>
				<path d="M5 18H3"></path>
			</svg>
		`;
		header.createEl("h3", {
			text: "Support Sage AI",
			cls: "sage-funding-title",
		});

		fundingContainer.createEl("p", {
			text: "Love using Sage AI? Here's how you can help us grow:",
			cls: "sage-funding-description",
		});

		const buttonsContainer = fundingContainer.createDiv(
			"sage-funding-buttons",
		);

		const sponsorButton = buttonsContainer.createEl("a", {
			href: "https://github.com/sponsors/SudhanPlayz",
			attr: {
				target: "_blank",
				rel: "noopener",
			},
			cls: "sage-funding-button sage-funding-button-primary",
		});
		const sponsorIcon = sponsorButton.createEl("div", {
			cls: "button-icon",
		});
		sponsorIcon.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
			</svg>
		`;
		sponsorButton.createSpan({ text: "Become a Sponsor" });
		sponsorButton.createEl("span", { cls: "sage-funding-button-shine" });

		const starButton = buttonsContainer.createEl("a", {
			href: "https://github.com/SudhanPlayz/SageAI",
			attr: {
				target: "_blank",
				rel: "noopener",
			},
			cls: "sage-funding-button sage-funding-button-secondary",
		});
		const starIcon = starButton.createEl("div", { cls: "button-icon" });
		starIcon.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
			</svg>
		`;
		starButton.createSpan({ text: "Star on GitHub" });
		starButton.createEl("span", { cls: "sage-funding-button-shine" });

		const footer = fundingContainer.createDiv("sage-funding-footer");
		const footerIcon = footer.createEl("div", { cls: "footer-icon" });
		footerIcon.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
			</svg>
		`;
		footer.createEl("p", {
			text: "Every contribution, big or small, helps us make Sage AI better! <3",
			cls: "sage-funding-footer-text",
		});

		const buttons = fundingEl.querySelectorAll("a");
		buttons.forEach((button) => {
			button.addEventListener("mouseover", () => {
				button.style.opacity = "0.9";
			});
			button.addEventListener("mouseout", () => {
				button.style.opacity = "1";
			});
		});
	}
}
