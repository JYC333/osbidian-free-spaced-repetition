export interface FSRSettings {
	dataLocation: string;
	dataLocationPath: string;
	folderDeckRootName: string;
}

export interface TextOffset {
	start: number;
	end: number;
}

export interface Heading {
	heading: string;
	level: number;
	position: TextOffset;
}

export interface Card {
	question: TextOffset | string;
	answer: TextOffset | string;
	type: string; // "basic" | "cloze"
	deck: string[]; // Folder path or customized deck
	FSRInfo: Record<string, string | number | Date>; //fsrsJs Card type
}

export interface ReviewCard {
	fileName: string;
	cardIndex: number;
}

export interface FSRTemplate {
	name: string;
	cardType: FSRTemplateCard[];
}

export interface FSRTemplateCard {
	name: string;
	question: Heading[];
	answer: Heading[];
}

export interface FSRData {
	trackedNotes: Record<string, Card[]>; // key: file absolute path
	reviewSettings: Record<string, any>; // key: setting name
	templates: Record<string, FSRTemplate>; // key: template file absolute path
}

export interface TableData {
	question: string | TextOffset;
	state: string;
	due: string;
	template: string;
	card: string;
	deck: string[];
}

export interface FSRSubView {
	set(currentQueue: ReviewCard[], deckInfo: Record<string, string>): void;

	show(): void;
	hide(): void;
}

export type ReviewMode = "deck" | "review" | "browse";
