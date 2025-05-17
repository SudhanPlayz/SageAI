import { tool } from "ai";
import { z } from "zod";
import SageAI from "main";
import { StreamCallbacks, ToolEvent } from "../../types";

export function createRenameFileTool(
	app: SageAI,
	callbacks?: StreamCallbacks,
	allToolEvents?: ToolEvent[],
) {
	return tool({
		description: "Rename a file in the vault",
		parameters: z.object({
			oldPath: z
				.string()
				.describe("The current path of the file to rename"),
			newPath: z.string().describe("The new path for the file"),
		}),
		execute: async ({ oldPath, newPath }) => {
			const toolEvent: ToolEvent = {
				type: "toolCall",
				tool: "renameFile",
				args: { oldPath, newPath },
				timestamp: Date.now(),
			};

			callbacks?.onToolEvent?.(toolEvent);
			callbacks?.onToolCall?.("renameFile", { oldPath, newPath });
			allToolEvents?.push(toolEvent);

			try {
				if (!oldPath || !newPath) {
					throw new Error("Both oldPath and newPath are required");
				}

				const file = app.app.vault.getAbstractFileByPath(oldPath);
				if (!file) {
					throw new Error(`File not found: ${oldPath}`);
				}

				const existingFile =
					app.app.vault.getAbstractFileByPath(newPath);
				if (existingFile) {
					throw new Error(`File already exists at path: ${newPath}`);
				}

				await app.app.fileManager.renameFile(file, newPath);

				const result = {
					success: true,
					message: `File renamed from ${oldPath} to ${newPath}`,
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "renameFile",
					args: { oldPath, newPath },
					result,
					timestamp: Date.now(),
				};

				callbacks?.onToolEvent?.(resultEvent);
				callbacks?.onToolResult?.(result);
				allToolEvents?.push(resultEvent);

				return result;
			} catch (error) {
				console.error("Error in renameFile tool:", error);

				const errorResult = {
					success: false,
					error: "Failed to rename file",
					message: error.message,
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "renameFile",
					args: { oldPath, newPath },
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
