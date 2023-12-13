import { DataLocation, PLUGIN_DATA_PATH } from "src/constants";
import FreeSpacedRepetition from "src/main";
import { FSRData } from "src/types";

const fsrsJs = require("fsrs.js");

const DEFAULT_SR_DATA: FSRData = {
	trackedNotes: {},
	reviewSettings: { Default: new fsrsJs.FSRS() },
	templates: {},
};

export class DataStore {
	data: FSRData;
	plugin: FreeSpacedRepetition;
	dataPath: string;

	/**
	 * constructor.
	 *
	 * @param {FreeSpacedRepetition} plugin
	 */
	constructor(plugin: FreeSpacedRepetition) {
		this.plugin = plugin;
		if (this.plugin.settings.dataLocation === DataLocation.PluginFolder) {
			this.dataPath = PLUGIN_DATA_PATH;
		} else {
			this.dataPath = this.plugin.settings.dataLocationPath;
		}
		this.load();
	}

	/**
	 * load.
	 */
	async load() {
		let adapter = this.plugin.app.vault.adapter;

		if (await adapter.exists(this.dataPath)) {
			let data = await adapter.read(this.dataPath);
			if (data == null) {
				console.log("Unable to read spaced repetition data!");
				this.data = Object.assign({}, DEFAULT_SR_DATA);
			} else {
				console.log("Reading tracked files...");
				this.data = Object.assign(
					Object.assign({}, DEFAULT_SR_DATA),
					JSON.parse(data)
				);
				for (let note in this.data.trackedNotes) {
					this.data.trackedNotes[note].forEach((card) => {
						card.FSRInfo.due = new Date(card.FSRInfo.due);
						card.FSRInfo.last_review = new Date(
							card.FSRInfo.last_review
						);
					});
				}
				for (let fsrs in this.data.reviewSettings) {
					this.data.reviewSettings[fsrs] = new fsrsJs.FSRS(
						this.data.reviewSettings[fsrs]
					);
				}
			}
		} else {
			console.log("Tracked files not found! Creating new file...");
			this.data = Object.assign({}, DEFAULT_SR_DATA);
			await adapter.write(this.dataPath, JSON.stringify(this.data));
		}
	}

	/**
	 * save.
	 */
	async save() {
		await this.plugin.app.vault.adapter.write(
			this.dataPath,
			JSON.stringify(this.data)
		);
	}
}
