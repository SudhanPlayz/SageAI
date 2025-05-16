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

		containerRef.current.innerHTML = "";

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

			containerRef.current.innerHTML = content
				.split("\n")
				.map((line) => `<div>${line || "&nbsp;"}</div>`)
				.join("");
		}
	}, [content, app]);

	return <div className="obsidian-markdown-content" ref={containerRef}></div>;
};
