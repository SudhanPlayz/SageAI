import SageAI, { APIProvider, MCPServer } from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import {
	isMCPServerRunning,
	startMCPServer,
	stopMCPServerByIndex,
	getMCPToolsByIndex,
} from "ai/agent/mcp";

export class SettingsTab extends PluginSettingTab {
	plugin: SageAI;

	constructor(app: App, plugin: SageAI) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const headerEl = containerEl.createDiv("sage-settings-header");
		const headerIcon = headerEl.createEl("div", {
			cls: "sage-header-icon",
		});
		headerIcon.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
				<path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>
			</svg>
		`;
		headerEl.createEl("h1", {
			text: "Sage AI Settings",
			cls: "sage-header-title",
		});
		headerEl.createEl("p", {
			text: "Configure your AI assistant with powerful integrations",
			cls: "sage-header-subtitle",
		});

		this.createSection(
			containerEl,
			"API Configuration",
			"Configure your AI provider and authentication",
			(sectionContent) => {
				this.createAPISettings(sectionContent);
			},
		);

		this.createSection(
			containerEl,
			"Model Settings",
			"Customize model behavior and preferences",
			(sectionContent) => {
				this.createModelSettings(sectionContent);
			},
		);

		this.createSection(
			containerEl,
			"MCP Tools & Servers",
			"Extend AI capabilities with Model Context Protocol",
			(sectionContent) => {
				this.createMCPSettings(sectionContent);
			},
		);

		this.createSupportSection(containerEl);
	}

	private createSection(
		container: HTMLElement,
		title: string,
		description: string,
		contentCallback: (sectionContent: HTMLElement) => void,
	): void {
		const sectionEl = container.createDiv("sage-settings-section");

		const sectionHeader = sectionEl.createDiv("sage-section-header");
		sectionHeader.createEl("h2", {
			text: title,
			cls: "sage-section-title",
		});
		sectionHeader.createEl("p", {
			text: description,
			cls: "sage-section-description",
		});

		const sectionContent = sectionEl.createDiv("sage-section-content");
		contentCallback.call(this, sectionContent);
	}

	private createAPISettings(sectionContent: HTMLElement): void {
		new Setting(sectionContent)
			.setName("API Provider")
			.setDesc("Choose your preferred AI service provider")
			.setClass("sage-setting-primary")
			.addDropdown((dropdown) => {
				const providerOptions = [
					{
						value: APIProvider.OPENROUTER,
						label: "OpenRouter",
						icon: "🌐",
					},
					{
						value: APIProvider.GOOGLE_GENAI,
						label: "Google Gemini",
						icon: "🔍",
					},
					{ value: APIProvider.OLLAMA, label: "Ollama", icon: "🦙" },
					{ value: APIProvider.GROQ, label: "Groq", icon: "⚡" },
					{
						value: APIProvider.ANTHROPIC,
						label: "Anthropic",
						icon: "🧠",
					},
					{
						value: APIProvider.MISTRAL,
						label: "Mistral",
						icon: "🌪️",
					},
					{ value: APIProvider.OPENAI, label: "OpenAI", icon: "🤖" },
					{ value: APIProvider.XAI, label: "XAI", icon: "✨" },
				];

				providerOptions.forEach((option) => {
					dropdown.addOption(
						option.value,
						`${option.icon} ${option.label}`,
					);
				});

				return dropdown
					.setValue(this.plugin.settings.apiProvider)
					.onChange(async (value) => {
						this.plugin.settings.apiProvider = value as APIProvider;
						await this.plugin.saveSettings();
						this.refreshAPISettings();
					});
			});

		if (this.plugin.settings.apiProvider !== APIProvider.OLLAMA) {
			const apiKeySetting = new Setting(sectionContent)
				.setName("API Key")
				.setDesc("Enter your API key for secure authentication")
				.setClass("sage-setting-secure")
				.addText((text) => {
					text.inputEl.type = "password";
					return text
						.setPlaceholder("Enter your API key")
						.setValue(this.plugin.settings.apiKey)
						.onChange(async (value) => {
							this.plugin.settings.apiKey = value;
							await this.plugin.saveSettings();
						});
				});

			apiKeySetting.addButton((button) =>
				button
					.setIcon("eye")
					.setTooltip("Show/Hide API Key")
					.onClick(() => {
						const input =
							button.buttonEl.parentElement?.querySelector(
								'input[type="password"], input[type="text"]',
							) as HTMLInputElement;
						if (input) {
							if (input.type === "password") {
								input.type = "text";
								button.setIcon("eye-off");
							} else {
								input.type = "password";
								button.setIcon("eye");
							}
						}
					}),
			);
		}

		if (this.plugin.settings.apiProvider === APIProvider.OLLAMA) {
			new Setting(sectionContent)
				.setName("Base URL")
				.setDesc(
					"Ollama server endpoint (default: http://localhost:11434)",
				)
				.setClass("sage-setting-url")
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
	}

	private refreshAPISettings(): void {
		const apiSection = this.containerEl.querySelector(
			".sage-settings-section:first-of-type .sage-section-content",
		) as HTMLElement;
		if (apiSection) {
			apiSection.empty();
			this.createAPISettings(this.containerEl);
		}
	}

	private createModelSettings(sectionContent: HTMLElement): void {
		new Setting(sectionContent)
			.setName("Model")
			.setDesc(
				"Specify the AI model to use (e.g., gpt-4, claude-3-sonnet)",
			)
			.setClass("sage-setting-model")
			.addText((text) =>
				text
					.setPlaceholder("Enter model name")
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(sectionContent)
			.setName("Temperature")
			.setDesc(
				"Controls randomness: lower is more deterministic, higher is more creative (0-1)",
			)
			.setClass("sage-setting-temperature")
			.addSlider((slider) => {
				slider
					.setLimits(0, 1, 0.01)
					.setValue(this.plugin.settings.temperature ?? 1)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.temperature = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(sectionContent)
			.setName("Top P")
			.setDesc("Controls diversity via nucleus sampling (0-1)")
			.setClass("sage-setting-top-p")
			.addSlider((slider) => {
				slider
					.setLimits(0, 1, 0.01)
					.setValue(this.plugin.settings.top_p ?? 1)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.top_p = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(sectionContent)
			.setName("Hide Thought Process")
			.setDesc(
				"Hide AI reasoning steps and tool usage details for cleaner output",
			)
			.setClass("sage-setting-toggle")
			.setClass("sage-setting-primary")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.hideThoughtProcess)
					.onChange(async (value) => {
						this.plugin.settings.hideThoughtProcess = value;
						await this.plugin.saveSettings();
					}),
			);
	}

	private createMCPSettings(sectionContent: HTMLElement): void {
		new Setting(sectionContent)
			.setName("Enable MCP Tools")
			.setDesc(
				"Activate Model Context Protocol for enhanced AI capabilities",
			)
			.setClass("sage-setting-toggle")
			.setClass("sage-setting-primary")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableMCP || false)
					.onChange(async (value) => {
						this.plugin.settings.enableMCP = value;
						await this.plugin.saveSettings();
						this.refreshMCPContent(sectionContent);
					}),
			);

		const mcpContentContainer = sectionContent.createDiv(
			"sage-mcp-dynamic-content",
		);
		this.renderMCPContent(mcpContentContainer);
	}

	private refreshMCPContent(sectionContent: HTMLElement): void {
		const mcpContainer = sectionContent.querySelector(
			".sage-mcp-dynamic-content",
		) as HTMLElement;
		if (mcpContainer) {
			mcpContainer.empty();
			this.renderMCPContent(mcpContainer);
		}
	}

	private renderMCPContent(container: HTMLElement): void {
		if (this.plugin.settings.enableMCP) {
			const mcpContainer = container.createDiv("sage-mcp-container");

			const serversHeader = mcpContainer.createDiv("sage-mcp-header");
			serversHeader.createEl("h3", {
				text: "MCP Servers",
				cls: "sage-mcp-title",
			});

			const addButton = serversHeader.createEl("button", {
				text: "Add Server",
				cls: "sage-button sage-button-primary",
			});
			addButton.innerHTML = `
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 5v14M5 12h14"/>
				</svg>
				Add Server
			`;
			addButton.addEventListener("click", () => {
				this.addMCPServer();
			});

			const serversList = mcpContainer.createDiv("sage-mcp-servers");
			this.renderMCPServers(serversList);

			this.createMCPExamples(mcpContainer);
		}
	}

	private renderMCPServers(container: HTMLElement): void {
		const servers = this.plugin.settings.mcpServers || [];

		if (servers.length === 0) {
			const emptyState = container.createDiv("sage-empty-state");
			emptyState.innerHTML = `
				<div class="sage-empty-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M12 2L2 7l10 5 10-5-10-5z"/>
						<path d="M2 17l10 5 10-5"/>
						<path d="M2 12l10 5 10-5"/>
					</svg>
				</div>
				<h4>No MCP Servers Configured</h4>
				<p>Add your first MCP server to extend AI capabilities</p>
			`;
		} else {
			servers.forEach((server, index) => {
				this.createMCPServerCard(container, server, index);
			});
		}
	}

	private createMCPServerCard(
		container: HTMLElement,
		server: MCPServer,
		index: number,
	): void {
		const serverCard = container.createDiv("sage-mcp-server");
		serverCard.classList.toggle(
			"sage-mcp-server-disabled",
			!server.enabled,
		);

		const serverHeader = serverCard.createDiv("sage-mcp-server-header");

		const serverInfo = serverHeader.createDiv("sage-mcp-server-info");
		const serverTitle = serverInfo.createDiv("sage-mcp-server-title");

		// const titleEl = serverTitle.createEl("h4", {
		// 	text: server.name || `Server ${index + 1}`,
		// });

		const isRunning = isMCPServerRunning(index);
		const statusBadge = serverTitle.createEl("span", {
			cls: `sage-status-badge ${server.enabled ? (isRunning ? "sage-status-enabled" : "sage-status-disabled") : "sage-status-disabled"}`,
			text: server.enabled
				? isRunning
					? "Running"
					: "Stopped"
				: "Disabled",
		});

		let summary = "";
		if (server.type === "stdio") {
			summary = server.transport.command || "No command configured";
		} else if (server.type === "sse") {
			summary = server.transport.url || "No URL configured";
		}
		serverInfo.createEl("p", {
			text: summary,
			cls: "sage-mcp-server-command",
		});

		const serverActions = serverHeader.createDiv("sage-mcp-server-actions");

		const toggleBtn = serverActions.createEl("button", {
			cls: `sage-toggle-btn ${server.enabled ? "sage-toggle-enabled" : "sage-toggle-disabled"}`,
			attr: {
				"aria-label": server.enabled
					? "Disable server"
					: "Enable server",
			},
		});
		toggleBtn.addEventListener("click", async () => {
			server.enabled = !server.enabled;
			await this.plugin.saveSettings();

			statusBadge.textContent = server.enabled
				? isMCPServerRunning(index)
					? "Running"
					: "Stopped"
				: "Disabled";
			statusBadge.className = `sage-status-badge ${server.enabled ? (isMCPServerRunning(index) ? "sage-status-enabled" : "sage-status-disabled") : "sage-status-disabled"}`;
			toggleBtn.className = `sage-toggle-btn ${server.enabled ? "sage-toggle-enabled" : "sage-toggle-disabled"}`;
			toggleBtn.setAttribute(
				"aria-label",
				server.enabled ? "Disable server" : "Enable server",
			);
			serverCard.classList.toggle(
				"sage-mcp-server-disabled",
				!server.enabled,
			);
		});

		if (server.enabled) {
			const runBtn = serverActions.createEl("button", {
				cls: "sage-mcp-run-btn",
				attr: {
					"aria-label": isRunning ? "Stop server" : "Start server",
				},
			});
			runBtn.innerText = isRunning ? "Stop" : "Start";
			runBtn.addEventListener("click", async () => {
				runBtn.setAttr("disabled", "true");
				if (isMCPServerRunning(index)) {
					await stopMCPServerByIndex(index);
				} else {
					await startMCPServer(server);
				}
				const serversContainer = this.containerEl.querySelector(
					".sage-mcp-servers",
				) as HTMLElement;
				if (serversContainer) {
					serversContainer.empty();
					this.renderMCPServers(serversContainer);
				}
			});
		}

		const expandBtn = serverActions.createEl("button", {
			cls: "sage-expand-btn",
			attr: { "aria-label": "Expand server settings" },
		});
		expandBtn.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:100%;height:100%;display:block;">
				<g>
					<path d="M6 9l6 6 6-6"/>
				</g>
			</svg>
		`;

