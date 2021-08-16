/** Throws a critical logic error **not meant to be caught**. */
export function panic(msg = "explicit panic"): never {
  throw new Error(`Thread panicked at '${msg}'`);
}
