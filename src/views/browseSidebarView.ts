import { WorkspaceLeaf, ItemView } from "obsidian";
import { DEFAULT_FILTER, FilterType } from "src/constants";
import FreeSpacedRepetition from "src/main";
import { calculateTotalHeight, changeFilter } from "src/utils/utils";
import { Filter } from "src/types";

import { t } from "src/lang/utils";

export class BrowseSidebarView extends ItemView {
	plugin: FreeSpacedRepetition;
	init: boolean;

	contentEl: HTMLElement;

	cardState: any[];
	decks: any[];

	filter: Filter = DEFAULT_FILTER;

	rootTitle: string[] = [t("SIDEBAR_CARD_STATE"), t("SIDEBAR_CARD_DECKS")];

	constructor(leaf: WorkspaceLeaf, plugin: FreeSpacedRepetition) {
		super(leaf);
		this.plugin = plugin;
		this.init = true;

		const container = this.containerEl.children[1];
		container.empty();

		let wrapperEl = container.createDiv("fsr-browser-wrapper");
		let headEl = wrapperEl.createDiv("fsr-browser-head");
		headEl.createEl("span", { text: "FSR Browser" });
		this.contentEl = wrapperEl.createDiv("fsr-browser-content");

		this.cardState = [
			{
				title: t("SIDEBAR_CARD_STATE"),
				type: FilterType.CardState,
				children: [
					{
						title: t("SIDEBAR_CARD_STATE_NEW"),
						type: FilterType.CardState,
						children: [],
					},
					{
						title: t("SIDEBAR_CARD_STATE_LEARNING"),
						type: FilterType.CardState,
						children: [],
					},
					{
						title: t("SIDEBAR_CARD_STATE_REVIEW"),
						type: FilterType.CardState,
						children: [],
					},
					{
						title: t("SIDEBAR_CARD_STATE_RELEARNING"),
						type: FilterType.CardState,
						children: [],
					},
				],
			},
		];
		this.decks = [
			{
				title: t("SIDEBAR_CARD_DECKS"),
				type: FilterType.Decks,
				children: this.getDecks(),
			},
		];

		this.addCollapsibleItems(
			this.contentEl,
			[...this.cardState, ...this.decks],
			"",
			0
		);

		setTimeout(() => {
			this.contentEl
				.querySelectorAll(".collapsible-header-deck")
				.forEach((item) => {
					let title = item.querySelector(
						".collapsible-title-sidebar"
					)?.textContent;
					if (title && this.rootTitle.contains(title)) {
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
		const filter = this.filter;
		const rootTitle = this.rootTitle;

		header.addEventListener("click", function (event: any) {
			let title = this.querySelector(
				".collapsible-title-sidebar"
			)?.textContent;
			if (
				event.target.className !== "collapsible-symbol" &&
				!rootTitle.contains(title)
			) {
				let condition;
				if (type === FilterType.Decks) {
					condition = fullPath.slice(
						FilterType.Decks.length + 1,
						fullPath.length
					);
				} else {
					condition = title;
				}

				changeFilter(this, type, condition, filter);
				console.log(filter);
				plugin.currentView.browseView.filterTableData(filter);
			}
		});

		if (children.length > 0) {
			const symbol = content.createEl("span", {
				cls: "collapsible-symbol",
				text: "+ ",
			});
			content.createEl("span", {
				cls: "collapsible-title-sidebar",
				text: title,
			});

			symbol.addEventListener("click", function () {
				symbol.textContent = symbol.textContent === "+ " ? "- " : "+ ";

				const content =
					this.parentElement.parentElement.parentElement
						.nextElementSibling;
				if (content.style.maxHeight) {
					content.style.maxHeight = null;
				} else {
					content.style.maxHeight =
						calculateTotalHeight(content) + "px";
				}
			});
		} else {
			content.createEl("span", {
				cls: "collapsible-symbol-occupy",
				text: "  ",
			});
			content.createEl("span", {
				cls: "collapsible-title-sidebar",
				text: title,
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
		const { data } = this.plugin.dataStore;

		for (let deck in data.folderDeck) {
			if (!decks.hasOwnProperty(deck)) {
				decks[deck] = {};
			}
		}

		for (let deck in data.customizedDeck) {
			if (!decks.hasOwnProperty(deck)) {
				decks[deck] = {};
			}
		}

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
				type: FilterType.Decks,
				children: this.formatDeckList(deck[k]),
			};
			deckList.push(item);
		});
		return deckList;
	}
}
