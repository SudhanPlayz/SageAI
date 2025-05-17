import * as React from "react";
import { useRef, useEffect } from "react";
import { Component, MarkdownRenderer } from "obsidian";
import { useApp } from "hooks/app";

interface ObsidianMarkdownContentProps {
	content: string;
}

export const ObsidianMarkdownContent: React.FC<
	ObsidianMarkdownContentProps
> = ({ content }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const app = useApp();

	useEffect(() => {
		if (!containerRef.current || !content || !app) return;

		// Clear the container using DOM API
		while (containerRef.current.firstChild) {
			containerRef.current.removeChild(containerRef.current.firstChild);
		}

		try {
			const processedContent = content
				.replace(/\[\[(.*?)\|(.*?)\]\]/g, "[$2]($1)")
				.replace(/\[\[(.*?)\]\]/g, "[$1]($1)");

			MarkdownRenderer.render(
				app.app,
				processedContent,
				containerRef.current,
				"./",
				{} as Component,
			);
		} catch (error) {
			console.error(
				"Error rendering markdown with Obsidian renderer:",
				error,
			);

			// Create a fallback display using DOM API
			const lines = content.split("\n");
			lines.forEach((line) => {
				const div = document.createElement("div");
				div.textContent = line || " ";
				containerRef.current?.appendChild(div);
			});
		}
	}, [content, app]);

	return <div className="obsidian-markdown-content" ref={containerRef}></div>;
};
