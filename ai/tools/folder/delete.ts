import { tool } from "ai";
import { z } from "zod";
import { StreamCallbacks, ToolEvent, ToolErrorResult } from "ai/types";
import SageAI from "main";
import { TFile } from "obsidian";

export function createDeleteFolderTool(
	app: SageAI,
	callbacks?: StreamCallbacks,
	allToolEvents?: ToolEvent[],
) {
	return tool({
		description: "Delete a folder from the vault",
		parameters: z.object({
			path: z.string().describe("The path of the folder to delete"),
		}),
		execute: async ({ path }) => {
			const toolEvent: ToolEvent = {
				type: "toolCall",
				tool: "deleteFolder",
				args: { path },
				timestamp: Date.now(),
			};

			callbacks?.onToolEvent?.(toolEvent);
			callbacks?.onToolCall?.("deleteFolder", { path });
			allToolEvents?.push(toolEvent);

			try {
				const folder = app.app.vault.getAbstractFileByPath(path);

				if (!folder) {
					throw new Error(`Folder "${path}" not found`);
				}

				if (folder instanceof TFile) {
					throw new Error(`"${path}" is a file, not a folder`);
				}

				await app.app.vault.delete(folder, true);

				const result = {
					success: true,
					path,
					message: "Folder deleted successfully",
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "deleteFolder",
					args: { path },
					result,
					timestamp: Date.now(),
				};

				callbacks?.onToolEvent?.(resultEvent);
				callbacks?.onToolResult?.(result);
				allToolEvents?.push(resultEvent);

				return result;
			} catch (error) {
				console.error("Error in deleteFolder tool:", error);

				const errorResult: ToolErrorResult = {
					success: false,
					error: "Failed to delete folder",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
					path,
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "deleteFolder",
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
