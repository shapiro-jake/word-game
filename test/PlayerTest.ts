import assert from 'assert';
import { Player } from '../src/Player';

describe('Player ADT', () => {
    /**
     * Testing strategy for Player
     *   
     *   submitWord(word)
     *     - word: all lowercase, not all lowercase
     * 
     *   checkForMatch(otherPlayer)
     *     - otherPlayer
     */

    it('covers a player submitting a lowercase word', async function() {
        const playerID = 'BobSmithson';
        const player = new Player(playerID);

        const word = 'cat';
        player.submitWord(word);
        assert.strictEqual(word, player.word);
    }); 

    it('covers a player submitting a lowercase word', async function() {
        const playerID = 'BobSmithson';
        const player = new Player(playerID);

        const word = 'CAT';
        const lowercaseWord = 'cat';
        player.submitWord(word);
        assert.strictEqual(lowercaseWord, player.word);
    });
});