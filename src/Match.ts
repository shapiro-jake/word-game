import { Player } from './Player';
import { Deferred } from './deferredGuess';
import { assert } from 'console';

enum State {REGISTERED, SUBMITTED, VICTORIOUS}
/**
 * A match of Word Game between 2 players with different usernames
 */
export class Match {
    private players: Set<string> = new Set();
    private numberOfGuesses: number = 0;
    private guesses: Map<string, { guess: string, deferredGuess: Deferred<void> }> = new Map();

    public constructor() {
        this.checkRep();
    }

    // Abstraction Function
    //     AF(players, numberOfGuesses) = a match of  Word Game where players 'players' are playing
    //                                    with the state and word of player 'playerID' in players.get(playerID)
    // Rep Invariant
    //     - number of players in 'players' is <= 2
    //     - numberOfGuesses >= 0
    // Safety From Rep Exposure
    //     - 

    /**
     * 
     */
    private checkRep() {
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
            throw Error;
        }

        if (this.alreadyRegistered(playerID)) {
            throw Error;
        }
        this.players.add(playerID);
    }

    /**
     * Have a player submit a word and update the game accordingly when both players have submitted a word
     * 
     * @param playerID the ID of the player who submitted a word
     * @param word the word a player submitted, required to be a single word consisting of only letters
     * @returns {boolean} a promise that resolves, when both players submit words, to
     *                    true iff both players have submitted words that match
     *                    and false otherwise
     * @throws if player is not registered
     */
    public submitWord(playerID: string, word: string): Promise<void> {
        if (!this.alreadyRegistered(playerID)) {
            throw Error;
        }

        const guessPromise = new Deferred<void>();
        this.guesses.set(playerID, { guess: word, deferredGuess: guessPromise});
        this.checkForMatch();
        return guessPromise.promise;
    }

    /**
     * Check if the guesses currently submitted constitute a match
     * 
     * If no guess or only 1 guess is submitted, does nothing
     * If two guesses are submitted and they do not constitute a match, resolves the deferred promises
     *     associated with the guesses, prints 'LOSER!', and returns false
     * If two guesses are submitted and they not constitute a match, resolves the deferred promises
     *     associated with the guesses, prints 'VICTORY!', and returns true
     * 
     * @returns {boolean} returns true iff there are two play
     */
    private checkForMatch(): boolean {
        // If the number of players is not 2, there cannot be a match
        if (this.numberOfPlayers !== 2) {
            return false;
        }

        // Get the guesses and associated promises from each player
        const playerIDs: Array<string> = new Array(...this.playerIDs);
        const player1ID: string = playerIDs[0] ?? '';
        const player2ID: string = playerIDs[1] ?? '';

        const player1Guess: string = this.guesses.get(player1ID)?.guess ?? '';
        const player2Guess: string = this.guesses.get(player2ID)?.guess ?? '';

        const player1Promise: Deferred<void> = this.guesses.get(player1ID)?.deferredGuess ?? new Deferred<void>();
        const player2Promise: Deferred<void> = this.guesses.get(player2ID)?.deferredGuess ?? new Deferred<void>();

        // Clear the guesses
        const emptyGuess: { guess: string, deferredGuess: Deferred<void>} = { guess: '', deferredGuess: new Deferred<void>()};
        this.guesses.set(player1ID, emptyGuess);
        this.guesses.set(player2ID, emptyGuess);

        // Check for a match
        // If two guess are equal, then there is a match
        if (player1Guess === player2Guess) {
            // WIN
            console.log('VICTORY!');
            return true;
        // Otherwise, there is no match
        } else {
            console.log('LOSER!');
            return false;
        }
    }


    /**
     * Get the number of players playing this Word Game
     * 
     * @returns {number} the number of players playing this Word Game
     */
    public get numberOfPlayers(): number {
        return Object.keys(this.players).length;
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
     * 
     * @param playerID the playerID being determined if it is already registered
     * @returns true iff player with ID 'playerID' is already registered in this match
     *          false otherwise
     */
    private alreadyRegistered(playerID: string) {
        return playerID in this.players;
    }
}