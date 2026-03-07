import bcrypt from "bcrypt";

export async function hashPassword(plain: string) {
  const hashedValue = await bcrypt.hash(plain, 12);
  return hashedValue;
}

export async function comparePassword(plain: string, hash: string) {
  const isVerified = await bcrypt.compare(plain, hash);
  return isVerified;
}
