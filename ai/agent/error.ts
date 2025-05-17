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
	const errorMessage =
		error instanceof Error ? error.message : "Unknown error occurred";

	if (callbacks?.onError) {
		callbacks.onError(
			error instanceof Error ? error : new Error(String(error)),
		);
	}

	const assistantErrorMessage: AIMessage = {
		id: crypto.randomUUID(),
		content: `I encountered an error while processing your request: ${errorMessage}. Please try again.`,
		role: "assistant" as const,
	};

	conversation.messages.push(assistantErrorMessage);
	storage.saveConversation(conversation);

	if (callbacks?.onComplete) {
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
