import { tool } from "ai";
import { z } from "zod";
import SageAI from "main";
import { StreamCallbacks, ToolEvent } from "../../types";

export function createGrepFilesTool(
	app: SageAI,
	callbacks?: StreamCallbacks,
	allToolEvents?: ToolEvent[],
) {
	return tool({
		description:
			"Search for text content across all files in the vault (grep-like functionality)",
		parameters: z.object({
			pattern: z
				.string()
				.describe("The text pattern to search for in file contents"),
			caseSensitive: z
				.boolean()
				.optional()
				.describe(
					"Whether the search should be case sensitive (default: false)",
				),
			filePattern: z
				.string()
				.optional()
				.describe(
					'Optional glob pattern to filter which files to search in (e.g., "*.md")',
				),
		}),
		execute: async ({ pattern, caseSensitive = false, filePattern }) => {
			const toolEvent: ToolEvent = {
				type: "toolCall",
				tool: "grepFiles",
				args: { pattern, caseSensitive, filePattern },
				timestamp: Date.now(),
			};

			callbacks?.onToolEvent?.(toolEvent);
			callbacks?.onToolCall?.("grepFiles", {
				pattern,
				caseSensitive,
				filePattern,
			});
			allToolEvents?.push(toolEvent);

			try {
				if (!pattern) {
					throw new Error("Search pattern cannot be empty");
				}

				let files = app.app.vault.getMarkdownFiles();

				if (filePattern) {
					const regex = new RegExp(
						"^" + filePattern.replace(/\*/g, ".*") + "$",
						"i",
					);
					files = files.filter((file) => regex.test(file.path));
				}

				const patternRegex = new RegExp(
					pattern,
					caseSensitive ? "g" : "gi",
				);

				type FileMatch = {
					line: number;
					content: string;
					match: string;
					position: number;
				};

				type FileResult = {
					file: string;
					name: string;
					matches: FileMatch[];
					matchCount: number;
				} | null;

				const matches: FileResult[] = [];
				let matchedFiles = 0;
				let totalMatches = 0;

				const batchSize = 20;
				for (let i = 0; i < files.length; i += batchSize) {
					const batch = files.slice(i, i + batchSize);

					const batchResults = await Promise.all(
						batch.map(async (file) => {
							try {
								const content = await app.app.vault.read(file);
								const fileMatches: FileMatch[] = [];

								const lines = content.split("\n");
								lines.forEach((line, lineNum) => {
									patternRegex.lastIndex = 0;

									let match;
									while (
										(match = patternRegex.exec(line)) !==
										null
									) {
										fileMatches.push({
											line: lineNum + 1,
											content: line.trim(),
											match: match[0],
											position: match.index,
										});
									}
								});

								if (fileMatches.length > 0) {
									return {
										file: file.path,
										name: file.name,
										matches: fileMatches,
										matchCount: fileMatches.length,
									};
								}

								return null;
							} catch (error) {
								console.error(
									`Error searching file ${file.path}:`,
									error,
								);
								return null;
							}
						}),
					);

					const validResults = batchResults.filter(
						Boolean,
					) as FileResult[];
					matches.push(...validResults);

					matchedFiles += validResults.length;
					validResults.forEach((r) => {
						if (r) {
							totalMatches += r.matchCount;
						}
					});
				}

				matches.sort((a, b) => {
					if (a === null) return 1;
					if (b === null) return -1;
					return b.matchCount - a.matchCount;
				});

				const maxResults = 50;
				const limitedMatches = matches.slice(0, maxResults);

				const result = {
					success: true,
					matches: limitedMatches,
					matchedFiles: matchedFiles,
					totalMatches: totalMatches,
					limitReached: matches.length > maxResults,
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "grepFiles",
					args: { pattern, caseSensitive, filePattern },
					result: result,
					timestamp: Date.now(),
				};

				callbacks?.onToolEvent?.(resultEvent);
				callbacks?.onToolResult?.(result);
				allToolEvents?.push(resultEvent);

				return result;
			} catch (error) {
				console.error("Error in grepFiles tool:", error);

				const errorResult = {
					success: false,
					error: "Failed to search file contents",
					message: error.message,
				};

				const resultEvent: ToolEvent = {
					type: "toolResult",
					tool: "grepFiles",
					args: { pattern, caseSensitive, filePattern },
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
