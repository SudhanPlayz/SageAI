import { tool } from "ai";
import { z } from "zod";
import { StreamCallbacks, ToolEvent, ToolErrorResult } from "ai/types";
import SageAI from "main";
import { TFile } from "obsidian";

export function createMoveFolderTool(
	app: SageAI,
	callbacks?: StreamCallbacks,
	allToolEvents?: ToolEvent[],
) {
	return tool({
		description: "Move a folder to a new location in the vault",
		parameters: z.object({
			path: z.string().describe("The path of the folder to move"),
			targetPath: z
				.string()
				.describe("The destination path for the folder"),
		}),
		execute: async ({ path, targetPath }) => {
			const toolEvent: ToolEvent = {
				type: "toolCall",
				tool: "moveFolder",
				args: { path, targetPath },
				timestamp: Date.now(),
			};

			callbacks?.onToolEvent?.(toolEvent);
			callbacks?.onToolCall?.("moveFolder", { path, targetPath });
			allToolEvents?.push(toolEvent);

			try {
				const folder = app.app.vault.getAbstractFileByPath(path);

				if (!folder) {
					throw new Error(`Folder "${path}" not found`);
				}

				if (folder instanceof TFile) {
					throw new Error(`"${path}" is a file, not a folder`);
				}

				const targetParentPath = targetPath.substring(
					0,
					targetPath.lastIndexOf("/"),
				);

				if (
					targetParentPath &&
					!app.app.vault.getAbstractFileByPath(targetParentPath)
				) {
					throw new Error(
						`Target parent folder "${targetParentPath}" does not exist`,
					);
				}

				await app.app.vault.rename(folder, targetPath);

				const result = {
					success: true,
					path,
					targetPath,
					message: "Folder moved successfully",
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "moveFolder",
					args: { path, targetPath },
					result,
					timestamp: Date.now(),
				};

				callbacks?.onToolEvent?.(resultEvent);
				callbacks?.onToolResult?.(result);
				allToolEvents?.push(resultEvent);

				return result;
			} catch (error) {
				console.error("Error in moveFolder tool:", error);

				const errorResult: ToolErrorResult = {
					success: false,
					error: "Failed to move folder",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
					path,
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "moveFolder",
					args: { path, targetPath },
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
