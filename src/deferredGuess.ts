/**
 * Collaboratively authored by Rob Miller and Max Goldman,
 * with contributions from Saman Amarasinghe, Adam Chlipala,
 * Srini Devadas, Michael Ernst, John Guttag, Daniel Jackson,
 * Martin Rinard, and Armando Solar-Lezama,
 * and from Robert Durfee, Jenna Himawan, Stacia Johanna,
 * Jessica Shi, Daniel Whatley, and Elizabeth Zhou.
 * This work is licensed under CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/
 * No changes were made.
 */

import assert from 'assert';

type Resolver<T> = (value: T | PromiseLike<T>) => void;
type Rejector = (reason: Error) => void;

/** Deferred represents a promise plus operations to resolve or reject it. */
export class Deferred<T> {

  /** The promise. */
  public readonly promise: Promise<T>;

  /** Mutator: fulfill the promise with a value of type T. */
  public readonly resolve: Resolver<T>;

  /** Mutator: reject the promise with an Error value. */
  public readonly reject: Rejector;
  
  /** Make a new Deferred. */
  public constructor() {
    let resolve: Resolver<T> | undefined;
    let reject: Rejector | undefined;

    this.promise = new Promise<T>((res: Resolver<T>, rej: Rejector) => {
      resolve = res;
      reject = rej;
    });

    // TypeScript's static checking doesn't know for sure 
    // that the Promise constructor callback above is called synchronously,
    // so assert that resolve and reject have indeed been initialized by this point
    assert(resolve);
    assert(reject);
    this.resolve = resolve;
    this.reject = reject;
  }

}