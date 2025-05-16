import * as React from "react";
import { ToolOperationIndicatorProps } from "../types";

export const ToolOperationIndicator: React.FC<ToolOperationIndicatorProps> = ({
	icon: Icon,
	children,
	type = "default",
	minimal = false,
}) =>
	minimal ? (
		<div className="sage-activity-minimal">
			{Icon && <Icon size={12} />}
			<span className="sage-activity-text">{children}</span>
		</div>
	) : (
		<div className={`sage-tool-operation sage-tool-operation-${type}`}>
			<div className="sage-tool-operation-icon">
				{Icon && <Icon size={14} />}
			</div>
			<div className="sage-tool-operation-content">{children}</div>
		</div>
	);
