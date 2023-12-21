import { WorkspaceLeaf } from "obsidian";
import { FilterType } from "src/constants";
import FreeSpacedRepetition from "src/main";
import { Card, Filter, TextOffset } from "src/types";

import isEqual from "lodash/isEqual";

export async function switchView(plugin: FreeSpacedRepetition, state: any) {
	const { workspace } = plugin.app;
	console.log(state);
	let leaf: WorkspaceLeaf | null = null;
	const leaves = workspace.getLeavesOfType("fsr-review-view");

	if (leaves.length > 0) {
		leaf = leaves[0];
		await leaf.setViewState({
			type: "fsr-review-view",
			state: state,
		});
	} else {
		leaf = workspace.getLeaf(true);
		await leaf.setViewState({
			type: "fsr-review-view",
			state: state,
		});
	}

	workspace.setActiveLeaf(leaf);
}

export async function openBrowseSidebar(
	plugin: FreeSpacedRepetition,
	side: string = "left"
) {
	const { workspace } = plugin.app;
	let leaf: WorkspaceLeaf | null = null;
	const leaves = workspace.getLeavesOfType("fsr-browse-sidebar");

	if (leaves.length > 0) {
		leaf = leaves[0];
		await leaf.setViewState({
			type: "fsr-browse-sidebar",
		});
	} else {
		switch (side) {
			default:
				leaf = workspace.getLeftLeaf(false);
				break;
			case "right":
				leaf = workspace.getRightLeaf(false);
				break;
		}
		await leaf.setViewState({
			type: "fsr-browse-sidebar",
		});
	}

	workspace.revealLeaf(leaf);
}

export function calculateTotalHeight(element: any) {
	let totalHeight = element.scrollHeight;
	const children = element.querySelectorAll(".collapsible-content");

	children.forEach((child: any) => {
		totalHeight += calculateTotalHeight(child);
	});

	return totalHeight;
}

export function changeFilter(
	element: any,
	type: string,
	condition: string,
	filter: Filter
) {
	if (element.style.backgroundColor) {
		element.style.backgroundColor = null;
		switch (type) {
			case FilterType.CardState:
				filter.cardState.remove(condition);
				break;
			case FilterType.Decks:
				filter.decks.remove(condition);
				break;
		}
	} else {
		element.style.backgroundColor = "#546791";
		switch (type) {
			case FilterType.CardState:
				filter.cardState = [
					...new Set([...filter.cardState, condition]),
				];
				break;
			case FilterType.Decks:
				filter.decks = [...new Set([...filter.decks, condition])];
				break;
		}
	}
}

export function getFolderPath(path: string, plugin: FreeSpacedRepetition) {
	let folders = path.split("/");
	if (folders.length === 1) {
		return plugin.settings.folderDeckRootName;
	} else {
		folders.pop();
		return folders.join("/");
	}
}

export async function updateView(
	plugin: FreeSpacedRepetition,
	pointer: any = null
) {
	if (plugin.sidebarView) {
		plugin.sidebarView.refresh();
	}
	const currentView = plugin.currentView;
	console.log(currentView.getState().mode);
	if (currentView) {
		switch (currentView.getState().mode) {
			case "deck":
				await new Promise((resolve) => {
					setTimeout(resolve, 100);
				});
				currentView.deckView.refreshView();
				break;
			case "review":
				currentView.reviewView.refreshView(pointer);
				break;
			case "browse":
				currentView.browseView.show();
				break;
		}
	}
}

export function checkExistence(newCard: Card, cardList: Card[]) {
	for (let i = 0; i < cardList.length; i++) {
		if (
			isEqual(newCard.question, cardList[i].question) &&
			isEqual(newCard.answer, cardList[i].answer)
		) {
			return i;
		}
	}
	return -1;
}

export function getCardText(
	section: Array<TextOffset | string> | string,
	fileContent: string
) {
	let text = "";
	switch (typeof section) {
		case "string":
			text = section;
			while (text.startsWith("#")) {
				text = text.slice(1, text.length);
				text = text.trim();
			}
			text = `# ${text}`;
			break;
		case "object":
			text = "";
			section.forEach((d) => {
				if (typeof d === "string") {
					text += d;
				} else {
					text += fileContent.substring(d.start, d.end + 1);
				}
			});
			break;
	}
	return text;
}
