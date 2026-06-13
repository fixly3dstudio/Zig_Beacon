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

export type ActionResult = { ok: boolean; message: string };

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

  try {
    await verifyGooglePlay({ packageName, clientEmail, privateKey });
  } catch (error) {
    return {
      ok: false,
      message: `Could not authenticate with Google: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }

  await savePlayCredentials({ packageName, clientEmail, privateKey });
  revalidatePath("/settings");
  revalidatePath("/reviews");
  return { ok: true, message: "Google Play connected." };
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

  try {
    await verifyAppStore({ appId, keyId, issuerId, privateKey });
  } catch (error) {
    return {
      ok: false,
      message: `Could not authenticate with App Store Connect: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }

  await saveAppStoreCredentials({ appId, keyId, issuerId, privateKey });
  revalidatePath("/settings");
  revalidatePath("/reviews");
  return { ok: true, message: "App Store Connect connected." };
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
