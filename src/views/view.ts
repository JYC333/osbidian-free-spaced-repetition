import {
	WorkspaceLeaf,
	ViewStateResult,
	ButtonComponent,
	ItemView,
	Notice,
} from "obsidian";
import { DeckType } from "src/constants";
import FreeSpacedRepetition from "src/main";
import { FSRSubView, ReviewMode, ReviewCard } from "src/types";

import { t } from "src/lang/utils";
import { switchView, openBrowseSidebar, updateView } from "src/utils/utils";
import { DeckView } from "src/views/deckView";
import { ReviewView } from "src/views/reviewView";
import { BrowseView } from "src/views/browseView";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

export class FSRView extends ItemView {
	plugin: FreeSpacedRepetition;

	wrapperEl: HTMLElement;
	tabsEl: HTMLElement;

	deckView: DeckView;
	reviewView: ReviewView;
	browseView: BrowseView;
	currentView: FSRSubView;

	mode: ReviewMode;
	deck: string;
	deckType: string;
	buildQueue: boolean;
	currentQueue: ReviewCard[];

	constructor(leaf: WorkspaceLeaf, plugin: FreeSpacedRepetition) {
		super(leaf);

		this.plugin = plugin;

		let contentEl = this.containerEl.querySelector(
			".view-content"
		) as HTMLElement;
		this.wrapperEl = contentEl.createDiv("fsr-wrapper");
		this.tabsEl = this.wrapperEl.createDiv("fsr-tabs");
		this.wrapperEl.createEl("hr");

		this.deckView = new DeckView(this, plugin);
		this.reviewView = new ReviewView(this, plugin);
		this.browseView = new BrowseView(this, plugin);

		this.currentView = this.deckView;
	}

	async setState(state: any, result: ViewStateResult): Promise<void> {
		this.mode = state.mode as ReviewMode;
		this.deck = state.deck;
		this.deckType = state.deckType;
		this.buildQueue = state.buildQueue;
		this.currentQueue = state.currentQueue;

		await super.setState(state, result);

		this.tabsEl.empty();
		let decksButton = this.tabsEl.createDiv("fsr-tabs-button");
		let browseButton = this.tabsEl.createDiv("fsr-tabs-button");
		let statsButton = this.tabsEl.createDiv("fsr-tabs-button");
		let editButton = this.tabsEl.createDiv("fsr-tabs-button");

		new ButtonComponent(decksButton)
			.setButtonText(t("DECKS"))
			.onClick(() => {
				setTimeout(() => updateView(this.plugin), 1);
				switchView(this.plugin, { mode: "deck" });
			})
			.setClass("fsr-tabs-decks");
		new ButtonComponent(browseButton)
			.setButtonText(t("BROWSE"))
			.onClick(() => {
				setTimeout(() => updateView(this.plugin), 1);
				switchView(this.plugin, { mode: "browse" });
				openBrowseSidebar(this.plugin);
			})
			.setClass("fsr-tabs-browse");
		new ButtonComponent(statsButton)
			.setButtonText(t("STATS"))
			.onClick(() => new Notice("Not Implemented"))
			.setClass("fsr-tabs-stats");

		if (this.mode === null || this.mode === "deck") {
			this.currentView.hide();
			this.currentView = this.deckView;
			this.currentView.show();
			return;
		}

		new ButtonComponent(editButton)
			.setButtonText(t("EDIT"))
			.onClick(() => this.reviewView.openCardEditor())
			.setClass("fsr-tabs-edit");

		this.currentView.hide();

		if (this.mode === "review") {
			this.currentView = this.reviewView;
			this.currentView.show();
		} else if (this.mode === "browse") {
			this.currentView = this.browseView;
			this.currentView.show();
			return;
		}
		console.log(
			`Loading item in deck: ${this.deck}, type: ${this.deckType}`
		);

		if (this.buildQueue || this.currentQueue.length === 0) {
			let reviewQueue: ReviewCard[] = [];
			for (let note in this.plugin.dataStore.data.trackedNotes) {
				for (
					let i = 0;
					i < this.plugin.dataStore.data.trackedNotes[note].length;
					i++
				) {
					let card = this.plugin.dataStore.data.trackedNotes[note][i];
					if (
						(card.FSRInfo.due as Date).getTime() >
						new Date().getTime()
					) {
						continue;
					}
					let cardForReview = {
						fileName: note,
						cardIndex: i,
					};
					if (
						state.deckType === DeckType.FolderDeck &&
						((state.deck ===
							this.plugin.settings.folderDeckRootName &&
							note.split("/").length === 1) ||
							note.startsWith(state.deck))
					) {
						reviewQueue.push(cardForReview);
					} else if (
						state.deckType === DeckType.CustomizedDeck &&
						card.decks.contains(state.deck)
					) {
						reviewQueue.push(cardForReview);
					}
				}
			}
			this.currentQueue = reviewQueue;
		}

		this.currentView.set(
			this.currentQueue,
			{
				deck: this.deck,
				deckType: this.deckType,
			},
			state.pointer
		);
	}

	getState(): any {
		let state = super.getState();
		state.mode = this.mode;
		state.deck = this.deck;
		state.deckType = this.deckType;
		return state;
	}

	getViewType(): string {
		return "fsr-review-view";
	}

	getDisplayText(): string {
		return "Free Spaced Repetition";
	}
}
