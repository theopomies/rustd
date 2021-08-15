import { panic } from "./panic.ts";
import { Err, Ok, Result } from "./result.ts";

/** Optional values.
*
* Type `Option` represents an optional value: every `Option`
* is either `Some` and contains a value, or `None`, and
* does not. `Option` types are very common in code, as
* they have a number of uses:
*
*  * Initial values
*  * Return values for functions that are not defined
*   over their entire input range (partial functions)
*  * Return value for otherwise reporting simple errors, where `None` is
*   returned on error
*  * Optional struct fields
*  * Struct fields that can be loaned or "taken"
*  * Optional function arguments
*  * Nullable pointers
*  * Swapping things out of difficult situations
*
* ```ts
* function divide(numerator: number, denominator: number): Option<number> {
*     if (denominator == 0) {
*         return None();
*     } else {
*         return Some(numerator / denominator);
*     }
* }
*
* let result = divide(2.0, 3.0);
*
* if (result.isSome()) {
*     console.log(result.unwrap()); // 0.6666666666666666
* } else {
*     console.log("The operation failed, for mysterious reasons."); // Never reached.
* }
* ```
*/
export interface Option<T> {
  /** Returns `true` if the option is a `Some` value.
   *
   * # Examples
   *
   * ```ts
   * let x: Option<number> = Some(2);
   * console.log(x.isSome()); // true
   *
   * let y: Option<number> = None();
   * console.log(y.isSome()); // false
   * ```
   */
  isSome(this: Option<T>): boolean;

  /** Returns `true` if the option is a `None` value.
   *
   * # Examples
   *
   * ```ts
   * let x: Option<number> = Some(2);
   * console.log(x.isNone()); // false
   *
   * let y: Option<number> = None();
   * console.log(y.isNone()); // true
   * ```
   */
  isNone(this: Option<T>): boolean;

  /** Returns `true` if the option is a `Some` value containing the given value.
   * (checked with the loose equalty operator `==`);
   *
   *
   * # Examples
   *
   * ```ts
   * let x: Option<number> = Some(2);
   * console.log(x.contains(2)); // true
   *
   * let x: Option<number> = Some(3);
   * console.log(x.contains(2)); // false
   *
   * let x: Option<number> = None;
   * console.log(x.contains(2)); // false
   * ```
   */
  contains<U>(this: Option<T>, x: U | T): boolean;

  /** Returns the contained `Some` value.
   *
   * # Panics (throws)
   *
   * Panics if the value is a `None` with a custom panic message provided by
   * `msg`.
   *
   * # Examples
   *
   * ```ts
   * let x = Some("value");
   * console.log(x.expect("fruits are healthy")); // "value"
   *
   * let y: Option<string> = None();
   * y.expect("fruits are healthy"); // panics with `fruits are healthy`
   * ```
   */
  expect(this: Option<T>, msg: string): T;

  /** Returns the contained `Some` value.
   *
   * Because this function may panic, please use `isSome`
   * before or call `unwrapOr`, `unwrapOrElse`.
   *
   * # Panics
   *
   * Panics if the self value equals `None`.
   *
   * # Examples
   *
   * ```ts
   * let x = Some("air");
   * console.log(x.unwrap()); // "air"
   *
   * let y: Option<string> = None();
   * console.log(y.unwrap()); // panics
   * ```
   */
  unwrap(this: Option<T>): T;

  /** Returns the contained `Some` value or a provided default.
   *
   * Arguments passed to `unwrapOr` are eagerly evaluated; if you are passing
   * the result of a function call, it is recommended to use `unwrapOrElse`,
   * which is lazily evaluated.
   *
   * # Examples
   *
   * ```ts
   * console.log(Some("car").unwrapOr("bike")); // "car"
   * console.log(None().unwrapOr("bike")); // "bike"
   * ```
   */
  unwrapOr(this: Option<T>, defaultValue: T): T;

  /** Returns the contained `Some` value or computes it from a callback.
   *
   * # Examples
   *
   * ```ts
   * let k = 10;
   * console.log(Some(4).unwrapOrElse(() => 2 * k)); // 4
   * console.log(None().unwrapOrElse(() => 2 * k)); // 20
   * ```
   */
  unwrapOrElse(this: Option<T>, f: () => T): T;

