import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { Leaf } from "./Leaf";
import { AppContext } from "hooks/app";
import SageAI from "main";

export const VIEW_TYPE_AGENT = "sage-ai-view";

export class AgentView extends ItemView {
	root: Root | null = null;
	plugin: SageAI;

	constructor(leaf: WorkspaceLeaf, plugin: SageAI) {
		super(leaf);
		this.icon = "sparkle";
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_AGENT;
	}

	getDisplayText() {
		return "Sage AI";
	}

	async onOpen() {
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<AppContext.Provider value={this.plugin}>
				<Leaf />
			</AppContext.Provider>,
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
