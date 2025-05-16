import { Message as AIMessage } from "ai";
import { Conversation } from "lib/storage";
import { StreamCallbacks, ToolEvent, AssistantResponse } from "../types";
import Storage from "lib/storage";

interface AIResult {
	textStream?: AsyncIterable<string>;
	toolCalls?: Array<{
		toolName: string;
		args: Record<string, unknown>;
		toolCallId: string;
	}>;
	toolResults?: Array<{
		toolName: string;
		toolCallId: string;
		result: unknown;
	}>;
}

export function processAIResponse(
	result: AIResult,
	allToolEvents: ToolEvent[],
	conversation: Conversation,
	storage: Storage,
	callbacks?: StreamCallbacks,
): Promise<AssistantResponse> {
	console.log(
		"[processAIResponse] Starting with conversation ID:",
		conversation.id,
	);
	let fullResponse = "";

	console.log("[processAIResponse] Initialized response object");

	return new Promise<AssistantResponse>((resolve) => {
		const processResponse = async () => {
			try {
				if (!result || typeof result !== "object") {
					console.error(
						"[processAIResponse] Invalid response format received",
					);
					throw new Error("Invalid response format from AI model");
				}

				if (result.textStream) {
					console.log("[processAIResponse] Processing text stream");
					try {
						for await (const chunk of result.textStream) {
							if (typeof chunk === "string") {
								fullResponse += chunk;
								callbacks?.onToken?.(chunk);
							}
						}
						console.log(
							"[processAIResponse] Text stream processing complete",
						);
					} catch (streamError) {
						console.error(
							"[processAIResponse] Error processing text stream:",
							streamError,
						);
					}
				}

				console.log("[processAIResponse] Processing tool events");
				try {
					processToolEvents(result, allToolEvents);
				} catch (toolError) {
					console.error(
						"[processAIResponse] Error processing tool events:",
						toolError,
					);
				}

				console.log("[processAIResponse] Creating assistant message");
				const assistantMessage = createAssistantMessage(
					fullResponse,
					allToolEvents,
				);

				const messageWithMetadata = {
					...assistantMessage,
					toolEvents: allToolEvents,
				};

				try {
					console.log("[processAIResponse] Saving conversation");
					conversation.messages.push(messageWithMetadata);
					await storage.saveConversation(conversation);
				} catch (saveError) {
					console.error(
						"[processAIResponse] Error saving conversation:",
						saveError,
					);
				}

				try {
					if (callbacks?.onComplete) {
						console.log(
							"[processAIResponse] Calling onComplete callback",
						);
						callbacks.onComplete(assistantMessage);
					}
				} catch (callbackError) {
					console.error(
						"[processAIResponse] Error in onComplete callback:",
						callbackError,
					);
				}

				console.log(
					"[processAIResponse] Resolving with complete response",
				);
				resolve({
					text: assistantMessage.content,
					toolEvents: allToolEvents,
					isComplete: true,
				});
			} catch (error) {
				console.error(
					"[processAIResponse] Error in main processing:",
					error,
				);
				resolve({
					text:
						"Error processing response: " +
						(error instanceof Error
							? error.message
							: "Unknown error"),
					toolEvents: allToolEvents,
					isComplete: false,
					error: true,
					errorMessage:
						error instanceof Error
							? error.message
							: "Unknown error",
				});
			}
		};

		processResponse();
	});
}

function processToolEvents(result: AIResult, allToolEvents: ToolEvent[]) {
	if (!result || typeof result !== "object") {
		console.warn("Invalid result object in processToolEvents");
		return;
	}

	const toolCalls = Array.isArray(result.toolCalls) ? result.toolCalls : [];
	const toolResults = Array.isArray(result.toolResults)
		? result.toolResults
		: [];

	for (const call of toolCalls) {
		if (call && typeof call === "object") {
			allToolEvents.push({
				type: "toolCall",
				tool: call.toolName || "unknown",
				args: call.args || {},
				timestamp: Date.now(),
			});
		}
	}

	for (const resultItem of toolResults) {
		if (resultItem && typeof resultItem === "object") {
			const matchingCall = toolCalls.find(
				(c) =>
					c &&
					c.toolCallId &&
					resultItem.toolCallId &&
					c.toolCallId === resultItem.toolCallId,
			);

			allToolEvents.push({
				type: "toolResult",
				tool: resultItem.toolName || "unknown",
				args: matchingCall?.args || {},
				result: resultItem.result,
				timestamp: Date.now(),
			});
		}
	}
}

