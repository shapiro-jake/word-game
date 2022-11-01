# word-game

## Rules

Two players play the Word Game simultaneously. Initially, they submit a one-word random guess. After both have submitted their initial guess, they see what the other person has guessed and submit a second guess, and so on. The goal of the game is to guess the same word by using some commonalities between the previous two (or more) guesses. Guesses must be one word, are not case sensitive, and cannot be repeated in the same match.

## Running the Word Game

To run the Word Game, open two terminals and run the following commands, one in each:

```bash
npm run server
```

```bash
npm run watchify-play
```

Then, navigate to [localhost:8789](https://localhost:8789) on as many tabs as you'd like and play the Word Game!

## Next Steps

As extensions, I'd like to deploy the game to a web domain so players on different machines can play the game at once, to support more than 2 players playing in one match, and to add an element of ML to the Word Game. Specifically, I'd like to be able to visualize the trajectory of the players' guesses using dimensionality reduction of the words' representations by a model such as Word2Vec, or to allow a player to play against an AI by having the AI guess the most similar word to the previous guesses.

I hope you enjoy!

## License

Shield: [![CC BY-SA 4.0][cc-by-sa-shield]][cc-by-sa]

This work is licensed under a
[Creative Commons Attribution-ShareAlike 4.0 International License][cc-by-sa].

[![CC BY-SA 4.0][cc-by-sa-image]][cc-by-sa]

[cc-by-sa]: http://creativecommons.org/licenses/by-sa/4.0/
[cc-by-sa-image]: https://licensebuttons.net/l/by-sa/4.0/88x31.png
[cc-by-sa-shield]: https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg
