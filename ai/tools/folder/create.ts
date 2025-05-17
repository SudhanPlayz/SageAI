import { tool } from "ai";
import { z } from "zod";
import { StreamCallbacks, ToolEvent, ToolErrorResult } from "ai/types";
import SageAI from "main";

export function createCreateFolderTool(
	app: SageAI,
	callbacks?: StreamCallbacks,
	allToolEvents?: ToolEvent[],
) {
	return tool({
		description: "Create a new folder in the vault",
		parameters: z.object({
			path: z
				.string()
				.describe("The path where the folder should be created"),
		}),
		execute: async ({ path }) => {
			const toolEvent: ToolEvent = {
				type: "toolCall",
				tool: "createFolder",
				args: { path },
				timestamp: Date.now(),
			};

			callbacks?.onToolEvent?.(toolEvent);
			callbacks?.onToolCall?.("createFolder", { path });
			allToolEvents?.push(toolEvent);

			try {
				if (app.app.vault.getAbstractFileByPath(path)) {
					throw new Error(`Folder "${path}" already exists`);
				}

				await app.app.vault.createFolder(path);

				const result = {
					success: true,
					path,
					message: "Folder created successfully",
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "createFolder",
					args: { path },
					result,
					timestamp: Date.now(),
				};

				callbacks?.onToolEvent?.(resultEvent);
				callbacks?.onToolResult?.(result);
				allToolEvents?.push(resultEvent);

				return result;
			} catch (error) {
				console.error("Error in createFolder tool:", error);

				const errorResult: ToolErrorResult = {
					success: false,
					error: "Failed to create folder",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
					path,
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "createFolder",
					args: { path },
					result: errorResult,
					timestamp: Date.now(),
				};

				callbacks?.onToolEvent?.(resultEvent);
				callbacks?.onToolResult?.(errorResult);
				allToolEvents?.push(resultEvent);

				return errorResult;
			}
		},
	});
}
