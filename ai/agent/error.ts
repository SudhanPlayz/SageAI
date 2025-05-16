import { Message as AIMessage } from "ai";
import { Conversation } from "lib/storage";
import { StreamCallbacks, ToolEvent, AssistantResponse } from "../types";
import Storage from "lib/storage";

export function handleChatError(
	error: Error | unknown,
	conversation: Conversation,
	storage: Storage,
	callbacks?: StreamCallbacks,
	toolEvents: ToolEvent[] = [],
): AssistantResponse {
	console.log("[handleChatError] Processing error");
	const errorMessage =
		error instanceof Error ? error.message : "Unknown error occurred";
	console.error("[handleChatError] Error details:", errorMessage, error);

	if (callbacks?.onError) {
		console.log("[handleChatError] Calling error callback");
		callbacks.onError(
			error instanceof Error ? error : new Error(String(error)),
		);
	}

	const assistantErrorMessage: AIMessage = {
		id: crypto.randomUUID(),
		content: `I encountered an error while processing your request: ${errorMessage}. Please try again.`,
		role: "assistant" as const,
	};

	console.log("[handleChatError] Adding error message to conversation");
	conversation.messages.push(assistantErrorMessage);
	storage.saveConversation(conversation);

	if (callbacks?.onComplete) {
		console.log(
			"[handleChatError] Calling onComplete callback with error message",
		);
		callbacks.onComplete(assistantErrorMessage);
	}

	return {
		text: assistantErrorMessage.content,
		error: true,
		errorMessage: errorMessage,
		toolEvents: toolEvents,
		isComplete: false,
	};
}
