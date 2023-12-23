import {
	CachedMetadata,
	Editor,
	Notice,
	Plugin,
	TFile,
	TFolder,
} from "obsidian";

import Commands from "src/commands";
import { DEFAULT_SETTINGS, INIT_CHANGETRACKER, TrackMode } from "src/constants";
import { NoteDeletionWarningModal } from "src/modals/modals";
import { FSRSettingTab } from "src/settings";
import { DataStore } from "src/store";
import {
	Card,
	CharacterTracker,
	EditStep,
	FSRSettings,
	TextOffset,
} from "src/types";
import { BrowseSidebarView } from "src/views/browseSidebarView";

import { t } from "src/lang/utils";
import { switchView } from "src/utils/utils";
import { FSRView } from "src/views/view";
import { cloneDeep } from "lodash";

export default class FreeSpacedRepetition extends Plugin {
	settings: FSRSettings;
	allFolders: string[];

	commands: Commands;
	dataStore: DataStore;

	changeRecord: EditStep[] = [];
	CTracker: CharacterTracker = cloneDeep(INIT_CHANGETRACKER);

	editor: Editor;
	lastEditNote: string;

	currentView: FSRView;
	sidebarView: BrowseSidebarView;

	async onload() {
		await this.loadSettings();
		this.loadFolders();

		this.dataStore = new DataStore(this);
		await this.dataStore.load();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new FSRSettingTab(this.app, this));

		this.commands = new Commands(this);
		this.commands.addCommand();

		this.registerView("fsr-review-view", (leaf) => {
			this.currentView = new FSRView(leaf, this);
			// this.currentView.navigation = true;
			return this.currentView;
		});

		this.registerView("fsr-browse-sidebar", (leaf) => {
			this.sidebarView = new BrowseSidebarView(leaf, this);
			return this.sidebarView;
		});

		const mainLeaves =
			this.app.workspace.getLeavesOfType("fsr-review-view");

		if (mainLeaves.length > 0) {
			mainLeaves[0].detach();
		}

