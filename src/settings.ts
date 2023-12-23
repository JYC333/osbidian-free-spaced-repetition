import { App, PluginSettingTab, Setting } from "obsidian";
import { DataLocation, TrackMode } from "src/constants";
import FreeSpacedRepetition from "src/main";

import { t } from "src/lang/utils";

export class FSRSettingTab extends PluginSettingTab {
	plugin: FreeSpacedRepetition;

	constructor(app: App, plugin: FreeSpacedRepetition) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h1", { text: t("SETTING_HEADER") });

		new Setting(containerEl)
			.setName(t("DATA_LOCATION"))
			.setDesc(t("DATA_LOCATION_DESC"))
			.addDropdown((dropdown) => {
				dropdown.addOption(
					DataLocation.PluginFolder,
					DataLocation.PluginFolder
				);
				dropdown.addOption(
					DataLocation.VaultFolder,
					DataLocation.VaultFolder
				);
				dropdown.setValue(this.plugin.settings.dataLocation);

				dropdown.onChange((val) => {
					this.plugin.settings.dataLocation = val;
					this.plugin.saveData(this.plugin.settings);
					this.display();
				});
			});

		if (this.plugin.settings.dataLocation === "In Vault Folder") {
			new Setting(containerEl)
				.setName(t("DATA_LOCATION_PATH"))
				.setDesc(t("DATA_LOCATION_PATH_DESC"))
				.addDropdown((dropdown) => {
					Object.values(this.plugin.allFolders).forEach((val) => {
						dropdown.addOption(val, val);
					});
					dropdown.setValue(this.plugin.settings.dataLocationPath);

					dropdown.onChange((val) => {
						this.plugin.settings.dataLocationPath = val;
						this.plugin.saveData(this.plugin.settings);
					});
				});
		}

		new Setting(containerEl)
			.setName(t("ROOT_DECK"))
			.setDesc(t("ROOT_DECK_DESC"))
			.addText((text) => {
				text.setPlaceholder("Root")
					.setValue(
						this.plugin.settings.folderDeckRootName === "Root"
							? ""
							: this.plugin.settings.folderDeckRootName
					)
					.onChange(async (value) => {
						this.plugin.settings.folderDeckRootName =
							value === "" ? "Root" : value;
						await this.plugin.saveSettings();
						this.plugin.currentView?.deckView.refreshView();
					});
			});

		new Setting(containerEl)
			.setName(t("TRACK_MODE"))
			.setDesc(t("TRACK_MODE_DESC"))
			.addDropdown((dropdown) => {
				dropdown.addOption(TrackMode.Character, TrackMode.Character);
				dropdown.addOption(TrackMode.Section, TrackMode.Section);
				dropdown.setValue(this.plugin.settings.trackMode);

				dropdown.onChange((val) => {
					this.plugin.settings.trackMode = val;
					this.plugin.saveData(this.plugin.settings);
					this.display();
				});
			});
	}
}
