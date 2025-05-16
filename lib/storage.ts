import { Message } from "ai";
import { App } from "obsidian";

export interface Conversation {
	id: string;
	messages: Message[];
	createdAt: number;
}

class Storage {
	constructor(private app: App) {
		this.app = app;
	}

	getConversations(): Conversation[] {
		const conversations = this.app.loadLocalStorage("chats");
		return conversations || ([] as Conversation[]);
	}

	getConversation(id: string): Conversation | undefined {
		const conversations = this.getConversations();
		return conversations.find((c: Conversation) => c.id === id);
	}

	saveConversation(conversation: Conversation): void {
		const conversations = this.getConversations();
		const existingConversationIndex = conversations.findIndex(
			(c: Conversation) => c.id === conversation.id,
		);
		if (existingConversationIndex !== -1) {
			conversations[existingConversationIndex] = conversation;
		} else {
			conversations.push(conversation);
		}
		this.app.saveLocalStorage("chats", conversations);
	}

	deleteConversation(id: string): void {
		const conversations = this.getConversations();
		const newConversations = conversations.filter(
			(c: Conversation) => c.id !== id,
		);
		this.app.saveLocalStorage("chats", newConversations);
	}
}

export default Storage;
