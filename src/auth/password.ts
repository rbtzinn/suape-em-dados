import "server-only";

import { scryptSync, timingSafeEqual } from "node:crypto";

export function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, salt, encodedHash] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !encodedHash) return false;
  const expected = Buffer.from(encodedHash, "base64url");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
