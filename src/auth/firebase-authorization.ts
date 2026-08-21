import type { Role } from "@/domain/types";

function emailSet(value: string | undefined): Set<string> {
  return new Set(
    String(value ?? "")
      .split(",")
      .map((email) => email.trim().toLocaleLowerCase("pt-BR"))
      .filter(Boolean),
  );
}

export function firebaseRoleForEmail(email: string): Role | null {
  const normalized = email.trim().toLocaleLowerCase("pt-BR");
  if (!normalized) return null;
  if (emailSet(process.env.FIREBASE_ADMIN_EMAILS).has(normalized)) return "ADMIN";
  if (emailSet(process.env.FIREBASE_ANALYST_EMAILS).has(normalized)) return "ANALYST";
  return "VIEWER";
}
