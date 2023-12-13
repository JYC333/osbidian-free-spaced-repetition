import { ButtonComponent, MarkdownRenderer, Notice, TFile } from "obsidian";
import { FSRRating } from "src/constants";
import FreeSpacedRepetition from "src/main";
import { FSRSubView, ReviewCard } from "src/types";
import { switchView } from "src/utils";

import { t } from "src/lang/utils";
import { FSRView } from "src/views/view";

export class ReviewView implements FSRSubView {
	view: FSRView;
	plugin: FreeSpacedRepetition;

	containerEl: HTMLElement;

	questionEl: HTMLElement;
	answerEl: HTMLElement;
	answerContentEl: HTMLElement;
	tapEl: HTMLElement;
	finishEl: HTMLElement;

	currentQueue: ReviewCard[];
	currentReview: number;

	deckInfo: Record<string, string>;

	constructor(view: FSRView, plugin: FreeSpacedRepetition) {
		this.view = view;
		this.plugin = plugin;
		this.containerEl = view.wrapperEl.createDiv("fsr-review");
		this.containerEl.style.display = "none";

		this.questionEl = this.containerEl.createDiv("fsr-question");

		this.tapEl = this.containerEl.createDiv("fsr-question-tap");

		let answerEl = this.containerEl.createDiv("fsr-answer");
		this.answerContentEl = answerEl.createDiv("fsr-answer-content");

		answerEl.createEl("hr");

		let buttonDiv = answerEl.createDiv("fsr-answer-buttons");

		let againButton = buttonDiv.createDiv("fsr-answer-button");
		let hardButton = buttonDiv.createDiv("fsr-answer-button");
		let goodButton = buttonDiv.createDiv("fsr-answer-button");
		let easyButton = buttonDiv.createDiv("fsr-answer-button");

		this.answerEl = answerEl;

		new ButtonComponent(againButton)
			.setButtonText(t("AGAIN"))
			.onClick(() => this.reviewRating(FSRRating.Again))
			.setClass("fsr-answer-again");
		new ButtonComponent(hardButton)
			.setButtonText(t("HARD"))
			.onClick(() => this.reviewRating(FSRRating.Hard))
			.setClass("fsr-answer-hard");
		new ButtonComponent(goodButton)
			.setButtonText(t("GOOD"))
			.onClick(() => this.reviewRating(FSRRating.Good))
			.setClass("fsr-answer-good");
		new ButtonComponent(easyButton)
			.setButtonText(t("EASY"))
			.onClick(() => this.reviewRating(FSRRating.Easy))
			.setClass("fsr-answer-easy");

		this.finishEl = this.containerEl.createDiv("fsr-finish");
		this.finishEl.createDiv("fsr-finish-text");

		let backToDeckButton = this.finishEl.createDiv("fsr-finish-button");
		let extraReviewButton = this.finishEl.createDiv("fsr-finish-button");

		new ButtonComponent(backToDeckButton)
			.setButtonText(t("BACK_TO_DECK"))
			.onClick(() => {
				this.plugin.currentView?.deckView.refreshView();
				console.log(this.plugin.dataStore.data.trackedNotes);
				switchView(this.plugin, { mode: "deck" });
			})
			.setClass("fsr-finish-back");
		new ButtonComponent(extraReviewButton)
			.setButtonText(t("EXTRA_REVIEW"))
			.onClick(() => {
				new Notice("Not implemented");
			})
			.setClass("fsr-finish-extra");

		this.tapEl.addEventListener("click", function () {
			this.style.display = "none";
			answerEl.style.display = "flex";
		});

		this.initView();
	}

	initView() {
		this.tapEl.style.display = "flex";
		this.answerEl.style.display = "none";
		this.finishEl.style.display = "none";

		this.questionEl.empty();
		this.answerContentEl.empty();
	}

	reviewRating(rating: number) {
		let pointer = this.currentQueue[this.currentReview];

		let card =
			this.plugin.dataStore.data.trackedNotes[pointer.fileName][
				pointer.cardIndex
			];

		let fsrs = this.plugin.dataStore.data.reviewSettings["Default"];

		let scheduling_cards = fsrs.repeat(card.FSRInfo, new Date());

		this.plugin.dataStore.data.trackedNotes[pointer.fileName][
			pointer.cardIndex
		].FSRInfo = scheduling_cards[rating].card;

		this.currentQueue.splice(this.currentReview, 1);

		this.tapEl.style.display = "flex";
		this.answerEl.style.display = "none";

		switchView(this.plugin, {
			mode: "review",
			deck: this.deckInfo.deck,
			deckType: this.deckInfo.deckType,
			buildQueue: false,
			currentQueue: this.currentQueue,
		});
	}

	async set(currentQueue: ReviewCard[], deckInfo: Record<string, string>) {
		this.initView();
		console.log(currentQueue);
		if (currentQueue.length === 0) {
			this.tapEl.style.display = "none";
			this.finishEl.style.display = "flex";
			let text = this.finishEl.querySelector(
				".fsr-finish-text"
			) as HTMLElement;
			text.setText(
				t("REVIEW_FINISH", {
					currentDeck: deckInfo.deck,
				})
			);
		} else {
			this.currentQueue = currentQueue;
			this.deckInfo = deckInfo;

			let randomIndex = Math.floor(Math.random() * currentQueue.length);
			let pointer = currentQueue[randomIndex];

			this.currentReview = randomIndex;

			let card =
				this.plugin.dataStore.data.trackedNotes[pointer.fileName][
					pointer.cardIndex
				];

			let file = this.plugin.app.vault.getAbstractFileByPath(
				pointer.fileName
			);

			let question, answer;
			if (typeof card.question === "string") {
				question = "### " + card.question;
				while (question.startsWith("#")) {
					question = question.slice(1, question.length);
					question = question.trim();
				}
				question = `# ${question}`;
			}

			if (typeof card.answer === "string") {
				answer = card.answer;
			}

			if (file instanceof TFile) {
				await this.plugin.app.vault.cachedRead(file).then((c) => {
					if (typeof card.question === "object") {
						question = c.substring(
							card.question.start,
							card.question.end + 1
						);
					}
					if (typeof card.answer === "object") {
						answer = c.substring(
							card.answer.start,
							card.answer.end + 1
						);
					}
				});
			}

			MarkdownRenderer.render(
				this.plugin.app,
				question as string,
				this.questionEl,
				pointer.fileName,
				this.view
			);

			MarkdownRenderer.render(
				this.plugin.app,
				answer as string,
				this.answerContentEl,
				pointer.fileName,
				this.view
			);
		}
	}

	show() {
		this.containerEl.style.display = "flex";
	}

	hide() {
		this.containerEl.style.display = "none";
	}
}
