import { assert } from 'console';
import HttpStatus from 'http-status-codes';
import $ from 'jquery';

// Registration Page HTML Elements
const registrationDiv = document.getElementById('registration') as HTMLElement;
assert(registrationDiv);

const playerIDInput = document.getElementById('PlayerID') as HTMLInputElement;
assert(playerIDInput);

const requestedIDInput = document.getElementById('OpponentID') as HTMLInputElement;
assert(requestedIDInput);

const registerButton = document.getElementById('registerButton') as HTMLButtonElement;
assert(registerButton);

// Pairing Page HTML Elements
const pairingDiv = document.getElementById('pairing') as HTMLElement;
assert(pairingDiv);

// Play Page HTML Elements
const playDiv = document.getElementById('play') as HTMLElement;
assert(playDiv);

const welcomePlayerIDText = document.getElementById('welcomePlayerID') as HTMLElement;
assert(welcomePlayerIDText);

const opponentText = document.getElementById('opponentText') as HTMLElement;
assert(opponentText);

const previousGuessesText = document.getElementById('previousGuesses') as HTMLElement;
assert(previousGuessesText);

const guessElements = document.getElementsByClassName("guess");
assert(guessElements);

const guessInput = document.getElementById('guess') as HTMLInputElement;
assert(guessInput);

const submitButton = document.getElementById('submitButton') as HTMLButtonElement;
assert(submitButton);

const rematchButton = document.getElementById('rematchButton') as HTMLButtonElement;
assert(rematchButton);

const thanksForPlayingText = document.getElementById('thanksText') as HTMLElement;
assert(thanksForPlayingText);

/**
 * Start the interactive session for the Word Game
 */
function startGame(): void {
    // Unbind previous "player leaving" event listeners
    $(window).off('unload');

    // Reset registration page
    registrationDiv.classList.remove('div--hidden');
    playerIDInput.value = '';
    requestedIDInput.value = '';
    registerButton.disabled = false;

    $('#registerButton').off('click').on('click', function() {
        // Clean registration page
        registrationDiv.classList.add('div--hidden');
        registerButton.disabled = true;

        const playerID: string = playerIDInput.value;
        const requestedID: string = requestedIDInput.value;
        registerPlayer(playerID, requestedID);
    });

    $('#PlayerID').off('keypress').on('keypress', function(event) {
        if (event.key === 'Enter'){
            registerButton.click();
        }
    });

    $('#OpponentID').off('keypress').on('keypress', function(event) {
        if (event.key === 'Enter'){
            registerButton.click();
        }
    });
}

/**
 * Try to register a player with 'playerID' to play against a player with ID 'requestedID',
 *     or a randmo player if 'requestedID' === ''
 * 
 * @param {string} playerID the ID to be registered
 * @param {string} requestedID the ID of the requested opponent, if any
 */
function registerPlayer(playerID: string, requestedID: string): void {

    // Reset pairing page
    pairingDiv.classList.remove('div--hidden');

    // Listen for player leaving while playing or waiting to be paired 
    window.addEventListener('unload', function exit() {
        const request = new XMLHttpRequest();
        const url = `http://localhost:8789/exit/${playerID}`;
        request.open('GET', url);
        console.log(`Sending exit request to ${url}`);
        request.send();
    });

    const request = new XMLHttpRequest();
    const url = `http://localhost:8789/register?playerID=${playerID}&requestedID=${requestedID}`;

    // Listen for registration attempt to be processed by the server
    request.addEventListener('load', function onRegister() {
        // Clean pairing page
        pairingDiv.classList.add('div--hidden');

        // Check for error in registering
        if (this.status === HttpStatus.NOT_ACCEPTABLE) {
            startGame();
            alert(`${this.responseText}`);
        // Successful registration
        } else {
            console.log(`Successfully registered ${playerID}. Starting the game now...`);
            const opponentID: string = JSON.parse(this.response).opponent;
            WordGame(playerID, opponentID);
        }
    });
    
    request.open('GET', url);
    console.log(`Sending registration request to ${url}`);
    request.send();
}

/**
 * Start the Word Game between 'playerID' and 'opponentID'
 * 
 * @param {string} playerID the ID of the player playing the Word Game
 * @param {string} opponentID the ID of the opponent of 'playerID'
 */