function createAssistantMessage(
	fullResponse: string,
	allToolEvents: ToolEvent[],
): AIMessage {
	const assistantMessage: AIMessage = {
		id: crypto.randomUUID(),
		content: fullResponse || "I processed your request.",
		role: "assistant" as const,
	};

	if (!fullResponse || fullResponse.trim() === "") {
		console.log("Empty response detected, using fallback");
		assistantMessage.content = generateFallbackResponse(allToolEvents);
	}

	return assistantMessage;
}

interface SearchResult {
	error?: string;
	matches?: string[];
	matchedFiles?: string[];
}

interface ReadFileResult {
	error?: string;
	name?: string;
}

interface WriteFileResult {
	error?: string;
	message?: string;
}

interface GrepResult {
	error?: string;
	matches?: string[];
	matchedFiles?: string[];
}

function generateFallbackResponse(allToolEvents: ToolEvent[]): string {
	let fallbackResponse = "I processed your request. ";

	const searchEvents = allToolEvents.filter(
		(e) => e.type === "toolResult" && e.tool === "searchFiles",
	);
	const readEvents = allToolEvents.filter(
		(e) => e.type === "toolResult" && e.tool === "readFile",
	);
	const writeEvents = allToolEvents.filter(
		(e) => e.type === "toolResult" && e.tool === "writeFile",
	);
	const grepEvents = allToolEvents.filter(
		(e) => e.type === "toolResult" && e.tool === "grepFiles",
	);

	if (searchEvents.length > 0) {
		const lastSearchEvent = searchEvents[searchEvents.length - 1];
		const searchResults = lastSearchEvent.result as SearchResult;

		if (searchResults) {
			if (Array.isArray(searchResults) && searchResults.length > 0) {
				try {
					fallbackResponse += `I found ${searchResults.length} file(s): ${searchResults.map((r) => r.name || r.file || "unnamed file").join(", ")}. `;
				} catch (e) {
					fallbackResponse += `I found ${searchResults.length} files. `;
				}
			} else if (searchResults.error) {
				fallbackResponse += `I tried to search for files but encountered an error: ${searchResults.error}. `;
			} else {
				fallbackResponse +=
					"I searched but couldn't find any matching files. ";
			}
		}
	}

	if (readEvents.length > 0) {
		const lastReadEvent = readEvents[readEvents.length - 1];
		const readResult = lastReadEvent.result as ReadFileResult;

		if (readResult) {
			if (readResult.error) {
				fallbackResponse += `I tried to read a file but encountered an error: ${readResult.error}. `;
			} else if (readResult.name) {
				fallbackResponse += `I read the file "${readResult.name}" and found its contents. `;
			} else {
				fallbackResponse += "I read a file and found its contents. ";
			}
		}
	}

	if (writeEvents.length > 0) {
		const lastWriteEvent = writeEvents[writeEvents.length - 1];
		const writeResult = lastWriteEvent.result as WriteFileResult;

		if (writeResult) {
			if (writeResult.error) {
				fallbackResponse += `I tried to write to a file but encountered an error: ${writeResult.error}. `;
			} else if (writeResult.message) {
				fallbackResponse += `${writeResult.message}. `;
			} else {
				fallbackResponse += "I successfully wrote to the file. ";
			}
		}
	}

	if (grepEvents.length > 0) {
		const lastGrepEvent = grepEvents[grepEvents.length - 1];
		const grepResult = lastGrepEvent.result as GrepResult;

		if (grepResult) {
			if (grepResult.error) {
				fallbackResponse += `I tried to search for content but encountered an error: ${grepResult.error}. `;
			} else if (
				Array.isArray(grepResult.matches) &&
				grepResult.matches.length > 0
			) {
				fallbackResponse += `I found ${grepResult.matches.length} matches across ${grepResult.matchedFiles} files. `;
			} else {
				fallbackResponse +=
					"I searched for content but couldn't find any matches. ";
			}
		}
	}

	return fallbackResponse;
}
