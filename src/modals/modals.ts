import { App, Modal, Setting } from "obsidian";
import FreeSpacedRepetition from "src/main";

import { t } from "src/lang/utils";
import { getFolderPath, updateView } from "src/utils/utils";

import { isEqual } from "lodash";

export class NoteDeletionWarningModal extends Modal {
	note: string;
	plugin: FreeSpacedRepetition;
	onSubmit: (result: boolean) => void;

	constructor(
		app: App,
		plugin: FreeSpacedRepetition,
		note: string,
		onSubmit: (result: boolean) => void
	) {
		super(app);
		this.plugin = plugin;
		this.note = note;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		const { data } = this.plugin.dataStore;
		contentEl.createEl("h1", {
			text: `${
				data.trackedNotes[this.note].length
			} cards are related with this note.\n
            They are deleted and cannot recovered.`,
		});

		let decks: any = {};
		for (let i = 0; i < data.trackedNotes[this.note].length; i++) {
			data.trackedNotes[this.note][i].decks.forEach((d) => {
				if (!decks.hasOwnProperty(d)) {
					decks[d] = [{ fileName: this.note, cardIndex: i }];
				} else {
					decks[d].push({ fileName: this.note, cardIndex: i });
				}
			});
		}

		let folderDeck = getFolderPath(this.note, this.plugin);
		data.folderDeck[folderDeck].remove(this.note);
		if (Object.keys(decks).length > 0) {
			for (let d of decks) {
				data.customizedDeck[d] = data.customizedDeck[d].filter((p) => {
					let flag = true;
					for (let pp in decks[d]) {
						if (isEqual(p, pp)) {
							flag = false;
						}
					}
					return flag;
				});
			}
		}

		delete data.trackedNotes[this.note];

		updateView(this.plugin);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class CardDeletionWarningModal extends Modal {
	onSubmit: (result: boolean) => void;

	constructor(app: App, onSubmit: (result: boolean) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h1", { text: t("CARD_DELETE_WARNING") });

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Yes")
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(true);
					})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Cancel")
					.setWarning()
					.onClick(() => {
						this.close();
						this.onSubmit(false);
					})
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
