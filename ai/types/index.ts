import { Message as AIMessage } from "ai";

export type ToolEvent = {
	type: "toolCall" | "toolResult";
	tool: string;
	args?: Record<string, unknown>;
	result?: unknown;
	timestamp?: number;
};

export type StreamCallbacks = {
	onStart?: () => void;
	onToken?: (token: string) => void;
	onToolCall?: (tool: string, args: Record<string, unknown>) => void;
	onToolResult?: (result: unknown) => void;
	onToolEvent?: (event: ToolEvent) => void;
	onComplete?: (message: AIMessage) => void;
	onError?: (error: Error) => void;
};

export type AssistantResponse = {
	text: string;
	toolEvents: ToolEvent[];
	isComplete: boolean;
	error?: boolean;
	errorMessage?: string;
};

export type ToolSuccessResult<T> = {
	success: true;
	data: T;
};

export type ToolErrorResult = {
	success: false;
	error: string;
	message?: string;
	path?: string;
};

export type ToolResult<T> = ToolSuccessResult<T> | ToolErrorResult;
