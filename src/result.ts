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

export class Result<T, E> {
  protected constructor(private result: ResultOk<T> | ResultErr<E>) {}

  static Ok<T, E>(value: T): Result<T, E> {
    return new Result({ tag: ResultTag.Ok, value });
  }

  static Err<T, E>(err: E): Result<T, E> {
    return new Result({ tag: ResultTag.Err, err });
  }

  isOk(this: Result<T, E>): boolean {
    return this.result.tag == ResultTag.Ok;
  }

  isErr(this: Result<T, E>): boolean {
    return !this.isOk();
  }

  expect(this: Result<T, E>, msg: string): T {
    if (this.result.tag == ResultTag.Err) panic(msg);
    return this.result.value;
  }

  unwrap(this: Result<T, E>): T {
    if (this.result.tag == ResultTag.Err) panic(`: ${this.result.err}`);
    return this.result.value;
  }

  expectErr(this: Result<T, E>, msg: string): E {
    if (this.result.tag == ResultTag.Ok) panic(msg);
    return this.result.err;
  }

  unwrapErr(this: Result<T, E>): E {
    if (this.result.tag == ResultTag.Ok) panic(`: ${this.result.value}`);
    return this.result.err;
  }

  contains<U>(this: Result<T, E>, x: T | U): boolean {
    return this.result.tag == ResultTag.Ok && this.result.value == x;
  }

  containsErr<U>(this: Result<T, E>, x: E | U): boolean {
    return this.result.tag == ResultTag.Err && this.result.err == x;
  }

  ok(this: Result<T, E>): Option<T> {
    if (this.result.tag == ResultTag.Err) return None();
    return Some(this.result.value);
  }

  err(this: Result<T, E>): Option<E> {
    if (this.result.tag == ResultTag.Ok) return None();
    return Some(this.result.err);
  }

  map<U>(this: Result<T, E>, op: (arg: T) => U): Result<U, E> {
    if (this.result.tag == ResultTag.Err) return Err(this.result.err);
    return Ok(op(this.result.value));
  }

  mapOr<U>(this: Result<T, E>, defaultValue: U, f: (arg: T) => U): U {
    if (this.result.tag == ResultTag.Err) return defaultValue;
    return f(this.result.value);
  }

  mapOrElse<U>(
    this: Result<T, E>,
    defaultValue: (arg: E) => U,
    f: (arg: T) => U,
  ): U {
    if (this.result.tag == ResultTag.Err) return defaultValue(this.result.err);
    return f(this.result.value);
  }

  mapErr<F>(this: Result<T, E>, f: (arg: E) => F): Result<T, F> {
    if (this.result.tag == ResultTag.Ok) return Ok(this.result.value);
    return Err(f(this.result.err));
  }

  iter(this: Result<T, E>): Iterable<T> {
    return this[Symbol.iterator]();
  }

  *[Symbol.iterator](this: Result<T, E>): Iterable<T> {
    if (this.result.tag == ResultTag.Ok) yield this.result.value;
  }

  and<U>(this: Result<T, E>, res: Result<U, E>): Result<U, E> {
    if (this.result.tag == ResultTag.Ok) return res;
    return Err(this.result.err);
  }

  andThen<U>(this: Result<T, E>, op: (arg: T) => Result<U, E>): Result<U, E> {
    if (this.result.tag == ResultTag.Ok) return op(this.result.value);
    return Err(this.result.err);
  }

  or<F>(this: Result<T, E>, res: Result<T, F>): Result<T, F> {
    if (this.result.tag == ResultTag.Err) return res;
    return Ok(this.result.value);
  }

  orElse<F>(this: Result<T, E>, op: (arg: E) => Result<T, F>): Result<T, F> {
    if (this.result.tag == ResultTag.Err) return op(this.result.err);
    return Ok(this.result.value);
  }

  unwrapOr(this: Result<T, E>, defaultValue: T): T {
    if (this.result.tag == ResultTag.Err) return defaultValue;
    return this.result.value;
  }

  unwrapOrElse(this: Result<T, E>, op: (arg: E) => T): T {
    if (this.result.tag == ResultTag.Err) return op(this.result.err);
    return this.result.value;
  }

  transpose(this: Result<Option<T>, E>): Option<Result<T, E>> {
    if (this.result.tag == ResultTag.Ok && this.result.value.isNone()) {
      return None();
    }
    if (this.result.tag == ResultTag.Ok) {
      return Some(Ok(this.result.value.unwrap()));
    }
    return Some(Err(this.result.err));
  }

  flatten(this: Result<T, E>): Result<T, E> {
    if (
      this.result.tag == ResultTag.Ok && this.result.value instanceof Result
    ) {
      return this.result.value;
    }
    return new Result(this.result);
  }
}

export const { Ok, Err } = Result;

// deno-lint-ignore ban-types
export function resultify(f: Function): Function {
  // deno-lint-ignore no-explicit-any
  return (...args: any[]) => {
    try {
      return Ok(f(...args));
    } catch (e) {
      return Err(e);
    }
  };
}
