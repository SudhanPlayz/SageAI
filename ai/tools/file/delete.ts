import { tool } from "ai";
import { z } from "zod";
import SageAI from "main";
import { StreamCallbacks, ToolEvent, ToolErrorResult } from "ai/types";

export function createDeleteFileTool(
	app: SageAI,
	callbacks?: StreamCallbacks,
	allToolEvents?: ToolEvent[],
) {
	return tool({
		description: "Delete a file from the vault",
		parameters: z.object({
			path: z.string().describe("The path of the file to delete"),
		}),
		execute: async ({ path }) => {
			const toolEvent: ToolEvent = {
				type: "toolCall",
				tool: "deleteFile",
				args: { path },
				timestamp: Date.now(),
			};

			callbacks?.onToolEvent?.(toolEvent);
			callbacks?.onToolCall?.("deleteFile", { path });
			allToolEvents?.push(toolEvent);

			try {
				const file = app.app.vault.getFileByPath(path);
				if (!file) {
					const errorResult: ToolErrorResult = {
						success: false,
						error: "File not found",
						path,
					};

					const resultEvent: ToolEvent = {
						type: "toolResult",
						tool: "deleteFile",
						args: { path },
						result: errorResult,
						timestamp: Date.now(),
					};

					callbacks?.onToolEvent?.(resultEvent);
					callbacks?.onToolResult?.(errorResult);
					allToolEvents?.push(resultEvent);

					return errorResult;
				}

				await app.app.vault.delete(file);

				const result = {
					success: true,
					path,
					message: "File deleted successfully",
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "deleteFile",
					args: { path },
					result,
					timestamp: Date.now(),
				};

				callbacks?.onToolEvent?.(resultEvent);
				callbacks?.onToolResult?.(result);
				allToolEvents?.push(resultEvent);

				return result;
			} catch (error) {
				console.error("Error in deleteFile tool:", error);

				const errorResult: ToolErrorResult = {
					success: false,
					error: "Failed to delete file",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
					path,
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "deleteFile",
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
