import assert from 'assert';
import fetch from 'node-fetch';
import HttpStatus from 'http-status-codes';

function register(playerIDstring: string) {
    if (/^[A-Za-z0-9]+$/.test(playerIDstring)) {
        console.log(`Registering ${playerIDstring}`)
        const url = `http://localhost:8789/register/${playerIDstring}`;
        location.href = url;
    } else {
        alert(`${playerIDstring} is an invalid username!`);
    }
}

function main() {
    const registerButton: HTMLButtonElement = document.getElementById("registerButton") as HTMLButtonElement ?? assert.fail('missing register button')
    registerButton.addEventListener('click', function() {
        const playerID: HTMLInputElement = document.getElementById("PlayerID") as HTMLInputElement ?? assert.fail('missing playerID');
        const playerIDstring: string = playerID.value;
        register(playerIDstring);
    });
}

void main();
