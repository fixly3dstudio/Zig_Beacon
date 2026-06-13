import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export type PlayCredentials = {
  packageName: string;
  clientEmail: string;
  privateKey: string;
};

export type AppStoreCredentials = {
  appId: string;
  keyId: string;
  issuerId: string;
  privateKey: string;
};

export type IntegrationStatus = {
  connected: boolean;
  source: "database" | "env" | "none";
  lastSyncedAt: string | null;
  lastStatus: string | null;
  /** Non-secret hint shown in the UI (e.g. package name / app id). */
  hint: string | null;
};

// ── Encryption (AES-256-GCM) ──────────────────────────────────────────────
// Key is derived from CREDENTIALS_SECRET (preferred) or DATABASE_URL so there is
// always a stable per-environment key. Set CREDENTIALS_SECRET in production.
function encryptionKey(): Buffer {
  const secret =
    process.env.CREDENTIALS_SECRET ||
    process.env.DATABASE_URL ||
    "zig-beacon-dev-fallback";
  return createHash("sha256").update(secret).digest();
}

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

// ── Read stored config (decrypted) ────────────────────────────────────────
async function readConfig<T>(store: string): Promise<T | null> {
  const row = await prisma.storeIntegration.findUnique({ where: { store } });
  if (!row || !row.connected) return null;
  try {
    return JSON.parse(decrypt(row.config)) as T;
  } catch {
    return null;
  }
}

// ── Credential resolvers: database first, env fallback ────────────────────
export async function getPlayCredentials(): Promise<PlayCredentials | null> {
  const fromDb = await readConfig<PlayCredentials>("play");
  if (fromDb?.packageName && fromDb.clientEmail && fromDb.privateKey) return fromDb;

  if (
    process.env.GOOGLE_PLAY_PACKAGE_NAME &&
    process.env.GOOGLE_PLAY_CLIENT_EMAIL &&
    process.env.GOOGLE_PLAY_PRIVATE_KEY
  ) {
    return {
      packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME,
      clientEmail: process.env.GOOGLE_PLAY_CLIENT_EMAIL,
      privateKey: process.env.GOOGLE_PLAY_PRIVATE_KEY,
    };
  }
  return null;
}

export async function getAppStoreCredentials(): Promise<AppStoreCredentials | null> {
  const fromDb = await readConfig<AppStoreCredentials>("appstore");
  if (fromDb?.appId && fromDb.keyId && fromDb.issuerId && fromDb.privateKey) return fromDb;

  if (
    process.env.APP_STORE_APP_ID &&
    process.env.APP_STORE_KEY_ID &&
    process.env.APP_STORE_ISSUER_ID &&
    process.env.APP_STORE_PRIVATE_KEY
  ) {
    return {
      appId: process.env.APP_STORE_APP_ID,
      keyId: process.env.APP_STORE_KEY_ID,
      issuerId: process.env.APP_STORE_ISSUER_ID,
      privateKey: process.env.APP_STORE_PRIVATE_KEY,
    };
  }
  return null;
}

// ── Persist credentials (encrypted) ───────────────────────────────────────
export async function savePlayCredentials(creds: PlayCredentials) {
  const config = encrypt(JSON.stringify(creds));
  await prisma.storeIntegration.upsert({
    where: { store: "play" },
    create: { store: "play", config, connected: true },
    update: { config, connected: true, lastStatus: null },
  });
}

export async function saveAppStoreCredentials(creds: AppStoreCredentials) {
  const config = encrypt(JSON.stringify(creds));
  await prisma.storeIntegration.upsert({
    where: { store: "appstore" },
    create: { store: "appstore", config, connected: true },
    update: { config, connected: true, lastStatus: null },
  });
}

export async function disconnectStore(store: "play" | "appstore") {
  await prisma.storeIntegration
    .delete({ where: { store } })
    .catch(() => undefined);
}

export async function markSync(store: "play" | "appstore", status: string) {
  await prisma.storeIntegration
    .update({
      where: { store },
      data: { lastSyncedAt: new Date(), lastStatus: status },
    })
    .catch(() => undefined);
}

// ── Status for the Settings UI (no secrets returned) ──────────────────────
export async function getIntegrationStatus(): Promise<{
  play: IntegrationStatus;
  appStore: IntegrationStatus;
}> {
  const rows = await prisma.storeIntegration.findMany();
  const byStore = new Map(rows.map((r) => [r.store, r]));

  function build(
    store: string,
    envConfigured: boolean,
    hintFrom: (cfg: Record<string, string>) => string
  ): IntegrationStatus {
    const row = byStore.get(store);
    if (row?.connected) {
      let hint: string | null = null;
      try {
        hint = hintFrom(JSON.parse(decrypt(row.config)));
      } catch {
        hint = null;
      }
      return {
        connected: true,
        source: "database",
        lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
        lastStatus: row.lastStatus,
        hint,
      };
    }
    if (envConfigured) {
      return { connected: true, source: "env", lastSyncedAt: null, lastStatus: null, hint: "Configured via .env" };
    }
    return { connected: false, source: "none", lastSyncedAt: null, lastStatus: null, hint: null };
  }

  return {
    play: build(
      "play",
      Boolean(process.env.GOOGLE_PLAY_PACKAGE_NAME && process.env.GOOGLE_PLAY_PRIVATE_KEY),
      (cfg) => cfg.packageName
    ),
    appStore: build(
      "appstore",
      Boolean(process.env.APP_STORE_APP_ID && process.env.APP_STORE_PRIVATE_KEY),
      (cfg) => `App ID ${cfg.appId}`
    ),
  };
}
