import {
	App,
	ButtonComponent,
	Component,
	MarkdownRenderer,
	Modal,
	Notice,
	TFile,
	TextAreaComponent,
	ToggleComponent,
} from "obsidian";

import FreeSpacedRepetition from "src/main";
import { Card, TextOffset } from "src/types";

import { t } from "src/lang/utils";
import { CardDeletionWarningModal } from "src/modals/modals";
import { updateView, checkExistence, getCardText } from "src/utils/utils";

import { isEqual } from "lodash";

const fsrsJs = require("fsrs.js");

export class CardEditorModal extends Modal {
	app: App;
	file: TFile;
	plugin: FreeSpacedRepetition;
	comp: Component;

	question: any = null;
	answer: any = null;

	editing: any = null;

	constructor(
		app: App,
		file: TFile,
		plugin: FreeSpacedRepetition,
		editing: any = null
	) {
		super(app);
		this.app = app;
		this.file = file;
		this.plugin = plugin;
		this.editing = editing;
		this.comp = new Component();
		this.comp.load();
	}

	async onClose() {
		this.comp.unload();
		this.contentEl.empty();
		this.question = null;
		this.answer = null;
		if (this.editing) {
			updateView(this.plugin, {
				fileName: this.file.path,
				cardIndex: this.editing.ind,
			});
		}
		this.editing = null;
	}

	async onOpen() {
		const { contentEl } = this;
		this.modalEl.style.minWidth = "80vw";
		this.titleEl.setText(
			t("CARD_EDITOR_TITLE") + " - " + this.file.basename
		);
		const { data } = this.plugin.dataStore;

		contentEl.addClass("fsr-edit-mod");

		let cardListEl = contentEl.createDiv("fsr-edit-card-list");
		let cardEditEl = contentEl.createDiv("fsr-edit-card-edit");

		let fileContent: string = "";

		await this.plugin.app.vault
			.cachedRead(this.file)
			.then((c) => (fileContent = c));

		this.renderCardList(
			cardListEl,
			cardEditEl,
			data.trackedNotes[this.file.path],
			fileContent
		);

		this.renderCardEdit(cardEditEl, cardListEl, fileContent, this.editing);
	}

	renderCardList(
		container: HTMLElement,
		cardEditEl: HTMLElement,
		cardList: Card[],
		fileContent: string
	) {
		const note = this.file.path;

		container.createEl("h3", { text: t("CARD_EDITOR_EXISTING_CARD") });

		for (let card of cardList) {
			let cardEl = container.createDiv("fsr-floating-card");

			let cardContainer = cardEl.createDiv("fsr-floating-card-container");
			let questionEl = cardContainer.createDiv("fsr-card-question");
			cardContainer.createEl("hr");
			let answerEl = cardContainer.createDiv("fsr-card-answer");

			let buttonContainer = cardEl.createDiv("fsr-card-button-container");

			new ButtonComponent(buttonContainer).setIcon("edit").onClick(() => {
				cardEditEl.empty();
				this.renderCardEdit(cardEditEl, container, fileContent, {
					question: card.question,
					answer: card.answer,
					ind: checkExistence(card, cardList),
				});
			});
			new ButtonComponent(buttonContainer)
				.setIcon("trash-2")
				.setWarning()
				.onClick(() => {
					new CardDeletionWarningModal(this.app, (result) => {
						if (result) {
							const { data } = this.plugin.dataStore;
							const cardInd = checkExistence(
								card,
								data.trackedNotes[note]
							);

							if (cardInd === -1) {
								new Notice("Error when delete card!");
							} else {
								data.trackedNotes[note].splice(cardInd, 1);
								container.empty();
								this.renderCardList(
									container,
									cardEditEl,
									data.trackedNotes[note],
									fileContent
								);
								this.plugin.dataStore.save();
								updateView(this.plugin);
								new Notice(
									t("CARD_EDITOR_DELETE", {
										ind: cardInd,
										note: note,
									})
								);
							}
						}
					}).open();
				});

			MarkdownRenderer.render(
				this.app,
				getCardText(card.question, fileContent),
				questionEl,
				note,
				this.comp
			);

			MarkdownRenderer.render(
				this.app,
				getCardText(card.answer, fileContent),
				answerEl,
				note,
				this.comp
			);
		}
	}

