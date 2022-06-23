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
     *     - Number of players registered: 0, 1, 2
     * 
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

    it('covers a player submitting a word with only themselves playing', async function () {
        const playerID = 'BobSmith'
        const word = 'cat'
        
        const server = await startServer(0);
        const registerURL = `http://localhost:${server.port}/register/${playerID}`
        const registerResponse = await fetch(registerURL);
        assert.strictEqual(await registerResponse.text(), `Registered ${playerID}`);

        const submitURL = `http://localhost:${server.port}/submit/${playerID}/${word}`
        const submitResponse = await fetch(submitURL);
        assert.strictEqual(await submitResponse.text(), `${playerID} is the only player playing!`);
        assert.strictEqual(submitResponse.status, HttpStatus.NOT_ACCEPTABLE);

        server.stop(); 
    });

    it('covers two players submitting non-matching words', async function () {
        const player1ID = 'BobSmith'
        const player2ID = 'JackJohn'

        const word1 = 'cat'
        const word2 = 'dog'
        
        const server = await startServer(0);

        const registerURL1 = `http://localhost:${server.port}/register/${player1ID}`
        const registerResponse1 = await fetch(registerURL1);
        assert.strictEqual(await registerResponse1.text(), `Registered ${player1ID}`);

        const registerURL2 = `http://localhost:${server.port}/register/${player2ID}`
        const registerResponse2 = await fetch(registerURL2);
        assert.strictEqual(await registerResponse2.text(), `Registered ${player2ID}`);

        const submitURL1 = `http://localhost:${server.port}/submit/${player1ID}/${word1}`
        const submitResponse1 = await fetch(submitURL1);
        assert.strictEqual(await submitResponse1.text(), `${player1ID} submitted: ${word1}`);


        const submitURL2 = `http://localhost:${server.port}/submit/${player2ID}/${word2}`
        const submitResponse2 = await fetch(submitURL2);
        assert.strictEqual(await submitResponse2.text(), `${player2ID} submitted \'${word2}\' \
            while ${player1ID} submitted \'${word1}\', which do not match. Try again!`);

        const playAgainURL = `http://localhost:${server.port}/playAgain/${player1ID}/`;
        const playAgainResponse = await fetch(playAgainURL);
        assert.strictEqual(await playAgainResponse.text(), `${player1ID} cannot play again, they have not won!`);
        assert.strictEqual(playAgainResponse.status, HttpStatus.NOT_ACCEPTABLE);

        server.stop(); 
    });

    it('covers two players submitting matching words', async function () {
        const player1ID = 'BobSmith'
        const player2ID = 'JackJohn'

        const word = 'cat'
        
        const server = await startServer(0);

        const registerURL1 = `http://localhost:${server.port}/register/${player1ID}`
        const registerResponse1 = await fetch(registerURL1);
        assert.strictEqual(await registerResponse1.text(), `Registered ${player1ID}`);

        const registerURL2 = `http://localhost:${server.port}/register/${player2ID}`
        const registerResponse2 = await fetch(registerURL2);
        assert.strictEqual(await registerResponse2.text(), `Registered ${player2ID}`);

        const submitURL1 = `http://localhost:${server.port}/submit/${player1ID}/${word}`
        const submitResponse1 = await fetch(submitURL1);
        assert.strictEqual(await submitResponse1.text(), `Both players submitted \'${word}\'! Congratulations!`);


        const submitURL2 = `http://localhost:${server.port}/submit/${player2ID}/${word}`
        const submitResponse2 = await fetch(submitURL2);
        assert.strictEqual(await submitResponse2.text(), `${player2ID} submitted: ${word}`);

        const playAgainURL = `http://localhost:${server.port}/playAgain/${player1ID}/`;
        const playAgainResponse = await fetch(playAgainURL);
        assert.strictEqual(await playAgainResponse.text(), `${player1ID} has decided to play again!`);
        assert.strictEqual(playAgainResponse.status, HttpStatus.NOT_ACCEPTABLE);

        server.stop(); 
    });
});