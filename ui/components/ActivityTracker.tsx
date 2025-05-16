import * as React from "react";
import {
	BrainIcon,
	FileTextIcon,
	SearchIcon,
	FileEditIcon,
} from "lucide-react";
import { StatusUpdate } from "../types";

interface ActivityTrackerProps {
	status: StatusUpdate[];
	isLoading: boolean;
}

export const ActivityTracker: React.FC<ActivityTrackerProps> = ({
	status,
	isLoading,
}) => {
	if (!isLoading || status.length === 0) return null;

	const currentStatus = status[status.length - 1];
	let statusIcon = BrainIcon;
	let statusText = "Thinking...";

	if (currentStatus.type === "reading") {
		statusIcon = FileTextIcon;
		statusText = `Reading ${currentStatus.target || "file"}...`;
	} else if (currentStatus.type === "searching") {
		statusIcon = SearchIcon;
		statusText = `Searching for ${currentStatus.target || "content"}...`;
	} else if (currentStatus.type === "writing") {
		statusIcon = FileEditIcon;
		statusText = `Writing to ${currentStatus.target || "file"}...`;
	}

	const Icon = statusIcon;

	return (
		<div className="sage-activity-tracker">
			<div className="sage-activity-step">
				<div className="sage-activity-icon">
					<Icon size={14} />
				</div>
				<div className="sage-activity-label">{statusText}</div>
			</div>
		</div>
	);
};
