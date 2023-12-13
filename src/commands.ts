import { TFile, WorkspaceLeaf } from "obsidian";
import { Card } from "src/types";
import FreeSpacedRepetition from "src/main";
import { switchView, updateView } from "src/utils";

import isEqual from "lodash/isEqual";
const fsrsJs = require("fsrs.js");

export default class Commands {
	plugin: FreeSpacedRepetition;

	constructor(plugin: FreeSpacedRepetition) {
		this.plugin = plugin;
	}

	addCommand() {
		const plugin = this.plugin;

		plugin.addCommand({
			id: "create-card",
			name: "Create Card from Current File",
			callback: () => {
				let file = plugin.app.workspace.getActiveFile();
				if (file != null) {
					console.log(file);
					this.createCard(file);
				}
			},
		});

		plugin.addCommand({
			id: "review-view",
			name: "Review",
			callback: () => switchView(this.plugin, { mode: "deck" }),
		});

		plugin.addCommand({
			id: "dev",
			name: "dev",
			callback: async () => {
				const { workspace } = plugin.app;

				let leaf: WorkspaceLeaf | null = null;
				leaf = workspace.getLeaf(true);
				await leaf.setViewState({
					type: "test",
				});

				workspace.setActiveLeaf(leaf);
			},
		});
	}

	createCard(file: TFile) {
		const fileName = file.path;
		if (!this.plugin.dataStore.data.trackedNotes.hasOwnProperty(fileName)) {
			this.plugin.dataStore.data.trackedNotes[fileName] = [];
		}
		const fileCache = this.plugin.app.metadataCache.getFileCache(file);
		console.log(fileCache);
		const newCard: Card = {
			question: file.basename,
			answer: {
				start: 0,
				// @ts-ignore
				end: fileCache?.sections[fileCache.sections?.length - 1]
					.position.end.offset,
			},
			type: "basic",
			deck: [],
			FSRInfo: new fsrsJs.Card(),
		};

		const cardInd = this.checkDuplicate(
			newCard,
			this.plugin.dataStore.data.trackedNotes[fileName]
		);

		if (cardInd === -1) {
			this.plugin.dataStore.data.trackedNotes[fileName].push(newCard);

			console.log(`Create card for note: ${fileName}`);
		} else {
			console.log(`Card duplicated for note: ${fileName}`);
		}
		this.plugin.dataStore.save();
		updateView(this.plugin);
		// this.plugin.currentView.deckView.refreshView();
		console.log(this.plugin.dataStore.data);

		// this.plugin.app.vault.read(file).then((content) => {
		// 	console.log(content);
		// 	console.log(fileCache?.sections[4].position.start.offset);
		// 	console.log(
		// 		content.slice(
		// 			fileCache?.sections[4].position.start.offset,
		// 			fileCache?.sections[4].position.end.offset
		// 		)
		// 	);
		// });
	}

	checkDuplicate(newCard: Card, cardList: Card[]) {
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
}
