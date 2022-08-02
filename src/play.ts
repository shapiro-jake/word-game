import { assert } from 'console';
import HttpStatus from 'http-status-codes';


function startGame(): void {

    const playerIDElement = document.getElementById('PlayerID') as HTMLInputElement;
    assert(playerIDElement);
    
    const submitButton = document.getElementById('registerButton') as HTMLButtonElement;
    assert(submitButton);

    submitButton.addEventListener('click', function() {
        registerPlayer(playerIDElement.value);
    });
}

function registerPlayer(playerID: string) {
    const registration = document.getElementById('registration') as HTMLElement;
    assert(registration);
    registration.setAttribute('hidden', 'hidden');

    const pairing = document.getElementById('pairing') as HTMLElement;
    assert(pairing);
    pairing.removeAttribute('hidden');

    const welcomePlayerID = document.getElementById('welcomePlayerID') as HTMLElement;
    assert(welcomePlayerID);

    const opponentText = document.getElementById('opponentText') as HTMLElement;
    assert(opponentText);

    const request = new XMLHttpRequest();
    const url = `http://localhost:8789/register/${playerID}`;

    request.addEventListener('loadend', function onRegiter() {
        if (this.status === HttpStatus.NOT_ACCEPTABLE) {
            registration.removeAttribute('hidden');
            pairing.setAttribute('hidden', 'hidden');
            
            alert(`${this.responseText}`);
        } else {
            console.log(`Successfully registered ${playerID}. Starting the game now...`);

            pairing.setAttribute('hidden', 'hidden');
            
            welcomePlayerID.innerHTML = `Welcome, ${playerID}!`;

            const opponentID: string = JSON.parse(this.response).opponent;
            opponentText.innerHTML = `Playing against ${opponentID}`;

            document.getElementById('play')?.removeAttribute('hidden');
            WordGame(playerID);
        }
    });
    
    request.open('GET', url);
    console.log(`Sending registration request to ${url}`);
    request.send();
}

function WordGame(playerID: string) {
    let submitting = false;

    const submitButton = document.getElementById('submitButton') as HTMLButtonElement;
    assert(submitButton);
    submitButton.addEventListener('click', submitGuess);

    const previousGuesses = document.getElementById('previousGuesses') as HTMLElement;
    assert(previousGuesses);

    function submitGuess() {
        // Cannot submit more than once in one turn
        if (submitting) {
            console.log('Already submitting a guess!');
            return;
        }
        submitting = true;

        const guessHTML = document.getElementById('guess') as HTMLInputElement;
        const guess = guessHTML.value;

        const request = new XMLHttpRequest();
        const url = `http://localhost:8789/submit/${playerID}/${guess}`;

        request.addEventListener('load', function onSubmit() {
            if (this.status === HttpStatus.NOT_ACCEPTABLE) {
                alert(`${this.responseText}`);
            } else {
                const result = JSON.parse(this.response);
                if (result.match) {
                    submitButton.disabled = true;
                    previousGuesses.innerHTML = `Congratulations! You guys matched with \"${result.matchingGuess}\"
                                                 after ${result.numberOfGuesses} guesses!`;
                } else {
                    previousGuesses.innerHTML = `Womp, womp. You guys did not submit a match.\nPrevious guesses: \"${result.guess1}\" and \"${result.guess2}\"`;
                }
            }
        });
        request.addEventListener('loadend', function onSubmitDone() {
            submitting = false;
        });

        request.open('GET', url);
        console.log(`Sending submit request to ${url}`);
        request.send();
    }
}

startGame();