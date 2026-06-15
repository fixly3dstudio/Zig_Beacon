import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
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
  source: "database" | "browser" | "env" | "none";
  lastSyncedAt: string | null;
  lastStatus: string | null;
  /** Non-secret hint shown in the UI (e.g. package name / app id). */
  hint: string | null;
};

type StoredIntegration = {
  store: string;
  config: string;
  connected: boolean;
  lastSyncedAt: Date | null;
  lastStatus: string | null;
};

const COOKIE_PREFIX = "zig-beacon-integration-";

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

function integrationCookieName(store: string) {
  return `${COOKIE_PREFIX}${store}`;
}

async function readCookieIntegration(store: string): Promise<StoredIntegration | null> {
  try {
    const jar = await cookies();
    const raw = jar.get(integrationCookieName(store))?.value;
    if (!raw) return null;
    const parsed = JSON.parse(decodeURIComponent(raw)) as {
      store?: string;
      config?: string;
      connected?: boolean;
      lastSyncedAt?: string | null;
      lastStatus?: string | null;
    };
    if (!parsed.config || !parsed.connected) return null;
    return {
      store,
      config: parsed.config,
      connected: true,
      lastSyncedAt: parsed.lastSyncedAt ? new Date(parsed.lastSyncedAt) : null,
      lastStatus: parsed.lastStatus ?? null,
    };
  } catch {
    return null;
  }
}

async function writeCookieIntegration(row: StoredIntegration) {
  const jar = await cookies();
  jar.set(
    integrationCookieName(row.store),
    encodeURIComponent(
      JSON.stringify({
        store: row.store,
        config: row.config,
        connected: row.connected,
        lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
        lastStatus: row.lastStatus,
      })
    ),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    }
  );
}

async function deleteCookieIntegration(store: string) {
  const jar = await cookies();
  jar.delete(integrationCookieName(store));
}

// ── Read stored config (decrypted) ────────────────────────────────────────
async function readConfig<T>(store: string): Promise<T | null> {
  const row = await prisma.storeIntegration.findUnique({ where: { store } });
  const saved = row?.connected ? row : await readCookieIntegration(store);
  if (!saved || !saved.connected) return null;
  try {
    return JSON.parse(decrypt(saved.config)) as T;
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
  await writeCookieIntegration({
    store: "play",
    config,
    connected: true,
    lastSyncedAt: null,
    lastStatus: null,
  });
  await prisma.storeIntegration.upsert({
    where: { store: "play" },
    create: { store: "play", config, connected: true },
    update: { config, connected: true, lastStatus: null },
  });
}

export async function saveAppStoreCredentials(creds: AppStoreCredentials) {
  const config = encrypt(JSON.stringify(creds));
  await writeCookieIntegration({
    store: "appstore",
    config,
    connected: true,
    lastSyncedAt: null,
    lastStatus: null,
  });
  await prisma.storeIntegration.upsert({
    where: { store: "appstore" },
    create: { store: "appstore", config, connected: true },
    update: { config, connected: true, lastStatus: null },
  });
}

export async function disconnectStore(store: "play" | "appstore") {
  await deleteCookieIntegration(store);
  await prisma.storeIntegration
    .delete({ where: { store } })
    .catch(() => undefined);
}

export async function markSync(store: "play" | "appstore", status: string) {
  const cookieRow = await readCookieIntegration(store);
  if (cookieRow) {
    await writeCookieIntegration({
      ...cookieRow,
      lastSyncedAt: new Date(),
      lastStatus: status,
    });
  }
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
  const cookieRows = await Promise.all([
    readCookieIntegration("play"),
    readCookieIntegration("appstore"),
  ]);
  const byStore = new Map<string, StoredIntegration>(
    rows.map((r) => [
      r.store,
      {
        store: r.store,
        config: r.config,
        connected: r.connected,
        lastSyncedAt: r.lastSyncedAt,
        lastStatus: r.lastStatus,
      },
    ])
  );
  for (const row of cookieRows) {
    if (row && !byStore.has(row.store)) byStore.set(row.store, row);
  }

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
        source: rows.some((item) => item.store === store) ? "database" : "browser",
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
