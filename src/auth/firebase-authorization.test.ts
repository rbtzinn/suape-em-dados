import { afterEach, describe, expect, it } from "vitest";

import { firebaseRoleForEmail } from "./firebase-authorization";

const previous = {
  admin: process.env.FIREBASE_ADMIN_EMAILS,
  analyst: process.env.FIREBASE_ANALYST_EMAILS,
  viewer: process.env.FIREBASE_VIEWER_EMAILS,
};

afterEach(() => {
  process.env.FIREBASE_ADMIN_EMAILS = previous.admin;
  process.env.FIREBASE_ANALYST_EMAILS = previous.analyst;
  process.env.FIREBASE_VIEWER_EMAILS = previous.viewer;
});

describe("firebaseRoleForEmail", () => {
  it("nega por padrão e respeita os papéis configurados", () => {
    process.env.FIREBASE_ADMIN_EMAILS = "admin@suape.local";
    process.env.FIREBASE_ANALYST_EMAILS = "analista@suape.local";
    process.env.FIREBASE_VIEWER_EMAILS = "leitor@suape.local";

    expect(firebaseRoleForEmail("ADMIN@suape.local")).toBe("ADMIN");
    expect(firebaseRoleForEmail("analista@suape.local")).toBe("ANALYST");
    expect(firebaseRoleForEmail("leitor@suape.local")).toBe("VIEWER");
    expect(firebaseRoleForEmail("desconhecido@suape.local")).toBeNull();
  });
});
