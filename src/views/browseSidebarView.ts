import { WorkspaceLeaf, ItemView } from "obsidian";
import FreeSpacedRepetition from "src/main";
import { calculateTotalHeight, getFolderPath } from "src/utils";

import { t } from "src/lang/utils";

export class BrowseSidebarView extends ItemView {
	plugin: FreeSpacedRepetition;
	init: boolean;

	contentEl: HTMLElement;

	cardState: any[];
	decks: any[];

	constructor(leaf: WorkspaceLeaf, plugin: FreeSpacedRepetition) {
		super(leaf);
		this.plugin = plugin;
		this.init = true;

		const container = this.containerEl.children[1];
		container.empty();

		let wrapperEl = container.createDiv("fsr-browser-wrapper");
		// 在此处创建你的界面内容
		let headEl = wrapperEl.createDiv("fsr-browser-head");
		headEl.createEl("span", { text: "FSR Browser" });
		this.contentEl = wrapperEl.createDiv("fsr-browser-content");

		this.cardState = [
			{
				title: t("SIDEBAR_CARD_STATE"),
				type: "CardState",
				children: [
					{
						title: t("SIDEBAR_CARD_STATE_NEW"),
						type: "CardState",
						children: [],
					},
					{
						title: t("SIDEBAR_CARD_STATE_LEARNING"),
						type: "CardState",
						children: [],
					},
					{
						title: t("SIDEBAR_CARD_STATE_REVIEW"),
						type: "CardState",
						children: [],
					},
					{
						title: t("SIDEBAR_CARD_STATE_RELEARNING"),
						type: "CardState",
						children: [],
					},
				],
			},
		];
		this.decks = [
			{
				title: t("SIDEBAR_CARD_DECKS"),
				type: "Deck",
				children: this.getDecks(),
			},
		];

		this.addCollapsibleItems(
			this.contentEl,
			[...this.cardState, ...this.decks],
			"",
			0
		);

		const rootTitle = [t("SIDEBAR_CARD_STATE"), t("SIDEBAR_CARD_DECKS")];
		setTimeout(() => {
			this.contentEl
				.querySelectorAll(".collapsible-header-deck")
				.forEach((item) => {
					let title =
						item.querySelector(".collapsible-title")?.textContent;
					if (title && rootTitle.contains(title)) {
						// @ts-ignore
						let content = item.parentElement.nextElementSibling;
						// @ts-ignore
						content.style.maxHeight =
							calculateTotalHeight(content) + "px";
						// @ts-ignore
						item.querySelector(".collapsible-symbol").textContent =
							"- ";
					}
				});
		}, 1);
	}

	refresh() {
		let heights: Record<string, number> = {};

		this.contentEl
			.querySelectorAll(".collapsible-header-deck")
			.forEach((item) => {
				let title =
					item.querySelector(".collapsible-title")?.textContent;
				if (title) {
					heights[title] =
						// @ts-ignore
						item.parentElement?.nextElementSibling.style.maxHeight;
				}
			});

		this.contentEl.empty();
		this.decks = [
			{
				title: t("SIDEBAR_CARD_DECKS"),
				type: "Deck",
				children: this.getDecks(),
			},
		];

		this.addCollapsibleItems(
			this.contentEl,
			[...this.cardState, ...this.decks],
			"",
			0
		);

		this.contentEl
			.querySelectorAll(".collapsible-header-deck")
			.forEach((item) => {
				let title =
					item.querySelector(".collapsible-title")?.textContent;
				if (title) {
					// @ts-ignore
					item.parentElement.nextElementSibling.style.maxHeight =
						heights[title];
					if (heights[title]) {
						// @ts-ignore
						item.querySelector(".collapsible-symbol").textContent =
							"- ";
					}
				}
			});
	}

	getViewType() {
		return "fsr-browse-sidebar";
	}

	getDisplayText() {
		return "FSR Browse Sidebar";
	}

	async onOpen() {
		this.refresh();
	}

	async onClose() {}

	addCollapsibleItems(
		container: HTMLElement,
		items: any[],
		parent: string,
		depth: number
	) {
		items.forEach((item) => {
			this.addCollapsibleItem(
				container,
				item.title,
				item.type,
				item.children,
				parent,
				depth
			);
		});
	}

	addCollapsibleItem(
		container: any,
		title: string,
		type: string,
		children: any,
		parent: string,
		depth: number
	) {
		const fullPath = parent === "" ? title : `${parent}/${title}`;

		container.createEl("div", "collapsible-space");
		const header = container.createEl("div", "collapsible-header");
		const deck = header.createEl("div", "collapsible-header-deck");
		for (let i = 0; i < depth; i++) {
			deck.createEl("div", "collapsible-header-space");
		}
		const content = deck.createEl("div", "collapsible-header-content");

		const plugin = this.plugin;

		if (children.length > 0) {
			const symbol = content.createEl("span", {
				cls: "collapsible-symbol",
				text: "+ ",
			});
			const titleEl = content.createEl("span", {
				cls: "collapsible-title",
				text: title,
			});

			symbol.addEventListener("click", function () {
				symbol.textContent = symbol.textContent === "+ " ? "- " : "+ ";

				const content =
					this.parentElement.parentElement.parentElement
						.nextElementSibling;
				console.log(content);
				if (content.style.maxHeight) {
					content.style.maxHeight = null;
				} else {
					content.style.maxHeight =
						calculateTotalHeight(content) + "px";
				}
			});

			titleEl.addEventListener("click", function () {
				console.log("jump to deck review page:", title, type, fullPath);
			});
		} else {
			content.createEl("span", {
				cls: "collapsible-symbol-occupy",
				text: "  ",
			});
			const titleEl = content.createEl("span", {
				cls: "collapsible-title",
				text: title,
			});

			titleEl.addEventListener("click", function () {
				console.log("jump to deck review page:", title, type, fullPath);
			});
		}

		const contentEl = container.createEl("div", "collapsible-content");

		if (children && children.length > 0) {
			const subContainer = contentEl.createDiv({
				cls: "collapsible-sub-container",
			});
			this.addCollapsibleItems(
				subContainer,
				children,
				fullPath,
				depth + 1
			);
		}
	}

	getDecks() {
		let decks: Record<string, any> = {};
		for (let note in this.plugin.dataStore.data.trackedNotes) {
			let folderPath = getFolderPath(note, this.plugin);
			this.plugin.dataStore.data.trackedNotes[note].map((d) => {
				if (!decks.hasOwnProperty(folderPath)) {
					decks[folderPath] = {};
				}
			});
		}
		console.log(decks);

		return this.formatDecks(decks);
	}

	formatDecks(decks: Record<string, any>) {
		let paths = {};
		for (let path in decks) {
			this.formatPathObject(paths, path, decks[path]);
		}
		return this.formatDeckList(paths);
	}

	formatPathObject(deck: any, path: string, info: Record<string, any>) {
		let paths = path.split("/");
		let parent = paths.shift();
		if (parent) {
			if (!deck.hasOwnProperty(parent)) {
				deck[parent] = {};
			}
			if (paths.length > 0) {
				this.formatPathObject(deck[parent], paths.join("/"), info);
			}
			if (paths.length === 0 && Object.keys(deck[parent]).length === 0) {
				deck[parent] = info;
			}
		}
		return deck;
	}

	formatDeckList(deck: any) {
		let keys = Object.keys(deck).sort();
		let deckList: any = [];
		keys.forEach((k: string) => {
			let item = {
				title: k,
				type: "Deck",
				children: this.formatDeckList(deck[k]),
			};
			deckList.push(item);
		});
		return deckList;
	}
}
