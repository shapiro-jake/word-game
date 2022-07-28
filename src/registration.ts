import assert from 'assert';
import fetch from 'node-fetch';
import HttpStatus from 'http-status-codes';

function register(playerIDstring: string) {
    const req = new XMLHttpRequest()
    const url = `http://localhost:8789/register/${playerIDstring}`;
    req.addEventListener('load', function onRegistration() {
        if (this.status === HttpStatus.NOT_ACCEPTABLE) {
            alert(`${this.responseText}`);
        } else {
            console.log(`Registered ${playerIDstring}`);
        }
    });

    req.open('GET', url);
    console.log(`Sending registration request to ${url}`);
    req.send();
}

function main() {
    // const registerButton: HTMLButtonElement = document.getElementById("registerButton") as HTMLButtonElement ?? assert.fail('missing register button')
    // registerButton.addEventListener('click', function() {
    //     const playerID: HTMLInputElement = document.getElementById("PlayerID") as HTMLInputElement ?? assert.fail('missing playerID');
    //     const playerIDstring: string = playerID.value;
    //     register(playerIDstring);
    // });
}

void main();
