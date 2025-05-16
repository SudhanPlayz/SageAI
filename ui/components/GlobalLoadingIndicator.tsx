import * as React from "react";
import { LoaderIcon } from "lucide-react";

interface GlobalLoadingIndicatorProps {
	isActive: boolean;
	currentStatus?: string;
}

export const GlobalLoadingIndicator: React.FC<GlobalLoadingIndicatorProps> = ({
	isActive,
	currentStatus,
}) => {
	if (!isActive) return null;

	return (
		<div className="sage-global-loader">
			<div className="sage-loader-content">
				<LoaderIcon size={16} className="sage-loader-icon" />
				<div className="sage-loader-text">
					{currentStatus || "Processing..."}
				</div>
			</div>
		</div>
	);
};
