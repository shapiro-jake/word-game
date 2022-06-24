import { Player } from './Player';

enum State {REGISTERED, SUBMITTED, VICTORIOUS}
/**
 * An object representing a Word Game of exactly 2 players with different usernames to play
 */
export class GameState {
    private players: Map<string, Player> = new Map();
    private numberOfGuesses: number = 0;

    public constructor() {
        this.checkRep();
    }

    // Abstraction Function
    //     AF(players, numberOfGuesses) = a game of the Word Game where players 'players' are playing
    //                                    with the state and word of player 'playerID' in players.get(playerID)
    // Rep Invariant
    //     - number of players in 'players' is <= 2
    //     - numberOfGuess >= 0
    // Safety From Rep Exposure
    //     - 

    /**
     * 
     */
    private checkRep() {
    }

    /**
     * Register a new player to play this Word Game, required to consist of only alphanumeric characters
     * Modifies GameState to include the new player
     * 
     * @param playerID the ID of a new player that wants to play this Word Game
     * @throws if a player with playerID is already registered or is more than the second player to register
     */
    public registerPlayer(playerID: string): void {
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

    }
}