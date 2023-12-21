import { TFile, moment } from "obsidian";
import { FSRState, DEFAULT_FILTER } from "src/constants";
import FreeSpacedRepetition from "src/main";
import { FSRSubView, ReviewCard, TableData, Filter } from "src/types";

import { t } from "src/lang/utils";
import { getCardText, getFolderPath } from "src/utils/utils";
import { FSRView } from "src/views/view";

import { GridApi, GridOptions, createGrid } from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

export class BrowseView implements FSRSubView {
	plugin: FreeSpacedRepetition;

	containerEl: HTMLElement;
	tableEl: HTMLElement;
	tableData: TableData[] = [];
	tableOption: GridOptions;
	table: GridApi;

	constructor(view: FSRView, plugin: FreeSpacedRepetition) {
		this.plugin = plugin;
		this.containerEl = view.wrapperEl.createDiv("fsr-browse");
		this.containerEl.style.display = "none";

		this.resetTableData();
		this.initView();
	}

	initView() {
		let grid = this.containerEl.createDiv("fsr-browse-table");
		grid.innerHTML = `<table id="fsr-table" class="ag-theme-quartz" style="width: 100%"></table>`;

		this.tableOption = {
			columnDefs: [
				{
					headerName: t("TABLE_HEADER_NOTE"),
					field: "note",
					maxWidth: 1500,
				},
				{
					headerName: t("TABLE_HEADER_QUESTION"),
					field: "question",
					maxWidth: 1000,
				},
				{ headerName: t("TABLE_HEADER_STATE"), field: "state" },
				{ headerName: t("TABLE_HEADER_DUE"), field: "due" },
				// { headerName: t("TABLE_HEADER_TEMPLATE"), field: "template" },
				// { headerName: t("TABLE_HEADER_CARD"), field: "card" },
				{ headerName: t("TABLE_HEADER_DECK"), field: "decks" },
			],
			rowData: [],
			domLayout: "autoHeight",
		};

		this.tableEl = document.querySelector("#fsr-table") as HTMLElement;
	}

	async resetTableData() {
		this.tableData = [];
		for (let note in this.plugin.dataStore.data.trackedNotes) {
			let folderDeck = getFolderPath(note, this.plugin);
			let fileContent: string = "";
			let file = this.plugin.app.vault.getAbstractFileByPath(note);
			if (file instanceof TFile) {
				await this.plugin.app.vault
					.cachedRead(file)
					.then((c) => (fileContent = c));
			}
			this.plugin.dataStore.data.trackedNotes[note].forEach((card) => {
				let question = getCardText(card.question, fileContent);

				while (question.startsWith("#")) {
					question = question.slice(1, question.length);
					question = question.trim();
				}
				this.tableData.push({
					note: note,
					question: question.trim(),
					state: Object.keys(FSRState).find(
						(key) =>
							FSRState[key as keyof typeof FSRState] ===
							card.FSRInfo.state
					) as string,
					due: moment(card.FSRInfo.due).format("YYYY-MM-DD HH:mm:ss"),
					template: "default",
					card: "default",
					decks: [folderDeck, ...card.decks],
				});
			});
		}
	}

	filterTableData(filters: Filter = DEFAULT_FILTER) {
		let filteredTableData: TableData[] = [...this.tableData];
		for (let filter in filters) {
			console.log(filter, filters[filter]);
			switch (filter) {
				case "cardState":
					if (filters[filter].length !== 0) {
						filteredTableData = filteredTableData.filter((d) =>
							filters[filter].includes(d.state)
						);
					}
					break;
				case "decks":
					if (filters[filter].length !== 0) {
						filteredTableData = filteredTableData.filter((d) =>
							d.decks.some((e) =>
								filters[filter].some((v) => e.startsWith(v))
							)
						);
					}
					break;
			}
		}
		console.log(filteredTableData);
		this.updateTable(filteredTableData);
	}

	updateTable(data: TableData[]) {
		this.table.setGridOption("rowData", data);
	}

	set(currentQueue: ReviewCard[], deckInfo: Record<string, string>) {}

	show() {
		if (!document.querySelector("#fsr-table")) {
			this.initView();
		}
		if (!this.tableEl) {
			this.tableEl = document.querySelector("#fsr-table") as HTMLElement;
		}
		if (!this.table) {
			this.table = createGrid(this.tableEl, this.tableOption);
		}
		this.resetTableData();
		setTimeout(() => this.updateTable(this.tableData), 1);

		// this.updateTable(this.tableData);
		this.containerEl.style.display = "flex";
	}

	hide() {
		this.containerEl.style.display = "none";
	}
}
