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
			.setName("API Provider")
			.setDesc("Select which AI provider to use")
			.addDropdown((dropdown) =>
				dropdown
					.addOption(APIProvider.OPENROUTER, "OpenRouter")
					.addOption(APIProvider.GOOGLE_GENAI, "Google Gemini")
					.addOption(APIProvider.OLLAMA, "Ollama")
					.setValue(this.plugin.settings.apiProvider)
					.onChange(async (value) => {
						this.plugin.settings.apiProvider = value as APIProvider;
						await this.plugin.saveSettings();
						this.display();
					}),
			);

		if (this.plugin.settings.apiProvider !== APIProvider.OLLAMA) {
			new Setting(containerEl)
				.setName("API Key")
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

		const fundingEl = containerEl.createDiv("sage-funding");
		fundingEl.innerHTML = `
			<div style="
				margin-top: 30px;
				padding: 20px;
				border-radius: 8px;
				background: var(--background-secondary);
				border: 1px solid var(--background-modifier-border);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			">
				<div style="
					display: flex;
					align-items: center;
					gap: 12px;
					margin-bottom: 12px;
				">
					<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles" style="color: var(--interactive-accent)">
						<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
						<path d="M20 3v4"></path>
						<path d="M22 5h-4"></path>
						<path d="M4 17v2"></path>
						<path d="M5 18H3"></path>
					</svg>
					<h3 style="margin: 0; color: var(--text-normal);">Support Sage AI</h3>
				</div>
				<p style="
					margin: 0 0 16px 0;
					color: var(--text-muted);
					line-height: 1.5;
				">
					Love using Sage AI? Here's how you can help us grow:
				</p>
				<div style="
					display: flex;
					gap: 12px;
					margin-bottom: 16px;
				">
					<a href="https://github.com/sponsors/SudhanPlayz" 
					   target="_blank" 
					   rel="noopener"
					   style="
						display: inline-flex;
						align-items: center;
						gap: 8px;
						padding: 8px 16px;
						background: var(--interactive-accent);
						color: var(--text-on-accent);
						border-radius: 4px;
						text-decoration: none;
						font-weight: 500;
						transition: all 0.2s ease;
						flex: 1;
						justify-content: center;
						position: relative;
						overflow: hidden;
					">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
						</svg>
						Become a Sponsor
						<span style="
							position: absolute;
							top: 0;
							left: 0;
							width: 100%;
							height: 100%;
							background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
							transform: translateX(-100%);
							transition: transform 0.6s;
						"></span>
					</a>
					<a href="https://github.com/SudhanPlayz/SageAI" 
					   target="_blank" 
					   rel="noopener"
					   style="
						display: inline-flex;
						align-items: center;
						gap: 8px;
						padding: 8px 16px;
						background: var(--background-primary);
						color: var(--text-normal);
						border: 1px solid var(--background-modifier-border);
						border-radius: 4px;
						text-decoration: none;
						font-weight: 500;
						transition: all 0.2s ease;
						flex: 1;
						justify-content: center;
						position: relative;
						overflow: hidden;
					">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
						</svg>
						Star on GitHub
						<span style="
							position: absolute;
							top: 0;
							left: 0;
							width: 100%;
							height: 100%;
							background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
							transform: translateX(-100%);
							transition: transform 0.6s;
						"></span>
					</a>
				</div>
				<div style="
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 8px;
					margin-top: 12px;
					padding-top: 12px;
					border-top: 1px solid var(--background-modifier-border);
				">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted)">
						<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
					</svg>
					<p style="
						margin: 0;
						color: var(--text-muted);
						font-size: 0.9em;
						text-align: center;
					">
						Every contribution, big or small, helps us make Sage AI better! <3
					</p>
				</div>
			</div>
		`;

		// Add hover effects for buttons
		const buttons = fundingEl.querySelectorAll("a");
		buttons.forEach((button) => {
			const shine = button.querySelector("span");
			button.addEventListener("mouseover", () => {
				button.style.opacity = "0.9";
				if (shine) {
					shine.style.transform = "translateX(100%)";
				}
			});
			button.addEventListener("mouseout", () => {
				button.style.opacity = "1";
				if (shine) {
					shine.style.transform = "translateX(-100%)";
				}
			});
		});
	}
}
