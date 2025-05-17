import { tool } from "ai";
import { z } from "zod";
import { StreamCallbacks, ToolEvent } from "../../types";
import SageAI from "../../../main";
import { TFile } from "obsidian";

export function createSearchFilesTool(
	app: SageAI,
	callbacks?: StreamCallbacks,
	allToolEvents?: ToolEvent[],
) {
	return tool({
		description: "Search for files in the vault",
		parameters: z.object({
			query: z
				.string()
				.describe("The search query to find files in the vault"),
		}),
		execute: async ({ query }) => {
			const toolEvent: ToolEvent = {
				type: "toolCall",
				tool: "searchFiles",
				args: { query },
				timestamp: Date.now(),
			};

			callbacks?.onToolEvent?.(toolEvent);
			callbacks?.onToolCall?.("searchFiles", { query });
			allToolEvents?.push(toolEvent);

			try {
				const files = app.app.vault.getMarkdownFiles();
				const searchTerms = query
					.toLowerCase()
					.split(/\s+/)
					.filter(Boolean);

				if (searchTerms.length === 0) {
					return { success: false, error: "Empty search query" };
				}

				const results = files
					.map((file) => ({
						file: file.path,
						name: file.name,
						matches: calculateMatchScore(file, searchTerms),
					}))
					.filter((result) => result.matches > 0)
					.sort((a, b) => b.matches - a.matches)
					.slice(0, 20);

				try {
					localStorage.setItem(
						"sage_latest_search_results",
						JSON.stringify(results),
					);
				} catch (e) {
					console.error(
						"Failed to store search results in localStorage:",
						e,
					);
				}

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "searchFiles",
					args: { query },
					result: results,
					timestamp: Date.now(),
				};

				callbacks?.onToolEvent?.(resultEvent);
				callbacks?.onToolResult?.(results);
				allToolEvents?.push(resultEvent);

				return results;
			} catch (error) {
				console.error("Error in searchFiles tool:", error);

				const errorResult = {
					success: false,
					error: "Failed to search files",
					message:
						error instanceof Error
							? error.message
							: "Unknown error",
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "searchFiles",
					args: { query },
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

function calculateMatchScore(file: TFile, searchTerms: string[]): number {
	const fileName = file.name.toLowerCase();
	const filePath = file.path.toLowerCase();

	let score = 0;

	for (const term of searchTerms) {
		if (fileName === term) {
			score += 10;
		} else if (fileName.includes(term)) {
			score += 5;
		} else if (filePath.includes(term)) {
			score += 2;
		}
	}

	return score;
}
