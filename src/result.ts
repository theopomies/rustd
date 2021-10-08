import { panic } from "./panic.ts";
import { None, Option, Some } from "./option.ts";

enum ResultTag {
  Ok,
  Err,
}

interface ResultOk<T> {
  tag: ResultTag.Ok;
  value: T;
}

interface ResultErr<E> {
  tag: ResultTag.Err;
  err: E;
}

/** Error handling with the `Result` type.
 *
 * `Result<T, E>` is the type used for returning and propagating
 * errors. It is acts as an enum with the variants, `Ok(T)`, representing
 * success and containing a value, and `Err(E)`, representing error
 * and containing an error value.
 *
 * Functions return `Result` whenever errors are expected and
 * recoverable.
 *
 * A simple function returning `Result` might be
 * defined and used like so:
 *
 * ```ts
 * function divide(n: number, d: number): Result<Number, string> {
 *    if (d == 0) return Err(`${n} / ${d} cannot be computed, denominator must be non-zero.`);
 *    return Ok(n / d);
 * }
 *
 * let goodResult = divide(5, 2.5);
 * console.log(goodResult.isOk()); // true
 * goodResult = goodResult.map((i) => i * 21);
 * console.log(goodResult.isOk()); // true
 * let value = goodResult.unwrap();
 * console.log(value); // 42
 *
 * let badResult = divide(42, 0);
 * console.log(badResult.isErr()); // true
 * console.error(badResult.unwrapErr()); // "42 / 0 cannot be computed, denominator must be non-zero."
 * ```
 */
export class Result<T, E> {
  protected constructor(private result: ResultOk<T> | ResultErr<E>) {}

  /** Contains the success value */
  static Ok<T, E>(value: T): Result<T, E> {
    return new Result({ tag: ResultTag.Ok, value });
  }

  /** Contains the error value */
  static Err<T, E>(err: E): Result<T, E> {
    return new Result({ tag: ResultTag.Err, err });
  }

  /** Returns `true` if the result is `Ok`.
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * let x: Result<number, string> = Ok(-3);
   * console.log(x.isOk()); // true
   *
   * let y: Result<number, string> = Err("Some error message");
   * console.log(y.isOk()); // false
   * ```
   */
  isOk(this: Result<T, E>): boolean {
    return this.result.tag == ResultTag.Ok;
  }

  /** Returns `true` if the result is `Err`.
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * let x: Result<number, string> = Ok(-3);
   * console.log(x.isErr()); // false
   *
   * let y: Result<number, string> = Err("Some error message");
   * console.log(y.isErr()); // true
   * ```
   */
  isErr(this: Result<T, E>): boolean {
    return !this.isOk();
  }

  /** Returns `true` if the result is an `Ok` value containing the given value.
   * (loose equality `==`);
   *
   * # Examples
   *
   * ```ts
   * let x: Result<number, string> = Ok(2);
   * console.log(x.contains(2)); // true
   *
   * let y: Result<number, string> = Ok(3);
   * console.log(y.contains(2)); // false
   *
   * let z: Result<number, string> = Err("Some error message");
   * console.log(z.contains(2)); // false
   * ```
   */
  contains<U>(this: Result<T, E>, x: T | U): boolean {
    return this.result.tag == ResultTag.Ok && this.result.value == x;
  }

  /** Returns `true` if the result is an `Err` value containing the given value.
   * (loose equality `==`);
   *
   * # Examples
   *
   * ```ts
   * let x: Result<number, string> = Ok(2);
   * console.log(x.containsErr("Some error message")); // false
   *
   * let y: Result<number, string> = Err("Some error message");
   * console.log(y.containsErr("Some error message")); // true
   *
   * let z: Result<number, string> = Err("Some other error message");
   * console.log(z.containsErr("Some error message")); // false
   * ```
   */
  containsErr<F>(this: Result<T, E>, x: E | F): boolean {
    return this.result.tag == ResultTag.Err && this.result.err == x;
  }

