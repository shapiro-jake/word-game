// import assert from 'assert';
// import { Match } from '../src/Match';
// import util from 'util';

// describe('Match ADT', () => {
//     /**
//      * Testing strategy for Match ADT
//      * 
//      *   registerPlayer(playerID)
//      *     - playerID: not yet registered, already registered
//      *     - Number of registered players: 0, 1, > 1
//      *   submitWord(word)
//      *     - Number of other players at time of submission: 0, 1
//      *     - Other player: is not registered,
//      *                     is registered
//      *     - Submitted word: eventually does not match, eventually does match
//      *   getNumberOfPlayers()
//      *     - returns: 0, 1, 2
//      */

//     it('covers a single new player registering', async function() {
//         const gameState: Match = new Match();
//         const playerID = 'Bob Smithson';
//         gameState.registerPlayer(playerID);
//         const playersPlaying: Set<string> = new Set([playerID])
//         assert.strictEqual(playersPlaying, gameState.playerIDs);
//     });

//     it('covers a player who is already registered registering', async function() {
//         const gameState: Match = new Match();
//         let numberOfPlayers = 0;
//         assert.strictEqual(numberOfPlayers, gameState.numberOfPlayers);

//         const playerID = 'BobSmithson';
//         gameState.registerPlayer(playerID);
//         numberOfPlayers++;
//         const playersPlaying: Set<string> = new Set([playerID])
//         assert.strictEqual(playersPlaying, gameState.playerIDs);
//         assert.throws(() => gameState.registerPlayer(playerID));
//         assert.strictEqual(numberOfPlayers, gameState.numberOfPlayers);
//     });

//     it('covers a second player registering', async function() {
//         const gameState: Match = new Match();
//         const playerID1 = 'BobSmithson';
//         gameState.registerPlayer(playerID1);
//         const playersPlaying: Set<string> = new Set([playerID1])
//         assert.strictEqual(playersPlaying, gameState.playerIDs);

//         const playerID2 = 'JackJohn';
//         gameState.registerPlayer(playerID2);
//         playersPlaying.add(playerID2);
//         assert.strictEqual(playersPlaying, gameState.playerIDs);
//     });

//     it('covers a third player registering', async function() {
//         const gameState: Match = new Match();
//         let numberOfPlayers = 0;
//         const playerID1 = 'BobSmithson';
//         gameState.registerPlayer(playerID1);
//         numberOfPlayers++;
//         const playersPlaying: Set<string> = new Set([playerID1])
//         assert.strictEqual(playersPlaying, gameState.playerIDs);

//         const playerID2 = 'JackJohn';
//         gameState.registerPlayer(playerID2);
//         numberOfPlayers++
//         playersPlaying.add(playerID2);
//         assert.strictEqual(playersPlaying, gameState.playerIDs);

//         const playerID3 = 'LucyLove';
//         assert.throws(() => gameState.registerPlayer(playerID3));
//         assert.strictEqual(playersPlaying, gameState.playerIDs);
//         assert.strictEqual(numberOfPlayers, gameState.numberOfPlayers);
//     });

//     it('covers an unregistered player submitting a word', async function() {
//         const gameState: Match = new Match();
//         const playerID = 'BobSmithson';
//         const word = 'cat';
//         assert.throws(() => gameState.submitWord(playerID, word));
//     });

//     it('covers a single registered player submitting a word', async function() {
//         const gameState: Match = new Match();
//         const playerID = 'BobSmithson';
//         const word = 'cat'
//         gameState.registerPlayer(playerID);
//         assert.throws(() => gameState.submitWord(playerID, word));
//     });

//     it('covers two players submitting words that do not match', async function() {
//         const gameState: Match = new Match();
//         const playerID1 = 'BobSmithson';
//         const playerID2 = 'JackJohn';
//         gameState.registerPlayer(playerID1);
//         gameState.registerPlayer(playerID2);

//         const word1 = 'cat';
//         const word2 = 'dog';
//         const submitted1: Promise<boolean> = gameState.submitWord(playerID1, word1);
//         assert(util.inspect(submitted1).includes("pending"));

//         const submitted2: Promise<boolean> = gameState.submitWord(playerID2, word2);
//         assert(!submitted1);
//         assert(!submitted2);
//     });

//     it('covers two players submitting words that match', async function() {
//         const gameState: Match = new Match();
//         const playerID1 = 'BobSmithson';
//         const playerID2 = 'JackJohn';
//         gameState.registerPlayer(playerID1);
//         gameState.registerPlayer(playerID2);

//         const word = 'cat';
//         const submitted1: Promise<boolean> = gameState.submitWord(playerID1, word);
//         assert(util.inspect(submitted1).includes("pending"));

//         const submitted2: Promise<boolean> = gameState.submitWord(playerID2, word);
//         assert(submitted1);
//         assert(submitted2);
//     });
// });