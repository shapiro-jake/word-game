# word-game

## Rules

Two players play the Word Game simultaneously. Initially, they submit a one-word random guess. After both have submitted their initial guess, they see what the other person has guessed and submit a second guess, and so on. The goal of the game is to guess the same word by using some commonalities between the previous two (or more) guesses. Guesses must be one word, are not case sensitive, and cannot be repeated in the same match.

## Running the Word Game

To run the Word Game, open two terminals and run the following commands, one in each:

```bash
npm run server 8789
```

```bash
npm run watchify-play
```

Then, navigate to [localhost:8789]localhost:8789 on as many tabs as you'd like and play the Word Game!

## Next Steps

As improvements, I'd like to deploy the game to a web domain so players on different machines can play the game at once, to support more than 2 players playing in one match, and to add an element of ML to the Word Game.

I hope you enjoy!