  /** Maps an `Option<T>` to `Option<U>` by applying a function to a contained value.
   *
   * # Examples
   *
   * Converts an `Option<string>` into an `Option<number>`, this does
   * **NOT** affect the original value, it produces a new `Option` containing the result
   * (still be careful if the inner value is an `Object`, this method do any copying
   * so you may get two `Option`s pointing to the same `Object`):
   *
   * ```ts
   * let maybeSomeString = Some("Hello, World!");
   * let maybeSomeLen = maybeSomeString.map((s) => s.length);
   *
   * console.log(maybeSomeLen.contains(13)); // true
   * ```
   */
  map<U>(this: Option<T>, f: (arg: T) => U): Option<U>;

  /** Returns the provided default result (if none),
   * or applies a function to the contained value (if any).
   *
   * Arguments passed to `mapOr` are eagerly evaluated; if you are passing
   * the result of a function call, it is recommended to use `mapOrElse`,
   * which is lazily evaluated.
   *
   * # Examples
   *
   * ```ts
   * let x = Some("foo");
   * console.log(x.mapOr(42, (v) => v.length)); // 3
   *
   * let y: Option<string> = None();
   * console.log(y.mapOr(42, (v) => v.length)); // 42
   * ```
   */
  mapOr<U>(this: Option<T>, defaultValue: U, f: (arg: T) => U): U;

  /** Computes a default function result (if none), or
   * applies a different function to the contained value (if any).
   *
   * # Examples
   *
   * ```ts
   * let k = 21;
   *
   * let x = Some("foo");
   * console.log(x.mapOrElse(() => 2  * k, (v) => v.length)); // 3
   *
   * let y: Option<string> = None;
   * console.log(y.mapOrElse(() => 2  * k, (v) => v.length)); // 42
   * ```
   */
  mapOrElse<U>(this: Option<T>, defaultValue: () => U, f: (arg: T) => U): U;

  /** Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to
   * `Ok(v)` and `None` to `Err(err)`.
   *
   * Arguments passed to `okOr` are eagerly evaluated; if you are passing the
   * result of a function call, it is recommended to use `okOrElse`, which is
   * lazily evaluated.
   *
   * # Examples
   *
   * ```ts
   * let x = Some("foo");
   * console.log(x.okOr(0).isOk()); // true
   *
   * let y: Option<string> = None();
   * console.log(y.okOr(0).isErr()); // true
   * ```
   */
  okOr<E>(this: Option<T>, error: E): Result<T, E>;

  /** Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to
   * `Ok(v)` and `None` to `Err(err())`.
   *
   * # Examples
   *
   * ```ts
   * let x = Some("foo");
   * console.log(x.okOrElse(() => 0).contains("foo")); // true
   *
   * let y: Option<string> = None();
   * console.log(y.okOrElse(() => 0).containsErr(0)); //true
   * ```
   */
  okOrElse<E>(this: Option<T>, error: () => E): Result<T, E>;

  /** Returns an iterator over the possibly contained value.
   *
   * # Examples
   *
   * ```ts
   * let x = Some(4);
   * console.log(x.iter().next().value); // 4
   *
   * let y: Option<number> = None();
   * console.log(y.iter().next().done); // true
   *
   * for (let value of Some(42)) {
   *    console.log(value); // 42
   * }
   * ```
   */
  iter(this: Option<T>): Iterable<T>;

  /** Returns `None` if the option is `None`, otherwise returns `optb`.
   *
   * # Examples
   *
   * ```ts
   * let x = Some(2);
   * let y: Option<string> = None();
   * console.log(x.and(y).isNone()); // true
   *
   * let x: Option<number> = None();
   * let y = Some("foo");
   * console.log(x.and(y).isNone()); // true
   *
   * let x = Some(2);
   * let y = Some("foo");
   * console.log(x.and(y).contains("foo")); // true
   *
   * let x: Option<number> = None();
   * let y: Option<string> = None();
   * console.log(x.and(y).isNone()); // true
   * ```
   */
  and<U>(this: Option<T>, optb: Option<U>): Option<U>;

  /** Returns `None` if the option is `None`, otherwise calls `f` with the
   * wrapped value and returns the result.
   *
   * Some languages call this operation flatmap.
   *
   * # Examples
   *
   * ```ts
   * function sq(x: number): Option<number> {
   *    return Some(x * x);
   * }
   * function nope(_: number): Option<number> {
   *    return None();
   * }
   *
   * console.log(Some(2).andThen(sq).andThen(sq).contains(16)); // true
   * console.log(Some(2).andThen(sq).andThen(nope).isNone()); // true
   * console.log(Some(2).andThen(nope).andThen(sq).isNone()); // true
   * console.log(None().andThen(sq).andThen(sq).isNone()); // true
   * ```
   */
  andThen<U>(this: Option<T>, optb: (arg: T) => Option<U>): Option<U>;

