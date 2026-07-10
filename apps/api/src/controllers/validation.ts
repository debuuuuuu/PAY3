export class BadRequestError extends Error {
  readonly name = "BadRequestError";
}

export class NotFoundError extends Error {
  readonly name = "NotFoundError";
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestError(`${field} is required.`);
  }
  return value.trim();
}

export function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new BadRequestError("Expected a string value.");
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function requireUuid(value: unknown, field: string): string {
  const raw = requireString(value, field);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      raw,
    )
  ) {
    throw new BadRequestError(`${field} must be a valid UUID.`);
  }
  return raw;
}
