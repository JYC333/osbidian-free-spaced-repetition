export interface FSRSettings {
	dataLocation: string;
	dataLocationPath: string;
	folderDeckRootName: string;
	trackMode: string;
}

interface CurrentPrevious {
	current: number;
	previous: number;
}

export interface EditStep {
	start: number;
	end: number;
	total: number;
}

export interface CharacterTracker {
	cursor: CurrentPrevious;
	total: CurrentPrevious;
	start: number;
	startTotal: number;
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
	question: Array<TextOffset | string> | string;
	answer: Array<TextOffset | string> | string;
	type: string; // "basic" | "cloze"
	decks: string[]; // Customized decks
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
	// key: file absolute path, value: card info
	trackedNotes: Record<string, Card[]>;
	// key: file parent folder path, value: file abs path
	folderDeck: Record<string, string[]>;
	// key: customized deck full path, value: file abs path with card index, if -1, all cards included
	customizedDeck: Record<string, ReviewCard[]>;
	// key: setting name, value: FSR algorithm params
	reviewSettings: Record<string, any>;
	// key: template file absolute path, value: FSR Template
	templates: Record<string, FSRTemplate>;
}

export interface TableData {
	note: string;
	question: string;
	state: string;
	due: string;
	template: string;
	card: string;
	decks: string[];
}

export interface Filter {
	[cardState: string]: string[];
	decks: string[];
}

export interface FSRSubView {
	set(
		currentQueue: ReviewCard[],
		deckInfo: Record<string, string>,
		pointer: any
	): void;

	show(): void;
	hide(): void;
}

export type ReviewMode = "deck" | "review" | "browse";