  /** Converts from `Result<T, E>` to `Option<T>`.
   *
   * Converts `self` into an `Option<T>`,
   * and discarding the error, if any.
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * let x: Result<number, string> = Ok(2);
   * let xOk: Option<number> = x.ok()
   * console.log(xOk.isSome() && xOk.contains(2)); // true
   *
   * let y: Result<number, string> = Err("Nothing here");
   * console.log(y.ok().isNone()); // true
   * ```
   */
  ok(this: Result<T, E>): Option<T> {
    if (this.result.tag == ResultTag.Err) return None();
    return Some(this.result.value);
  }

  /** Converts from `Result<T, E>` to `Option<E>`.
   *
   * Converts `self` into an `Option<E>`,
   * and discarding the success value, if any.
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * let x: Result<number, string> = Ok(2);
   * console.log(x.err().isNone()); // true
   *
   * let y: Result<number, string> = Err("Nothing here");
   * let yErr: Option<string> = y.err();
   * console.log(yErr.isSome() && yErr.contains("Nothing here")); // true
   * ```
   */
  err(this: Result<T, E>): Option<E> {
    if (this.result.tag == ResultTag.Ok) return None();
    return Some(this.result.err);
  }

  /** Maps a `Result<T, E>` to `Result<U, E>` by applying a function to a
   * contained `Ok` value, leaving an `Err` value untouched.
   *
   * This function can be used to compose the results of two functions.
   *
   * # Examples
   *
   * Print the numbers on each line of a string squared.
   *
   * ```ts
   * let line = "1\n2\n3\n4\n";
   *
   * function parseInteger(n: string): Result<number, string> {
   *    const parsed = parseInt(n);
   *    if (Number.isNaN(parsed)) return Err(`${n} is not a Number!`);
   *    return Ok(parsed);
   * }
   *
   * // Array.map
   * for (let parsingResult of line.split("\n").map(parseInteger)) {
   *    // Log numbers squared, using Result.map, discard errors
   *    if (parsingResult.isOk()) console.log(parsingResult.map((x) => x * x).unwrap());
   * }
   * ```
   */
  map<U>(this: Result<T, E>, op: (arg: T) => U): Result<U, E> {
    if (this.result.tag == ResultTag.Err) return Err(this.result.err);
    return Ok(op(this.result.value));
  }

  /** Returns the provided default (if `Err`), or
   * applies a function to the contained value (if `Ok`),
   *
   * Arguments passed to `mapOr` are eagerly evaluated; if you are passing
   * the result of a function call, it is recommended to use `mapOrElse`,
   * which is lazily evaluated.
   *
   * # Examples
   *
   * ```ts
   * let x: Result<string, string> = Ok("foo");
   * console.log(x.mapOr(42, (v) => v.length)); // 3
   *
   * let y: Result<string, string> = Err("bar");
   * console.log(y.mapOr(42, (v) => v.length)); // 42
   * ```
   */
  mapOr<U>(this: Result<T, E>, defaultValue: U, f: (arg: T) => U): U {
    if (this.result.tag == ResultTag.Err) return defaultValue;
    return f(this.result.value);
  }

  /** Maps a `Result<T, E>` to `U` by applying a fallback function to a
   * contained `Err` value, or a default function to a
   * contained `Ok` value.
   *
   * This function can be used to unpack a successful result
   * while handling an error.
   *
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * let k = 21;
   *
   * let x : Result<string, string> = Ok("foo");
   * console.log(x.mapOrElse((e) => k * 2, (v) => v.length)); // 3
   *
   * let y : Result<string, string> = Err("bar");
   * console.log(y.mapOrElse((e) => k * 2, (v) => v.length)); // 42
   * ```
   */
  mapOrElse<U>(
    this: Result<T, E>,
    defaultValue: (arg: E) => U,
    f: (arg: T) => U,
  ): U {
    if (this.result.tag == ResultTag.Err) return defaultValue(this.result.err);
    return f(this.result.value);
  }