  /** Returns `None` if the option is `None`, otherwise calls `predicate`
   * with the wrapped value and returns:
   *
   * - `Some(t)` if `predicate` returns `true` (where `t` is the wrapped
   *   value), and
   * - `None` if `predicate` returns `false`.
   *
   * # Examples
   *
   * ```ts
   * function isEven(n: number): boolean {
   *     return n % 2 == 0
   * }
   *
   * console.log(None().filter(isEven).isNone()); // true
   * console.log(Some(3).filter(isEven).isNone()); // true
   * console.log(Some(4).filter(isEven).contains(4)); //true
   * ```
   */
  filter(this: Option<T>, predicate: (arg: T) => boolean): Option<T>;

  /** Returns the option if it contains a value, otherwise returns `optb`.
   *
   * Arguments passed to `or` are eagerly evaluated; if you are passing the
   * result of a function call, it is recommended to use `orElse`, which is
   * lazily evaluated.
   *
   * # Examples
   *
   * ```ts
   * let x = Some(2);
   * let y = None();
   * console.log(x.or(y).contains(2)); // true
   *
   * let x = None();
   * let y = Some(100);
   * console.log(x.or(y).contains(100)); // true
   *
   * let x = Some(2);
   * let y = Some(100);
   * console.log(x.or(y).contains(2)); // true
   *
   * let x: Option<number> = None();
   * let y = None();
   * console.log(x.or(y).isNone()); // true
   * ```
   */
  or(this: Option<T>, optb: Option<T>): Option<T>;

  /** Returns the option if it contains a value, otherwise calls `f` and
   * returns the result.
   *
   * # Examples
   *
   * ```ts
   * function nobody(): Option<string> {
   *    return None();
   * }
   * function vikings(): Option<string> {
   *    return Some("vikings");
   * }
   *
   * console.log(Some("barbarians").orElse(vikings).contains("barbarians")); // true
   * console.log(None().orElse(vikings).contains("vikings")); // true
   * console.log(None().orElse(nobody).isNone()); // true
   * ```
   */
  orElse(this: Option<T>, optb: () => Option<T>): Option<T>;

  /** Returns `Some` if exactly one of `self`, `optb` is `Some`, otherwise returns `None`.
   *
   * # Examples
   *
   * ```ts
   * let x = Some(2);
   * let y: Option<number> = None();
   * console.log(x.xor(y).contains(2)); // true
   *
   * let x: Option<number> = None();
   * let y = Some(2);
   * console.log(x.xor(y).contains(2)); // true
   *
   * let x = Some(2);
   * let y = Some(2);
   * console.log(x.xor(y).isNone()); // true
   *
   * let x: Option<number> = None();
   * let y: Option<number> = None();
   * console.log(x.xor(y).isNone()); // true
   * ```
   */
  xor(this: Option<T>, optb: Option<T>): Option<T>;

  /** Inserts `value` into the option then returns it.
   *
   * If the option already contains a value, the old value is overwritten.
   *
   * # Example
   *
   * ```ts
   * let opt = None();
   * let v = opt.insert(1);
   * console.log(v); // 1
   * console.log(opt.unwrap()) // 1
   * let val = opt.insert({ x: true });
   * console.log(val); // { x: true }
   * val.x = false;
   * console.log(opt.unwrap()); // { x: false }
   * ```
   */
  insert(this: Option<T>, value: T): T;

  /** Inserts `value` into the option if it is `None`, then
   * returns it.
   *
   * See also `Option.insert`, which updates the value even if
   * the option already contains `Some`.
   *
   * # Examples
   *
   * ```ts
   * let x = None();
   *
   * {
   *     let y = x.getOrInsert({ v: 5 });
   *     console.log(y); // { v: 5 }
   *
   *      y.v = 7;
   * }
   *
   * console.log(x.unwrap()); // { v: 7 };
   * ```
   */
  getOrInsert(this: Option<T>, value: T): T;

  /** Inserts a value computed from `f` into the option if it is `None`,
   * then returns it.
   *
   * # Examples
   *
   * ```ts
   * let mut x = None();
   *
   * {
   *     let y = x.getOrInsertWith(() => { v: 5 });
   *     console.log(y); // { v: 5 }
   *
   *      y.v = 7;
   * }
   *
   * console.log(x.unwrap()); // { v: 7 }
   * ```
   */
  getOrInsertWith(this: Option<T>, f: () => T): T;

