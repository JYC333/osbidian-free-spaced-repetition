import { Notice, Plugin, TFile, TFolder, WorkspaceLeaf } from "obsidian";

import Commands from "src/commands";
import { DEFAULT_SETTINGS } from "src/constants";
import { NoteDeletionWarningModal } from "src/modals";
import { FSRSettingTab } from "src/settings";
import { DataStore } from "src/store";
import { FSRSettings } from "src/types";
import { switchView } from "src/utils";
import { BrowseSidebarView } from "src/views/browseSidebarView";

import { t } from "src/lang/utils";
import { FSRView } from "src/views/view";

export default class FreeSpacedRepetition extends Plugin {
	settings: FSRSettings;
	allFolders: string[];

	commands: Commands;
	dataStore: DataStore;

	currentView: FSRView;
	sidebarView: BrowseSidebarView;

	async onload() {
		await this.loadSettings();
		this.loadFolders();

		this.dataStore = new DataStore(this);

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
							this.dataStore.data.trackedNotes[
								folderOrFile.path
							].length,
							async (result) => {
								console.log(result);
							}
						).open();
					}
				}
			})
		);

		this.addRibbonIcon("pencil", t("CREART_CARD_RIBBON"), () => {
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
			"Unloading Obsidian Free Spaced Repetition. Saving tracked files..."
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
}
