import { ToolResult } from "ai/types";
import SageAI from "main";
import { FileOperationManager } from "./FileOperationManager";

interface FileOperationResult {
	message: string;
}

export async function executeFileOperation(
	app: SageAI,
	operationId: string,
): Promise<ToolResult<FileOperationResult>> {
	const operation = FileOperationManager.getPendingOperation(operationId);

	if (!operation) {
		return {
			success: false,
			error: "Operation not found",
			message: `No operation found with ID ${operationId}`,
		};
	}

	if (operation.rejected) {
		return {
			success: false,
			error: "Operation rejected",
			message: "The operation was rejected by the user",
		};
	}

	if (!operation.approved) {
		try {
			await waitForOperationResponse(operationId, 120000);
		} catch (error) {
			return {
				success: false,
				error: "Operation timed out",
				message: "The operation timed out waiting for user approval",
			};
		}

		const updatedOperation =
			FileOperationManager.getPendingOperation(operationId);
		if (!updatedOperation || updatedOperation.rejected) {
			return {
				success: false,
				error: "Operation rejected",
				message: "The operation was rejected by the user",
			};
		}
	}

	try {
		switch (operation.type) {
			case "rename": {
				if (!operation.targetPath) {
					throw new Error(
						"Target path is required for rename operations",
					);
				}
				const file = app.app.vault.getFileByPath(operation.sourcePath);
				if (!file) {
					throw new Error(`File "${operation.sourcePath}" not found`);
				}
				await app.app.vault.rename(file, operation.targetPath);
				return {
					success: true,
					data: {
						message: `File successfully renamed from "${operation.sourcePath}" to "${operation.targetPath}"`,
					},
				};
			}

			case "delete": {
				const file = app.app.vault.getFileByPath(operation.sourcePath);
				if (!file) {
					throw new Error(`File "${operation.sourcePath}" not found`);
				}
				await app.app.vault.delete(file);
				return {
					success: true,
					data: {
						message: `File "${operation.sourcePath}" successfully deleted`,
					},
				};
			}

			case "move": {
				if (!operation.targetPath) {
					throw new Error(
						"Target path is required for move operations",
					);
				}
				const file = app.app.vault.getFileByPath(operation.sourcePath);
				if (!file) {
					throw new Error(`File "${operation.sourcePath}" not found`);
				}
				await app.app.vault.rename(file, operation.targetPath);
				return {
					success: true,
					data: {
						message: `File successfully moved from "${operation.sourcePath}" to "${operation.targetPath}"`,
					},
				};
			}

			case "createFolder": {
				await app.app.vault.createFolder(operation.sourcePath);
				return {
					success: true,
					data: {
						message: `Folder "${operation.sourcePath}" successfully created`,
					},
				};
			}

			case "deleteFolder": {
				const folder = app.app.vault.getAbstractFileByPath(
					operation.sourcePath,
				);
				if (!folder) {
					throw new Error(
						`Folder "${operation.sourcePath}" not found`,
					);
				}
				await app.app.vault.delete(folder, true);
				return {
					success: true,
					data: {
						message: `Folder "${operation.sourcePath}" successfully deleted`,
					},
				};
			}

			case "moveFolder": {
				if (!operation.targetPath) {
					throw new Error(
						"Target path is required for move operations",
					);
				}
				const folder = app.app.vault.getAbstractFileByPath(
					operation.sourcePath,
				);
				if (!folder) {
					throw new Error(
						`Folder "${operation.sourcePath}" not found`,
					);
				}
				await app.app.vault.rename(folder, operation.targetPath);
				return {
					success: true,
					data: {
						message: `Folder successfully moved from "${operation.sourcePath}" to "${operation.targetPath}"`,
					},
				};
			}

			default:
				return {
					success: false,
					error: "Unknown operation type",
					message: `Operation type "${operation.type}" is not supported`,
				};
		}
	} catch (error) {
		console.error("Error executing file operation:", error);
		return {
			success: false,
			error: "Failed to execute operation",
			message: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

async function waitForOperationResponse(
	operationId: string,
	timeout: number,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const startTime = Date.now();

		const checkStatus = () => {
			const operation =
				FileOperationManager.getPendingOperation(operationId);

			if (operation && (operation.approved || operation.rejected)) {
				resolve();
				return;
			}

			if (Date.now() - startTime >= timeout) {
				reject(new Error("Operation timed out"));
				return;
			}

			setTimeout(checkStatus, 500);
		};

		checkStatus();
	});
}