	renderCardEdit(
		container: HTMLElement,
		cardListEl: HTMLElement,
		fileContent: string,
		editing: any = null
	) {
		const { data } = this.plugin.dataStore;
		const note = this.file.path;

		if (editing) {
			container.createEl("h3", { text: t("CARD_EDITOR_EDIT_CARD") });
		} else {
			container.createEl("h3", { text: t("CARD_EDITOR_NEW_CARD") });
		}

		let questionEl = container.createDiv("fsr-edit-question");
		this.renderEditor(
			questionEl,
			t("CARD_EDITOR_QUESTION"),
			fileContent,
			editing?.question
		);

		let answerEl = container.createDiv("fsr-edit-answer");
		this.renderEditor(
			answerEl,
			t("CARD_EDITOR_ANSWER"),
			fileContent,
			editing?.answer
		);

		let buttonEl = container.createDiv("fsr-edit-button-container");
		if (editing) {
			new ButtonComponent(buttonEl)
				.setButtonText(t("CARD_EDITOR_BACK"))
				.onClick(() => {
					this.question = null;
					this.answer = null;
					container.empty();
					this.renderCardEdit(container, cardListEl, fileContent);
				});
		}
		new ButtonComponent(buttonEl)
			.setButtonText(
				editing ? t("CARD_EDITOR_UPDATE") : t("CARD_EDITOR_CREATE")
			)
			.onClick(() => {
				if (!this.question || !this.answer) {
					new Notice(t("CARD_EDITOR_EMPTY_WARNING"));
				} else {
					if (editing) {
						const { ind } = editing;
						data.trackedNotes[note][ind].question = this.question;
						data.trackedNotes[note][ind].answer = this.answer;
						new Notice(
							t("CARD_EDITOR_UPDATED", {
								ind: ind + 1,
								note: note,
							})
						);
					} else {
						const newCard = this.createCard();

						const cardInd = checkExistence(
							newCard,
							data.trackedNotes[note]
						);

						if (cardInd === -1) {
							data.trackedNotes[note].push(newCard);
							new Notice(
								t("CARD_EDITOR_CREATED", {
									note: note,
								})
							);
							this.plugin.dataStore.save();
							updateView(this.plugin);
						} else {
							new Notice(
								t("CARD_EDITOR_DUPLICATED", {
									note: note,
								})
							);
						}
					}
					this.question = null;
					this.answer = null;

					cardListEl.empty();
					this.renderCardList(
						cardListEl,
						container,
						data.trackedNotes[note],
						fileContent
					);
					container.empty();
					this.renderCardEdit(container, cardListEl, fileContent);
				}
			});
	}

	renderEditor(
		container: HTMLElement,
		sectionName: string,
		fileContent: string,
		editing: any = null
	) {
		let titleEl = container.createDiv("fsr-edit-title");
		titleEl.createEl("h5", { text: sectionName });

		let mode = typeof editing === "object" && editing !== null;

		let toggleEl = titleEl.createDiv("fsr-edit-toggle");
		toggleEl.createSpan({ text: t("CARD_EDITOR_INPUT") });
		new ToggleComponent(toggleEl).setValue(mode).onChange((value) => {
			inputEl.empty();
			switch (sectionName) {
				case t("CARD_EDITOR_QUESTION"):
					this.question = null;
					break;
				case t("CARD_EDITOR_ANSWER"):
					this.answer = null;
					break;
			}
			this.renderInput(inputEl, value, fileContent, sectionName, editing);
		});
		toggleEl.createSpan({ text: t("CARD_EDITOR_SELECT") });

		let inputEl = container.createDiv("fsr-edit-content");

		this.renderInput(inputEl, mode, fileContent, sectionName, editing);
	}

	renderInput(
		container: HTMLElement,
		mode: boolean,
		fileContent: string,
		sectionName: string,
		editing: any = null
	) {
		if (mode) {
			let sections = this.plugin.app.metadataCache.getFileCache(
				this.file
			)?.sections;
			let leftList: Array<TextOffset | string> = [];
			if (sections) {
				let formatSections = sections.map((d) => {
					return {
						start: d.position.start.offset,
						end: d.position.end.offset,
					};
				});
				if (sectionName === t("CARD_EDITOR_QUESTION")) {
					leftList = [`# ${this.file.basename}\n`, ...formatSections];
				} else {
					leftList = [...formatSections];
				}
			}
			let rightList: Array<TextOffset | string> = [];
			if (typeof editing === "object" && editing !== null) {
				rightList = leftList.filter((d) => {
					for (let v of editing) {
						if (isEqual(d, v)) {
							return true;
						}
					}
				});
				leftList = leftList.filter((d) => {
					let flag = true;
					for (let v of rightList) {
						flag = flag && !isEqual(d, v);
					}
					return flag;
				});
				switch (sectionName) {
					case t("CARD_EDITOR_QUESTION"):
						this.question = rightList;
						break;
					case t("CARD_EDITOR_ANSWER"):
						this.answer = rightList;
						break;
				}
			}
			this.renderTransfer(
				container,
				leftList,
				rightList,
				fileContent,
				sectionName
			);
		} else {
			let textArea = new TextAreaComponent(container)
				.setValue(
					typeof editing === "string" && editing !== null
						? editing
						: ""
				)
				.onChange((value) => {
					questionTextPreview.empty();
					MarkdownRenderer.render(
						this.app,
						value,
						questionTextPreview,
						this.file.path,
						this.comp
					);
					switch (sectionName) {
						case t("CARD_EDITOR_QUESTION"):
							this.question = value;
							break;
						case t("CARD_EDITOR_ANSWER"):
							this.answer = value;
							break;
					}
				});
			let questionTextPreview = container.createDiv("fsr-edit-preview");
			textArea.inputEl.className = "fsr-edit-text";
			if (typeof editing === "string" && editing !== null) {
				switch (sectionName) {
					case t("CARD_EDITOR_QUESTION"):
						this.question = editing;
						break;
					case t("CARD_EDITOR_ANSWER"):
						this.answer = editing;
						break;
				}
				MarkdownRenderer.render(
					this.app,
					editing,
					questionTextPreview,
					this.file.path,
					this.comp
				);
			}
		}
	}

