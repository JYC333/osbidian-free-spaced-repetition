import { CharacterTracker, FSRSettings, Filter } from "src/types";

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

export const INIT_CHANGETRACKER: CharacterTracker = {
	cursor: { current: 0, previous: -1 },
	total: { current: 0, previous: 0 },
	start: 0,
	startTotal: 0,
};

export const DEFAULT_SETTINGS: FSRSettings = {
	dataLocation: "In Plugin Folder",
	dataLocationPath: "./",
	folderDeckRootName: "Root",
	trackMode: "Section",
};

export const PLUGIN_DATA_PATH: string =
	"./.obsidian/plugins/obsidian-free-spaced-repetition/FSRData.json";

export const DEFAULT_FILTER: Filter = {
	cardState: [],
	decks: [],
};

export const IMAGE_FORMATS = [
	"jpg",
	"jpeg",
	"gif",
	"png",
	"svg",
	"webp",
	"apng",
	"avif",
	"jfif",
	"pjpeg",
	"pjp",
	"bmp",
];
export const AUDIO_FORMATS = ["mp3", "webm", "m4a", "wav", "ogg"];
export const VIDEO_FORMATS = ["mp4", "mkv", "avi", "mov"];

export enum DataLocation {
	PluginFolder = "In Plugin Folder",
	VaultFolder = "In Vault Folder",
}

export enum DeckType {
	FolderDeck = "FolderDeck",
	CustomizedDeck = "CustomizedDeck",
}

export enum TrackMode {
	Character = "Character",
	Section = "Section",
}

export enum FilterType {
	CardState = "CardState",
	Decks = "Decks",
}