  /** Maps a `Result<T, E>` to `Result<T, F>` by applying a function to a
   * contained `Err` value, leaving an `Ok` value untouched.
   *
   * This function can be used to pass through a successful result while handling
   * an error.
   *
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * function stringifyError(code: number): string {
   *    return `error code: ${code}`;
   * }
   *
   * let x: Result<number, number> = Ok(2);
   * console.log(x.mapErr(stringify).unwrap()); // 2
   *
   * let y: Result<number, number> = Err(13);
   * console.log(y.mapErr(stringify).unwrapErr()); // error code: 13
   * ```
   */
  mapErr<F>(this: Result<T, E>, f: (arg: E) => F): Result<T, F> {
    if (this.result.tag == ResultTag.Ok) return Ok(this.result.value);
    return Err(f(this.result.err));
  }

  /** Returns an iterator over the possibly contained value.
   *
   * The iterator yields one value if the result is `Result::Ok`, otherwise none.
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * let x: Result<number, string> = Ok(7);
   * console.log(x.iter().next().value); // 7
   *
   * let y: Result<number, string> = Err("nothing!");
   * console.log(y.iter().next().value); // undefined (empty iterator, done is set to true)
   * ```
   */
  iter(this: Result<T, E>): Iterable<T> {
    return this[Symbol.iterator]();
  }

  *[Symbol.iterator](this: Result<T, E>): Iterable<T> {
    if (this.result.tag == ResultTag.Ok) yield this.result.value;
  }

  /** Returns `res` if the result is `Ok`, otherwise returns the `Err` value of `self`.
   *
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * let x: Result<number, string> = Ok(2);
   * let y: Result<string, string> = Err("late error");
   * console.log(x.and(y).unwrapErr()); // late error
   *
   * let x: Result<number, string> = Err("early error");
   * let y: Result<string, string> = Ok("foo");
   * console.log(x.and(y).unwrapErr()); // early error
   *
   * let x: Result<number, string> = Err("not a 2");
   * let y: Result<string, string> = Err("late error");
   * console.log(x.and(y).unwrapErr()); // not a 2
   *
   * let x: Result<number, string> = Ok(2);
   * let y: Result<string, string> = Ok("different result type");
   * console.log(x.and(y).unwrap()); // different result type
   * ```
   */
  and<U>(this: Result<T, E>, res: Result<U, E>): Result<U, E> {
    if (this.result.tag == ResultTag.Ok) return res;
    return Err(this.result.err);
  }

  /** Calls `op` if the result is `Ok`, otherwise returns the `Err` value of `self`.
   *
   *
   * This function can be used for control flow based on `Result` values.
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * function sq(x: number): Result<number, number> {
   *    return Ok(x * x);
   * }
   * function err(x: number): Result<number, number> {
   *    return Err(x);
   * }
   *
   * console.log(Ok(2).andThen(sq).andThen(sq).unwrap()); // 16
   * console.log(Ok(2).andThen(sq).andThen(err).unwrapErr()); // 4
   * console.log(Ok(2).andThen(err).andThen(sq).unwrapErr()); // 2
   * console.log(Err(3).andThen(sq).andThen(sq).unwrapErr()); // 3
   * ```
   */
  andThen<U>(this: Result<T, E>, op: (arg: T) => Result<U, E>): Result<U, E> {
    if (this.result.tag == ResultTag.Ok) return op(this.result.value);
    return Err(this.result.err);
  }

  /** Returns `res` if the result is `Err`, otherwise returns the `Ok` value of `self`.
   *
   * Arguments passed to `or` are eagerly evaluated; if you are passing the
   * result of a function call, it is recommended to use `orElse`, which is
   * lazily evaluated.
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * let x: Result<number, string> = Ok(2);
   * let y: Result<number, string> = Err("late error");
   * console.log(x.or(y).unwrap()); // 2
   *
   * let x: Result<number, string> = Err("early error");
   * let y: Result<number, string> = Ok(2);
   * console.log(x.or(y).unwrap()); // 2
   *
   * let x: Result<number, string> = Err("not a 2");
   * let y: Result<number, string> = Err("late error");
   * console.log(x.or(y).unwrapErr()); // late error
   *
   * let x: Result<number, string> = Ok(2);
   * let y: Result<number, string> = Ok(100);
   * console.log(x.or(y).unwrap()); // 2
   * ```
   */
  or<F>(this: Result<T, E>, res: Result<T, F>): Result<T, F> {
    if (this.result.tag == ResultTag.Err) return res;
    return Ok(this.result.value);
  }

