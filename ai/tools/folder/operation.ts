import { tool } from "ai";
import { z } from "zod";
import {
	StreamCallbacks,
	ToolEvent,
	ToolErrorResult,
	PendingFileOperation,
} from "../../types";
import SageAI from "../../../main";
import { FileOperationManager } from "../../managers/index";
import { TFile } from "obsidian";

export function createFolderOperationTool(
	app: SageAI,
	callbacks?: StreamCallbacks,
	allToolEvents?: ToolEvent[],
) {
	return tool({
		description:
			"Request folder operations (create, delete, move) in the vault. All operations require user approval.",
		parameters: z.object({
			operation: z
				.enum(["create", "delete", "move"])
				.describe("The folder operation to perform"),
			path: z
				.string()
				.describe("The path of the folder for the operation"),
			targetPath: z
				.string()
				.optional()
				.describe("The destination path for move operations"),
		}),
		execute: async ({ operation, path, targetPath }) => {
			console.log(
				`Executing folder${operation} tool request with path:`,
				path,
				targetPath ? `targetPath: ${targetPath}` : "",
			);

			const toolName = `folder${operation.charAt(0).toUpperCase() + operation.slice(1)}`;

			const toolEvent: ToolEvent = {
				type: "toolCall",
				tool: toolName,
				args: { operation, path, targetPath },
				timestamp: Date.now(),
			};

			callbacks?.onToolEvent?.(toolEvent);
			callbacks?.onToolCall?.(toolName, { operation, path, targetPath });
			allToolEvents?.push(toolEvent);

			try {
				let folder;
				switch (operation) {
					case "create":
						if (app.app.vault.getAbstractFileByPath(path)) {
							throw new Error(`Folder "${path}" already exists`);
						}
						break;
					case "delete":
					case "move":
						folder = app.app.vault.getAbstractFileByPath(path);
						if (!folder) {
							throw new Error(`Folder "${path}" not found`);
						}
						if (folder instanceof TFile) {
							throw new Error(
								`"${path}" is a file, not a folder`,
							);
						}

						if (operation === "move") {
							if (!targetPath) {
								throw new Error(
									"Target path is required for move operations",
								);
							}

							const targetParentPath = targetPath.substring(
								0,
								targetPath.lastIndexOf("/"),
							);
							if (
								targetParentPath &&
								!app.app.vault.getAbstractFileByPath(
									targetParentPath,
								)
							) {
								throw new Error(
									`Target parent folder "${targetParentPath}" does not exist`,
								);
							}
						}
						break;
				}

				const operationId = crypto.randomUUID();
				const opType =
					operation === "create"
						? "createFolder"
						: operation === "delete"
							? "deleteFolder"
							: "moveFolder";

				const description =
					operation === "create"
						? `Create folder "${path}"`
						: operation === "delete"
							? `Delete folder "${path}"`
							: `Move folder from "${path}" to "${targetPath}"`;

				const pendingOp: PendingFileOperation = {
					id: operationId,
					type: opType as
						| "createFolder"
						| "deleteFolder"
						| "moveFolder",
					sourcePath: path,
					targetPath: targetPath,
					approved: false,
					rejected: false,
					timestamp: Date.now(),
					description,
				};

				FileOperationManager.addPendingOperation(pendingOp);

				const result = {
					success: true,
					pending: true,
					operationId,
					message: `Folder ${operation} operation is pending user approval`,
					description,
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: toolName,
					args: { operation, path, targetPath },
					result,
					timestamp: Date.now(),
				};

				callbacks?.onToolEvent?.(resultEvent);
				callbacks?.onToolResult?.(result);
				allToolEvents?.push(resultEvent);

				return result;
			} catch (error) {
				console.error(`Error in folder${operation} tool:`, error);

				const errorResult: ToolErrorResult = {
					success: false,
					error: `Failed to process folder ${operation} request`,
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: toolName,
					args: { operation, path, targetPath },
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
