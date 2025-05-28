import * as React from "react";
import { useState, useRef, useEffect } from "react";
import {
	HistoryIcon,
	MessageSquarePlusIcon,
	SendIcon,
	Sparkles,
	BrainIcon,
	LoaderIcon,
	SearchIcon,
	FileTextIcon,
	FileEditIcon,
	XIcon,
	CheckIcon,
} from "lucide-react";
import { chatWithAgent } from "ai/agent";
import { useApp } from "hooks/app";
import { StreamCallbacks, ToolEvent } from "ai/types";

// Components
import { GlobalLoadingIndicator } from "ui/components/GlobalLoadingIndicator";
import { ActivityTracker } from "ui/components/ActivityTracker";
import { HistoryPanel } from "ui/components/HistoryPanel";
import { ObsidianMarkdownContent } from "ui/components/ObsidianMarkdownContent";
import { ToolOperationIndicator } from "ui/components/ToolOperationIndicator";

// Types
import { Message, StatusUpdate, Conversation } from "ui/types";

// Utils
import { formatMessageTime, formatMessageDate } from "ui/utils/dateUtils";

export const Leaf = () => {
	const app = useApp();
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState<Message[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
	const [conversation, setConversation] = useState<Conversation>({
		id: crypto.randomUUID(),
		messages: [],
		createdAt: Date.now(),
	});
	const [streamingMessage, setStreamingMessage] = useState("");
	const [toolActivity, setToolActivity] = useState<ToolEvent[]>([]);
	const [isHistoryVisible, setIsHistoryVisible] = useState(false);
	const [currentStep, setCurrentStep] = useState<string>("");
	const conversationRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (app && messages.length > 0) {
			setConversation((prev) => ({
				...prev,
				messages: messages.map((msg) => ({
					content: msg.content,
					role: msg.role,
					id: Math.random().toString(36).substring(2, 9),
				})),
			}));
		}
	}, [messages, app]);

	const groupedMessages = React.useMemo(() => {
		if (messages.length === 0) return [];

		const result: {
			date: string;
			messages: (Message & { timestamp?: number })[];
		}[] = [];
		let currentDate = "";
		let currentGroup: (Message & { timestamp?: number })[] = [];

		messages.forEach((msg, index) => {
			const timestamp =
				Date.now() - (messages.length - index) * 1000 * 60 * 5;
			const messageWithTime = { ...msg, timestamp };

			const date = formatMessageDate(timestamp);

			if (currentDate !== date) {
				if (currentGroup.length > 0) {
					result.push({ date: currentDate, messages: currentGroup });
				}
				currentDate = date;
				currentGroup = [messageWithTime];
			} else {
				currentGroup.push(messageWithTime);
			}
		});

		if (currentGroup.length > 0) {
			result.push({ date: currentDate, messages: currentGroup });
		}

		return result;
	}, [messages]);

	const handleSendMessage = async () => {
		if (!message.trim() || !app) return;

		const userMessage: Message = {
			id: crypto.randomUUID(),
			content: message,
			role: "user",
		};
		setMessages((prev) => [...prev, userMessage]);
		setMessage("");
		setIsLoading(true);
		setCurrentStep("Starting...");

		setStatusUpdates([]);
		setStreamingMessage("");
		setToolActivity([]);

		try {
			const callbacks: StreamCallbacks = {
				onStart: () => {
					setStatusUpdates([{ type: "thinking" }]);
					setCurrentStep("Thinking...");
				},
				onToken: (token) => {
					setStreamingMessage((prev) => prev + token);
				},
				onToolEvent: (event) => {
					setToolActivity((prev) => [...prev, event]);

					if (event.type === "toolCall") {
						if (event.tool === "searchFiles") {
							const searchQuery =
								(event.args as any)?.query || "";
							setStatusUpdates([
								{
									type: "searching",
									target: searchQuery,
									details: `Searching for files matching "${searchQuery}"...`,
								},
							]);
							setCurrentStep(`Searching for "${searchQuery}"...`);

							if (!streamingMessage.trim()) {
								setStreamingMessage(
									`Searching for files matching "${searchQuery}"...`,
								);
							}
						} else if (event.tool === "readFile") {
							const filePath = (event.args as any)?.path || "";
							setStatusUpdates([
								{
									type: "reading",
									target: filePath,
									details: `Reading file "${filePath}"...`,
								},
							]);
							setCurrentStep(`Reading "${filePath}"...`);

							if (streamingMessage.endsWith("...")) {
								setStreamingMessage(
									(prev) =>
										`${prev}\nReading file "${filePath}"...`,
								);
							} else {
								setStreamingMessage((prev) =>
									prev
										? `${prev}\n\nReading file "${filePath}"...`
										: `Reading file "${filePath}"...`,
								);
							}
						}
					} else if (event.type === "toolResult") {
						setStatusUpdates([{ type: "thinking" }]);
						setCurrentStep("Processing results...");

						if (event.tool === "searchFiles") {
							const searchResults = event.result as any[];
							if (Array.isArray(searchResults)) {
								if (searchResults.length === 0) {
									setStreamingMessage(
										(prev) =>
											`${prev}\nI couldn't find any files matching your search.`,
									);
								} else {
									const fileList = searchResults
										.map((r) => r.name || r.file)
										.join(", ");
									setStreamingMessage(
										(prev) =>
											`${prev}\nFound ${searchResults.length} file(s): ${fileList}`,
									);
								}
							}
						} else if (event.tool === "readFile") {
							const fileResult = event.result as any;
							if (fileResult.error) {
								setStreamingMessage(
									(prev) =>
										`${prev}\nError reading file: ${fileResult.error}`,
								);
							} else {
								setStreamingMessage(
									(prev) =>
										`${prev}\nSuccessfully read "${fileResult.name}"`,
								);
							}
						}
					}
				},
				onToolCall: (tool, args) => {},
				onToolResult: (result) => {},
				onComplete: (assistantMessage) => {
					setIsLoading(false);
					setStatusUpdates([]);
					setCurrentStep("");

					if (
						assistantMessage.content &&
						assistantMessage.content.trim() !== ""
					) {
						setStreamingMessage("");
					}

					const updatedMessages = conversation.messages
						.filter((msg) => msg.role !== "system")
						.map((msg) => ({
							id: msg.id || crypto.randomUUID(),
							content: msg.content,
							role: msg.role as "user" | "assistant",
							toolEvents: (msg as any).toolEvents || [],
						}));

					const lastMsg = updatedMessages[updatedMessages.length - 1];
					if (
						lastMsg &&
						lastMsg.role === "assistant" &&
						(!lastMsg.content || lastMsg.content.trim() === "")
					) {
						console.warn(
							"Empty assistant message detected, using fallback",
						);

						lastMsg.content =
							streamingMessage ||
							"I processed your request but couldn't prepare a proper response.";
					}

					setMessages(updatedMessages);

					setTimeout(() => {
						setToolActivity([]);
					}, 1000);
				},
			};

			await chatWithAgent(app, conversation, message, callbacks);
		} catch (error) {
			console.error("Error getting response from agent:", error);

			setMessages((prev) => [
				...prev,
				{
					id: crypto.randomUUID(),
					content:
						"Sorry, I encountered an error processing your request.",
					role: "assistant",
				},
			]);
			setIsLoading(false);
			setStatusUpdates([]);
			setStreamingMessage("");
			setToolActivity([]);
			setCurrentStep("");
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const clearChat = () => {
		setMessages([]);
		setConversation({
			id: crypto.randomUUID(),
			messages: [],
			createdAt: Date.now(),
		});
	};

	const selectConversation = (convo: Conversation) => {
		if (convo.id === conversation.id) {
			setIsHistoryVisible(false);
			return;
		}

		setConversation(convo);

		const formattedMessages = convo.messages
			.filter((msg) => msg.role !== "system")
			.map((msg) => ({
				id: msg.id || crypto.randomUUID(),
				content: msg.content,
				role: msg.role as "user" | "assistant",
				toolEvents: (msg as any).toolEvents || [],
			}));

		setMessages(formattedMessages);
		setIsHistoryVisible(false);
	};

	const deleteConversation = (id: string) => {
		if (app) {
			app.storage.deleteConversation(id);

			if (id === conversation.id) {
				clearChat();
			}
		}
	};

	useEffect(() => {
		if (conversationRef.current) {
			conversationRef.current.scrollTop =
				conversationRef.current.scrollHeight;
		}
	}, [messages, streamingMessage, statusUpdates, toolActivity]);

	const renderToolEvent = (event: ToolEvent) => {
		if (event.type === "toolCall") {
			switch (event.tool) {
				case "searchFiles": {
					const args = event.args as any;
					return (
						<ToolOperationIndicator
							icon={SearchIcon}
							type="search"
							minimal>
							Searching for "{args?.query || ""}"
						</ToolOperationIndicator>
					);
				}
				case "readFile": {
					const args = event.args as any;
					return (
						<ToolOperationIndicator
							icon={FileTextIcon}
							type="read"
							minimal>
							Reading file "{args?.path || ""}"
						</ToolOperationIndicator>
					);
				}
			}
		}

		if (event.type === "toolResult") {
			switch (event.tool) {
				case "searchFiles": {
					const results = event.result as any[];
					return (
						<ToolOperationIndicator
							icon={SearchIcon}
							type="result"
							minimal>
							Found {results.length} results
						</ToolOperationIndicator>
					);
				}
				case "readFile": {
					const readResult = event.result as any;
					if (readResult.error) {
						return (
							<ToolOperationIndicator
								icon={XIcon}
								type="error"
								minimal>
								Error reading file: {readResult.error}
							</ToolOperationIndicator>
						);
					} else {
						return (
							<ToolOperationIndicator
								icon={CheckIcon}
								type="success"
								minimal>
								Read file "{readResult.name || ""}"
							</ToolOperationIndicator>
						);
					}
				}
			}
		}

		return null;
	};

	const autoResizeTextarea = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height =
				textareaRef.current.scrollHeight + "px";
		}
	};

	useEffect(() => {
		autoResizeTextarea();
	}, [message]);

	return (
		<div
			className={`sage-container ${isHistoryVisible ? "with-history" : ""} ${isLoading ? "is-loading" : ""} ${app?.settings.hideThoughtProcess ? "sage-hide-thought-process" : ""}`}>
			<GlobalLoadingIndicator
				isActive={isLoading}
				currentStatus={currentStep}
			/>

			<HistoryPanel
				visible={isHistoryVisible}
				onClose={() => setIsHistoryVisible(false)}
				onSelectConversation={selectConversation}
				onDeleteConversation={deleteConversation}
				currentConversationId={conversation.id}
			/>

			<div className="sage-header">
				<div className="sage-header-left">
					<h1>Sage AI</h1>
				</div>
				<div className="sage-header-right">
					<button
						className="sage-header-button"
						onClick={clearChat}
						title="New Chat">
						<MessageSquarePlusIcon size={16} />
					</button>
					<button
						className={`sage-header-button ${isHistoryVisible ? "active" : ""}`}
						onClick={() => setIsHistoryVisible(!isHistoryVisible)}
						title="Chat History">
						<HistoryIcon size={16} />
					</button>
				</div>
			</div>

			<div className="sage-conversation" ref={conversationRef}>
				{messages.length === 0 ? (
					<div className="sage-empty-state">
						<div className="sage-empty-content">
							<div className="sage-empty-icon">
								<Sparkles size={64} />
							</div>
							<h3>Welcome to Sage AI</h3>
							<p>Your intelligent assistant</p>
							<div className="sage-suggestions">
								<h4>Try asking:</h4>
								<div className="sage-suggestion-items">
									<button
										onClick={() =>
											setMessage(
												"Summarize the current note",
											)
										}>
										Summarize the current note
									</button>
									<button
										onClick={() =>
											setMessage(
												"Generate a table of contents",
											)
										}>
										Generate a table of contents
									</button>
									<button
										onClick={() =>
											setMessage("Find related notes")
										}>
										Find related notes
									</button>
								</div>
							</div>
						</div>
					</div>
				) : (
					<>
						{groupedMessages.map((group, groupIndex) => (
							<React.Fragment key={groupIndex}>
								<div className="sage-date-separator">
									<span className="sage-date-separator-text">
										{group.date}
									</span>
								</div>

								{group.messages.map((msg, index) => (
									<div
										key={index}
										className={`sage-message sage-message-${msg.role}`}
										data-time={
											msg.timestamp
												? formatMessageTime(
														msg.timestamp,
													)
												: ""
										}>
										<div className="sage-message-content">
											<ObsidianMarkdownContent
												content={msg.content}
											/>

											{msg.role === "assistant" &&
												msg.toolEvents &&
												msg.toolEvents.length > 0 &&
												!app?.settings
													.hideThoughtProcess && (
													<div className="sage-thought-process">
														<div className="sage-thought-header">
															<BrainIcon
																size={14}
															/>
															<span>
																Thought process
															</span>
														</div>
														<div className="sage-tool-events-list">
															{msg.toolEvents.map(
																(event, i) => (
																	<div
																		key={i}
																		className="sage-thought-item">
																		{renderToolEvent(
																			event,
																		)}
																	</div>
																),
															)}
														</div>
													</div>
												)}
										</div>
									</div>
								))}
							</React.Fragment>
						))}

						{isLoading && (
							<div className="sage-message sage-message-assistant sage-loading">
								<div className="sage-message-content">
									<ActivityTracker
										status={statusUpdates}
										isLoading={isLoading}
									/>

									{statusUpdates.length > 0 ? (
										<div className="sage-status-updates">
											{statusUpdates.map(
												(status, index) => (
													<div
														key={index}
														className="sage-status-update">
														{status.type ===
															"thinking" && (
															<ToolOperationIndicator
																icon={BrainIcon}
																type="thinking"
																minimal={true}>
																Thinking...
															</ToolOperationIndicator>
														)}
														{status.type ===
															"reading" && (
															<ToolOperationIndicator
																icon={
																	FileTextIcon
																}
																type="read"
																minimal={true}>
																Reading{" "}
																{status.target}
															</ToolOperationIndicator>
														)}
														{status.type ===
															"searching" && (
															<ToolOperationIndicator
																icon={
																	SearchIcon
																}
																type="search"
																minimal={true}>
																Searching for{" "}
																{status.target}
															</ToolOperationIndicator>
														)}
														{status.type ===
															"writing" && (
															<ToolOperationIndicator
																icon={
																	FileEditIcon
																}
																type="write"
																minimal={true}>
																Updating{" "}
																{status.target}
															</ToolOperationIndicator>
														)}
													</div>
												),
											)}
										</div>
									) : (
										<div className="sage-typing-indicator">
											<span></span>
											<span></span>
											<span></span>
										</div>
									)}

									{toolActivity.length > 0 &&
										!app?.settings.hideThoughtProcess && (
											<div className="sage-thought-process active">
												{toolActivity.map(
													(event, i) => (
														<div
															key={i}
															className="sage-thought-item">
															{renderToolEvent(
																event,
															)}
														</div>
													),
												)}
											</div>
										)}

									{streamingMessage && (
										<div className="sage-streaming-content">
											<ObsidianMarkdownContent
												content={streamingMessage}
											/>
										</div>
									)}
								</div>
							</div>
						)}
					</>
				)}
			</div>

			<div className="sage-form">
				<div className="sage-input-container">
					<textarea
						ref={textareaRef}
						className="sage-input"
						placeholder="Ask Sage AI..."
						value={message}
						onChange={(e) => {
							setMessage(e.target.value);
							autoResizeTextarea();
							e.target.classList.add("sage-input");
						}}
						onKeyDown={handleKeyPress}
						rows={1}
						disabled={isLoading}
					/>
				</div>
				<button
					className={`sage-send-button ${message.trim() ? "active" : ""} ${isLoading ? "loading" : ""}`}
					onClick={handleSendMessage}
					disabled={isLoading || !message.trim()}
					title="Send message">
					{isLoading ? (
						<LoaderIcon size={18} className="sage-spin" />
					) : (
						<SendIcon size={18} />
					)}
				</button>
			</div>
		</div>
	);
};
