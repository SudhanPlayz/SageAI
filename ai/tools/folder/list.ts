import { tool } from "ai";
import { z } from "zod";
import { StreamCallbacks, ToolEvent, ToolErrorResult } from "ai/types";
import SageAI from "main";
import { TFile } from "obsidian";

export function createListFolderTool(
	app: SageAI,
	callbacks?: StreamCallbacks,
	allToolEvents?: ToolEvent[],
) {
	return tool({
		description:
			"List all files and folders in a specific path in the vault",
		parameters: z.object({
			path: z
				.string()
				.describe(
					'The path to list contents from. Use empty string or "/" for root',
				),
		}),
		execute: async ({ path }) => {
			const normalizedPath = path === "/" ? "" : path;

			const toolEvent: ToolEvent = {
				type: "toolCall",
				tool: "listFolder",
				args: { path: normalizedPath },
				timestamp: Date.now(),
			};

			callbacks?.onToolEvent?.(toolEvent);
			callbacks?.onToolCall?.("listFolder", { path: normalizedPath });
			allToolEvents?.push(toolEvent);

			try {
				const allFiles = app.app.vault.getAllLoadedFiles();

				const items = allFiles.filter((file) => {
					if (!normalizedPath) {
						return file.parent === app.app.vault.getRoot();
					}

					const parentPath = file.parent ? file.parent.path : "";
					return parentPath === normalizedPath;
				});

				const folders = items
					.filter((item) => !(item instanceof TFile))
					.map((folder) => ({
						name: folder.name,
						path: folder.path,
						type: "folder",
					}));

				const files = items
					.filter((item) => item instanceof TFile)
					.map((file) => ({
						name: file.name,
						path: file.path,
						type: "file",
						extension: file.extension,
					}));

				folders.sort((a, b) => a.name.localeCompare(b.name));
				files.sort((a, b) => a.name.localeCompare(b.name));

				const result = {
					success: true,
					path: normalizedPath,
					folders,
					files,
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "listFolder",
					args: { path: normalizedPath },
					result,
					timestamp: Date.now(),
				};

				callbacks?.onToolEvent?.(resultEvent);
				callbacks?.onToolResult?.(result);
				allToolEvents?.push(resultEvent);

				return result;
			} catch (error) {
				console.error("Error in listFolder tool:", error);

				const errorResult: ToolErrorResult = {
					success: false,
					error: "Failed to list folder contents",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
					path: normalizedPath,
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "listFolder",
					args: { path: normalizedPath },
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
