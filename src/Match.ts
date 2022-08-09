import { assert } from 'console';
import { Deferred } from './deferredGuess';

enum Status {IN_PROGRESS, FINISHED}

/**
 * A match of Word Game between 2 players with different usernames
 */
export class Match {
    private status: Status = Status.IN_PROGRESS;
    private readonly players: Set<string> = new Set();
    private readonly waitingPlayers: Array<Deferred<void>> = new Array();
    private numberOfGuesses: number = 0;
    private readonly guesses: Map<string, string> = new Map();
    private readonly previousGuesses: Set<string> = new Set();
    private readonly deferredGuesses: Array<Deferred<void>> = new Array();
    private readonly playAgainResponses: Array<boolean> = new Array();
    private readonly deferredPlayAgain: Array<Deferred<void>> = new Array();

    public constructor() {
        this.checkRep();
    }

    // Abstraction Function
    //     AF(players, waitingPlayers,
    //        numberOfGuesses, guesses,
    //        previousGuesses, deferredGuesses) = a match of  Word Game where players 'players' are playing,
    //                                            'waitingPlayers' are waiting to be paired against an opponent,
    //                                            the players have made 'numberOfGuesses' cumulative guesses,
    //                                            with the guess of player 'playerID' in guesses.get(playerID),
    //                                            with 'previousGuesses' as the guesses that have been previously submitted during this match,
    //                                            and 'deferredGuesses' guesses to be checked when both players have submitted a word
    // Rep Invariant
    //     - number of players in 'players' is <= 2 with each player having an ID consisting of only alphanumeric characters
    //     - number of waitingPlayers is <= 1
    //     - numberOfGuesses >= 0
    //     - each player's guess is a single word consisting only of lowercase letters,
    //           unless it is the empty string which represents no guess
    //     - number of deferred guesses is <= 1
    // Safety From Rep Exposure
    //     - all rep fields are private
    //     - all public methods either take no or only immutable types as arguments
    //           and return either a promise that resolves to void, an immutable type, or nothing
    //     - all getters that return rep fields defensively copy where applicable

    /**
     * Ensure the rep invariant
     */
    private checkRep() {
        assert(this.players.size <= 2);
        assert(this.waitingPlayers.length <= 1);
        assert(this.numberOfGuesses >= 0);
        for (const playerID of this.players) {
            const guess:string = this.guesses.get(playerID) ?? '';
            assert(/[\w]/.test(guess) || guess === '');
        }
        assert(this.deferredGuesses.length <= 1);
    }

    /**
     * Register a new player to play this Word Game
     * 'playerID' required to consist of only alphanumeric characters
     * Modifies the rep of this Match to include the new player
     * 
     * @param playerID the ID of a new player that wants to play this Word Game
     * 
     * @returns {Promise<void>} a promise that resolves when this match has 2 players registered to play
     * @throws if a player with playerID is already registered or is more than the second player to register
     */
    public registerPlayer(playerID: string): Promise<void> {
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

        const waitingPlayer: Deferred<void> = new Deferred();
        this.waitingPlayers.push(waitingPlayer);

        if (this.waitingPlayers.length === 2) {
            while (this.waitingPlayers.length > 0) {
                this.waitingPlayers.pop()?.resolve();
            }
        }

        this.checkRep();
        return waitingPlayer.promise;
    }

    /**
     * Have a player submit a word
     * Requires that 'guess' is not in 'this.previousGuesses' and a single word consisting of only letters
     * Requires that 'playerID' is already registered and consists of only alphanumeric characters
     * 
     * @param playerID the ID of the player who submitted a word
     * @param guess the word a player submitted
     * @returns {Promise<void>} a promise that resolves when two players in this Match submit words
     */
    public submitWord(playerID: string, guess: string): Promise<{ match: boolean, guess1: string, guess2: string}> {
        const waitingGuess = new Deferred<void>();
        this.guesses.set(playerID, guess);
        this.deferredGuesses.push(waitingGuess);
        this.numberOfGuesses += 1;

        if (this.deferredGuesses.length === 2) {
            while (this.deferredGuesses.length > 0) {
                this.deferredGuesses.pop()?.resolve();
            }
        }

        this.checkRep();
        const returnedPromise: Promise<{ match: boolean, guess1: string, guess2: string}> = new Promise(async (resolve, reject) => {
            await waitingGuess.promise;
            resolve(this.checkForMatch());
        });
        return returnedPromise;
    }


