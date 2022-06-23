import express, { Application } from 'express';
import { Server } from 'http';
import { GameState } from './GameState';


/**
 * HTTP web game server that allows exactly two players with different usernames to play the 'Word Game'.
 * 
 * It can handle three different requests:
 *     - A player can sign up to play with an entered username /register/PlayerID
 *     - Once there are two players registered, each player can enter a word /submit/PlayerID/word
 *     - After a game has been completed, each player can elect to play again /playAgain/playerID
 */
export class WebServer {
    
    private readonly app: Application;
    private server: Server|undefined;

    // Abstraction Function
    //     AF(app, server, requestedPort, gameState) = an HTTP server 'server' running on an Express Application 'app' on port 'requestedPort'
    //                                                 that allows two players to play the Word Game with game state 'gameState
    // Rep Invariant
    //     - gameState.numberOfPlayers() <= 2
    // Safety From Rep Exposure
    //   All fields are private
    //   In the constructor, requestedPort is an immutable number
    //   A mutable GameState is intentionally taken as an argument to the constructor and is therefore not a problem
    //   All public methods do not return aliases to any parts of the 
    
    public constructor(
        private readonly requestedPort: number,
        private readonly gameState: GameState
    ) {
        this.app = express();
        this.app.use((request, response, next) => {
            response.set('Access-Control-Allow-Origin', '*');
            next();
        });
    }

    /**
     * Start this server
     * 
     * @returns {Promise<void>} a promise that resolves when the server is listening
     */
    public start(): Promise<void> {
        return new Promise(resolve => {
            this.server = this.app.listen(this.requestedPort, () => {
                console.log('server now listening at', this.port);
                resolve();
            })
        })
    }

    /**
     * @returns {number} the actual port that server is listening at. (May be different
     *          than the requestedPort used in the constructor, since if
     *          requestedPort = 0 then an arbitrary available port is chosen.)
     *          Requires that start() has already been called and completed.
     */
    public get port(): number {
        const address = this.server?.address() ?? 'not connected';
        if (typeof(address) === 'string') {
            throw new Error('server is not listening at a port');
        }
        return address.port;
    }

    /**
     * Stop this server. Once stopped, this server cannot be restarted.
     */
     public stop(): void {
        this.server?.close();
        console.log('server stopped');
    }
}