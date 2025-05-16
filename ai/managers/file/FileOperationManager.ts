import { PendingFileOperation } from "ai/types";
import SageAI from "main";
import { executeFileOperation } from "./operations";

export class FileOperationManager {
	private static pendingOperations: Map<string, PendingFileOperation> =
		new Map();
	private static app: SageAI | null = null;

	static setApp(app: SageAI): void {
		this.app = app;
	}

	static addPendingOperation(operation: PendingFileOperation): string {
		this.pendingOperations.set(operation.id, operation);
		return operation.id;
	}

	static getPendingOperation(id: string): PendingFileOperation | undefined {
		return this.pendingOperations.get(id);
	}

	static approvePendingOperation(id: string): void {
		const operation = this.pendingOperations.get(id);
		if (operation && this.app) {
			operation.approved = true;
			this.pendingOperations.set(id, operation);

			executeFileOperation(this.app, id).catch((error) => {
				console.error("Error executing approved operation:", error);
			});
		}
	}

	static rejectPendingOperation(id: string): void {
		const operation = this.pendingOperations.get(id);
		if (operation) {
			operation.rejected = true;
			this.pendingOperations.set(id, operation);
		}
	}

	static getAllPendingOperations(): PendingFileOperation[] {
		return Array.from(this.pendingOperations.values());
	}

	static clearResolvedOperations(): void {
		for (const [id, operation] of this.pendingOperations.entries()) {
			if (operation.approved || operation.rejected) {
				this.pendingOperations.delete(id);
			}
		}
	}
}
