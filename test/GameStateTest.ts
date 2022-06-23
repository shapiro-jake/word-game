import assert from 'assert';
import { GameState } from '../src/GameState';

describe('GameState ADT', () => {
    /**
     * Testing strategy for GameState ADT
     * 
     *   registerPlayer(playerID)
     *     - playerID: not yet registered, already registered
     *     - Number of registered players: 0, 1, > 1
     *   submitWord(word)
     *     - Number of other players: 0, 1
     *     - Other player: is not registered,
     *                     has not yet submitted a word,
     *                     has already submitted a word
     *     - Submitted word: eventually does not match, eventually does match
     *   getNumberOfPlayers()
     *     - returns: 0, 1, 2
     */
});