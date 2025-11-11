import crypto from "crypto";

const KEY = Buffer.from((process.env.ENC_SECRET || "").padEnd(32, "x")).subarray(0, 32);

export function encrypt(text: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(base64: string): string {
  try {
    const data = Buffer.from(base64, "base64");
    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const enc = data.subarray(28);

    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(tag);

    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return dec.toString("utf8");
  } catch (err) {
    console.error("Decryption failed:", (err as Error).message);
    throw new Error("Invalid encrypted data");
  }
}