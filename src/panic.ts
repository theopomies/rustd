export function panic(msg = "explicit panic"): never {
  throw new Error(`Thread panicked at '${msg}'`);
}