  /** Takes the value out of the option, leaving a `None` in its place.
   *
   * # Examples
   *
   * ```ts
   * let x = Some(2);
   * let y = x.take();
   * console.log(x.isNone()); // true
   * console.log(y.contains(2)) // true
   *
   * let x: Option<number> = None();
   * let y = x.take();
   * console.log(x.isNone()); // true
   * console.log(y.isNone()); // true
   * ```
   */
  take(this: Option<T>): Option<T>;

  /** Replaces the actual value in the option by the value given in parameter,
   * returning the old value if present,
   * leaving a `Some` in its place without deinitializing either one.
   *
   * # Examples
   *
   * ```ts
   * let x = Some(2);
   * let old = x.replace(5);
   * console.log(x.unwrap()); // 5
   * console.log(old.unwrap()); // 2
   *
   * let x = None();
   * let old = x.replace(3);
   * console.log(x.unwrap()); // 3
   * console.log(old.isNone()); // true
   * ```
   */
  replace(this: Option<T>, value: T): Option<T>;

  /** Zips `self` with another `Option`.
   *
   * If `self` is `Some(s)` and `other` is `Some(o)`, this method returns `Some([s, o])`.
   * Otherwise, `None` is returned.
   *
   * # Examples
   *
   * ```ts
   * let x = Some(1);
   * let y = Some("hi");
   * let z = None();
   *
   * console.log(x.zip(y).unwrap()); // [ 1, "hi" ]
   * console.log(x.zip(z).isNone()); // true
   * ```
   */
  zip<U>(this: Option<T>, other: Option<U>): Option<[T, U]>;

  /** Zips `self` and another `Option` with function `f`.
   *
   * If `self` is `Some(s)` and `other` is `Some(o)`, this method returns `Some(f(s, o))`.
   * Otherwise, `None` is returned.
   *
   * # Examples
   *
   * ```ts
   * class Point {
   *    constructor(public x: number, public y: number) {}
   * }
   *
   * function newPoint(x: number, y: number): Point {
   *    return new Point(x, y);
   * }
   *
   * let x = Some(17.5);
   * let y = Some(42.7);
   *
   * console.log(x.zipWith(y, newPoint).unwrap()); // Point { x: 17.5, y: 42.7 }
   * console.log(x.zipWith(None, newPoint).isNone()); // true
   * ```
   */
  zipWith<U, R>(
    this: Option<T>,
    other: Option<U>,
    f: (lhs: T, rhs: U) => R,
  ): Option<R>;

  /** Transposes an `Option` of a `Result` into a `Result` of an `Option`.
   *
   * `None` will be mapped to `Ok(None)`.
   * `Some(Ok(_))` and `Some(Err(_))` will be mapped to
   * `Ok(Some(_))` and `Err(_)`.
   *
   * # Examples
   *
   * ```ts
   *
   * let x: Result<Option<number>, string> = Ok(Some(5));
   * let y: Option<Result<number, string>> = Some(Ok(5));
   * // Both now have the same representation
   * y = y.transpose();
   * ```
   */
  transpose<E>(this: Option<Result<T, E>>): Result<Option<T>, E>;

  /** Converts from `Option<Option<T>>` to `Option<T>`
   *
   * # Examples
   *
   * Basic usage:
   *
   * ```ts
   * let x: Option<Option<number>> = Some(Some(6));
   * console.log(x.flatten().contains(6)); // true
   *
   * let x: Option<Option<number>> = Some(None());
   * console.log(x.flatten().isNone());
   *
   * let x: Option<Option<number>> = None();
   * console.log(x.flatten().isNone());
   * ```
   *
   * Flattening only removes one level of nesting at a time:
   *
   * ```ts
   * let x: Option<Option<Option<number>>> = Some(Some(Some(6)));
   * console.log(x.flatten().unwrap().contains(6)); // true
   * console.log(x.flatten().flatten().contains(6)); // true;
   * ```
   */
  flatten(this: Option<Option<T>>): Option<T>;
  [Symbol.iterator](): Iterable<T>;
}

