import SageAI from "main";

export function enhancePromptWithEditorContext(
	app: SageAI,
	originalPrompt: string,
): string {
	const workspace = app.app.workspace;

	const activeFile = workspace.getActiveFile();

	if (!activeFile) {
		return originalPrompt;
	}

	const editor = workspace.activeEditor?.editor;
	const contextInfo = [];

	contextInfo.push(`Current file: ${activeFile.path}`);

	if (editor) {
		const cursor = editor.getCursor();
		contextInfo.push(
			`Cursor position: Line ${cursor.line + 1}, Column ${cursor.ch + 1}`,
		);

		const selection = editor.getSelection();
		if (selection && selection.trim().length > 0) {
			contextInfo.push(`Selected text: "${selection}"`);
		}

		const currentLine = editor.getLine(cursor.line);
		if (currentLine) {
			contextInfo.push(`Current line content: "${currentLine.trim()}"`);
		}
	}

	const fileExtension = activeFile.path.split(".").pop();
	if (fileExtension) {
		contextInfo.push(`File type: ${fileExtension}`);
	}

	const contextString = contextInfo.join("\n");

	const enhancedPrompt = `Context Information:\n${contextString}\n\nUser Query: ${originalPrompt}`;

	return enhancedPrompt;
}
