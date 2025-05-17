import { tool } from "ai";
import { z } from "zod";
import { StreamCallbacks, ToolEvent, ToolErrorResult } from "../../types";
import SageAI from "../../../main";

export function createReadFileTool(
	app: SageAI,
	callbacks?: StreamCallbacks,
	allToolEvents?: ToolEvent[],
) {
	return tool({
		description: "Read a file in the vault",
		parameters: z.object({
			path: z.string().describe("The path to the file to read"),
		}),
		execute: async ({ path }) => {
			const toolEvent: ToolEvent = {
				type: "toolCall",
				tool: "readFile",
				args: { path },
				timestamp: Date.now(),
			};

			callbacks?.onToolEvent?.(toolEvent);
			callbacks?.onToolCall?.("readFile", { path });
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
						tool: "readFile",
						args: { path },
						result: errorResult,
						timestamp: Date.now(),
					};

					callbacks?.onToolEvent?.(resultEvent);
					callbacks?.onToolResult?.(errorResult);
					allToolEvents?.push(resultEvent);

					return errorResult;
				}

				const content = await app.app.vault.read(file);
				const result = {
					success: true,
					data: {
						path: file.path,
						name: file.name,
						content,
					},
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "readFile",
					args: { path },
					result: result.data,
					timestamp: Date.now(),
				};

				callbacks?.onToolEvent?.(resultEvent);
				callbacks?.onToolResult?.(result.data);
				allToolEvents?.push(resultEvent);

				return result.data;
			} catch (error) {
				console.error("Error in readFile tool:", error);

				const errorResult: ToolErrorResult = {
					success: false,
					error: "Failed to read file",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
					path,
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "readFile",
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
