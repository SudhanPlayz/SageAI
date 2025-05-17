import { tool } from "ai";
import { z } from "zod";
import { StreamCallbacks, ToolEvent, ToolErrorResult } from "../../types";
import SageAI from "../../../main";

export function createWriteFileTool(
	app: SageAI,
	callbacks?: StreamCallbacks,
	allToolEvents?: ToolEvent[],
) {
	return tool({
		description: "Write content to a file in the vault",
		parameters: z.object({
			path: z
				.string()
				.describe("The path where the file should be written"),
			content: z.string().describe("The content to write to the file"),
		}),
		execute: async ({ path, content }) => {
			const toolEvent: ToolEvent = {
				type: "toolCall",
				tool: "writeFile",
				args: { path },
				timestamp: Date.now(),
			};

			callbacks?.onToolEvent?.(toolEvent);
			callbacks?.onToolCall?.("writeFile", { path });
			allToolEvents?.push(toolEvent);

			try {
				const existingFile = app.app.vault.getFileByPath(path);

				if (existingFile) {
					await app.app.vault.modify(existingFile, content);
				} else {
					const parentPath = path.substring(0, path.lastIndexOf("/"));
					if (
						parentPath &&
						!app.app.vault.getAbstractFileByPath(parentPath)
					) {
						await app.app.vault.createFolder(parentPath);
					}

					await app.app.vault.create(path, content);
				}

				const result = {
					success: true,
					path,
					message: existingFile
						? "File updated successfully"
						: "File created successfully",
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "writeFile",
					args: { path },
					result,
					timestamp: Date.now(),
				};

				callbacks?.onToolEvent?.(resultEvent);
				callbacks?.onToolResult?.(result);
				allToolEvents?.push(resultEvent);

				return result;
			} catch (error) {
				console.error("Error in writeFile tool:", error);

				const errorResult: ToolErrorResult = {
					success: false,
					error: "Failed to write file",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
					path,
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "writeFile",
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
