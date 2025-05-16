import * as React from "react";
import { AlertCircleIcon, CheckIcon, XIcon } from "lucide-react";
import { PendingFileOperation } from "ai/types";

interface PendingOperationsModalProps {
	operation: PendingFileOperation;
	onApprove: (id: string) => void;
	onReject: (id: string) => void;
}

export const PendingOperationsModal: React.FC<PendingOperationsModalProps> = ({
	operation,
	onApprove,
	onReject,
}) => {
	return (
		<div className="sage-pending-operation-modal">
			<div className="sage-pending-operation-content">
				<div className="sage-pending-operation-header">
					<AlertCircleIcon size={20} />
					<h3>Approval Required</h3>
				</div>
				<div className="sage-pending-operation-description">
					{operation.description}
				</div>
				<div className="sage-pending-operation-details">
					<div>
						<strong>Operation:</strong> {operation.type}
					</div>
					<div>
						<strong>Source:</strong> {operation.sourcePath}
					</div>
					{operation.targetPath && (
						<div>
							<strong>Target:</strong> {operation.targetPath}
						</div>
					)}
				</div>
				<div className="sage-pending-operation-actions">
					<button
						className="sage-pending-operation-reject"
						onClick={() => onReject(operation.id)}>
						<XIcon size={16} />
						Reject
					</button>
					<button
						className="sage-pending-operation-approve"
						onClick={() => onApprove(operation.id)}>
						<CheckIcon size={16} />
						Approve
					</button>
				</div>
			</div>
		</div>
	);
};
