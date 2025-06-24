import { smoothStream, streamText } from "ai";
import { getModel } from "../core/model";
import { Conversation } from "lib/storage";
import SageAI from "main";
import { AGENT_SYSTEM_PROMPT } from "../core/prompts";
import { StreamCallbacks, ToolEvent, AssistantResponse } from "../types";
import {
	createSearchFilesTool,
	createReadFileTool,
	createWriteFileTool,
	createMoveFileTool,
} from "../tools/file";
import {
	createCreateFolderTool,
	createListFolderTool,
	createDeleteFolderTool,
	createMoveFolderTool,
} from "../tools/folder";
import {
	createGrepFilesTool,
	createRenameFileTool,
	createDeleteFileTool,
} from "../tools/file";
import { enhancePromptWithEditorContext } from "../utils/context";
import { processAIResponse } from "./response";
import { handleChatError } from "./error";

interface AIResult {
	textStream?: AsyncIterable<string>;
	toolCalls?: Array<{
		toolName: string;
		args: Record<string, unknown>;
		toolCallId: string;
	}>;
	toolResults?: Array<{
		toolName: string;
		toolCallId: string;
		result: unknown;
	}>;
}

export const chatWithAgent = async (
	app: SageAI,
	conversation: Conversation,
	prompt: string,
	callbacks?: StreamCallbacks,
): Promise<AssistantResponse> => {
	const storage = app.storage;
	const allToolEvents: ToolEvent[] = [];

	try {
		if (conversation.messages.length === 0) {
			conversation.messages.push({
				id: crypto.randomUUID(),
				content: AGENT_SYSTEM_PROMPT,
				role: "system",
			});
		}

		conversation.messages.push({
			id: crypto.randomUUID(),
			content: prompt,
			role: "user",
		});

		const enhancedPrompt = enhancePromptWithEditorContext(app, prompt);

		if (callbacks?.onStart) {
			callbacks.onStart();
		}

		const result: AIResult = await streamAIResponse(
			app,
			conversation,
			callbacks,
			allToolEvents,
			enhancedPrompt,
		);

		const response = await processAIResponse(
			result,
			allToolEvents,
			conversation,
			storage,
			callbacks,
		);

		return response;
	} catch (error) {
		return handleChatError(
			error,
			conversation,
			storage,
			callbacks,
			allToolEvents,
		);
	}
};

async function streamAIResponse(
	app: SageAI,
	conversation: Conversation,
	callbacks?: StreamCallbacks,
	allToolEvents: ToolEvent[] = [],
	enhancedPrompt?: string,
): Promise<AIResult> {
	const messages = [...conversation.messages];
	if (enhancedPrompt) {
		const lastMessage = messages[messages.length - 1];
		if (lastMessage && lastMessage.role === "user") {
			messages[messages.length - 1] = {
				...lastMessage,
				content: enhancedPrompt,
			};
		}
	}

	const raw = await streamText({
		model: getModel(app.settings),
		messages: messages,
		temperature: 0.7,
		maxSteps: 10,
		tools: {
			searchFiles: createSearchFilesTool(app, callbacks, allToolEvents),
			readFile: createReadFileTool(app, callbacks, allToolEvents),
			writeFile: createWriteFileTool(app, callbacks, allToolEvents),
			grepFiles: createGrepFilesTool(app, callbacks, allToolEvents),
			renameFile: createRenameFileTool(app, callbacks, allToolEvents),
			deleteFile: createDeleteFileTool(app, callbacks, allToolEvents),
			moveFile: createMoveFileTool(app, callbacks, allToolEvents),
			createFolder: createCreateFolderTool(app, callbacks, allToolEvents),
			deleteFolder: createDeleteFolderTool(app, callbacks, allToolEvents),
			moveFolder: createMoveFolderTool(app, callbacks, allToolEvents),
			listFolder: createListFolderTool(app, callbacks, allToolEvents),
		},
		experimental_transform: smoothStream({
			delayInMs: 20,
		}),
	});

	// Await and map toolCalls and toolResults if they are promises
	const toolCallsRaw = raw.toolCalls ? await raw.toolCalls : [];
	const toolResultsRaw = raw.toolResults ? await raw.toolResults : [];

	const toolCalls = Array.isArray(toolCallsRaw)
		? toolCallsRaw.map((call) => ({
				toolName: call.toolName,
				args: call.args,
				toolCallId: call.toolCallId,
			}))
		: [];

	const toolResults = Array.isArray(toolResultsRaw)
		? toolResultsRaw.map((result) => ({
				toolName: result.toolName,
				toolCallId: result.toolCallId,
				result: result.result,
			}))
		: [];

	return {
		textStream: raw.textStream,
		toolCalls,
		toolResults,
	};
}
