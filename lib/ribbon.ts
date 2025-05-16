import SageAI from "main";
import { Menu } from "obsidian";

export const addRibbon = (app: SageAI) => {
	app.addRibbonIcon("sparkle", "Sage AI", (event) => {
		const menu = new Menu();

		app.activateView();

		menu.showAtMouseEvent(event);
	});
};
