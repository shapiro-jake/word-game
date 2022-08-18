import { assert } from 'console';
import express, { Application, response } from 'express';
import { Server } from 'http';
import HttpStatus from 'http-status-codes';
import { Match } from './Match';
import bodyParser from 'body-parser';
import asyncHandler from 'express-async-handler';
import path from 'path';
import {PythonShell} from 'python-shell';



/**
 * HTTP web server that allows players to play the Word Game
 */
export class WebServer {
    private server: Server|undefined;
    private readonly app: Application;
    private readonly matches: Map<string, Match> = new Map();
    private nextMatch: Match = new Match(this.maxPlayers);
    private readonly registeredPlayers: Set<string> = new Set();
    private requestedIDs: Set<string> = new Set(); // Set of requested IDs
    private matchRequests: Map<string, string> = new Map(); // Maps requested player to who requested it


    // Abstraction Function
    // 
    //  AF(server, app, requestedPort,
    //     matches, nextMatch, registeredPlayers, maxPlayers,
    //     requestedIDs, matchRequests) =
    // 
    //  An HTTP server 'server' supporting the Word Game running on an Express application 'app' on port 'requestedPort'
    //  where player with ID 'playerID' is playing in match 'matches.get(playerID)',
    //  the next match to be filled is 'nextMatch', the ID's of registered player in 'registeredPlayers',
    //  'maxPlayers' playing in a single match,
    //  the ID's of requested opponents in 'requestedIDs',
    //  and if a player requested to play player 'requestedID', that player's ID is 'matchRequests.get(requestedID)'
    //
    // Rep Invariant
    //     - nextMatch.numberOfPlayers <= 1
    //     - each ID in 'requestedIDs' is a key in 'matchRequests'
    //
    // Safety From Rep Exposure
    //   All fields are private
    //   In the constructor, 'requestedPort' and 'maxPlayers' is an immutable number
    //   All public methods do not return aliases to any parts of the rep

