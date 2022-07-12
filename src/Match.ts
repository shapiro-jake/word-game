import { Player } from './Player';

enum State {REGISTERED, SUBMITTED, VICTORIOUS}
/**
 * A match of Word Game between 2 players with different usernames
 */
export class Match {
    private players: Map<string, Player> = new Map();
    private numberOfGuesses: number = 0;

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

        this.players.set(playerID, new Player(playerID));
    }

    /**
     * Have a player submit a word and update the game accordingly when both players have submitted a word
     * 
     * @param playerID the ID of the player who submitted a word
     * @param word the word a player submitted, required to be a single word consisting of only letters
     * @returns {boolean} a promise that resolves, when both players submit words, to
     *                    true iff both players have submitted words that match
     *                    and false otherwise
     * @throws if player is not registered or there are not two people playing
     */
    public submitWord(playerID: string, word: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(true);
        })
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
        return new Set();
    }

    /**
     * 
     * @param playerID the playerID being determined if it is already registered
     * @returns true iff player with ID 'playerID' is already registered in this match
     *          false otherwise
     */
    private alreadyRegistered(playerID: string) {
        return playerID in this.playerIDs;
    }
}