	renderTransfer(
		container: any,
		leftList: Array<TextOffset | string>,
		rightList: Array<TextOffset | string>,
		fileContent: string,
		sectionName: string
	) {
		let leftToRight: number[] = [];
		let rightToLeft: number[] = [];

		let questionLeftEl = container.createDiv("fsr-edit-left");
		for (let i = 0; i < leftList.length; i++) {
			let sectionCard = questionLeftEl.createDiv({
				attr: { id: i, class: "fsr-floating-card" },
			});
			let content = "";
			if (typeof leftList[i] === "string") {
				content = leftList[i] as string;
			} else {
				content = fileContent.substring(
					(leftList[i] as TextOffset).start,
					(leftList[i] as TextOffset).end + 1
				);
			}

			sectionCard.addEventListener("click", function () {
				if (this.style.backgroundColor) {
					this.style.backgroundColor = null;
					leftToRight.remove(Number(this.id));
				} else {
					this.style.backgroundColor = "#546791";
					leftToRight.push(Number(this.id));
				}
				// console.log(leftToRight);
			});

			MarkdownRenderer.render(
				this.app,
				content,
				sectionCard,
				this.file.path,
				this.comp
			);
		}

		let transferButtonContainerEl = container.createDiv(
			"fsr-edit-button-move"
		);
		new ButtonComponent(transferButtonContainerEl)
			.setButtonText("<>")
			.onClick(() => {
				let toRight = [];
				let toLeft = [];
				for (let i of leftToRight.reverse()) {
					toRight.unshift(...leftList.splice(i, 1));
				}
				for (let i of rightToLeft.reverse()) {
					toLeft.unshift(...rightList.splice(i, 1));
				}
				// console.log("toRight", toRight);
				// console.log("toLeft", toLeft);
				leftList.push(...toLeft);
				rightList.push(...toRight);
				switch (sectionName) {
					case t("CARD_EDITOR_QUESTION"):
						this.question = rightList;
						break;
					case t("CARD_EDITOR_ANSWER"):
						this.answer = rightList;
						break;
				}
				container.empty();
				this.renderTransfer(
					container,
					leftList,
					rightList,
					fileContent,
					sectionName
				);
			});

		let questionRightEl = container.createDiv("fsr-edit-right");
		for (let i = 0; i < rightList.length; i++) {
			let sectionCard = questionRightEl.createDiv({
				attr: { id: i, class: "fsr-floating-card" },
			});
			let content = "";
			if (typeof rightList[i] === "string") {
				content = rightList[i] as string;
			} else {
				content = fileContent.substring(
					(rightList[i] as TextOffset).start,
					(rightList[i] as TextOffset).end + 1
				);
			}

			sectionCard.addEventListener("click", function () {
				if (this.style.backgroundColor) {
					this.style.backgroundColor = null;
					rightToLeft.remove(Number(this.id));
				} else {
					this.style.backgroundColor = "#546791";
					rightToLeft.push(Number(this.id));
				}
			});

			MarkdownRenderer.render(
				this.app,
				content,
				sectionCard,
				this.file.path,
				this.comp
			);
		}
	}

	createCard() {
		let question: Array<TextOffset | string> | string = [],
			answer: Array<TextOffset | string> | string = [];
		switch (typeof this.question) {
			case "string":
				question = this.question;
				break;
			case "object":
				question = [];
				this.question.forEach((d: string | TextOffset) => {
					if (typeof d === "string") {
						(question as Array<TextOffset | string>).push(d);
					} else {
						(question as Array<TextOffset | string>).push({
							start: d.start,
							end: d.end,
						});
					}
				});
				break;
		}
		switch (typeof this.answer) {
			case "string":
				answer = this.answer;
				break;
			case "object":
				answer = [];
				this.answer.forEach((d: string | TextOffset) => {
					if (typeof d === "string") {
						(answer as Array<TextOffset | string>).push(d);
					} else {
						(answer as Array<TextOffset | string>).push({
							start: d.start,
							end: d.end,
						});
					}
				});
				break;
		}

		const newCard: Card = {
			question: question,
			answer: answer,
			type: "basic",
			decks: [],
			FSRInfo: new fsrsJs.Card(),
		};

		return newCard;
	}
}