		const removeBtn = serverActions.createEl("button", {
			cls: "sage-remove-btn",
			attr: { "aria-label": "Remove server" },
		});
		removeBtn.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:100%;height:100%;display:block;">
				<g>
					<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
				</g>
			</svg>
		`;
		removeBtn.addEventListener("click", async () => {
			if (confirm(`Are you sure you want to remove "${server.name}"?`)) {
				await this.removeMCPServer(index);
			}
		});

		const serverDetails = serverCard.createDiv("sage-mcp-server-details");
		serverDetails.style.display = "none";

		expandBtn.addEventListener("click", async () => {
			const isExpanded = serverDetails.style.display !== "none";
			serverDetails.style.display = isExpanded ? "none" : "block";
			expandBtn.style.transform = isExpanded
				? "rotate(0deg)"
				: "rotate(180deg)";

			serverDetails.empty();
			if (!isExpanded && isMCPServerRunning(index)) {
				const toolsHeader = serverDetails.createDiv();
				toolsHeader.innerHTML = `<strong>Available Tools:</strong>`;
				const toolsList = serverDetails.createDiv();
				toolsList.innerText = "Loading...";
				const tools = await getMCPToolsByIndex(index);
				if (tools && tools.length > 0) {
					toolsList.innerHTML = `<ul style='margin:0;padding-left:18px;'>${tools.map((t: any) => `<li><code>${t.name}</code>: ${t.description || ""}</li>`).join("")}</ul>`;
				} else {
					toolsList.innerText =
						"No tools available or server not running.";
				}
			}
			this.createServerDetailsForm(serverDetails, server, index);
		});

		this.createServerDetailsForm(serverDetails, server, index);
	}

	private createServerDetailsForm(
		container: HTMLElement,
		server: MCPServer,
		serverIndex: number,
	): void {
		new Setting(container)
			.setName("Server Name")
			.setDesc("Friendly name for identification")
			.addText((text) =>
				text
					.setPlaceholder("My MCP Server")
					.setValue(server.name)
					.onChange(async (value) => {
						server.name = value;
						await this.plugin.saveSettings();

						const serverCard =
							container.closest(".sage-mcp-server");
						const titleEl = serverCard?.querySelector(
							".sage-mcp-server-title h4",
						);
						if (titleEl) {
							titleEl.textContent =
								value || `Server ${serverIndex + 1}`;
						}
					}),
			);

		new Setting(container)
			.setName("Server Type")
			.setDesc("How should Sage connect to this server?")
			.addDropdown((dropdown) => {
				dropdown.addOption("stdio", "Stdio (Local Command)");
				dropdown.addOption("sse", "SSE (HTTP Event Stream)");
				dropdown.setValue(server.type);
				dropdown.onChange(async (value) => {
					server.type = value as "stdio" | "sse";
					if (value === "stdio") {
						server.transport = { command: "", args: [], env: {} };
					} else if (value === "sse") {
						server.transport = { url: "", headers: {} };
					} else {
						server.transport = {};
					}
					await this.plugin.saveSettings();
					container.empty();
					this.createServerDetailsForm(
						container,
						server,
						serverIndex,
					);
				});
				return dropdown;
			});

		if (server.type === "stdio") {
			new Setting(container)
				.setName("Command")
				.setDesc("Executable command to start the server")
				.addText((text) =>
					text
						.setPlaceholder(
							"npx @modelcontextprotocol/server-filesystem",
						)
						.setValue(server.transport.command || "")
						.onChange(async (value) => {
							server.transport.command = value;
							await this.plugin.saveSettings();
							const serverCard =
								container.closest(".sage-mcp-server");
							const commandEl = serverCard?.querySelector(
								".sage-mcp-server-command",
							);
							if (commandEl) {
								commandEl.textContent =
									value || "No command configured";
							}
						}),
				);

			new Setting(container)
				.setName("Arguments")
				.setDesc("Command line arguments (one per line)")
				.addTextArea((text) =>
					text
						.setPlaceholder("/path/to/directory\n--option=value")
						.setValue((server.transport.args || []).join("\n"))
						.onChange(async (value) => {
							server.transport.args = value
								.split("\n")
								.filter((arg) => arg.trim());
							await this.plugin.saveSettings();
						}),
				);

			new Setting(container)
				.setName("Environment Variables")
				.setDesc(
					"Environment variables (KEY=VALUE format, one per line)",
				)
				.addTextArea((text) =>
					text
						.setPlaceholder("API_KEY=your_key\nDEBUG=true")
						.setValue(
							server.transport.env
								? Object.entries(server.transport.env)
										.map(([k, v]) => `${k}=${v}`)
										.join("\n")
								: "",
						)
						.onChange(async (value) => {
							const env: Record<string, string> = {};
							value
								.split("\n")
								.filter((line) => line.trim())
								.forEach((line) => {
									const [key, ...valueParts] =
										line.split("=");
									if (key && valueParts.length > 0) {
										env[key.trim()] = valueParts
											.join("=")
											.trim();
									}
								});
							server.transport.env =
								Object.keys(env).length > 0 ? env : {};
							await this.plugin.saveSettings();
						}),
				);
		} else if (server.type === "sse") {
			new Setting(container)
				.setName("SSE URL")
				.setDesc("HTTP endpoint for SSE (Server-Sent Events)")
				.addText((text) =>
					text
						.setPlaceholder("https://localhost:3000/events")
						.setValue(server.transport.url || "")
						.onChange(async (value) => {
							server.transport.url = value;
							await this.plugin.saveSettings();
							const serverCard =
								container.closest(".sage-mcp-server");
							const commandEl = serverCard?.querySelector(
								".sage-mcp-server-command",
							);
							if (commandEl) {
								commandEl.textContent =
									value || "No URL configured";
							}
						}),
				);

			new Setting(container)
				.setName("Headers")
				.setDesc("HTTP headers (KEY=VALUE format, one per line)")
				.addTextArea((text) =>
					text
						.setPlaceholder(
							"Authorization=Bearer ...\nX-API-KEY=...",
						)
						.setValue(
							server.transport.headers
								? Object.entries(server.transport.headers)
										.map(([k, v]) => `${k}=${v}`)
										.join("\n")
								: "",
						)
						.onChange(async (value) => {
							const headers: Record<string, string> = {};
							value
								.split("\n")
								.filter((line) => line.trim())
								.forEach((line) => {
									const [key, ...valueParts] =
										line.split("=");
									if (key && valueParts.length > 0) {
										headers[key.trim()] = valueParts
											.join("=")
											.trim();
									}
								});
							server.transport.headers =
								Object.keys(headers).length > 0 ? headers : {};
							await this.plugin.saveSettings();
						}),
				);
		}
	}

	private createMCPExamples(container: HTMLElement): void {
		const examplesSection = container.createDiv("sage-mcp-examples");

		const examplesHeader = examplesSection.createDiv(
			"sage-examples-header",
		);
		examplesHeader.createEl("h4", {
			text: "Popular MCP Servers",
			cls: "sage-examples-title",
		});
		examplesHeader.createEl("p", {
			text: "Quick-start templates for common integrations",
			cls: "sage-examples-subtitle",
		});

		const examplesGrid = examplesSection.createDiv("sage-examples-grid");

		const examples = [
			{
				name: "GitHub",
				description: "Access repositories, issues, and pull requests",
				command: "npx @modelcontextprotocol/server-github -y",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="32" height="32" viewBox="0 0 50 50">
    <circle cx="25" cy="25" r="22" fill="white"/>
    <path d="M17.791,46.836C18.502,46.53,19,45.823,19,45v-5.4c0-0.197,0.016-0.402,0.041-0.61C19.027,38.994,19.014,38.997,19,39 c0,0-3,0-3.6,0c-1.5,0-2.8-0.6-3.4-1.8c-0.7-1.3-1-3.5-2.8-4.7C8.9,32.3,9.1,32,9.7,32c0.6,0.1,1.9,0.9,2.7,2c0.9,1.1,1.8,2,3.4,2 c2.487,0,3.82-0.125,4.622-0.555C21.356,34.056,22.649,33,24,33v-0.025c-5.668-0.182-9.289-2.066-10.975-4.975 c-3.665,0.042-6.856,0.405-8.677,0.707c-0.058-0.327-0.108-0.656-0.151-0.987c1.797-0.296,4.843-0.647,8.345-0.714 c-0.112-0.276-0.209-0.559-0.291-0.849c-3.511-0.178-6.541-0.039-8.187,0.097c-0.02-0.332-0.047-0.663-0.051-0.999 c1.649-0.135,4.597-0.27,8.018-0.111c-0.079-0.5-0.13-1.011-0.13-1.543c0-1.7,0.6-3.5,1.7-5c-0.5-1.7-1.2-5.3,0.2-6.6 c2.7,0,4.6,1.3,5.5,2.1C21,13.4,22.9,13,25,13s4,0.4,5.6,1.1c0.9-0.8,2.8-2.1,5.5-2.1c1.5,1.4,0.7,5,0.2,6.6c1.1,1.5,1.7,3.2,1.6,5 c0,0.484-0.045,0.951-0.11,1.409c3.499-0.172,6.527-0.034,8.204,0.102c-0.002,0.337-0.033,0.666-0.051,0.999 c-1.671-0.138-4.775-0.28-8.359-0.089c-0.089,0.336-0.197,0.663-0.325,0.98c3.546,0.046,6.665,0.389,8.548,0.689 c-0.043,0.332-0.093,0.661-0.151,0.987c-1.912-0.306-5.171-0.664-8.879-0.682C35.112,30.873,31.557,32.75,26,32.969V33 c2.6,0,5,3.9,5,6.6V45c0,0.823,0.498,1.53,1.209,1.836C41.37,43.804,48,35.164,48,25C48,12.318,37.683,2,25,2S2,12.318,2,25 C2,35.164,8.63,43.804,17.791,46.836z"></path>
</svg>`,
				color: "github",
			},
			{
				name: "Brave Search",
				description:
					"Web search capabilities for real-time information",
				command: "npx @modelcontextprotocol/server-brave-search -y",
				icon: `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="32" height="32" viewBox="0 0 48 48">
<path fill="#ff651f" d="M41,13l1,4l-4.09,16.35c-0.59,2.35-2.01,4.41-4.01,5.79l-8.19,5.68c-0.51,0.36-1.11,0.53-1.71,0.53	c-0.6,0-1.2-0.17-1.71-0.53l-8.19-5.68c-2-1.38-3.42-3.44-4.01-5.79L6,17l1-4l-1-2l3.25-3.25c1.05-1.05,2.6-1.44,4.02-0.99	c0.04,0.01,0.07,0.02,0.1,0.03L14,7l4-4h12l4,4l0.65-0.22c0.83-0.28,1.7-0.27,2.5,0c0.58,0.19,1.13,0.51,1.58,0.95	c0.01,0.01,0.01,0.01,0.02,0.02L42,11L41,13z"></path><path fill="#f4592b" d="M38.73,7.73L33,11l-9,2l-9-3l-2.07-2.07c-0.56-0.56-1.41-0.74-2.15-0.44L8.67,8.33l0.58-0.58	c1.05-1.05,2.6-1.44,4.02-0.99c0.04,0.01,0.07,0.02,0.1,0.03L14,7l4-4h12l4,4l0.65-0.22c0.83-0.28,1.7-0.27,2.5,0	C37.73,6.97,38.28,7.29,38.73,7.73z"></path><path fill="#fff" d="M32.51,23.49c-0.3,0.3-0.38,0.77-0.19,1.15l0.34,0.68c0.22,0.45,0.34,0.94,0.34,1.44	c0,0.8-0.29,1.57-0.83,2.16l-0.66,0.74c-0.32,0.21-0.72,0.23-1.04,0.05l-5.23-2.88c-0.59-0.4-0.6-1.27-0.01-1.66l3.91-2.66	c0.48-0.28,0.63-0.89,0.35-1.37l-1.9-3.16C27.28,17.46,27.45,17.24,28,17l6-3h-5l-3,0.75c-0.55,0.14-0.87,0.7-0.72,1.24l1.46,5.09	c0.14,0.51-0.14,1.05-0.65,1.22l-1.47,0.49c-0.21,0.07-0.41,0.11-0.62,0.11c-0.21,0-0.42-0.04-0.63-0.11l-1.46-0.49	c-0.51-0.17-0.79-0.71-0.65-1.22l1.46-5.09c0.15-0.54-0.17-1.1-0.72-1.24L19,14h-5l6,3c0.55,0.24,0.72,0.46,0.41,0.98l-1.9,3.16	c-0.28,0.48-0.13,1.09,0.35,1.37l3.91,2.66c0.59,0.39,0.58,1.26-0.01,1.66l-5.23,2.88c-0.32,0.18-0.72,0.16-1.04-0.05l-0.66-0.74	C15.29,28.33,15,27.56,15,26.76c0-0.5,0.12-0.99,0.34-1.44l0.34-0.68c0.19-0.38,0.11-0.85-0.19-1.15l-4.09-4.83	c-0.83-0.99-0.94-2.41-0.26-3.51l3.4-5.54c0.27-0.36,0.75-0.49,1.17-0.33l2.62,1.05c0.48,0.19,0.99,0.29,1.49,0.29	c0.61,0,1.23-0.14,1.79-0.42c0.75-0.38,1.57-0.57,2.39-0.57s1.64,0.19,2.39,0.57c1.03,0.51,2.22,0.56,3.28,0.13l2.62-1.05	c0.42-0.16,0.9-0.03,1.17,0.33l3.4,5.54c0.68,1.1,0.57,2.52-0.26,3.51L32.51,23.49z"></path><path fill="#fff" d="M29.51,32.49l-4.8,3.8c-0.19,0.19-0.45,0.29-0.71,0.29s-0.52-0.1-0.71-0.29l-4.8-3.8	c-0.24-0.24-0.17-0.65,0.13-0.8l4.93-2.47c0.14-0.07,0.29-0.1,0.45-0.1s0.31,0.03,0.45,0.1l4.93,2.47	C29.68,31.84,29.75,32.25,29.51,32.49z"></path><path fill="#ed4d01" d="M41,13l1,4l-4.09,16.35c-0.59,2.35-2.01,4.41-4.01,5.79l-8.19,5.68c-0.51,0.36-1.11,0.53-1.71,0.53	V10.36L25,12h7v-2l5.15-3.22c0.59,0.19,1.15,0.52,1.6,0.97L42,11L41,13z"></path><path fill="#f5f5f5" d="M32.51,23.49c-0.3,0.3-0.38,0.77-0.19,1.15l0.34,0.68c0.22,0.45,0.34,0.94,0.34,1.44	c0,0.8-0.29,1.57-0.83,2.16l-0.66,0.74c-0.32,0.21-0.72,0.23-1.04,0.05l-5.23-2.88c-0.59-0.4-0.6-1.27-0.01-1.66l3.91-2.66	c0.48-0.28,0.63-0.89,0.35-1.37l-1.9-3.16C27.28,17.46,27.45,17.24,28,17l6-3h-5l-3,0.75c-0.55,0.14-0.87,0.7-0.72,1.24l1.46,5.09	c0.14,0.51-0.14,1.05-0.65,1.22l-1.47,0.49c-0.21,0.07-0.41,0.11-0.62,0.11V9.63c0.82,0,1.64,0.19,2.39,0.57	c1.03,0.51,2.22,0.56,3.28,0.13l2.62-1.05c0.42-0.16,0.9-0.03,1.17,0.33l3.4,5.54c0.68,1.1,0.57,2.52-0.26,3.51L32.51,23.49z"></path><path fill="#f5f5f5" d="M29.51,32.49l-4.8,3.8c-0.19,0.19-0.45,0.29-0.71,0.29v-7.46c0.16,0,0.31,0.03,0.45,0.1l4.93,2.47	C29.68,31.84,29.75,32.25,29.51,32.49z"></path>
</svg>`,
				color: "search",
			},
		];

		examples.forEach((example) => {
			const exampleCard = examplesGrid.createDiv(
				`sage-example-card sage-example-${example.color}`,
			);

			const exampleHeader = exampleCard.createDiv("sage-example-header");
			exampleHeader.innerHTML = example.icon;
			exampleHeader.createEl("h5", {
				text: example.name,
				cls: "sage-example-name",
			});

			exampleCard.createEl("p", {
				text: example.description,
				cls: "sage-example-description",
			});

			const exampleCommand = exampleCard.createDiv(
				"sage-example-command",
			);
			exampleCommand.createEl("code", { text: example.command });

			const copyBtn = exampleCommand.createEl("button", {
				cls: "sage-copy-btn",
				attr: { "aria-label": "Copy command" },
			});
			copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:100%;height:100%;display:block;">
				<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
				<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
			</svg>`;
			copyBtn.addEventListener("click", () => {
				navigator.clipboard.writeText(example.command);
				copyBtn.innerHTML = `
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:100%;height:100%;display:block;">
						<path d="M20 6L9 17l-5-5"/>
					</svg>
				`;
				setTimeout(() => {
					copyBtn.innerHTML = `
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:100%;height:100%;display:block;">
							<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
							<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
						</svg>
					`;
				}, 2000);
			});
		});
	}

	private createSupportSection(container: HTMLElement): void {
		const supportSection = container.createDiv("sage-support-section");

		const supportHeader = supportSection.createDiv("sage-support-header");
		const supportIcon = supportHeader.createEl("div", {
			cls: "sage-support-icon",
		});
		supportIcon.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
				<path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>
			</svg>
		`;

		const supportContent = supportHeader.createDiv("sage-support-content");
		supportContent.createEl("h3", {
			text: "Support Sage AI",
			cls: "sage-support-title",
		});
		supportContent.createEl("p", {
			text: "Help us continue improving and building amazing features",
			cls: "sage-support-subtitle",
		});

		const supportActions = supportSection.createDiv("sage-support-actions");

		const sponsorBtn = supportActions.createEl("a", {
			href: "https://github.com/sponsors/SudhanPlayz",
			cls: "sage-support-btn sage-support-btn-primary",
			attr: { target: "_blank", rel: "noopener" },
		});
		sponsorBtn.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6.42 3.42 5 5.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5 18.58 5 20 6.42 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
			</svg>
			<span>Become a Sponsor</span>
		`;

		const starBtn = supportActions.createEl("a", {
			href: "https://github.com/SudhanPlayz/SageAI",
			cls: "sage-support-btn sage-support-btn-secondary",
			attr: { target: "_blank", rel: "noopener" },
		});
		starBtn.innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
			</svg>
			<span>Star on GitHub</span>
		`;

		const supportFooter = supportSection.createDiv("sage-support-footer");
		supportFooter.createEl("p", {
			text: "Every contribution helps us make Sage AI better for everyone! 💜",
			cls: "sage-support-footer-text",
		});
	}

	private async addMCPServer(): Promise<void> {
		const newServer: MCPServer = {
			id: Date.now().toString(),
			name: "New MCP Server",
			type: "stdio",
			transport: { command: "", args: [], env: {} },
			enabled: true,
		};

		if (!this.plugin.settings.mcpServers) {
			this.plugin.settings.mcpServers = [];
		}

		this.plugin.settings.mcpServers.push(newServer);
		await this.plugin.saveSettings();

		const serversContainer = this.containerEl.querySelector(
			".sage-mcp-servers",
		) as HTMLElement;
		if (serversContainer) {
			serversContainer.empty();
			this.renderMCPServers(serversContainer);
		}
	}

	private async removeMCPServer(index: number): Promise<void> {
		if (this.plugin.settings.mcpServers) {
			this.plugin.settings.mcpServers.splice(index, 1);
			await this.plugin.saveSettings();

			const serversContainer = this.containerEl.querySelector(
				".sage-mcp-servers",
			) as HTMLElement;
			if (serversContainer) {
				serversContainer.empty();
				this.renderMCPServers(serversContainer);
			}
		}
	}
}
