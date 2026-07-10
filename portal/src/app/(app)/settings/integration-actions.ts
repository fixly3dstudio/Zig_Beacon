"use server";

import { revalidatePath } from "next/cache";
import {
  savePlayCredentials,
  saveAppStoreCredentials,
  disconnectStore,
  getPlayCredentials,
  getAppStoreCredentials,
} from "@/lib/reviews/credentials";
import { verifyGooglePlay } from "@/lib/reviews/google-play";
import { verifyAppStore } from "@/lib/reviews/app-store";
import { syncOneStore } from "@/lib/reviews/sync";

export type ActionResult = { ok: boolean; message: string; warning?: boolean };

function revalidateReviewSurfaces() {
  revalidatePath("/settings");
  revalidatePath("/reviews");
  revalidatePath("/");
}

export async function savePlayIntegration(input: {
  packageName: string;
  serviceAccountJson: string;
}): Promise<ActionResult> {
  const packageName = input.packageName.trim();
  if (!packageName) return { ok: false, message: "Package name is required." };

  let clientEmail: string | undefined;
  let privateKey: string | undefined;
  try {
    const parsed = JSON.parse(input.serviceAccountJson) as {
      client_email?: string;
      private_key?: string;
    };
    clientEmail = parsed.client_email;
    privateKey = parsed.private_key;
  } catch {
    return { ok: false, message: "Service account JSON is not valid JSON." };
  }
  if (!clientEmail || !privateKey) {
    return {
      ok: false,
      message: "JSON is missing client_email or private_key — paste the full service account key file.",
    };
  }

  // Authenticate first so we don't store obviously-bad keys.
  try {
    await verifyGooglePlay({ packageName, clientEmail, privateKey });
  } catch (error) {
    return {
      ok: false,
      message: `Could not connect to Google Play reviews: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }

  // Persist the credentials, THEN pull reviews. Persistence never depends on the
  // review fetch succeeding, so the connection survives a refresh either way.
  await savePlayCredentials({ packageName, clientEmail, privateKey });
  const sync = await syncOneStore("play");
  revalidateReviewSurfaces();

  if (sync.error) {
    return {
      ok: true,
      warning: true,
      message: `Connected, but the first review pull failed: ${sync.error}. Credentials are saved — try Sync now from App Reviews.`,
    };
  }
  return {
    ok: true,
    message: `Google Play connected — pulled ${sync.fetched} review${sync.fetched === 1 ? "" : "s"} (${sync.created} new).`,
  };
}

export async function saveAppStoreIntegration(input: {
  appId: string;
  keyId: string;
  issuerId: string;
  privateKey: string;
}): Promise<ActionResult> {
  const appId = input.appId.trim();
  const keyId = input.keyId.trim();
  const issuerId = input.issuerId.trim();
  const privateKey = input.privateKey.trim();
  if (!appId || !keyId || !issuerId || !privateKey) {
    return { ok: false, message: "All App Store Connect fields are required." };
  }

  // For App Store Connect the credential check IS a review fetch, so persist the
  // keys first and let the sync below surface any auth problem — this guarantees
  // the connection sticks across a refresh.
  await saveAppStoreCredentials({ appId, keyId, issuerId, privateKey });
  const sync = await syncOneStore("appstore");
  revalidateReviewSurfaces();

  if (sync.error) {
    return {
      ok: true,
      warning: true,
      message: `Saved, but App Store Connect returned: ${sync.error}. Double-check the App ID and key role, then Test connection.`,
    };
  }
  return {
    ok: true,
    message: `App Store Connect connected — pulled ${sync.fetched} review${sync.fetched === 1 ? "" : "s"} (${sync.created} new).`,
  };
}

export async function testIntegration(store: "play" | "appstore"): Promise<ActionResult> {
  try {
    if (store === "play") {
      const creds = await getPlayCredentials();
      if (!creds) return { ok: false, message: "Google Play is not configured." };
      await verifyGooglePlay(creds);
      return { ok: true, message: "Google Play connection is healthy." };
    }
    const creds = await getAppStoreCredentials();
    if (!creds) return { ok: false, message: "App Store Connect is not configured." };
    await verifyAppStore(creds);
    return { ok: true, message: "App Store Connect connection is healthy." };
  } catch (error) {
    return {
      ok: false,
      message: `Connection failed: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
}

export async function disconnectIntegration(store: "play" | "appstore"): Promise<ActionResult> {
  await disconnectStore(store);
  revalidatePath("/settings");
  revalidatePath("/reviews");
  return { ok: true, message: "Disconnected." };
}
