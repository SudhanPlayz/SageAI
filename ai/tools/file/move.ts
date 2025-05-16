import { tool } from "ai";
import { z } from "zod";
import { StreamCallbacks, ToolEvent, ToolErrorResult } from "../../types";
import SageAI from "../../../main";

export function createMoveFileTool(
	app: SageAI,
	callbacks?: StreamCallbacks,
	allToolEvents?: ToolEvent[],
) {
	return tool({
		description: "Move a file to a new location in the vault",
		parameters: z.object({
			sourcePath: z.string().describe("The current path of the file"),
			targetPath: z
				.string()
				.describe("The new path where the file should be moved"),
		}),
		execute: async ({ sourcePath, targetPath }) => {
			console.log(
				"Executing moveFile tool with source:",
				sourcePath,
				"target:",
				targetPath,
			);

			const toolEvent: ToolEvent = {
				type: "toolCall",
				tool: "moveFile",
				args: { sourcePath, targetPath },
				timestamp: Date.now(),
			};

			callbacks?.onToolEvent?.(toolEvent);
			callbacks?.onToolCall?.("moveFile", { sourcePath, targetPath });
			allToolEvents?.push(toolEvent);

			try {
				const file = app.app.vault.getFileByPath(sourcePath);
				if (!file) {
					const errorResult: ToolErrorResult = {
						success: false,
						error: "Source file not found",
						path: sourcePath,
					};

					const resultEvent: ToolEvent = {
						type: "toolResult",
						tool: "moveFile",
						args: { sourcePath, targetPath },
						result: errorResult,
						timestamp: Date.now(),
					};

					callbacks?.onToolEvent?.(resultEvent);
					callbacks?.onToolResult?.(errorResult);
					allToolEvents?.push(resultEvent);

					return errorResult;
				}

				const existingFile = app.app.vault.getFileByPath(targetPath);
				if (existingFile) {
					const errorResult: ToolErrorResult = {
						success: false,
						error: "Target file already exists",
						path: targetPath,
					};

					const resultEvent: ToolEvent = {
						type: "toolResult",
						tool: "moveFile",
						args: { sourcePath, targetPath },
						result: errorResult,
						timestamp: Date.now(),
					};

					callbacks?.onToolEvent?.(resultEvent);
					callbacks?.onToolResult?.(errorResult);
					allToolEvents?.push(resultEvent);

					return errorResult;
				}

				await app.app.vault.rename(file, targetPath);

				const result = {
					success: true,
					sourcePath,
					targetPath,
					message: "File moved successfully",
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "moveFile",
					args: { sourcePath, targetPath },
					result,
					timestamp: Date.now(),
				};

				callbacks?.onToolEvent?.(resultEvent);
				callbacks?.onToolResult?.(result);
				allToolEvents?.push(resultEvent);

				return result;
			} catch (error) {
				console.error("Error in moveFile tool:", error);

				const errorResult: ToolErrorResult = {
					success: false,
					error: "Failed to move file",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
					path: sourcePath,
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "moveFile",
					args: { sourcePath, targetPath },
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
