import { App, Modal, Setting } from "obsidian";

import { t } from "src/lang/utils";

export class NoteDeletionWarningModal extends Modal {
	numberOfCards: number;
	onSubmit: (result: boolean) => void;

	constructor(
		app: App,
		numberOfCards: number,
		onSubmit: (result: boolean) => void
	) {
		super(app);
		this.numberOfCards = numberOfCards;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h1", {
			text: `${this.numberOfCards} cards are related with this note.\n
            They will be deleted and can be recovered.`,
		});

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
