import "server-only";

import type { Role } from "@/domain/types";
import { normalizeText, parseBoolean } from "@/domain/normalization";
import { sheetsRepository } from "@/infra/google-sheets/repository";

export interface AuthorizedUser {
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
}

export async function findAuthorizedUser(email: string): Promise<AuthorizedUser | null> {
  const normalizedEmail = normalizeText(email);

  if (sheetsRepository.isConfigured()) {
    try {
      const row = (await sheetsRepository.readRows("authorized_users")).find(
        (candidate) =>
          normalizeText(candidate.email) === normalizedEmail &&
          parseBoolean(candidate.active) !== false,
      );
      if (row && ["ADMIN", "ANALYST", "VIEWER"].includes(row.role)) {
        return {
          email: row.email,
          name: row.display_name || row.email,
          role: row.role as Role,
          passwordHash: row.password_hash,
        };
      }
    } catch {
      // O usuário inicial por variável de ambiente permanece como recuperação segura.
    }
  }

  if (
    process.env.BOOTSTRAP_ADMIN_EMAIL &&
    process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH &&
    normalizeText(process.env.BOOTSTRAP_ADMIN_EMAIL) === normalizedEmail
  ) {
    return {
      email: process.env.BOOTSTRAP_ADMIN_EMAIL,
      name: "Administrador",
      role: "ADMIN",
      passwordHash: process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH,
    };
  }

  return null;
}
