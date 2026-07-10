export class ConfigError extends Error {
  readonly name = "ConfigError";

  constructor(message: string) {
    super(message);
  }
}
