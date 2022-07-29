import { assert } from 'console';
import { Deferred } from './deferredGuess';

/**
 * A match of Word Game between 2 players with different usernames
 */
export class Match {
    private players: Set<string> = new Set();
    private numberOfGuesses: number = 0;
    private guesses: Map<string, string> = new Map();
    private deferredGuesses: Array<Deferred<void>> = new Array();

    public constructor() {
        this.checkRep();
    }

    // Abstraction Function
    //     AF(players, numberOfGuesses,
    //        guesses, deferredGuesses) = a match of  Word Game where players 'players' are playing,
    //                                    have made 'numberOfGuesses' guesses,
    //                                    with the gussed of player 'playerID' in guesses.get(playerID),
    //                                    and 'deferredGuesses' guesses to be checked when both players have submitted a word
    // Rep Invariant
    //     - number of players in 'players' is <= 2 with each player having an ID consisting of only alphanumeric characters
    //     - numberOfGuesses >= 0
    //     - each player's guess is a single word consisting only of lowercase letters,
    //           unless it is the empty string which represents no guess
    //     - number of deferred guesses is <= 2
    // Safety From Rep Exposure
    //     - all rep fields are private
    //     - all public methods and getters either take no or only immutable types as arguments
    //           and return either a promise that resolves to void, an immutable type, or nothing

    /**
     * 
     */
    private checkRep() {
        assert(this.players.size <= 2);
        assert(this.numberOfGuesses >= 0);
        for (const playerID of this.players) {
            const guess:string = this.guesses.get(playerID) ?? '';
            assert(/[\w]/.test(guess) || guess === '');
        }
        assert(this.deferredGuesses.length <= 2);
    }

    /**
     * Register a new player to play this Word Game
     * 'playerID' required to consist of only alphanumeric characters
     * Modifies GameState to include the new player
     * 
     * @param playerID the ID of a new player that wants to play this Word Game
     * @throws if a player with playerID is already registered or is more than the second player to register
     */
    public registerPlayer(playerID: string): void {
        if (this.numberOfPlayers === 2) {
            this.checkRep();
            throw Error;
        }

        if (this.alreadyRegistered(playerID)) {
            this.checkRep();
            throw Error;
        }
        
        this.players.add(playerID);
        this.guesses.set(playerID, '');
        this.checkRep();
    }

    /**
     * Have a player submit a word
     * 
     * @param playerID the ID of the player who submitted a word
     * @param word the word a player submitted, required to be a single word consisting of only letters
     * @returns {Promise<void>} a promise that resolves when both players submit words
     * @throws if player is not registered
     */
    public submitWord(playerID: string, word: string): Promise<void> {
        if (!this.alreadyRegistered(playerID)) {
            this.checkRep();
            throw Error;
        }

        const guessPromise = new Deferred<void>();
        this.guesses.set(playerID, word);
        this.deferredGuesses.push(guessPromise);

        if (this.deferredGuesses.length === 2) {
            while (this.numberOfSubmittedWords > 0) {
                this.deferredGuesses.pop()?.resolve();
            }
        }

        this.checkRep();
        return guessPromise.promise;
    }


    /**
     * Check if the guesses currently submitted constitute a match
     * 
     * Requires that the number of submitted words is exactly 2
     * If two guesses are submitted and they do not constitute a match, resolves the deferred promises
     *     associated with the guesses, prints 'LOSER!', and returns false
     * If two guesses are submitted and they not constitute a match, resolves the deferred promises
     *     associated with the guesses, prints 'VICTORY!', and returns true
     * 
     * @returns {boolean} returns true iff the two submitted words are a match
     * @returns {string} return the two guesses
     * @throws {error} if there are not two submitted words
     */
    public checkForMatch(): { result: boolean, guess1: string, guess2: string } {
        // If the number of players is not 2, there cannot be a match
        if (this.numberOfSubmittedWords !== 2) {
            this.checkRep();
            throw Error;
        }

        // If 2 submitted words, then both players have guessed
        this.numberOfGuesses += 1;

        // Get the guesses and associated promises from each player
        const playerIDs: Array<string> = new Array(...this.playerIDs);
        const player1ID: string = playerIDs[0] ?? '';
        const player2ID: string = playerIDs[1] ?? '';

        const player1Guess: string = this.guesses.get(player1ID) ?? '';
        const player2Guess: string = this.guesses.get(player2ID) ?? '';

        // Clear the guesses
        this.guesses.set(player1ID, '');
        this.guesses.set(player2ID, '');

        // Check for a match
        let result: boolean = false;
        // If two guess are equal, then there is a match
        if (player1Guess === player2Guess) {
            const result = true;
        }

        this.checkRep();
        return { result: result, guess1: player1Guess, guess2: player2Guess };
    }

    /**
     * Convert this match into a string
     * 
     * @returns a string describing the number of player in this match,
     *              how many guesses they've submitted,
     *              and their current guesses.
     */
    public toString(): string {
        let output = '';
        output += `This game has ${this.numberOfPlayers} players playing.\n`;
        output += `They have guessed ${this.numberOfGuesses} times.\n`;
        output += `Their current guesses are:\n`;
        for (const playerID of this.playerIDs) {
            output += `    ${playerID}: ${this.guesses.get(playerID)}\n`;
        }
        return output;
    }

    /**
     * Check if a player with ID 'playerID' is already registered in this match
     * 
     * @param playerID the playerID being determined if it is already registered
     * @returns {boolean} true iff player with ID 'playerID' is already registered in this match
     *          false otherwise
     */
     private alreadyRegistered(playerID: string): boolean {
        return playerID in this.players;
    }

    /**
     * Get the number of players playing this Word Game
     * 
     * @returns {number} the number of players playing this Word Game
     */
    public get numberOfPlayers(): number {
        return this.players.size;
    }

    /**
     * Get the IDs of all the players playing this game
     * 
     * @returns {Set<string>} a set containing the IDs of the players playing this game
     */
    public get playerIDs(): Set<string> {
        return new Set(this.players);
    }

    /**
     * Get the number of submitted words
     * 
     * @returns {int} the number of submissions
     */
    private get numberOfSubmittedWords(): number {
        return this.deferredGuesses.length;
    }
}