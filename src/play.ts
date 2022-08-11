import { assert } from 'console';
import HttpStatus from 'http-status-codes';
import $ from 'jquery';


function startGame(): void {
    const registrationPage = document.getElementById('registration') as HTMLElement;
    assert(registrationPage);
    registrationPage.classList.remove('hidden');

    const playerIDElement = document.getElementById('PlayerID') as HTMLInputElement;
    assert(playerIDElement);
    playerIDElement.value = '';

    const requestedIDElement = document.getElementById('OpponentID') as HTMLInputElement;
    assert(requestedIDElement);
    requestedIDElement.value = '';
    
    const registerButton = document.getElementById('registerButton') as HTMLButtonElement;
    assert(registerButton);
    registerButton.disabled = false;

    $('#registerButton').off('click').on('click', function() {
        registrationPage.classList.add('hidden');
        const playerID: string = playerIDElement.value;
        const requestedID: string = requestedIDElement.value;
        registerPlayer(playerID, requestedID);
    });

    $('#PlayerID').off('keypress').on('keypress', function(event) {
        if (event.key === 'Enter'){
            registerButton.click();
            registerButton.disabled = true;
        }
    });

    $('#OpponentID').off('keypress').on('keypress', function(event) {
        if (event.key === 'Enter'){
            registerButton.click();
            registerButton.disabled = true;
        }
    });
}

function registerPlayer(playerID: string, requestedID: string) {
    const pairing = document.getElementById('pairing') as HTMLElement;
    assert(pairing);
    pairing.classList.remove('hidden');

    const request = new XMLHttpRequest();
    const url = `http://localhost:8789/register?playerID=${playerID}&requestedID=${requestedID}`;

    request.addEventListener('loadend', function onRegister() {
        if (this.status === HttpStatus.NOT_ACCEPTABLE) {
            pairing.classList.add('hidden');
            startGame();
            alert(`${this.responseText}`);
        } else {
            console.log(`Successfully registered ${playerID}. Starting the game now...`);
            pairing.classList.add('hidden');
            const opponentID: string = JSON.parse(this.response).opponent;
            WordGame(playerID, opponentID);
        }
    });
    
    request.open('GET', url);
    console.log(`Sending registration request to ${url}`);
    request.send();
}

function WordGame(playerID: string, opponentID: string) {
    const play = document.getElementById('play') as HTMLElement;
    assert(play);
    play.classList.remove('hidden');

    const welcomePlayerID = document.getElementById('welcomePlayerID') as HTMLElement;
    assert(welcomePlayerID);
    welcomePlayerID.innerHTML = `Welcome, ${playerID}!`;

    const opponentText = document.getElementById('opponentText') as HTMLElement;
    assert(opponentText);
    opponentText.innerHTML = `Playing against ${opponentID}`;

    const previousGuesses = document.getElementById('previousGuesses') as HTMLElement;
    assert(previousGuesses);

    const guessElements = document.getElementsByClassName("guess");
    assert(guessElements);

    const guessHTML = document.getElementById('guess') as HTMLInputElement;
    assert(guessHTML);

    const submitButton = document.getElementById('submitButton') as HTMLButtonElement;
    assert(submitButton);
    submitButton.disabled = false;
    $('#submitButton').off('click keypress').on('click', submitGuess);
    $('#guess').off('keypress').on('keypress', function(event) {
        if (event.key === 'Enter'){
            submitButton.click();
            submitButton.disabled = true;
        }
    });

    const playAgainButton = document.getElementById('playAgainButton') as HTMLButtonElement;
    assert(playAgainButton);
    playAgainButton.addEventListener('click', playAgain);

    const thanksForPlaying = document.getElementById('thanksText') as HTMLElement;
    assert(thanksForPlaying);

    function submitGuess() {
        submitButton.disabled = true;

        const guess = guessHTML.value;

        const request = new XMLHttpRequest();
        const url = `http://localhost:8789/submit/${playerID}/${guess}`;

        request.addEventListener('load', function onSubmit() {
            if (this.status === HttpStatus.NOT_ACCEPTABLE) {
                alert(`${this.responseText}`);
                submitButton.disabled = false;
            } else {
                guessHTML.value = '';

                const result = JSON.parse(this.response);
                if (result.match) {    
                    addClass(guessElements, 'hidden');
                    playAgainButton.classList.remove('hidden');

                    previousGuesses.innerHTML = `Congratulations! You guys matched with \"${result.matchingGuess}\"
                                                 after ${result.numberOfGuesses} guesses!`;
                } else {
                    submitButton.disabled = false;
                    previousGuesses.innerHTML = `Womp, womp. You guys did not submit a match.\nPrevious guesses: \"${result.guess1}\" and \"${result.guess2}\"`;
                }
            }
        });

        request.open('GET', url);
        console.log(`Sending submit request to ${url}`);
        request.send();
    }

    function playAgain() {
        playAgainButton.disabled = true;

        const request = new XMLHttpRequest();
        const url = `http://localhost:8789/playAgain/${playerID}/true`;

        request.addEventListener('load', function onPlayAgain() {
            playAgainButton.disabled = false;
            playAgainButton.classList.add('hidden');
            removeClass(guessElements, 'hidden');
            previousGuesses.innerHTML = '';

            const rematch = JSON.parse(this.response).rematch;
            if (rematch) {
                submitButton.disabled = false;
            } else {
                play.classList.add('hidden');
                registerPlayer(playerID, '');
            }
        });

        request.open('GET', url);
        console.log(`Sending playAgain request to ${url}`);
        request.send();
    }

    addEventListener('unload', function noPlayAgain() {
        const request = new XMLHttpRequest();
        const url = `http://localhost:8789/playAgain/${playerID}/false`;
        request.open('GET', url);
        console.log(`Sending noPlayAgain request to ${url}`);
        request.send();
    });
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