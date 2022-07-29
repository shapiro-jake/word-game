import { assert } from 'console';
import express, { Application } from 'express';
import { Server } from 'http';
import HttpStatus from 'http-status-codes';
import { Match } from './Match';
import bodyParser from 'body-parser';
import asyncHandler from 'express-async-handler';


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
    private readonly matches: Map<string, Match> = new Map();
    private nextMatch: Match = new Match();



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
    ) {
        this.app = express();
        this.app.use((request, response, next) => {
            response.set('Access-Control-Allow-Origin', '*');
            next();
        });

        /**
         * Set '/dist' to static directory from which to serve files
         */
        this.app.use(express.static('dist'));
        this.app.set('view engine', 'ejs');
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        
        /**
         * Display registration page as initial webpage.
         */
        this.app.get('/', (request, response) => {
            response.render('registration');
        });

        /** 
         * Handle a request for /register/playerID by responding with the response of the Word Game
         * if playerID consists of only alphanumeric characters; error 406 otherwise.
         */
        this.app.post('/register', (request, response) => {
            const playerID = request.body.PlayerID;
            assert(playerID);

            // Check that playerID consists of only alphanumeric characters
            if (!/^[A-Za-z0-9]+$/.test(playerID)) {
                response
                    .status(HttpStatus.NOT_ACCEPTABLE)
                    .type('text')
                    .send(`${playerID} is an invalid username!`);

            // playerID is valid but already playing a match
            } else if (this.matches.get(playerID) !== undefined) {
                response
                    .status(HttpStatus.NOT_ACCEPTABLE)
                    .type('text')
                    .send(`${playerID} is already registered in a match!`);
            // playerID is valid and is not already registered
            } else {
                // Try to register the player
                try {
                    // Successful registration
                    this.nextMatch.registerPlayer(playerID);
                    this.matches.set(playerID, this.nextMatch);

                    // Match is full, so create a new match for which players can register
                    if (this.nextMatch.numberOfPlayers === 2) {
                        this.nextMatch = new Match();
                    }
                    console.log(this.matches.get(playerID)?.toString());
                    response.render('play', {playerID: playerID});

                // Failed registration - either match is already full or player is already registered in this match
                } catch (e) {
                    response
                        .status(HttpStatus.NOT_ACCEPTABLE)
                        .type('text')
                        .send(`${playerID} is already registered, or there are already two people playing!`);
                }
            }
        });

        /**
         * Handle a request for /submit/playerID/word by responding with the response of the Word Game
         * if playerID consists of only alphanumeric characters and word is a single word that consists of only letters;
         * error 406 otherwise
         */
        this.app.post('/submit', asyncHandler(async (request, response) => {
            const { playerID, guess } = request.body;
            console.log(request.body);
            assert(playerID);
            assert(guess);
            if (typeof playerID === 'string' && typeof guess === 'string') {
                if(/[\w\d]+/.test(playerID) && /[\w]/.test(guess)) {
                    const playersMatch: Match = this.matches.get(playerID) ?? new Match();
                    await playersMatch.submitWord(playerID, guess);
                    const { result, guess1, guess2 } = playersMatch.checkForMatch();;
                    if (result) {
                        response
                            .status(HttpStatus.OK)
                            .type('text')
                            .send(`${playerID} submitted ${guess} and it's a match! Congratulations!`);
                    } else {
                        response
                            .status(HttpStatus.OK)
                            .type('text')
                            .send(`Womp womp, you guys did not submit a match. The two guess were \"${guess1}\" and \"${guess2}\"`);
                    }
                } else {
                    response
                        .status(HttpStatus.NOT_ACCEPTABLE)
                        .type('text')
                        .send('Invalid playerID or word!');
                }
            }
        }));

        // /**
        //  * Handle a request for /playAgain/playerID by responding with the response of the Word Game
        //  * if playerID consists of only alphanumeric characters;
        //  * error 406 otherwise
        //  */
        // this.app.get('/playAgain/:playerID', (request, response) => {
        //     const { playerID } = request.params;
        //     assert(playerID);
        //     if(/[\w\d]+/.test(playerID)) {
        //         response
        //         .status(HttpStatus.OK)
        //         .type('text')
        //         .send(`${playerID} has elected to play again!`);
        //     } else {
        //         response
        //         .status(HttpStatus.NOT_ACCEPTABLE)
        //         .type('text')
        //         .send('Invalid playerID');
        //     }
        // });
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
            });
        });
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

/**
 * Start a server
 */
 async function main(): Promise<void> {
    const desiredPort = 8789;
    const server: WebServer = new WebServer(desiredPort);
    await server.start();
}

if (require.main === module) {
    void main();
}