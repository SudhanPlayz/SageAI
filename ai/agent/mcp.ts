import { experimental_createMCPClient as createMCPClient } from "ai";
import { Experimental_StdioMCPTransport as StdioMCPTransport } from "ai/mcp-stdio";
import SageAI from "main";

let mcpClients: any[] = [];
let mcpServers: any[] = [];

export const startMCP = async (app: SageAI) => {
	await stopMCP();
	mcpServers = [];
	mcpClients = [];

	if (app.settings.enableMCP) {
		mcpServers = app.settings.mcpServers.filter((s) => s.enabled);
		for (const s of mcpServers) {
			let transport: any;
			if (s.type === "sse") {
				transport = {
					type: "sse",
					url: s.url || s.transport?.url,
					headers: s.headers || s.transport?.headers || {},
				};
			} else if (s.type === "stdio") {
				transport = new StdioMCPTransport({
					command: s.transport.command ?? "",
					args: s.transport.args ?? [],
					env: s.transport.env ?? {},
				});
			}
			if (transport) {
				try {
					const client = await createMCPClient({ transport });
					mcpClients.push(client);
				} catch (e) {
					console.error(
						"[SAGE AI | MCP] Failed to start MCP client:",
						e,
					);
				}
			}
		}
	}
};

export const stopMCP = async () => {
	for (const client of mcpClients) {
		try {
			await client.close();
		} catch (e) {}
	}
	mcpClients = [];
	mcpServers = [];
};

export const getAllMCPTools = async () => {
	const allTools: any[] = [];
	for (const client of mcpClients) {
		try {
			const tools = await client.tools();
			allTools.push(...tools);
		} catch (e) {
			console.error(
				"[SAGE AI | MCP] Failed to get tools from client:",
				e,
			);
		}
	}
	return allTools;
};

export const getMCPToolsByIndex = async (index: number) => {
	if (!mcpClients[index]) return [];
	try {
		return await mcpClients[index].tools();
	} catch (e) {
		console.error("[SAGE AI | MCP] Failed to get tools from client:", e);
		return [];
	}
};

export const isAnyMCPRunning = () => mcpClients.length > 0;

export const isMCPServerRunning = (index: number) => !!mcpClients[index];

export const findMCPClientIndex = (serverConfig: any) => {
	return mcpServers.findIndex((s) => {
		if (s.type === "sse" && serverConfig.transport?.url)
			return s.transport.url === serverConfig.transport.url;
		if (s.type === "stdio" && serverConfig.transport?.command)
			return s.transport.command === serverConfig.transport.command;
		return false;
	});
};

export const stopMCPServerByIndex = async (index: number) => {
	if (!mcpClients[index]) return;
	try {
		await mcpClients[index].close();
	} catch (e) {
		// Intentionally ignored
	}
	mcpClients.splice(index, 1);
	mcpServers.splice(index, 1);
};

export const startMCPServer = async (serverConfig: any) => {
	let transport: any;
	if (serverConfig.type === "sse") {
		transport = {
			type: "sse",
			url: serverConfig.url || serverConfig.transport?.url,
			headers:
				serverConfig.headers || serverConfig.transport?.headers || {},
		};
	} else if (serverConfig.type === "stdio") {
		transport = new StdioMCPTransport({
			command: serverConfig.transport.command ?? "",
			args: serverConfig.transport.args ?? [],
			env: serverConfig.transport.env ?? {},
		});
	}
	if (transport) {
		try {
			console.log(transport);
			const client = await createMCPClient({ transport });
			console.log(client.init());
			mcpClients.push(client);
			mcpServers.push(serverConfig);
			return client;
		} catch (e) {
			console.error("[SAGE AI | MCP] Failed to start MCP client:", e);
		}
	}
	return null;
};

export const getMCPClients = () => mcpClients;
