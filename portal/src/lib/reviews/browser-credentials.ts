"use client";

import type { AppStoreCredentials, PlayCredentials } from "./credentials";

const KEY = "zig-beacon-review-integrations";

type BrowserIntegrations = {
  appstore?: AppStoreCredentials;
  play?: PlayCredentials;
};

function readAll(): BrowserIntegrations {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as BrowserIntegrations;
  } catch {
    return {};
  }
}

function writeAll(value: BrowserIntegrations) {
  localStorage.setItem(KEY, JSON.stringify(value));
  window.dispatchEvent(new Event("zig-beacon-review-integrations"));
}

export function getBrowserIntegrations() {
  return readAll();
}

export function saveBrowserAppStoreCredentials(creds: AppStoreCredentials) {
  writeAll({ ...readAll(), appstore: creds });
}

export function saveBrowserPlayCredentials(creds: PlayCredentials) {
  writeAll({ ...readAll(), play: creds });
}

export function clearBrowserIntegration(store: "appstore" | "play") {
  const next = readAll();
  delete next[store];
  writeAll(next);
}