  /** Calls `op` if the result is `Err`, otherwise returns the `Ok` value of `self`.
   *
   * This function can be used for control flow based on result values.
   *
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * function sq(x: number): Result<number, number> { return Ok(x * x); }
   * function err(x: number): Result<number, number> { return Err(x); }
   *
   * console.log(Ok(2).orElse(sq).orElse(sq).unwrap()); // 2
   * console.log(Ok(2).orElse(err).orElse(sq).unwrap()); // 2
   * console.log(Err(3).orElse(sq).orElse(err).unwrap()); // 9
   * console.log(Err(3).orElse(err).orElse(err).unwrapErr()); // 3
   * ```
   */
  orElse<F>(this: Result<T, E>, op: (arg: E) => Result<T, F>): Result<T, F> {
    if (this.result.tag == ResultTag.Err) return op(this.result.err);
    return Ok(this.result.value);
  }

  /** Returns the contained `Ok` value or a provided default.
   *
   * Arguments passed to `unwrapOr` are eagerly evaluated; if you are passing
   * the result of a function call, it is recommended to use `unwrapOrElse`,
   * which is lazily evaluated.
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * let defaultValue = 2;
   * let x: Result<number, string> = Ok(9);
   * console.log(x.unwrapOr(defaultValue)); // 9
   *
   * let y: Result<number, string> = Err("error");
   * console.log(y.unwrapOr(defaultValue)); // 2
   * ```
   */
  unwrapOr(this: Result<T, E>, defaultValue: T): T {
    if (this.result.tag == ResultTag.Err) return defaultValue;
    return this.result.value;
  }

  /** Returns the contained `Ok` value or computes it from a closure.
   *
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * function count(x: string): number { return x.length; }
   *
   * console.log(Ok(2).unwrapOrElse(count)); // 2
   * console.log(Err("foo").unwrapOrElse(count)); // 3
   * ```
   */
  unwrapOrElse(this: Result<T, E>, op: (arg: E) => T): T {
    if (this.result.tag == ResultTag.Err) return op(this.result.err);
    return this.result.value;
  }

  /** Returns the contained `Ok` value, consuming the `self` value.
   *
   * # Panics
   *
   * Panics if the value is an `Err`, with a panic message including the
   * passed message, and the content of the `Err`.
   *
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * let x: Result<number, string> = Err("emergency failure");
   * x.expect("Testing expect"); // panics with `Testing expect: emergency failure`
   * ```
   */
  expect(this: Result<T, E>, msg: string): T {
    if (this.result.tag == ResultTag.Err) panic(`${msg}: ${this.result.err}`);
    return this.result.value;
  }

  /** Returns the contained `Ok` value, consuming the `self` value.
   *
   * Because this function may panic, its use is generally discouraged
   * unless preceded by `isOk`.
   * Instead, prefer to call `unwrapOr`, `unwrapOrElse`, or
   * `unwrapOr_default`.
   *
   * # Panics
   *
   * Panics if the value is an `Err`, with a panic message provided by the
   * `Err`'s value.
   *
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * let x: Result<number, string> = Ok(2);
   * console.log(x.unwrap()); // 2
   * ```
   *
   * ```ts
   * let x: Result<number, string> = Err("emergency failure");
   * x.unwrap(); // panics with `emergency failure`
   * ```
   */
  unwrap(this: Result<T, E>): T {
    if (this.result.tag == ResultTag.Err) {
      panic(
        `called \`Result.unwrap()\` on an \`Err\` value: ${this.result.err}`,
      );
    }
    return this.result.value;
  }

  /** Returns the contained `Err` value.
   *
   * # Panics
   *
   * Panics if the value is an `Ok`, with a panic message including the
   * passed message, and the content of the `Ok`.
   *
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * let x: Result<number, string> = Ok(10);
   * x.expectErr("Testing expectErr"); // panics with `Testing expectErr: 10`
   * ```
   */
  expectErr(this: Result<T, E>, msg: string): E {
    if (this.result.tag == ResultTag.Ok) panic(`${msg}: ${this.result.value}`);
    return this.result.err;
  }

