import { tool } from "ai";
import { z } from "zod";
import SageAI from "main";
import {
	StreamCallbacks,
	ToolEvent,
	ToolErrorResult,
	PendingFileOperation,
} from "../../types";
import { FileOperationManager } from "../../managers/index";
import { executeFileOperation } from "../../managers/file/operations";

export function createDeleteFileTool(
	app: SageAI,
	callbacks?: StreamCallbacks,
	allToolEvents?: ToolEvent[],
) {
	return tool({
		description:
			"Request to delete a file from the vault. This operation requires user approval.",
		parameters: z.object({
			path: z.string().describe("The path of the file to delete"),
		}),
		execute: async ({ path }) => {
			console.log("Executing deleteFile tool request with path:", path);

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

				const operationId = crypto.randomUUID();
				const operation: PendingFileOperation = {
					id: operationId,
					type: "delete",
					sourcePath: path,
					approved: false,
					rejected: false,
					timestamp: Date.now(),
					description: `Delete file "${path}"`,
				};

				FileOperationManager.addPendingOperation(operation);

				const result = {
					success: true,
					pending: true,
					operationId,
					message: "File delete operation is pending user approval",
					description: operation.description,
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

				executeFileOperation(app, operationId)
					.then((finalResult) => {
						console.log("File operation completed:", finalResult);
					})
					.catch((error) => {
						console.error("Error executing file operation:", error);
					});

				return result;
			} catch (error) {
				console.error("Error in deleteFile tool:", error);

				const errorResult: ToolErrorResult = {
					success: false,
					error: "Failed to process delete file request",
					message: error.message,
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
