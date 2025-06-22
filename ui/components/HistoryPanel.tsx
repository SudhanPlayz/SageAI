import * as React from "react";
import { useState, useEffect } from "react";
import { ClockIcon, ChevronRightIcon, TrashIcon } from "lucide-react";
import { format } from "date-fns";
import { HistoryPanelProps, Conversation } from "../types";
import { useApp } from "hooks/app";

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
	visible,
	onClose,
	onSelectConversation,
	onDeleteConversation,
	currentConversationId,
	children,
}) => {
	const app = useApp();
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const loadConversations = () => {
		if (app) {
			const storage = app.storage;
			const savedConversations = storage.getConversations();
			setConversations(
				savedConversations.sort((a, b) => b.createdAt - a.createdAt),
			);
		}
	};

	useEffect(() => {
		if (visible && app) {
			loadConversations();
		}
	}, [visible, app, refreshTrigger]);

	const handleDelete = (id: string) => {
		onDeleteConversation(id);
		setRefreshTrigger((prev) => prev + 1);
	};

	if (!visible) return null;

	return (
		<div className="sage-history-panel">
			<div className="sage-history-header">
				{children}
				<button className="sage-history-close" onClick={onClose}>
					<ChevronRightIcon size={18} />
				</button>
			</div>
			<div className="sage-history-list">
				{conversations.length === 0 ? (
					<div className="sage-history-empty">
						No saved conversations
					</div>
				) : (
					conversations.map((convo) => (
						<div
							key={convo.id}
							className={`sage-history-item ${convo.id === currentConversationId ? "active" : ""}`}
							onClick={() => onSelectConversation(convo)}>
							<div className="sage-history-item-content">
								<div className="sage-history-item-title">
									{convo.messages.length > 0 &&
									convo.messages[0].role === "user"
										? convo.messages[0].content.includes(
												"\n",
											)
											? convo.messages[0].content
													.split("\n")[0]
													.substring(0, 40) +
												(convo.messages[0].content.split(
													"\n",
												)[0].length > 40
													? "..."
													: "")
											: convo.messages[0].content.substring(
													0,
													40,
												) +
												(convo.messages[0].content
													.length > 40
													? "..."
													: "")
										: "Conversation " +
											format(
												new Date(convo.createdAt),
												"MMM d, yyyy",
											)}
								</div>
								<div className="sage-history-item-date">
									{format(
										new Date(convo.createdAt),
										"MMM d, yyyy · h:mm a",
									)}
								</div>
							</div>
							<button
								className="sage-history-delete"
								onClick={(e) => {
									e.stopPropagation();
									handleDelete(convo.id);
								}}
								title="Delete conversation">
								<TrashIcon size={14} />
							</button>
						</div>
					))
				)}
			</div>
		</div>
	);
};
