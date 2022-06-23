import assert from 'assert';
import { WebServer } from '../src/server';
import { GameState } from '../src/GameState';
import fetch from 'node-fetch';
import HttpStatus from 'http-status-codes';

/**
 * Start a server at port 'port' with a blank GameState
 * 
 * @param port the port to run the server on
 */
 async function startServer(port: number): Promise<WebServer> {
    const gameState: GameState = new GameState();
    const server = new WebServer(port, gameState);
    await server.start();
    return server;
}

describe('WebServer', () => {
    /**
     * Testing strategy for WebServer
     * 
     *   /register/PlayerID, /submit/PlayerID/word, /playAgain/playerID
     *     - PlayerID: is valid, invalid
     *     - PlayerID: is already registered, not registered
     *   
     *   /submit/PlayerID/word
     *     - word: is valid, invalid
     *     - word: does not match, matches
     *     - Number of players: PlayerID is only player playing, 
     *                          second player is registered but has not submitted,
     *                          second player has already submitted
     *   /playAgain/playerID
     *     - PlayerID: has just won, has not just won
     */

    it('covers a player with an empty ID trying to register', async function () {
        const server = await startServer(0);
        const URL = `http://localhost:${server.port}/register/`;
        const serverResponse = await fetch(URL);
        assert.strictEqual(await serverResponse.text(), 'Invalid player ID!');
        assert.strictEqual(serverResponse.status, HttpStatus.NOT_ACCEPTABLE);

        server.stop();
    });
    
    it('covers a player with an invalid ID trying to register, submit a word, or play again', async function () {
        const invalidID = 'Bob.Smith';
        const word = 'cat';
        
        const server = await startServer(0);

        const registerURL = `http://localhost:${server.port}/register/${playerID}`
        const registerResponse = await fetch(registerURL);
        assert.strictEqual(await registerResponse.text(), 'Invalid player ID!');
        assert.strictEqual(registerResponse.status, HttpStatus.NOT_ACCEPTABLE);

        const submitURL = `http://localhost:${server.port}/submit/${playerID}/${word}`
        const submitResponse = await fetch(submitURL);
        assert.strictEqual(await submitResponse.text(), 'Invalid player ID!');
        assert.strictEqual(submitResponse.status, HttpStatus.NOT_ACCEPTABLE);

        const playAgainURL = `http://localhost:${server.port}/playAgain/${playerID}`
        const playAgainResponse = await fetch(playAgainURL);
        assert.strictEqual(await playAgainResponse.text(), 'Invalid player ID!');
        assert.strictEqual(playAgainResponse.status, HttpStatus.NOT_ACCEPTABLE);

        server.stop();
    });

    it('covers a player with an already existing ID trying to register', async function () {
        const playerID = 'BobSmith'
        
        const server = await startServer(0);
        const URL = `http://localhost:${server.port}/register/${playerID}`
        const serverResponse = await fetch(URL);
        assert.strictEqual(await serverResponse.text(), `Registered ${playerID}`);
        const repeatedResponse = await fetch(URL);
        assert.strictEqual(await serverResponse.text(), `${playerID} is already registered!`);
        assert.strictEqual(serverResponse.status, HttpStatus.NOT_ACCEPTABLE);

        server.stop();
    });

    it('covers an unregistered player trying to submit a word or play again', async function () {
        const unregisteredID = 'BobSmith';
        const word = 'cat';
        
        const server = await startServer(0);

        const submitURL = `http://localhost:${server.port}/submit/${playerID}/${word}`
        const submitResponse = await fetch(submitURL);
        assert.strictEqual(await submitResponse.text(), 'Unregistered player!');
        assert.strictEqual(submitResponse.status, HttpStatus.NOT_ACCEPTABLE);

        const playAgainURL = `http://localhost:${server.port}/playAgain/${playerID}`
        const playAgainResponse = await fetch(playAgainURL);
        assert.strictEqual(await playAgainResponse.text(), 'Unregistered player!');
        assert.strictEqual(playAgainResponse.status, HttpStatus.NOT_ACCEPTABLE);

        server.stop();
    });
});