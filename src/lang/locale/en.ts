// English

export default {
	// view/view.ts
	// Navigation Bar
	DECKS: "Decks",
	BROWSE: "Browse",
	STATS: "Stats",
	EDIT: "Edit",

	// Deck View
	// view/deckView.ts
	FOLDER_DECK: "Folder Deck",
	FOLDER_DECK_EMPTY: "No card existed, create card from note or by command.",
	CUSTOMIZRD_DECK: "Customized Deck",
	CUSTOMIZRD_DECK_EMPTY: "No customized deck existed.",
	CUSTOMIZRD_DECK_CREATE: "Create Deck",
	DECK: "Deck",
	NEW: "New",
	LEARN: "Learn",
	DUE: "Due",

	// Review View
	// view/reviewView.ts
	AGAIN: "Again",
	HARD: "Hard",
	GOOD: "Good",
	EASY: "Easy",
	BACK_TO_DECK: "Back to Deck",
	EXTRA_REVIEW: "Extra Review",
	REVIEW_FINISH:
		"Congratulation! All cards in ${currentDeck} is reviewed for now!",

	// Browse View
	// view/browseView.ts
	TABLE_HEADER_NOTE: "Note",
	TABLE_HEADER_QUESTION: "Question",
	TABLE_HEADER_STATE: "State",
	TABLE_HEADER_DUE: "Due",
	TABLE_HEADER_TEMPLATE: "Template",
	TABLE_HEADER_CARD: "Card",
	TABLE_HEADER_DECK: "Deck",

	// Browse sidebar
	// view/browseSidebarView.ts
	SIDEBAR_CARD_STATE: "Card State",
	SIDEBAR_CARD_STATE_NEW: "New",
	SIDEBAR_CARD_STATE_LEARNING: "Learning",
	SIDEBAR_CARD_STATE_REVIEW: "Review",
	SIDEBAR_CARD_STATE_RELEARNING: "Relearning",
	SIDEBAR_CARD_DECKS: "Decks",

	// main.ts
	CREATE_CARD_RIBBON: "Create Card",
	REVIEW_CARD_RIBBON: "Review Card",

	// settings.ts
	SETTING_HEADER: "Free Spaced Repetition",
	DATA_LOCATION: "Data Location",
	DATA_LOCATION_DESC:
		"Where to store the data file for free spaced repetition items.",
	DATA_LOCATION_PATH: "Data Location Path in Vault",
	DATA_LOCATION_PATH_DESC:
		"Where to store the data file for free spaced repetition items in Vault.",
	ROOT_DECK: "Root Deck",
	ROOT_DECK_DESC: "Folder deck name for notes at vault root.",

	// Modals
	// modals/modals.ts
	CARD_DELETE_WARNING:
		"The card will be deleted and cannot be recovered, the review info will lose.",

	// modals/cardEditorModal.ts
	CARD_EDITOR_TITLE: "Card Editor",
	CARD_EDITOR_EXISTING_CARD: "Existing Cards",
	CARD_EDITOR_DELETE: "Delete card ${ind} for note: ${note}",
	CARD_EDITOR_NEW_CARD: "New Card",
	CARD_EDITOR_EDIT_CARD: "Edit Card",
	CARD_EDITOR_INPUT: "Input",
	CARD_EDITOR_SELECT: "Select",
	CARD_EDITOR_QUESTION: "Question",
	CARD_EDITOR_ANSWER: "Answer",
	CARD_EDITOR_CREATE: "Create",
	CARD_EDITOR_CREATED: "Create card for note: ${note}",
	CARD_EDITOR_DUPLICATED: "Card duplicated for note: ${note}",
	CARD_EDITOR_BACK: "Back",
	CARD_EDITOR_UPDATE: "Update",
	CARD_EDITOR_UPDATED: "Update card ${ind} for note: ${note}",
	CARD_EDITOR_EMPTY_WARNING: "Empty question/answer is not allowed",
};