    /**
     * Check if the guesses currently submitted constitute a match
     * Requires that two players have submitted valid guesses
     * 
     * @returns {match: boolean} returns true iff the two submitted words are a match, false otherwise
     * @returns {guess1: string} returns the guess of one player
     * @returns {guess2: string} returns the guess of the second player
     */
    public checkForMatch(): { match: boolean, guess1: string, guess2: string } {
        const playerIDs: Array<string> = new Array(...this.playerIDs);
        const player1ID: string = playerIDs[0] ?? '';
        const player2ID: string = playerIDs[1] ?? '';

        const player1Guess: string = this.guesses.get(player1ID) ?? '';
        const player2Guess: string = this.guesses.get(player2ID) ?? '';
        this.previousGuesses.add(player1Guess).add(player2Guess);

        // Check for a match
        let result: boolean = false;
        
        // If two guess are equal, then there is a match
        if (player1Guess === player2Guess) {
            this.status = Status.FINISHED;
            result = true;
        }

        this.checkRep();
        return { match: result, guess1: player1Guess, guess2: player2Guess };
    }

    /**
     * 
     * @param playerID a player who wants to play again
     * @param {boolean} playAgain indicates if 'playerID' wants to play again
     * 
     * @returns {Promise<void>} a promise that resolves when both players have indicated whether they want to play again
     * @throws {error} if either this match is not finished or 'playerID' is not registered
     */
    public playAgain(playerID: string, playAgain: boolean): Promise<void> {
        if (this.status !== Status.FINISHED || !this.alreadyRegistered(playerID)) {
            throw Error;
        }

        this.playAgainResponses.push(playAgain);

        const playAgainDeferred: Deferred<void> = new Deferred();
        this.deferredPlayAgain.push(playAgainDeferred);

        if (this.deferredPlayAgain.length === 2) {
            while (this.deferredPlayAgain.length > 0) {
                this.deferredPlayAgain.pop()?.resolve();
            }
        }

        return playAgainDeferred.promise;
    }

    
    /**
     * Check if the players registered in this match want to play again
     * 
     * @returns {boolean} returns true iff the match is over and every player registered in this match
     *                        has indicated that they want to play again
     *                    false otherwise
     */
    public rematch(): boolean {
        if (this.playAgainResponses.every(element => element) &&
            this.playAgainResponses.length === this.numberOfPlayers &&
            this.status === Status.FINISHED) {
            this.clearMatch();
            return true;
        }
        return false;
    }

    /**
     * Get the ID of the opponent of a given player
     * @param playerID the player who's opponent to get
     * 
     * @returns {string} the ID of the other player in this Match, or void if only 'playerID' is playing
     * @throws {error} if 'playerID' is not registered in this Match
     */
     public getOpponent(playerID: string): string {
        if (!this.alreadyRegistered(playerID)) {
            throw Error;
        }

        for (const ID of this.playerIDs) {
            if (ID !== playerID) {
                return ID;
            }
        }

        return '';
    }


    /**
     * Restart the match by clearing previous guesses and resetting the number of guesses to 0
     * Mutates the rep of Match
     */
    private clearMatch(): void {
        this.numberOfGuesses = 0;
        this.previousGuesses.clear();
        for (const playerID of this.playerIDs) {
            this.guesses.set(playerID, '');
        }
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
     * @param playerID the playerID being determined if they are already registered
     * @returns {boolean} true iff player with ID 'playerID' is already registered in this match,
     *                    false otherwise
     */
     private alreadyRegistered(playerID: string): boolean {
        return this.players.has(playerID);
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
     * Get the guesses that were previously submitted in this match
     * 
     * @return {Set<string>} a set containing the previous guesses of this match
     */
    public get getPreviousGuesses(): Set<string> {
        return new Set(this.previousGuesses);
    }

    /**
     * Get the number of rounds of this match
     * 
     * @return {number} the number of rounds played in this match so far
     */
    public get getNumberOfGuesses(): number {
        return this.numberOfGuesses / 2;
    }
}