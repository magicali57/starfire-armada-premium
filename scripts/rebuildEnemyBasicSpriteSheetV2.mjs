import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const partsDir = "asset-source";
const prefix = "enemy_basic_idle_sheet.b64.part";
const expectedDigest = "dd84345ab058df6154bf11605e2b887be40e8dd3fe10e206eb4e50641efe0736";
const outputPath = "public/assets/ui-v2/gameplay/rapid-fire-premium/animations/enemy_basic_idle/enemy_basic_idle_sheet.png";

const parts = fs
  .readdirSync(partsDir)
  .filter((name) => name.startsWith(prefix))
  .sort();

if (parts.length !== 5) {
  throw new Error(`Expected 5 sprite-sheet source chunks, found ${parts.length}.`);
}

const encoded = parts
  .map((name) => fs.readFileSync(path.join(partsDir, name), "utf8").trim())
  .join("");
const bytes = Buffer.from(encoded, "base64");
const digest = crypto.createHash("sha256").update(bytes).digest("hex");

if (digest !== expectedDigest) {
  throw new Error(`Reconstructed PNG checksum mismatch: ${digest}`);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, bytes);
console.info(`Reconstructed verified sprite sheet: ${outputPath} (${bytes.length} bytes)`);