  /** Returns the contained `Err` value, consuming the `self` value.
   *
   * # Panics
   *
   * Panics if the value is an `Ok`, with a custom panic message provided
   * by the `Ok`'s value.
   *
   * # Examples
   *
   * ```ts
   * let x: Result<number, string> = Ok(2);
   * x.unwrapErr(); // panics with `2`
   * ```
   *
   * ```ts
   * let x: Result<number, string> = Err("emergency failure");
   * console.log(x.unwrapErr()); // emergency failure
   * ```
   */
  unwrapErr(this: Result<T, E>): E {
    if (this.result.tag == ResultTag.Ok) {
      panic(
        `called \`Result::unwrap_err()\` on an \`Ok\` value: ${this.result.value}`,
      );
    }
    return this.result.err;
  }

  /** Transposes a `Result` of an `Option` into an `Option` of a `Result`.
   *
   * `Ok(None)` will be mapped to `None`.
   * `Ok(Some(_))` and `Err(_)` will be mapped to `Some(Ok(_))` and `Some(Err(_))`.
   *
   * # Examples
   *
   * ```ts
   * #derive(Debug, Eq, PartialEq)
   * struct SomeErr;
   *
   * let x: Result<Option<number>, SomeErr> = Ok(Some(5));
   * let y: Option<Result<number, SomeErr>> = Some(Ok(5));
   * // Both are equivalent now, though equality is hard to prove in JS.
   * ```
   */
  transpose(this: Result<Option<T>, E>): Option<Result<T, E>> {
    if (this.result.tag == ResultTag.Ok && this.result.value.isNone()) {
      return None();
    }
    if (this.result.tag == ResultTag.Ok) {
      return Some(Ok(this.result.value.unwrap()));
    }
    return Some(Err(this.result.err));
  }

  /** Converts from `Result<Result<T, E>, E>` to `Result<T, E>`
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * #!feature(result_flattening)
   * let x: Result<Result<string, number>, number> = Ok(Ok("hello"));
   * console.log(`${x.flatten()}`); // Ok("hello")
   *
   * let x: Result<Result<string, number>, number> = Ok(Err(6));
   * console.log(`${x.flatten()}`); // Err(6)
   *
   * let x: Result<Result<string, number>, number> = Err(6);
   * console.log(`${x.flatten()}`); // Err(6)
   * ```
   *
   * Flattening only removes one level of nesting at a time:
   *
   * ```ts
   * let x: Result<Result<Result<string, number>, number>, number> = Ok(Ok(Ok("hello")));
   * console.log(`${x.flatten()}`); // Ok(Ok("hello"))
   * console.log(`${x.flatten().flatten()}`); // Ok("hello")
   * ```
   */
  flatten(this: Result<T, E>): Result<T, E> {
    if (
      this.result.tag == ResultTag.Ok && this.result.value instanceof Result
    ) {
      return this.result.value;
    }
    return new Result(this.result);
  }

  toString(this: Result<T, E>): string {
    if (this.result.tag == ResultTag.Ok) return `Ok(${this.result.value})`;
    return `Err(${this.result.err})`;
  }
}

export const { Ok, Err } = Result;
/** Converts a function that throws anything in a function that returns
 * `Ok(returnValue)` on success and `Err(Error)` on failure, Error
 * being the Error instance thrown by the function.
 *
 * Basic usage:
 * ```ts
 * function divide(n: number, d: number): number {
 *    if (d == 0) throw `${n} / ${d} cannot be computed, denominator must be non-zero.`;
 *    return n / d;
 * }
 *
 * let safeDivision = resultify(divide);
 *
 * let goodResult = safeDivision(5, 2.5);
 * console.log(goodResult.isOk()); // true
 * console.log(goodResult.unwrap()); // 2
 *
 * let badResult = safeDivision(42, 0);
 * console.log(badResult.isErr()); // true
 * console.error(badResult.unwrapErr()); // "42 / 0 cannot be computed, denominator must be non-zero."
 * ```
 */
// deno-lint-ignore ban-types
export function resultify(f: Function): Function {
  // deno-lint-ignore no-explicit-any
  return (...args: any) => {
    try {
      return Ok(f(...args));
    } catch (e) {
      return Err(e);
    }
  };
}
