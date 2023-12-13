import { Notice } from "obsidian";
import { DeckType } from "src/constants";
import FreeSpacedRepetition from "src/main";
import { FSRSubView, ReviewCard } from "src/types";
import { switchView, calculateTotalHeight, getFolderPath } from "src/utils";

import { t } from "src/lang/utils";
import { FSRView } from "src/views/view";

import isEqual from "lodash/isEqual";

export class DeckView implements FSRSubView {
	plugin: FreeSpacedRepetition;

	containerEl: HTMLElement;

	constructor(view: FSRView, plugin: FreeSpacedRepetition) {
		this.plugin = plugin;

		this.containerEl = view.wrapperEl.createDiv("fsr-deck");

		this.renderView(this.containerEl);
	}

	renderView(container: HTMLElement) {
		let [folderDeck, customizedDeck] = this.getDecks();

		container.createEl("h2", { text: t("FOLDER_DECK") });
		this.createHeader(container);

		if (folderDeck.length > 0) {
			this.addCollapsibleItems(
				container,
				folderDeck,
				"",
				0,
				DeckType.FolderDeck
			);
		} else {
			container
				.createDiv("fsr-deck-text")
				.setText(t("FOLDER_DECK_EMPTY"));
		}

		container.createEl("h2", { text: t("CUSTOMIZRD_DECK") });
		this.createHeader(container);

		if (customizedDeck.length > 0) {
			this.addCollapsibleItems(
				container,
				customizedDeck,
				"",
				0,
				DeckType.CustomizedDeck
			);
		} else {
			container
				.createDiv("fsr-deck-text")
				.setText(t("CUSTOMIZRD_DECK_EMPTY"));

			const buttonContainer = container.createDiv({
				cls: "fsr-deck-button",
			});
			const button = buttonContainer.createEl("button", {
				text: t("CUSTOMIZRD_DECK_CREATE"),
			});

			button.addEventListener("click", () => {
				new Notice("Not implemented");
			});
		}
	}

	refreshView() {
		let heights: Record<string, number> = {};

		this.containerEl
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

		this.containerEl.empty();
		this.renderView(this.containerEl);

		this.containerEl
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

	createHeader(container: HTMLElement) {
		const header = container.createEl("div", "column-header");
		const content = header.createEl("div", "collapsible-header-content");
		content.createEl("span", {
			cls: "collapsible-title",
			text: t("DECK"),
		});
		const status = header.createEl("div", "column-header-status");
		status.createEl("span", { text: t("NEW") });
		status.createEl("span", { text: t("LEARN") });
		status.createEl("span", { text: t("DUE") });
		container.createEl("hr");
	}

	addCollapsibleItems(
		container: HTMLElement,
		items: any[],
		parent: string,
		depth: number,
		deckType: string
	) {
		const skipKeys = ["learning", "newCard", "review"];
		items.forEach((item) => {
			if (!skipKeys.contains(item.title)) {
				this.addCollapsibleItem(
					container,
					item.title,
					item.children,
					item.newCard,
					item.learning,
					item.review,
					parent,
					depth,
					deckType
				);
			}
		});
	}

	addCollapsibleItem(
		container: any,
		title: string,
		children: any,
		newCard: number,
		learning: number,
		review: number,
		parent: string,
		depth: number,
		deckType: string
	) {
		const fullPath = parent === "" ? title : `${parent}/${title}`;
		container.createEl("div", "collapsible-space");
		const header = container.createEl("div", "collapsible-header");
		const deck = header.createEl("div", "collapsible-header-deck");
		for (let i = 0; i < depth; i++) {
			deck.createEl("div", "collapsible-header-space");
		}
		const content = deck.createEl("div", "collapsible-header-content");
		const status = header.createEl("div", "collapsible-header-status");
		status.createEl("span", { cls: "collapsible-new", text: `${newCard}` });
		status.createEl("span", {
			cls: "collapsible-learning",
			text: `${learning}`,
		});
		status.createEl("span", {
			cls: "collapsible-review",
			text: `${review}`,
		});

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
				if (content.style.maxHeight) {
					content.style.maxHeight = null;
				} else {
					content.style.maxHeight =
						calculateTotalHeight(content) + "px";
				}
			});

			titleEl.addEventListener("click", function () {
				console.log("jump to deck review page:", title);
				switchView(plugin, {
					mode: "review",
					deck: fullPath,
					deckType: deckType,
					buildQueue: true,
				});
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
				console.log("jump to deck review page:", title);
				switchView(plugin, {
					mode: "review",
					deck: fullPath,
					deckType: deckType,
					buildQueue: true,
				});
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
				depth + 1,
				deckType
			);
		}
	}

	getDecks() {
		let folderDeck: Record<string, any> = {};
		let customizedDeck: Record<string, any> = {};
		const stateMap = ["newCard", "learning", "review"];
		for (let note in this.plugin.dataStore.data.trackedNotes) {
			let folderPath = getFolderPath(note, this.plugin);
			this.plugin.dataStore.data.trackedNotes[note].map((d) => {
				let state =
					(d.FSRInfo.state as number) > 2
						? 1
						: (d.FSRInfo.state as number);
				if (!folderDeck.hasOwnProperty(folderPath)) {
					folderDeck[folderPath] = {
						newCard: 0,
						learning: 0,
						review: 0,
					};
				}
				if ((d.FSRInfo.due as Date).getTime() < new Date().getTime()) {
					folderDeck[folderPath][stateMap[state]] += 1;
				}
				d.deck.map((p) => {
					if (!customizedDeck.hasOwnProperty(p)) {
						customizedDeck[p] = {
							newCard: 0,
							learning: 0,
							review: 0,
						};
					}
					if (
						(d.FSRInfo.due as Date).getTime() < new Date().getTime()
					) {
						customizedDeck[p][stateMap[state]] += 1;
					}
				});
			});
		}

		return [this.formatDecks(folderDeck), this.formatDecks(customizedDeck)];
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
		const endKeys = ["learning", "newCard", "review"];
		let deckList: any = [];
		if (isEqual(keys, endKeys)) {
			return [];
		} else {
			keys.forEach((k: string) => {
				let item = {
					title: k,
					children: this.formatDeckList(deck[k]),
					newCard: 0,
					learning: 0,
					review: 0,
				};
				if (isEqual(Object.keys(deck[k]).sort(), endKeys)) {
					item["newCard"] += deck[k]["newCard"];
					item["learning"] += deck[k]["learning"];
					item["review"] += deck[k]["review"];
				} else {
					for (let c of item.children) {
						item["newCard"] += c["newCard"];
						item["learning"] += c["learning"];
						item["review"] += c["review"];
					}
				}
				deckList.push(item);
			});
		}
		return deckList;
	}

	set(currentQueue: ReviewCard[], deckInfo: Record<string, string>) {}
	show() {
		this.containerEl.style.display = "block";
	}

	hide() {
		this.containerEl.style.display = "none";
	}
}
