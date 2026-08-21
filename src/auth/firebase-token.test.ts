import { describe, expect, it } from "vitest";

import { validateFirebasePayload } from "./firebase-token-claims";

describe("validateFirebasePayload", () => {
  const now = 1_800_000_000;
  const payload = {
    aud: "suape-compliance-controle",
    auth_time: now - 10,
    email: "admin@suape.local",
    exp: now + 300,
    firebase: { sign_in_provider: "password" },
    iat: now - 10,
    iss: "https://securetoken.google.com/suape-compliance-controle",
    sub: "firebase-user-1",
    user_id: "firebase-user-1",
  };

  it("aceita claims válidas do projeto configurado", () => {
    expect(validateFirebasePayload(payload, "suape-compliance-controle", now).email)
      .toBe("admin@suape.local");
  });

  it("rejeita audiência incorreta e token expirado", () => {
    expect(() => validateFirebasePayload({ ...payload, aud: "outro" }, "suape-compliance-controle", now))
      .toThrow(/outro projeto/i);
    expect(() => validateFirebasePayload({ ...payload, exp: now }, "suape-compliance-controle", now))
      .toThrow(/expirado/i);
  });
});
