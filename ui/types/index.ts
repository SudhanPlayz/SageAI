import { ToolEvent } from "ai/types";

export interface StatusUpdate {
	type: "reading" | "writing" | "thinking" | "searching";
	target?: string;
	details?: string;
}

export interface SearchArgs {
	query?: string;
}

export interface ReadFileArgs {
	path?: string;
}

export interface SearchResult {
	file?: string;
	name?: string;
	matches?: number;
}

export interface ReadFileResult {
	error?: string;
	name?: string;
}

export interface Message {
	id: string;
	content: string;
	role: "user" | "assistant" | "system" | "data";
	toolEvents?: ToolEvent[];
}

export interface ToolOperationIndicatorProps {
	icon: React.ElementType;
	children: React.ReactNode;
	type?:
		| "default"
		| "search"
		| "read"
		| "write"
		| "thinking"
		| "result"
		| "success"
		| "error";
	minimal?: boolean;
}

export interface HistoryPanelProps {
	visible: boolean;
	onClose: () => void;
	onSelectConversation: (conversation: Conversation) => void;
	onDeleteConversation: (id: string) => void;
	currentConversationId: string;
}

export interface Conversation {
	id: string;
	messages: Message[];
	createdAt: number;
}
