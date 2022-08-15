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

function startGame(): void {
    $(window).off('unload');

    registrationDiv.classList.remove('hidden');
    playerIDInput.value = '';
    requestedIDInput.value = '';
    registerButton.disabled = false;

    $('#registerButton').off('click').on('click', function() {
        registrationDiv.classList.add('hidden');
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

function registerPlayer(playerID: string, requestedID: string) {

    pairingDiv.classList.remove('hidden');

    window.addEventListener('unload', function exit() {
        const request = new XMLHttpRequest();
        const url = `http://localhost:8789/exit/${playerID}`;
        request.open('GET', url);
        console.log(`Sending exit request to ${url}`);
        request.send();
    });

    const request = new XMLHttpRequest();
    const url = `http://localhost:8789/register?playerID=${playerID}&requestedID=${requestedID}`;

    request.addEventListener('load', function onRegister() {
        pairingDiv.classList.add('hidden');
        if (this.status === HttpStatus.NOT_ACCEPTABLE) {
            startGame();
            alert(`${this.responseText}`);
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

function WordGame(playerID: string, opponentID: string) {
    const checkRegisteredInterval = setInterval(checkRegistered, 1000, playerID);

    function checkRegistered() {
        const request = new XMLHttpRequest();
        const url = `http://localhost:8789/checkRegistered/${playerID}`;

        request.addEventListener('loadend', function checkedIfRegistered() {
            const isRegistered: boolean = JSON.parse(this.response).alreadyRegistered;
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
    
    playDiv.classList.remove('hidden');
    welcomePlayerIDText.innerHTML = `Welcome, ${playerID}!`;
    opponentText.innerHTML = `Playing against ${opponentID}`;
    submitButton.disabled = false;

    $('#submitButton').off('click').on('click', submitGuess);
    $('#guess').off('keypress').on('keypress', function(event) {
        if (event.key === 'Enter'){
            submitButton.click();
            submitButton.disabled = true;
        }
    });

    $('#rematchButton').off('click').on('click', rematch);

    function submitGuess() {
        submitButton.disabled = true;

        const guess = guessInput.value;

        const request = new XMLHttpRequest();
        const url = `http://localhost:8789/submit/${playerID}/${guess}`;

        request.addEventListener('load', function onSubmit() {
            if (this.status === HttpStatus.NOT_ACCEPTABLE) {
                alert(`${this.responseText}`);
                submitButton.disabled = false;
            } else {
                guessInput.value = '';

                const result = JSON.parse(this.response);
                if (result.match) {    
                    addClass(guessElements, 'hidden');
                    rematchButton.classList.remove('hidden');

                    previousGuessesText.innerHTML = `Congratulations! You guys matched with \"${result.matchingGuess}\"
                                                 after ${result.numberOfGuesses} guesses!`;
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

        request.addEventListener('load', function onRematch() {
            rematchButton.disabled = false;
            rematchButton.classList.add('hidden');
            removeClass(guessElements, 'hidden');
            previousGuessesText.innerHTML = '';

            const rematch = JSON.parse(this.response).rematch;
            if (rematch) {
                submitButton.disabled = false;
            } else {
                cleanPlayDiv();
                startGame();
            }
        });

        request.open('GET', url);
        console.log(`Sending rematch request to ${url}`);
        request.send();
    }

    function cleanPlayDiv() {
        playDiv.classList.add('hidden');
        welcomePlayerIDText.innerHTML = '';
        opponentText.innerHTML = '';
        previousGuessesText.innerHTML = '';
        submitButton.disabled = true;
    }
}

function addClass(elements: HTMLCollectionOf<Element>, addedClass: string): void {
    for (const element of elements) {
        element.classList.add(addedClass);
    }
}

function removeClass(elements: HTMLCollectionOf<Element>, removedClass: string): void {
    for (const element of elements) {
        element.classList.remove(removedClass);
    }
}

startGame();