function WordGame(playerID: string, opponentID: string) {
    // Continuously check if 'playerID' is still registered in his/her match
    const checkRegisteredInterval = setInterval(checkRegistered, 1000, playerID);

    function checkRegistered() {
        const request = new XMLHttpRequest();
        const url = `http://localhost:8789/checkRegistered/${playerID}`;

        request.addEventListener('loadend', function checkedIfRegistered() {
            const isRegistered: boolean = JSON.parse(this.response).alreadyRegistered;
            // If the player is no longer registered, restart the interactive session
            if (!isRegistered) {
                console.log(`${playerID} is not registered! Restarting game!`);
                clearInterval(checkRegisteredInterval);
                cleanPlayDiv();
                alert('You suck so much the other player left. Restarting the game now.');
                startGame();
            }
        });

        request.open('GET', url);
        console.log(`Checking if ${playerID} is registered, sending request to ${url}`);
        request.send();
    }
    
    // Reset the play page
    rematchButton.classList.add('button--hidden');
    playDiv.classList.remove('div--hidden');
    removeClass(guessElements, 'div--hidden');
    welcomePlayerIDText.innerHTML = `Welcome, ${playerID}!`;
    opponentText.innerHTML = `Playing against ${opponentID}`;
    submitButton.disabled = false;
    rematchButton.disabled = true;

    $('#submitButton').off('click').on('click', submitGuess);
    $('#guess').off('keypress').on('keypress', function(event) {
        if (event.key === 'Enter'){
            submitButton.click();
        }
    });

    $('#rematchButton').off('click').on('click', rematch);

    function submitGuess() {
        submitButton.disabled = true;

        const guess = guessInput.value;
        const request = new XMLHttpRequest();
        const url = `http://localhost:8789/submit/${playerID}/${guess}`;

        // Listen for the submission to process after both players have submitted guesses
        request.addEventListener('load', function onSubmit() {
            // The guess is invalid
            if (this.status === HttpStatus.NOT_ACCEPTABLE) {
                alert(`${this.responseText}`);
                submitButton.disabled = false;
            // The guess is valid
            } else {
                guessInput.value = '';

                const result = JSON.parse(this.response);
                // The players got a match
                if (result.match) {    
                    // Hide guess elements and show rematch button
                    addClass(guessElements, 'div--hidden');
                    rematchButton.disabled = false;
                    rematchButton.classList.remove('button--hidden');

                    previousGuessesText.innerHTML = `Congratulations! You guys matched with \"${result.matchingGuess}\"
                                                 after ${result.numberOfGuesses} guesses!`;
                // The players did not get a match
                } else {
                    submitButton.disabled = false;
                    previousGuessesText.innerHTML = `Womp, womp. You guys did not submit a match.\nPrevious guesses: \"${result.guess1}\" and \"${result.guess2}\"`;
                }
            }
        });

        request.open('GET', url);
        console.log(`Sending submit request to ${url}`);
        request.send();
    }

    function rematch() {
        rematchButton.disabled = true;

        const request = new XMLHttpRequest();
        const url = `http://localhost:8789/rematch/${playerID}`;

        // Listen for the rematch request to process after both players have opted for a rematch
        request.addEventListener('load', function onRematch() {
            // Reset play text elements
            rematchButton.classList.add('button--hidden');
            removeClass(guessElements, 'div--hidden');
            previousGuessesText.innerHTML = '';

            const rematch = JSON.parse(this.response).rematch;
            // Both players have opted for a rematch
            if (rematch) {
                submitButton.disabled = false;
                alert('Both of you have elected to play again! Enjoy!');
            // There will be no rematch
            } else {
                cleanPlayDiv();
                startGame();
            }
        });

        request.open('GET', url);
        console.log(`Sending rematch request to ${url}`);
        request.send();
    }

    // Clean the play div
    function cleanPlayDiv() {
        playDiv.classList.add('div--hidden');
        welcomePlayerIDText.innerHTML = '';
        opponentText.innerHTML = '';
        previousGuessesText.innerHTML = '';
        submitButton.disabled = true;
    }
}

// Add a class to a collection of HTML elements
function addClass(elements: HTMLCollectionOf<Element>, addedClass: string): void {
    for (const element of elements) {
        element.classList.add(addedClass);
    }
}

// Remove a class to a collection of HTML elements
function removeClass(elements: HTMLCollectionOf<Element>, removedClass: string): void {
    for (const element of elements) {
        element.classList.remove(removedClass);
    }
}

startGame();