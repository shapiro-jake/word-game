
enum State {WAITING, SUBMITTED, VICTORIOUS}

/**
 * A player that plays the Word Game
 */
export class Player {
    private state: State;
    private submittedWord: string;

    // Abstraction Function
    //     AF(playerID, state) = a player playing the Word Game
    //                           with ID 'playerID' in the state 'state'
    // Rep Invariant
    //     - playerID consists of only alphanumeric characters
    //     - If state === WAITING or VICTORIOUS, then submittedWord === ''
    //     - If state === SUBMITTED, then submittedWord has non-zero length and consists only of lowercase letters
    // Safety From Rep Exposure
    //     - All rep fields are private
    //     - All rep fields are immutable
    //     - All public methods take in either immutable or Player arguments and return immutable arguments

    /**
     * Create a Player ADT
     * 
     * @param playerID required to consist of only alphanumeric characters
     */
    public constructor(
        private readonly playerID: string
    ) {
        this.state = State.WAITING;
        this.submittedWord = '';
    }

    /**
     * Have this player submit a word
     * Modifies this player
     * 
     * @param word the word that this player wants to submit,
     *             required to be a single word that consists of letter
     */
    public submitWord(word: string): void {}

    /**
     * Check if this player has a match with another player
     * If the two have a match, erases both of the players' submitted words
     *     and notes that they are victorious
     * Requires that otherPlayer.state === SUBMITTED
     * 
     * @param otherPlayer another player
     * @returns {boolean} true iff the this.submittedWord.toLowerCase() === otherPlayer.submittedWord.toLowerCase()
     *                    false otherwise
     */
    public checkForMatch(otherPlayer: Player): boolean {
        return true;
    }

    /**
     * Get the word this player has currently submitted
     */
    public get word(): string {
        return this.submittedWord;
    }
}