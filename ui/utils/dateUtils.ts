import { format } from "date-fns";

export const formatMessageTime = (timestamp: number): string => {
	return format(new Date(timestamp), "h:mm a");
};

export const formatMessageDate = (timestamp: number): string => {
	const today = new Date();
	const messageDate = new Date(timestamp);

	if (messageDate.toDateString() === today.toDateString()) {
		return "Today";
	}

	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	if (messageDate.toDateString() === yesterday.toDateString()) {
		return "Yesterday";
	}

	return format(messageDate, "MMMM d, yyyy");
};
