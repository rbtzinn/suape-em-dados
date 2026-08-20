import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const readline = createInterface({ input: stdin, output: stdout });
const password = await readline.question("Senha inicial (não será salva): ");
readline.close();

if (password.length < 12) {
  console.error("Use uma senha com pelo menos 12 caracteres.");
  process.exitCode = 1;
} else {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  console.log(`scrypt$${salt}$${hash}`);
}
