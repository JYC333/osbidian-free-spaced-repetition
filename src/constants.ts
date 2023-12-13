import { FSRSettings } from "src/types";

const fsrsJs = require("fsrs.js");

export const FSRRating = {
	Again: fsrsJs.Rating.Again,
	Hard: fsrsJs.Rating.Hard,
	Good: fsrsJs.Rating.Good,
	Easy: fsrsJs.Rating.Easy,
};

export const FSRState = {
	New: fsrsJs.State.New,
	Learning: fsrsJs.State.Learning,
	Review: fsrsJs.State.Review,
	Relearning: fsrsJs.State.Relearning,
};

export const DEFAULT_SETTINGS: FSRSettings = {
	dataLocation: "In Plugin Folder",
	dataLocationPath: "./",
	folderDeckRootName: "Root",
};

export const PLUGIN_DATA_PATH: string =
	"./.obsidian/plugins/obsidian-free-spaced-repetition/tracked_files.json";

export enum DataLocation {
	PluginFolder = "In Plugin Folder",
	VaultFolder = "In Vault Folder",
}

export enum DeckType {
	FolderDeck = "FolderDeck",
	CustomizedDeck = "CustomizedDeck",
}
