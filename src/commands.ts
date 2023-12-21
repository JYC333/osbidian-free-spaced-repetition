import { TFile, WorkspaceLeaf } from "obsidian";
import { Card } from "src/types";
import FreeSpacedRepetition from "src/main";
import { CardEditorModal } from "src/modals/cardEditorModal";
import {
	switchView,
	updateView,
	getFolderPath,
	checkExistence,
} from "src/utils/utils";

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
		const { data } = this.plugin.dataStore;
		if (!data.trackedNotes.hasOwnProperty(fileName)) {
			data.trackedNotes[fileName] = [];
		}
		const fileCache = this.plugin.app.metadataCache.getFileCache(file);
		const newCard: Card = {
			question: file.basename,
			answer: [
				{
					start: 0,
					// @ts-ignore
					end: fileCache?.sections[fileCache.sections?.length - 1]
						.position.end.offset,
				},
			],
			type: "basic",
			decks: [],
			FSRInfo: new fsrsJs.Card(),
		};

		const cardInd = checkExistence(newCard, data.trackedNotes[fileName]);

		if (cardInd === -1) {
			data.trackedNotes[fileName].push(newCard);

			console.log(`Create card for note: ${fileName}`);
		} else {
			console.log(`Card duplicated for note: ${fileName}`);
		}

		const deck = getFolderPath(fileName, this.plugin);
		if (!data.folderDeck.hasOwnProperty(deck)) {
			data.folderDeck[deck] = [fileName];
		} else {
			data.folderDeck[deck] = [
				...new Set([...data.folderDeck[deck], fileName]),
			];
		}
		new CardEditorModal(this.plugin.app, file, this.plugin).open();

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
}
