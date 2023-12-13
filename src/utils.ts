import { WorkspaceLeaf } from "obsidian";
import FreeSpacedRepetition from "src/main";

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

export function getFolderPath(path: string, plugin: FreeSpacedRepetition) {
	let folders = path.split("/");
	if (folders.length === 1) {
		return plugin.settings.folderDeckRootName;
	} else {
		folders.pop();
		return folders.join("/");
	}
}

export async function updateView(plugin: FreeSpacedRepetition) {
	console.log(plugin.sidebarView);
	if (plugin.sidebarView) {
		plugin.sidebarView.refresh();
	}
	const currentView = plugin.currentView;
	console.log(currentView.getState());
	switch (currentView.getState().mode) {
		case "deck":
			await new Promise((resolve) => {
				setTimeout(resolve, 100);
			});
			currentView.deckView.refreshView();
			break;
		case "browse":
			currentView.browseView.show();
			break;
	}
}
