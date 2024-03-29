import { defineStore } from "pinia";

export const useMainStore = defineStore({
    id: "main",
    state: () => ({
        board: [[], [], [], [], [], [], []] as [number[], number[], number[], number[], number[], number[], number[]],
        cards: [] as number[],
        activeCardIndex: -1 as number,
        slots: [-1, -1, -1, -1] as [number, number, number, number],
        confirmDialog: {
            show: false as boolean,
            message: "" as string,
            type: "restart" as "newGame" | "restart",
        } as {
            show: boolean;
            message: string;
            type: "newGame" | "restart";
        },
        isAutoFinishAvailable: false as boolean,
        isGameFinished: false as boolean,
    }),
    getters: {},
    actions: {
        startGame() {
            this.isGameFinished = false;
            const allCards = Array.from({ length: 52 }, (_, i) => i + 1);
            for (let i = allCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
            }
            this.cards = allCards.splice(0, 24);
            const remainingCards = allCards;
            for (let i = 0; i < 7; i++) {
                for (let j = 0; j <= i; j++) {
                    if (i !== j) {
                        this.board[i][j] = -remainingCards.splice(0, 1)[0];
                    } else {
                        this.board[i][j] = remainingCards.splice(0, 1)[0];
                    }
                }
            }
        },
        nextCard() {
            if (this.activeCardIndex === this.cards.length - 1) {
                this.activeCardIndex = -1;
            } else {
                this.activeCardIndex += 1;
            }
        },
        previousCard() {
            if (this.activeCardIndex === 0) {
                this.activeCardIndex += 1;
            }
            this.activeCardIndex -= 1;
            if (this.cards.length === 0) {
                this.activeCardIndex = -1;
            }
        },
        getCardNumber(card: number): number | string {
            const cardNum = card % 13;
            if (cardNum === 1) {
                return "A";
            }
            if (cardNum === 11) {
                return "J";
            }
            if (cardNum === 12) {
                return "Q";
            }
            if (cardNum === 0) {
                return "K";
            }
            return cardNum;
        },
        getCardSuit(card: number): number {
            return Math.floor((card - 1) / 13);
        },
        deleteCardFromBoard(card: number) {
            const columnIndex = this.board.findIndex((slot) => slot.includes(card));
            const cardIndex = this.board[columnIndex].indexOf(card);
            this.board[columnIndex].splice(cardIndex, this.board[columnIndex].length - cardIndex + 1);
            this.board[columnIndex][this.board[columnIndex].length - 1] = -this.board[columnIndex][this.board[columnIndex].length - 1];
        },
        sendCardToSlot(card: number) {
            const suit = this.getCardSuit(card);
            const number = this.getCardNumber(card);
            if ((this.slots[suit] === -1 && number === "A") || this.isOneLess(number, this.getCardNumber(this.slots[suit]))) {
                this.slots[suit] = card;
                this.cards.splice(this.cards.indexOf(card), 1);
                this.previousCard();
            }
            const emptySlot = this.board.findIndex((slot) => slot.length === 0);
            if (number === "K" && emptySlot !== -1) {
                this.board[emptySlot].push(card);
                this.cards.splice(this.cards.indexOf(card), 1);
                this.previousCard();
            }
        },
        sendCardToSlotFromBoard(card: number) {
            const suit = this.getCardSuit(card);
            const number = this.getCardNumber(card);
            const cardToSendSlot = this.board.findIndex((slot) => slot.includes(card));
            const emptySlot = this.board.findIndex((slot) => slot.length === 0);
            if (number === "K" && emptySlot !== -1 && !this.board.every((column) => column.every((card) => card > 0))) {
                this.moveCardsToAnotherSlot(card, emptySlot);
            }
            if (this.board[cardToSendSlot][this.board[cardToSendSlot].length - 1] !== card) {
                return;
            }
            if ((this.slots[suit] === -1 && number === "A") || this.isOneLess(number, this.getCardNumber(this.slots[suit]))) {
                this.slots[suit] = card;
                const pickedCardSlot = this.board.findIndex((slot) => slot.includes(card));
                this.board[pickedCardSlot].splice(-1, 1);
                if (this.board[pickedCardSlot][this.board[pickedCardSlot].length - 1] < 0) {
                    this.board[pickedCardSlot][this.board[pickedCardSlot].length - 1] = -this.board[pickedCardSlot][this.board[pickedCardSlot].length - 1];
                }
            }
        },
        isOneLess(bigCard: number | string, smallCard: number | string) {
            if (typeof bigCard === "string" || typeof smallCard === "string") {
                return (bigCard === "K" && smallCard === "Q") || (bigCard === "Q" && smallCard === "J") || (bigCard === "J" && smallCard === 10) || (bigCard === 2 && smallCard === "A");
            }
            return bigCard - 1 === smallCard;
        },
        moveCardsToAnotherSlot(pickedCard: number, droppedSlot: number) {
            const pickedCardSlot = this.board.findIndex((slot) => slot.includes(pickedCard));
            const indexOfPickedCard = this.board[pickedCardSlot].indexOf(pickedCard);
            for (let i = indexOfPickedCard; i < this.board[pickedCardSlot].length; i++) {
                this.board[droppedSlot].push(this.board[pickedCardSlot][i]);
            }
            this.board[pickedCardSlot].splice(indexOfPickedCard, this.board[pickedCardSlot].length - indexOfPickedCard + 1);
            if (this.board[pickedCardSlot][this.board[pickedCardSlot].length - 1] < 0) {
                this.board[pickedCardSlot][this.board[pickedCardSlot].length - 1] = -this.board[pickedCardSlot][this.board[pickedCardSlot].length - 1];
            }
        },
        checkDrop(pickedCard: number, droppedSlot: number) {
            const lastCardOnSlot = this.board[droppedSlot][this.board[droppedSlot].length - 1];
            if (lastCardOnSlot === pickedCard) {
                return;
            }
            if (this.isColored(pickedCard) === this.isColored(lastCardOnSlot)) {
                return;
            }
            if (this.isOneLess(this.getCardNumber(lastCardOnSlot), this.getCardNumber(pickedCard))) {
                this.moveCardsToAnotherSlot(pickedCard, droppedSlot);
            }
        },
        checkDropFromCards(pickedCard: number, droppedSlot: number) {
            const lastCardOnSlot = this.board[droppedSlot][this.board[droppedSlot].length - 1];
            if (lastCardOnSlot === pickedCard) {
                return;
            }
            if (this.isColored(pickedCard) === this.isColored(lastCardOnSlot)) {
                return;
            }
            if (this.isOneLess(this.getCardNumber(lastCardOnSlot), this.getCardNumber(pickedCard))) {
                this.board[droppedSlot].push(pickedCard);
                this.cards.splice(this.cards.indexOf(pickedCard), 1);
                this.previousCard();
            }
        },
        isColored(card: number) {
            return card < 27;
        },
        newGame() {
            this.board = [[], [], [], [], [], [], []];
            this.cards = [];
            this.slots = [-1, -1, -1, -1];
            this.activeCardIndex = -1;
            this.startGame();
            this.confirmDialog.show = false;
        },
        showConfirmDialog(type: "newGame" | "restart") {
            this.confirmDialog = {
                show: true,
                type: type,
                message: type === "newGame" ? "Congratulations, you won! Would you like to play another one?" : "Are you sure you want to restart the game?",
            };
        },
        autoFinish(timeout: number) {
            this.isGameFinished = true;
            this.board.forEach((column) => {
                if (column?.length !== 0) {
                    if (!this.board.every((column) => column.length === 0)) {
                        setTimeout(() => {
                            this.sendCardToSlotFromBoard(column[column.length - 1]);
                            this.autoFinish(timeout + 300);
                        }, timeout);
                    }
                }
            });
            setTimeout(() => {
                this.showConfirmDialog("newGame");
            }, 4000);
        },
    },
    persist: true,
});