    public constructor(
        private readonly requestedPort: number,
        private readonly maxPlayers: number
    ) {
        this.app = express();
        this.app.use((request, response, next) => {
            response.set('Access-Control-Allow-Origin', '*');
            next();
        });

        // Serve static files from 'dist' or 'html'
        this.app.use(express.static('dist'));
        this.app.use(express.static('html'));
        // Allow for parsing 
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        // Test GET method
        this.app.get('/test', (request, response) => {
            console.log('HERE');
        });
        
        /**
         * Display play.html page as initial webpage.
         */
        this.app.get('/', (request, response) => {
            response.sendFile(path.resolve('html/play.html'));
        });

        /** 
         * Handle a request for /register/playerID by responding with the response of the Word Game
         * if playerID consists of only alphanumeric characters and is not already registered; error 406 otherwise.
         */
        this.app.get('/register', asyncHandler(async (request, response): Promise<any> => {
            const playerID: string = request.query['playerID']?.toString() ?? '';
            const requestedID: string = request.query['requestedID']?.toString() ?? '';

            // Check that playerID is valid
            if (!this.validID(playerID)) {
                return response
                    .status(HttpStatus.NOT_ACCEPTABLE)
                    .type('text')
                    .send(`${playerID} is an invalid username!`);

            }

            // Check that playerID is not already playing in a match
            if (this.registeredPlayers.has(playerID)) {
                return response
                    .status(HttpStatus.NOT_ACCEPTABLE)
                    .type('text')
                    .send(`${playerID} is already registered in a match!`);
            } 
            // At this point, playerID is valid and is not already registered

            // Check if playerID was requested
            if (this.requestedIDs.has(playerID)) {
                // Force playerID to play requesting player
                this.requestedIDs.delete(playerID);
                const requestingPlayer: string = this.matchRequests.get(playerID) ?? '';
                this.matchRequests.delete(playerID);

                const requestedMatch: Match = this.matches.get(requestingPlayer) ?? new Match(maxPlayers);
                this.matches.set(playerID, requestedMatch);
                this.registeredPlayers.add(playerID);

                await requestedMatch.registerPlayer(playerID);

                // At this point, requested match of playerID will have 'maxPlayers' players
                const opponent: string = this.matches.get(playerID)?.getOpponent(playerID) ?? '';
                return response
                    .status(HttpStatus.OK)
                    .json({opponent: opponent});
            }
            
            // No requested ID, so pair against next person in line
            if (requestedID === '') {
                this.matches.set(playerID, this.nextMatch);
                this.registeredPlayers.add(playerID);

                await this.nextMatch.registerPlayer(playerID);

                // Match is full, so create a new match for which players can register
                if (this.nextMatch.numberOfPlayers === maxPlayers) {
                    this.nextMatch = new Match(maxPlayers);
                }

                // At this point, match of playerID will have maxPlayers players
                const opponent: string = this.matches.get(playerID)?.getOpponent(playerID) ?? '';
                response
                    .status(HttpStatus.OK)
                    .json({opponent: opponent});

            // Otherwise, requested to play against someone
            } else {
                // Check that opponentID is valid
                if (!this.validID(requestedID)) {
                    response
                        .status(HttpStatus.NOT_ACCEPTABLE)
                        .type('text')
                        .send(`${requestedID} is an invalid username!`);

                // Can't request yourself!
                } else if (playerID === requestedID) {
                    response
                        .status(HttpStatus.NOT_ACCEPTABLE)
                        .type('text')
                        .send(`Can't request to play against yourself!`);
                // Valid requested ID
                } else {
                    this.registeredPlayers.add(playerID);

                    // Requested player is waiting to be paired up
                    if (this.matches.get(requestedID)!== undefined && this.matches.get(requestedID)?.numberOfPlayers !== maxPlayers) {
                        const requestedMatch: Match = this.matches.get(requestedID) ?? new Match(maxPlayers);
                        this.matches.set(playerID, requestedMatch);

                        await requestedMatch.registerPlayer(playerID);
                        this.nextMatch = new Match(maxPlayers);

                        const opponent: string = this.matches.get(playerID)?.getOpponent(playerID) ?? '';
                        response
                            .status(HttpStatus.OK)
                            .json({opponent: opponent});
                    // Requested player has not yet registered
                    } else {
                        const requestedMatch: Match = new Match(maxPlayers);
                        this.matches.set(playerID, requestedMatch);
                        this.requestedIDs.add(requestedID);
                        this.matchRequests.set(requestedID, playerID);

                        await requestedMatch.registerPlayer(playerID);
    
                        // At this point, requested match of playerID will have maxPlayers players
                        const opponent: string = this.matches.get(playerID)?.getOpponent(playerID) ?? '';
                        response
                            .status(HttpStatus.OK)
                            .json({opponent: opponent});
                    }
                }
            }
        }));


        /**
         * Check if a player is registered in a match
         */
        this.app.get('/checkRegistered/:playerID', (request, response) => {
            const playerID: string = request.params['playerID'] ?? '';
            assert(playerID);

            response
                .status(HttpStatus.OK)
                .json({alreadyRegistered: this.registeredPlayers.has(playerID)});
        });


        /**
         * Clear a registered player from playing
         */
        this.app.get('/exit/:playerID', (request, response) => {
            const playerID: string = request.params['playerID'] ?? '';
            assert(playerID);
            const playersMatch: Match = this.matches.get(playerID) ?? new Match(maxPlayers);
            const opponent: string = playersMatch.getOpponent(playerID) ?? ''; 

            this.matches.delete(playerID);
            this.registeredPlayers.delete(playerID);
            playersMatch.unregisterPlayer(playerID);

            if (opponent !== '') {
                this.matches.delete(opponent);
                this.registeredPlayers.delete(opponent);
                playersMatch.unregisterPlayer(opponent);
            }
            
            response
                .status(HttpStatus.OK)
                .json({opponent: opponent});
        });

        /**
         * Submit word 'guess' for player with ID 'playerID'
         * 
         * Handle a request for /submit/playerID/guess by responding with the response of the Word Game
         * if 'guess' is a single word that consists of only letters and has not been guessed yet;
         * error 406 otherwise
         * 
         * Requires that playerID is already registered in a match
         */
        this.app.get('/submit/:playerID/:guess', asyncHandler(async (request, response) => {
            const playerID: string = request.params['playerID'] ?? '';
            let guess: string = request.params['guess'] ?? '';
            assert(playerID);
            assert(guess);

            guess = guess.toLowerCase();
            const playersMatch: Match = this.matches.get(playerID) ?? new Match(maxPlayers);

            // Invalid guess - CHECK FOR WHITESPACE
            if(!/^[a-zA-Z]+$/.test(guess)) {
                response
                    .status(HttpStatus.NOT_ACCEPTABLE)
                    .type('text')
                    .send('Invalid guess! Remember, guesses must be single words consisting only of letters!');

            // Repeated guess
            } else if (playersMatch.getPreviousGuesses.has(guess)) {
                response
                    .status(HttpStatus.NOT_ACCEPTABLE)
                    .type('text')
                    .send(`You submitted ${guess}, but it has previously been submitted!`);

            // Valid guess
            } else {
                const { match, guess1, guess2 } = await playersMatch.submitWord(playerID, guess);

                // It's a match!
                if (match) {
                    response
                        .status(HttpStatus.OK)
                        .json({match: true, matchingGuess: guess1, numberOfGuesses: playersMatch.getNumberOfRounds});

                // Not a match
                } else {
                    response
                        .status(HttpStatus.OK)
                        .json({match: false, guess1: guess1, guess2: guess2});
                }
            }
        }));

        /**
         * Handle a request for /rematch/playerID for playerID that is registered in a match that just finished
         * If both players in the match opt to play again, server responds with true, the match is cleared, and they play again
         * Otherwise, server responds with false, and the players are removed from the server
         */
        this.app.get('/rematch/:playerID', asyncHandler(async (request, response) =>  {
            const playerID: string = request.params['playerID'] ?? '';
            assert(playerID);

            const playersMatch: Match = this.matches.get(playerID) ?? new Match(maxPlayers);

            const rematch: boolean = await playersMatch.rematch(playerID);

            if (!rematch) {
                this.matches.delete(playerID);
                this.registeredPlayers.delete(playerID);
            }

            response
                .status(HttpStatus.OK)
                .json({rematch: rematch});
        }));
    };

    /**
     * Check if an ID is valid (one or more alphanumeric characters without spaces)
     * 
     * @param {string} playerID the ID to be checked
     * @returns returns true iff 'playerID' is composed of one or more alphanumeric characters without spaces
     *          false otherwise
     */
    private validID(playerID: string): boolean {
        return /^[A-Za-z0-9]+$/.test(playerID);
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
 * Start a server to handle Word Game for 2-player matches
 */
 async function main(): Promise<void> {
    const desiredPort = 8789;
    const maxPlayers = 2;
    const server: WebServer = new WebServer(desiredPort, maxPlayers);
    await server.start();
}

if (require.main === module) {
    void main();
}