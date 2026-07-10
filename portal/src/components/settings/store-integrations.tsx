"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  Apple,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Play,
  Plug,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  savePlayIntegration,
  saveAppStoreIntegration,
  testIntegration,
  disconnectIntegration,
  type ActionResult,
} from "@/app/(app)/settings/integration-actions";
import type { IntegrationStatus } from "@/lib/reviews/credentials";
import {
  clearBrowserIntegration,
  getBrowserIntegrations,
  saveBrowserAppStoreCredentials,
  saveBrowserPlayCredentials,
} from "@/lib/reviews/browser-credentials";

type Props = {
  play: IntegrationStatus;
  appStore: IntegrationStatus;
};

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status.connected) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
        <CheckCircle2 size={13} />
        {status.source === "env"
          ? "Connected (.env)"
          : status.source === "browser"
            ? "Connected (browser)"
            : "Connected"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-xs font-medium text-muted">
      Not connected
    </span>
  );
}

function ResultLine({
  result,
  onDismiss,
}: {
  result: ActionResult | null;
  onDismiss: () => void;
}) {
  if (!result) return null;
  const tone = !result.ok ? "danger" : result.warning ? "warn" : "success";
  return (
    <div
      className={cn(
        "mt-3 flex items-start gap-2 rounded-lg border p-2.5 text-[13px]",
        tone === "danger" && "border-danger/30 bg-danger/10 text-danger",
        tone === "warn" && "border-warn/30 bg-warn/10 text-warn",
        tone === "success" && "border-success/30 bg-success/10 text-success"
      )}
    >
      {tone === "success" ? (
        <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={15} className="mt-0.5 shrink-0" />
      )}
      <span className="min-w-0 flex-1">{result.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss alert"
        className="ml-auto rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand";
const labelClass = "mb-1.5 block text-xs font-medium text-foreground";

function IntegrationCard({
  icon,
  name,
  description,
  status,
  children,
  onTest,
  onDisconnect,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  status: IntegrationStatus;
  children: (helpers: { pending: boolean; setResult: (r: ActionResult) => void }) => React.ReactNode;
  onTest: () => Promise<ActionResult>;
  onDisconnect: () => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(!status.connected);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => setResult(await action()));
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface text-foreground">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{name}</h3>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 text-[13px] leading-5 text-muted">{description}</p>
          {status.connected && status.hint && (
            <p className="mt-1.5 text-xs text-muted">
              {status.hint}
              {status.lastSyncedAt &&
                ` · last synced ${new Date(status.lastSyncedAt).toLocaleString("en-SG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`}
            </p>
          )}
        </div>
      </div>

      {/* Connected: actions row */}
      {status.connected && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(onTest)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
          >
            {pending ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
            Test connection
          </button>
          {(status.source === "database" || status.source === "browser") && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(onDisconnect)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
            >
              Disconnect
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            {open ? "Hide" : "Update credentials"}
            <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
          </button>
        </div>
      )}

      {/* Credential form */}
      {open && (
        <div className="mt-4 border-t border-border pt-4">
          {children({ pending, setResult })}
        </div>
      )}

      <ResultLine result={result} onDismiss={() => setResult(null)} />
    </Card>
  );
}

export function StoreIntegrations({ play, appStore }: Props) {
  const [playStatus, setPlayStatus] = useState(play);
  const [appStoreStatus, setAppStoreStatus] = useState(appStore);

  // Play form state
  const [pkg, setPkg] = useState("");
  const [saJson, setSaJson] = useState("");
  const [playPending, startPlay] = useTransition();
  const [playResult, setPlayResult] = useState<ActionResult | null>(null);

  // App Store form state
  const [appId, setAppId] = useState("");
  const [keyId, setKeyId] = useState("");
  const [issuerId, setIssuerId] = useState("");
  const [p8, setP8] = useState("");
  const [appPending, startApp] = useTransition();
  const [appSavePending, startAppSave] = useTransition();
  const [appResult, setAppResult] = useState<ActionResult | null>(null);

  useEffect(() => {
    const saved = getBrowserIntegrations();
    if (saved.play?.packageName) {
      setPlayStatus({
        connected: true,
        source: "browser",
        lastSyncedAt: null,
        lastStatus: null,
        hint: saved.play.packageName,
      });
    }
    if (saved.appstore?.appId) {
      setAppStoreStatus({
        connected: true,
        source: "browser",
        lastSyncedAt: null,
        lastStatus: null,
        hint: `App ID ${saved.appstore.appId}`,
      });
    }
  }, []);

  function currentAppStoreCreds() {
    return {
      appId: appId.trim(),
      keyId: keyId.trim(),
      issuerId: issuerId.trim(),
      privateKey: p8.trim(),
    };
  }

  function saveAppStoreToPortal(): ActionResult {
    const creds = currentAppStoreCreds();
    if (!creds.appId || !creds.keyId || !creds.issuerId || !creds.privateKey) {
      return { ok: false, message: "All App Store Connect fields are required before saving." };
    }

    saveBrowserAppStoreCredentials(creds);
    setAppStoreStatus({
      connected: true,
      source: "browser",
      lastSyncedAt: null,
      lastStatus: "Saved in this portal browser.",
      hint: `App ID ${creds.appId}`,
    });

    return {
      ok: true,
      message:
        "App Store Connect credentials saved in this portal. You can refresh or move pages and they will stay connected.",
    };
  }

  return (
    <section className="mt-6">
      <div className="flex items-center gap-2">
        <Plug size={16} className="text-brand" />
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          App store integrations
        </h2>
      </div>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
        Connect the stores to pull live reviews into <strong>App Reviews</strong>. Credentials are
        encrypted before they are stored and are never shown again after saving.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Google Play */}
        <IntegrationCard
          icon={<Play size={20} />}
          name="Google Play"
          description="Service account with the Google Play Android Developer API, granted access in Play Console."
          status={playStatus}
          onTest={() => testIntegration("play")}
          onDisconnect={async () => {
            clearBrowserIntegration("play");
            setPlayStatus({
              connected: false,
              source: "none",
              lastSyncedAt: null,
              lastStatus: null,
              hint: null,
            });
            return disconnectIntegration("play");
          }}
        >
          {() => (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Package name</label>
                <input
                  className={inputClass}
                  placeholder="com.cdg.zig"
                  value={pkg}
                  onChange={(e) => setPkg(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Service account JSON</label>
                <textarea
                  className={cn(inputClass, "min-h-28 resize-none font-mono text-xs leading-5")}
                  placeholder='Paste the full service account key file, e.g. { "type": "service_account", "client_email": "...", "private_key": "-----BEGIN PRIVATE KEY-----..." }'
                  value={saJson}
                  onChange={(e) => setSaJson(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-muted">
                  We extract <code>client_email</code> and <code>private_key</code> from the file.
                </p>
              </div>
              <button
                type="button"
                disabled={playPending}
                onClick={() =>
                  startPlay(async () =>
                    {
                      const result = await savePlayIntegration({ packageName: pkg, serviceAccountJson: saJson });
                      if (result.ok) {
                        try {
                          const parsed = JSON.parse(saJson) as {
                            client_email?: string;
                            private_key?: string;
                          };
                          if (parsed.client_email && parsed.private_key) {
                            saveBrowserPlayCredentials({
                              packageName: pkg.trim(),
                              clientEmail: parsed.client_email,
                              privateKey: parsed.private_key,
                            });
                            setPlayStatus({
                              connected: true,
                              source: "browser",
                              lastSyncedAt: null,
                              lastStatus: result.message,
                              hint: pkg.trim(),
                            });
                          }
                        } catch {
                          // The server action will show the actual validation error.
                        }
                      }
                      setPlayResult(result);
                    }
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {playPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                Connect &amp; verify
              </button>
              <ResultLine result={playResult} onDismiss={() => setPlayResult(null)} />
            </div>
          )}
        </IntegrationCard>

        {/* App Store Connect */}
        <IntegrationCard
          icon={<Apple size={20} />}
          name="App Store Connect"
          description="App Store Connect API key (.p8) generated under Users and Access → Integrations."
          status={appStoreStatus}
          onTest={() => testIntegration("appstore")}
          onDisconnect={async () => {
            clearBrowserIntegration("appstore");
            setAppStoreStatus({
              connected: false,
              source: "none",
              lastSyncedAt: null,
              lastStatus: null,
              hint: null,
            });
            return disconnectIntegration("appstore");
          }}
        >
          {() => (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>App ID</label>
                  <input className={inputClass} placeholder="1234567890" value={appId} onChange={(e) => setAppId(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Key ID</label>
                  <input className={inputClass} placeholder="ABC123XYZ" value={keyId} onChange={(e) => setKeyId(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Issuer ID</label>
                  <input className={inputClass} placeholder="00000000-0000-…" value={issuerId} onChange={(e) => setIssuerId(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Private key (.p8 contents)</label>
                <textarea
                  className={cn(inputClass, "min-h-28 resize-none font-mono text-xs leading-5")}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                  value={p8}
                  onChange={(e) => setP8(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={appSavePending}
                  onClick={() =>
                    startAppSave(() => {
                      setAppResult(saveAppStoreToPortal());
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface disabled:opacity-50"
                >
                  {appSavePending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Save in portal
                </button>
                <button
                  type="button"
                  disabled={appPending}
                  onClick={() =>
                    startApp(async () =>
                      {
                        const creds = currentAppStoreCreds();
                        const result = await saveAppStoreIntegration(creds);
                        if (result.ok) {
                          saveBrowserAppStoreCredentials(creds);
                          setAppStoreStatus({
                            connected: true,
                            source: "browser",
                            lastSyncedAt: null,
                            lastStatus: result.message,
                            hint: `App ID ${creds.appId}`,
                          });
                        }
                        setAppResult(result);
                      }
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {appPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Save &amp; verify
                </button>
              </div>
              <ResultLine result={appResult} onDismiss={() => setAppResult(null)} />
            </div>
          )}
        </IntegrationCard>
      </div>
    </section>
  );
}