		this.CTracker.total.previous =
			this.app.workspace.activeEditor?.editor?.getValue()
				.length as number;
		this.CTracker.startTotal = this.CTracker.total.previous;

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				if (leaf && leaf.getViewState().type === "markdown") {
					this.CTracker = cloneDeep(INIT_CHANGETRACKER);
					this.CTracker.total.previous =
						this.app.workspace.activeEditor?.editor?.getValue()
							.length as number;
					this.CTracker.startTotal = this.CTracker.total.previous;
				} else if (
					this.settings.trackMode === TrackMode.Character &&
					this.CTracker.cursor.previous !== -1
				) {
					this.updateCard(this.formatChangeRecord());
					this.changeRecord = [];
					this.CTracker.cursor.previous = -1;
				} else if (
					this.settings.trackMode === TrackMode.Section &&
					this.CTracker.cursor.previous !== -1
				) {
					setTimeout(() => {
						this.updateCard(
							this.formatChangeRecord(),
							this.formatSectionTracker(
								this.app.metadataCache.getCache(
									this.lastEditNote
								) as CachedMetadata
							)
						);

						this.changeRecord = [];
						this.CTracker.cursor.previous = -1;
					}, 100);
				}
			})
		);

		this.registerEvent(
			this.app.workspace.on("editor-change", (editor, file) => {
				this.lastEditNote = file.file?.path as string;
				this.characterTracking(editor);
			})
		);

		// ---------- Functions for rename files within one folder ----------
		// Update all folder list when create new folder
		this.registerEvent(
			this.app.vault.on("create", (folderOrFile) => {
				if (folderOrFile instanceof TFolder) {
					if (!this.allFolders.includes(folderOrFile.path)) {
						this.allFolders.push(folderOrFile.path);
					}
				}
			})
		);

		// Update all folder list when rename exist folder
		// Update FSR data when rename note with cards
		this.registerEvent(
			this.app.vault.on("rename", (folderOrFile, oldPath) => {
				if (folderOrFile instanceof TFolder) {
					this.allFolders.remove(oldPath);
					if (!this.allFolders.includes(folderOrFile.path)) {
						this.allFolders.push(folderOrFile.path);
					}
				}
				if (
					folderOrFile instanceof TFile &&
					this.dataStore.data.trackedNotes.hasOwnProperty(oldPath)
				) {
					this.dataStore.data.trackedNotes[folderOrFile.path] =
						this.dataStore.data.trackedNotes[oldPath];
					delete this.dataStore.data.trackedNotes[oldPath];
					console.log(this.dataStore.data);
					this.currentView?.deckView.refreshView();
				}
			})
		);

		// Update all folder list when delete folder
		this.registerEvent(
			this.app.vault.on("delete", async (folderOrFile) => {
				console.log(folderOrFile);
				new Notice("test");
				if (folderOrFile instanceof TFolder) {
					if (this.allFolders.includes(folderOrFile.path)) {
						this.allFolders.remove(folderOrFile.path);
					}
				}
				if (folderOrFile instanceof TFile) {
					console.log(folderOrFile);
					console.log(
						this.app.metadataCache.getFileCache(folderOrFile)
					);
					this.app.vault.process(folderOrFile, (data) => {
						console.log(data);
						return "1";
					});
					if (
						this.dataStore.data.trackedNotes.hasOwnProperty(
							folderOrFile.path
						)
					) {
						new NoteDeletionWarningModal(
							this.app,
							this,
							folderOrFile.path,
							async (result) => {
								console.log(result);
							}
						).open();
					}
				}
			})
		);

		this.addRibbonIcon("pencil", t("CARD_EDITOR_RIBBON"), () => {
			let file = this.app.workspace.getActiveFile();
			if (file) {
				this.commands.createCard(file);
			}
		});

		this.addRibbonIcon("lightbulb", t("REVIEW_CARD_RIBBON"), () =>
			switchView(this, { mode: "deck" })
		);

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => this.dataStore.save(), 5 * 60 * 1000)
		);
	}

	onunload() {
		console.log(
			"Unloading Obsidian Free Spaced Repetition. Saving data..."
		);
		this.dataStore.save();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	loadFolders() {
		this.allFolders = [];
		// @ts-ignore
		for (const fileOrFolder in this.app.vault.adapter.files) {
			// @ts-ignore
			if (this.app.vault.adapter.files[fileOrFolder] instanceof TFolder) {
				this.allFolders.push(
					// @ts-ignore
					this.app.vault.adapter.files[fileOrFolder].realpath
				);
			}
		}
	}

	characterTracking(editor: Editor) {
		const { cursor, total } = this.CTracker;

		if (cursor.previous !== -1) {
			cursor.previous = cursor.current;
			total.previous = total.current;
		}

		cursor.current = editor.posToOffset(editor.getCursor());
		total.current = editor.getValue().length;
		if (
			total.previous &&
			total.previous !== total.current &&
			cursor.previous === -1
		) {
			this.changeRecord.push({
				start: cursor.current + total.previous - total.current,
				end: cursor.current,
				total: total.current,
			});
			// console.log(cloneDeep(this.changeRecord));

			this.CTracker.startTotal = total.current;
			this.CTracker.start = cursor.current;
			cursor.previous = cursor.current;
			total.previous = total.current;
		} else if (cursor.previous !== -1) {
			if (
				cursor.current - cursor.previous ===
				total.current - total.previous
			) {
				// Continously edit
				if (
					this.changeRecord[this.changeRecord.length - 1].end ===
					cursor.previous
				) {
					this.changeRecord[this.changeRecord.length - 1].end =
						cursor.current;
					this.changeRecord[this.changeRecord.length - 1].total =
						total.current;
				}
			} else {
				// Start edit from different position
				this.changeRecord.push({
					start: cursor.current + total.previous - total.current,
					end: cursor.current,
					total: total.current,
				});
			}
		}
		// console.log(
		// 	cloneDeep(this.changeTracker),
		// 	cloneDeep(this.changeRecord)
		// );
	}

	formatChangeRecord() {
		let aggregateRecord: EditStep[] = [];
		let tmp: EditStep[] = [];

		for (let i = 0; i < this.changeRecord.length; i++) {
			if (i < this.changeRecord.length) {
				tmp = [this.changeRecord[i]];
				while (
					i < this.changeRecord.length - 1 &&
					tmp[tmp.length - 1].start ===
						this.changeRecord[i + 1].start &&
					tmp[tmp.length - 1].end === this.changeRecord[i + 1].end
				) {
					tmp.push(this.changeRecord[i + 1]);
					i++;
				}
			}

			if (tmp.length > 1) {
				let first = tmp.shift() as EditStep;
				if (first.start > first.end) {
					first.start += tmp.length;
					first.total -= tmp.length;
				} else {
					first.end += tmp.length;
					first.total += tmp.length;
				}
				aggregateRecord.push(first);
			} else {
				aggregateRecord = [...aggregateRecord, ...tmp];
			}
		}

		return aggregateRecord;
	}

	updateCard(changeRecord: EditStep[], currentSections: TextOffset[] = []) {
		if (
			this.dataStore.data.trackedNotes.hasOwnProperty(this.lastEditNote)
		) {
			const note = this.dataStore.data.trackedNotes[this.lastEditNote];
			note.forEach((c) => {
				this.updateContent(c.question, changeRecord, currentSections);
				this.updateContent(c.answer, changeRecord, currentSections);
			});
			new Notice(t("UPDATE_CARD_MESSAGE", { note: this.lastEditNote }));
		} else {
			console.log("Note has no cards.");
		}
	}

	updateContent(
		text: Array<TextOffset | string> | string,
		changeRecord: EditStep[],
		currentSections: TextOffset[] = []
	) {
		if (typeof text === "object") {
			text.forEach((s) => {
				if (typeof s === "object") {
					changeRecord.forEach((r) =>
						this.handleCharacterChange(r, s)
					);
					currentSections.forEach((r) => {
						if (r.start <= s.start && r.end >= s.end) {
							s.start = r.start;
							s.end = r.end;
						}
					});
				}
			});
		}
	}

	handleCharacterChange(r: TextOffset, s: TextOffset) {
		if (r.start < r.end) {
			if (r.start <= s.start) {
				s.start += r.end - r.start;
				s.end += r.end - r.start;
			} else if (r.start < s.end) {
				s.end += r.end - r.start;
			}
		} else if (r.start > r.end) {
			if (r.start < s.start) {
				s.start += r.end - r.start;
				s.end += r.end - r.start;
			} else if (r.start <= s.end) {
				s.end += r.end - r.start;
			}
		}
	}

	formatSectionTracker(cachedMetadata: CachedMetadata) {
		const sections = cachedMetadata?.sections;

		let formatSections: TextOffset[] = [];
		sections?.forEach((s) =>
			formatSections.push({
				start: s.position.start.offset,
				end: s.position.end.offset,
			})
		);

		return formatSections;
	}
}
