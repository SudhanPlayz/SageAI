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
	createFolderOperationTool,
	createListFolderTool,
} from "../tools/folder";
import {
	createGrepFilesTool,
	createRenameFileTool,
	createDeleteFileTool,
} from "../tools/file";
import { FileOperationManager } from "../managers/index";
import { enhancePromptWithEditorContext } from "../utils/context";
import { processAIResponse } from "./response";
import { handleChatError } from "./error";

export const chatWithAgent = async (
	app: SageAI,
	conversation: Conversation,
	prompt: string,
	callbacks?: StreamCallbacks,
): Promise<AssistantResponse> => {
	FileOperationManager.setApp(app);

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

		const result = await streamAIResponse(
			app,
			conversation,
			callbacks,
			allToolEvents,
			enhancedPrompt,
		);

		const response = await processAIResponse(
			//todo: fix this
			result as any,
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
) {
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

	return streamText({
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
			folderOperation: createFolderOperationTool(
				app,
				callbacks,
				allToolEvents,
			),
			listFolder: createListFolderTool(app, callbacks, allToolEvents),
		},
		experimental_transform: smoothStream({
			delayInMs: 20,
		}),
	});
}
