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

    private playAgainResponses: number = 0;
    private readonly deferredPlayAgain: Array<Deferred<void>> = new Array();

    /**
     * @param {number} maxPlayers the maximum number of players this match can hold
     */
    public constructor(public readonly maxPlayers: number) {
        this.checkRep();
    }

    // Abstraction Function
    // 
    // AF(status, maxPlayers, players, waitingPlayers
    //    numberOfGuesses, guesses, previousGuesses, deferredGuesses,
    //    playAgainResponses, deferredPlayAgain) = 
    //
    //    a match of the Word Game whose status is 'status' with 'maxPlayers' players playing,
    //    where players 'players' are playing, 'waitingPlayers' are waiting to be paired against an opponent,
    //    the players have made 'numberOfGuesses' cumulative guesses,
    //    the guess of player 'playerID' in guesses.get(playerID),
    //    the players have previously guessed the words 'previousGuesses',
    //    'deferredGuesses' guesses are waiting to be checked when both players have submitted a word,
    //    'playAgainResponses' number of requests to play again after a match has completed,
    //    and 'deferredPlayAgain' play again requests are waiting to be executed if both players opt to rematch.
    //
    // Rep Invariant
    //     - number of players in 'players' is <= maxPlayers with each player having an ID consisting of only alphanumeric characters
    //     - number of waitingPlayers is <= maxPlayers - 1
    //     - numberOfGuesses >= 0
    //     - each player's guess is a single word consisting only of lowercase letters,
    //           unless it is the empty string which represents no guess
    //     - number of deferred guesses is <= maxPlayers - 1
    //     - number of playAgainResponses <= maxPlayers
    //     - deferredPlayAgain.length <= maxPlayers - 1
    //
    // Safety From Rep Exposure
    //     - all rep fields are private
    //     - all public methods excluding getters either take no or only immutable types as arguments
    //           and return either a promise that resolves to an immutable type, an immutable type, or nothing
    //     - all getters that return rep fields defensively copy where applicable

    /**
     * Ensure the rep invariant
     */
    private checkRep() {
        assert(this.players.size <= this.maxPlayers);
        assert(this.waitingPlayers.length <= this.maxPlayers - 1);
        assert(this.numberOfGuesses >= 0);
        for (const playerID of this.players) {
            const guess:string = this.guesses.get(playerID) ?? '';
            assert(/[\w]/.test(guess) || guess === '');
        }
        assert(this.deferredGuesses.length <= this.maxPlayers - 1);
        assert(this.playAgainResponses <= this.maxPlayers);
        assert(this.deferredPlayAgain.length <= this.maxPlayers - 1);
    }

    /**
     * Register a new player to play this Word Game
     * 'playerID' required to consist of only alphanumeric characters
     * Modifies the rep of this Match to include the new player
     * 
     * @param {string} playerID the ID of a new player that wants to play this Word Game
     * 
     * @returns {Promise<void>} a promise that resolves when this match has 'this.maxPlayers' players registered to play
     * @throws if a player with playerID is already registered or is more than the second player to register
     */
    public registerPlayer(playerID: string): Promise<void> {
        // Check if Match is full
        if (this.numberOfPlayers === this.maxPlayers) {
            this.checkRep();
            throw Error;
        }

        // Check if 'playerID' is already registered
        if (this.alreadyRegistered(playerID)) {
            this.checkRep();
            throw Error;
        }
        
        // Register 'playerID'
        this.players.add(playerID);
        this.guesses.set(playerID, '');

        const waitingPlayer: Deferred<void> = new Deferred();
        this.waitingPlayers.push(waitingPlayer);

        // If player fills the match, resolve registration promises
        if (this.waitingPlayers.length === this.maxPlayers) {
            while (this.waitingPlayers.length > 0) {
                this.waitingPlayers.pop()?.resolve();
            }
        }

        this.checkRep();
        return waitingPlayer.promise;
    }


    /**
     * Unregister a player with username 'playerID' from this match
     * Modifies the rep by deleting 'playerID' from relevant rep fields
     * 
     * @param {string} playerID the player to unregister
     * @throws if playerID is not registered in this match
     */
    public unregisterPlayer(playerID: string): void {
        // Check if 'playerID' is registered
        if (!this.alreadyRegistered(playerID)) {
            this.checkRep();
            throw Error;
        }

        // Delete 'playerID' from the list of players
        this.players.delete(playerID);
        this.guesses.delete(playerID);

        // In case 'playerID' is waiting to be paired up - not extendable to > 2 player game
        this.waitingPlayers.pop();
    }

    /**
     * Have a player submit a word
     * Requires that 'guess' is not in 'this.previousGuesses' and a single word consisting of only letters
     * Requires that 'playerID' is already registered
     * 
     * @param {string} playerID the ID of the player who submitted a word
     * @param {string} guess the word a player submitted
     * @returns {Promise<void>} a promise that resolves when two players in this Match submit words
     */
    public submitWord(playerID: string, guess: string): Promise<{ match: boolean, guess1: string, guess2: string}> {
        // Clear match after completion
        if (this.status === Status.FINISHED) {
            this.clearMatch();
        }

        // Set 'guess' as guess of 'playerID'
        this.guesses.set(playerID, guess);
        const waitingGuess = new Deferred<void>();
        this.deferredGuesses.push(waitingGuess);
        this.numberOfGuesses += 1; // increments on each player's guess, not each round of the game

        // If all players have submitted guesses, resolve guess promises
        if (this.deferredGuesses.length === this.maxPlayers) {
            while (this.deferredGuesses.length > 0) {
                this.deferredGuesses.pop()?.resolve();
            }
        }

        this.checkRep();
        const returnedPromise: Promise<{ match: boolean, guess1: string, guess2: string}> = 
            new Promise(async (resolve, reject) => {
                await waitingGuess.promise;
                resolve(this.checkForMatch());
            });
        return returnedPromise;
    }


    /**
     * Check if the guesses currently submitted constitute a match
     * Requires that two players have submitted guesses
     * 
     * @returns {match: boolean} returns true iff the two submitted words are a match, false otherwise
     * @returns {guess1: string} returns the guess of one player
     * @returns {guess2: string} returns the guess of the second player
     */
    public checkForMatch(): { match: boolean, guess1: string, guess2: string } {
        // Get players' guesses
        const playerIDs: Array<string> = new Array(...this.playerIDs);
        const player1ID: string = playerIDs[0] ?? '';
        const player2ID: string = playerIDs[1] ?? '';
        const player1Guess: string = this.guesses.get(player1ID) ?? '';
        const player2Guess: string = this.guesses.get(player2ID) ?? '';

        // Add guesses to previous guesses
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
     * Process a player's intent to rematch after match has completed
     * 
     * @param {string} playerID a player who wants to play again
     * @returns {Promise<void>} a promise that resolves when both players have indicated whether they want to play again
     * @throws if either this match is not finished or 'playerID' is not registered
     */
    public rematch(playerID: string): Promise<boolean> {
        // Check if match has finished and 'playerID' is registered
        if (this.status !== Status.FINISHED || !this.alreadyRegistered(playerID)) {
            throw Error;
        }

        this.playAgainResponses += 1;

        const playAgainDeferred: Deferred<void> = new Deferred();
        this.deferredPlayAgain.push(playAgainDeferred);

        // If all players have indicated they want to play again
        if (this.deferredPlayAgain.length === this.maxPlayers) {
            while (this.deferredPlayAgain.length > 0) {
                this.deferredPlayAgain.pop()?.resolve();
            }
        }

        // Clear match if all players want to play again
        const returnedPromise: Promise<boolean> = new Promise(async (resolve, reject) => {
            await playAgainDeferred.promise;
            this.previousGuesses.clear();
            this.checkRep();
            resolve(true);
        });
        return returnedPromise;
    }


    /**
     * Get the ID of the opponent of a given player
     * 
     * @param {string} playerID the player who's opponent to get
     * @returns {string} the ID of the other player in this Match, or the empty string if 'playerID' is not playing anyone
     * @throws {error} if 'playerID' is not registered in this Match
     */
     public getOpponent(playerID: string): string {
        // Check that 'playerID' is registered
        if (!this.alreadyRegistered(playerID)) {
            throw Error;
        }

        // Return the ID that is not 'playerID' - not extendable to > 2 player game
        for (const ID of this.playerIDs) {
            if (ID !== playerID) {
                return ID;
            }
        }

        // Get here only if 'playerID' is playing
        return '';
    }


    /**
     * Restart the match by clearing previous match data
     * Mutates the rep of Match
     */
    private clearMatch(): void {
        this.numberOfGuesses = 0;
        for (const playerID of this.playerIDs) {
            this.guesses.set(playerID, '');
        }
        this.status = Status.IN_PROGRESS;
        this.playAgainResponses = 0;
    }

    /**
     * Convert this match into a string
     * 
     * @returns {string} a string describing the number of player in this match,
     *                   how many guesses they've submitted,
     *                   and their current guesses.
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
     * @param {string} playerID the playerID being determined if they are already registered
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
        // Defensively copy 'this.players'

        return new Set(this.players);
    }

    /**
     * Get the guesses that were previously submitted in this match
     * 
     * @return {Set<string>} a set containing the previous guesses of this match
     */
    public get getPreviousGuesses(): Set<string> {
        // Defensively copy 'this.previousGuesses'
        return new Set(this.previousGuesses);
    }

    /**
     * Get the number of rounds of this match
     * 
     * @return {number} the number of rounds played in this match so far
     */
    public get getNumberOfRounds(): number {
        // Each guess by each player incremenets 'this.numberOfGuesses', so divide by 2 for rounds
        return this.numberOfGuesses / 2;
    }
}