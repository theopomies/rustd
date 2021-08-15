import { panic } from "./panic.ts";
import { Err, Ok, Result } from "./result.ts";

export class Option<T> {
  protected constructor(
    private value?: T,
  ) {}

  static Some<T>(value: T): Option<T> {
    return new Option(value);
  }

  static None<T>(): Option<T> {
    return new Option();
  }

  isSome(this: Option<T>): boolean {
    return this.value != undefined;
  }

  isNone(this: Option<T>): boolean {
    return !this.isSome();
  }

  contains<U>(this: Option<T>, x: U | T): boolean {
    return this.isSome() && this.value == x;
  }

  expect(this: Option<T>, msg: string): T {
    if (this.value == undefined) panic(msg);
    return this.value;
  }

  unwrap(this: Option<T>): T {
    return this.expect("called `Option.unwrap()` on a `None` value");
  }

  unwrapOr(this: Option<T>, defaultValue: T): T {
    return this.value ?? defaultValue;
  }

  unwrapOrElse(this: Option<T>, f: () => T): T {
    return this.value ?? f();
  }

  map<U>(this: Option<T>, f: (arg: T) => U): Option<U> {
    if (this.value == undefined) {
      return None();
    }
    return Some(f(this.value));
  }

  mapOr<U>(this: Option<T>, defaultValue: U, f: (arg: T) => U): U {
    return this.map(f).unwrapOr(defaultValue);
  }

  mapOrElse<U>(this: Option<T>, defaultValue: () => U, f: (arg: T) => U): U {
    if (this.value == undefined) {
      return defaultValue();
    }
    return f(this.value);
  }

  okOr<E>(this: Option<T>, error: E): Result<T, E> {
    if (this.value == undefined) {
      return Err(error);
    }
    return Ok(this.value);
  }

  okOrElse<E>(this: Option<T>, error: () => E): Result<T, E> {
    if (this.value == undefined) {
      return Err(error());
    }
    return Ok(this.value);
  }

  iter(this: Option<T>): Iterable<T> {
    return this[Symbol.iterator]();
  }

  *[Symbol.iterator](this: Option<T>): Iterable<T> {
    if (this.value != undefined) yield this.value;
  }

  and<U>(this: Option<T>, optb: Option<U>): Option<U> {
    if (this.isNone()) return None();
    return optb;
  }

  andThen<U>(this: Option<T>, optb: () => Option<U>): Option<U> {
    if (this.isNone()) return None();
    return optb();
  }

  filter(this: Option<T>, predicate: (arg: T) => boolean): Option<T> {
    if (this.value == undefined || !predicate(this.value)) return None();
    return Some(this.value);
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

  insert(this: Option<T>, value: T): T {
    this.value = value;
    return this.value;
  }

  getOrInsert(this: Option<T>, value: T): T {
    if (this.value == undefined) return this.insert(value);
    return this.value;
  }

  getOrInsertWith(this: Option<T>, f: () => T): T {
    if (this.value == undefined) return this.insert(f());
    return this.value;
  }

  take(this: Option<T>): Option<T> {
    const newOption = new Option(this.value);
    this.value = undefined;
    return newOption;
  }

  replace(this: Option<T>, value: T): Option<T> {
    const oldOption = new Option(this.value);
    this.value = value;
    return oldOption;
  }

  zip<U>(this: Option<T>, other: Option<U>): Option<[T, U]> {
    if (this.value == undefined || other.value == undefined) {
      return None();
    }
    return Some([this.value, other.value]);
  }

  zipWith<U, R>(
    this: Option<T>,
    other: Option<U>,
    f: (lhs: T, rhs: U) => R,
  ): Option<R> {
    if (this.value == undefined || other.value == undefined) {
      return None();
    }
    return Some(f(this.value, other.value));
  }

  transpose<E>(this: Option<Result<T, E>>): Result<Option<T>, E> {
    if (this.value == undefined) return Ok(None());
    if (this.value.isOk()) return Ok(Some(this.value.unwrap()));
    return Err(this.value.unwrapErr());
  }

  flatten(this: Option<T>): Option<T> {
    if (this.value instanceof Option) return this.value;
    return new Option(this.value);
  }
}

export const { Some, None } = Option;