class FlattenHack<T> {
}
function Option<S>(value?: S): Option<S> {
  return new (class OptionImpl<T extends S> extends FlattenHack<T>
    implements Option<S> {
    constructor() {
      super();
    }

    isSome(this: Option<T>): boolean {
      return value != undefined;
    }

    isNone(this: Option<T>): boolean {
      return !this.isSome();
    }

    contains<U>(this: Option<T>, x: U | T): boolean {
      return this.isSome() && value == x;
    }

    expect(this: Option<T>, msg: string): S {
      if (value == undefined) panic(msg);
      return value;
    }

    unwrap(this: Option<T>): S {
      return this.expect("called `Option.unwrap()` on a `None` value");
    }

    unwrapOr(this: Option<T>, defaultValue: T): S {
      return value ?? defaultValue;
    }

    unwrapOrElse(this: Option<T>, f: () => T): S {
      return value ?? f();
    }

    map<U>(this: Option<T>, f: (arg: S) => U): Option<U> {
      if (value == undefined) {
        return None();
      }
      return Some(f(value));
    }

    mapOr<U>(this: Option<T>, defaultValue: U, f: (arg: T) => U): U {
      return this.map(f).unwrapOr(defaultValue);
    }

    mapOrElse<U>(this: Option<T>, defaultValue: () => U, f: (arg: S) => U): U {
      if (value == undefined) {
        return defaultValue();
      }
      return f(value);
    }

    okOr<E>(this: Option<T>, error: E): Result<S, E> {
      if (value == undefined) {
        return Err(error);
      }
      return Ok(value);
    }

    okOrElse<E>(this: Option<T>, error: () => E): Result<S, E> {
      if (value == undefined) {
        return Err(error());
      }
      return Ok(value);
    }

    iter(this: Option<T>): Iterable<S> {
      return this[Symbol.iterator]();
    }

    *[Symbol.iterator](this: Option<T>): Iterable<S> {
      if (value != undefined) yield value;
    }

    and<U>(this: Option<T>, optb: Option<U>): Option<U> {
      if (this.isNone()) return None();
      return optb;
    }

    andThen<U>(this: Option<T>, optb: (arg: S) => Option<U>): Option<U> {
      if (value == undefined) return None();
      return optb(value);
    }

    filter(this: Option<T>, predicate: (arg: S) => boolean): Option<S> {
      if (value == undefined || !predicate(value)) return None();
      return Some(value);
    }

    or(this: Option<T>, optb: Option<T>): Option<T> {
      if (this.isSome()) return this;
      return optb;
    }

    orElse(this: Option<T>, optb: () => Option<T>): Option<T> {
      if (this.isSome()) return this;
      return optb();
    }

    xor(this: Option<T>, optb: Option<T>): Option<T> {
      if (this.isSome() && optb.isNone()) return this;
      if (this.isNone()) return optb;
      return None();
    }

    insert(this: Option<T>, newValue: T): S {
      value = newValue;
      return value;
    }

    getOrInsert(this: Option<T>, value: T): T {
      if (value == undefined) return this.insert(value);
      return value;
    }

    getOrInsertWith(this: Option<T>, f: () => T): S {
      if (value == undefined) return this.insert(f());
      return value;
    }

    take(this: Option<T>): Option<S> {
      const newOption = Option(value);
      value = undefined;
      return newOption;
    }

    replace(this: Option<T>, newValue: T): Option<S> {
      const oldOption = Option(value);
      value = newValue;
      return oldOption;
    }

    zip<U>(this: Option<T>, other: Option<U>): Option<[S, U]> {
      if (value == undefined || other.isNone()) {
        return None();
      }
      return Some([value, other.unwrap()]);
    }

    zipWith<U, R>(
      this: Option<T>,
      other: Option<U>,
      f: (lhs: S, rhs: U) => R,
    ): Option<R> {
      if (value == undefined || other.isNone() == undefined) {
        return None();
      }
      return Some(f(value, other.unwrap()));
    }

    transpose<E>(this: Option<Result<T, E>>): Result<Option<T>, E> {
      if (value == undefined || !(value instanceof Result)) return Ok(None());
      if (value.isOk()) return Ok(Some(value.unwrap()));
      return Err(value.unwrapErr());
    }

    flatten(this: Option<Option<T>>): Option<S> {
      if (value != undefined && value instanceof FlattenHack) {
        return value as unknown as Option<S>;
      }
      return Option(value);
    }

    toString(this: Option<T>): string {
      if (this.isNone()) return "None";
      return `Some(${value})`;
    }
  })();
}

/** Some value `T`  */
export function Some<T>(value: T): Option<T> {
  return Option(value);
}

/** No value  */
export function None<T>(): Option<T> {
  return Option();
}
