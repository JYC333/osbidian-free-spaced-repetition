import { moment } from "obsidian";
import { FSRState } from "src/constants";
import FreeSpacedRepetition from "src/main";
import { FSRSubView, ReviewCard, TableData } from "src/types";
import { getFolderPath } from "src/utils";

import { t } from "src/lang/utils";
import { FSRView } from "src/views/view";

import { GridApi, GridOptions, createGrid } from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

export class BrowseView implements FSRSubView {
	plugin: FreeSpacedRepetition;

	containerEl: HTMLElement;
	tableEl: HTMLElement;
	tableOption: GridOptions;
	table: GridApi;

	constructor(view: FSRView, plugin: FreeSpacedRepetition) {
		this.plugin = plugin;
		this.containerEl = view.wrapperEl.createDiv("fsr-browse");
		this.containerEl.style.display = "none";

		this.initView();
	}

	initView() {
		let grid = this.containerEl.createDiv("fsr-browse-table");
		grid.innerHTML = `<table id="fsr-table" class="ag-theme-quartz" style="width: 100%"></table>`;

		this.tableOption = {
			columnDefs: [
				{
					headerName: t("TABLE_HEADER_QUESTION"),
					field: "question",
					maxWidth: 1000,
				},
				{ headerName: t("TABLE_HEADER_STATE"), field: "state" },
				{ headerName: t("TABLE_HEADER_DUE"), field: "due" },
				{ headerName: t("TABLE_HEADER_TEMPLATE"), field: "template" },
				{ headerName: t("TABLE_HEADER_CARD"), field: "card" },
				{ headerName: t("TABLE_HEADER_DECK"), field: "deck" },
			],
			rowData: [],
			domLayout: "autoHeight",
		};

		this.tableEl = document.querySelector("#fsr-table") as HTMLElement;
	}

	getTableData() {
		let tableData: TableData[] = [];
		for (let note in this.plugin.dataStore.data.trackedNotes) {
			let folderDeck = getFolderPath(note, this.plugin);
			this.plugin.dataStore.data.trackedNotes[note].forEach((card) => {
				tableData.push({
					question: card.question,
					state: Object.keys(FSRState).find(
						(key) =>
							FSRState[key as keyof typeof FSRState] ===
							card.FSRInfo.state
					) as string,
					due: moment(card.FSRInfo.due).format("YYYY-MM-DD HH:mm:ss"),
					template: "default",
					card: "default",
					deck: [folderDeck, ...card.deck],
				});
			});
		}
		return tableData;
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
		this.table.setGridOption("rowData", this.getTableData());
		this.containerEl.style.display = "flex";
	}

	hide() {
		this.containerEl.style.display = "none";
	}
}
