"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail, Send } from "lucide-react";
import { Card, CardLabel } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FeedbackType =
  | "Feature request"
  | "UX improvement"
  | "Data issue"
  | "Bug report"
  | "Other";

type SubmitState = "idle" | "sending" | "sent" | "fallback" | "error";

const feedbackTypes: FeedbackType[] = [
  "Feature request",
  "UX improvement",
  "Data issue",
  "Bug report",
  "Other",
];

const recipient = "manoharanharsaikron@comfortdelgro.com";

export function SettingsFeedbackForm() {
  const [type, setType] = useState<FeedbackType>("Feature request");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [name, setName] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [mailtoUrl, setMailtoUrl] = useState("");

  const canSubmit = title.trim().length > 2 && details.trim().length > 8;

  const draftPreview = useMemo(
    () =>
      [
        `Type: ${type}`,
        `Priority: ${priority}`,
        name.trim() ? `Submitted by: ${name.trim()}` : "Submitted by: Anonymous",
        "",
        title.trim() || "Feature / issue title",
        "",
        details.trim() || "Feedback details will appear here.",
      ].join("\n"),
    [details, name, priority, title, type]
  );

  const submit = async () => {
    if (!canSubmit) return;
    setState("sending");
    setMessage("");
    setMailtoUrl("");

    try {
      const response = await fetch("/api/settings/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          details,
          name,
          priority,
          page: "Settings",
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        fallback?: boolean;
        message?: string;
        mailto?: string;
      };

      if (!response.ok && !data.fallback) {
        throw new Error(data.message ?? "Could not send feedback");
      }

      if (data.fallback) {
        setState("fallback");
        setMailtoUrl(data.mailto ?? "");
        setMessage(
          data.message ??
            "Direct email is not configured. Open the draft email to send this feedback."
        );
        return;
      }

      setState("sent");
      setMessage(data.message ?? `Feedback sent to ${recipient}.`);
      setTitle("");
      setDetails("");
      setName("");
      setPriority("Medium");
      setType("Feature request");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not send feedback. Please try again."
      );
    }
  };

  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted">
            Feedback type
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {feedbackTypes.map((item) => (
              <button
                key={item}
                onClick={() => setType(item)}
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  type === item
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted hover:text-foreground"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            className="text-xs font-semibold uppercase tracking-widest text-muted"
            htmlFor="feedback-priority"
          >
            Priority
          </label>
          <select
            id="feedback-priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-brand"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Urgent</option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            className="text-xs font-semibold uppercase tracking-widest text-muted"
            htmlFor="feedback-title"
          >
            Feature / issue title
          </label>
          <input
            id="feedback-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Add export for Beacon Score"
            className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand"
          />
        </div>
        <div>
          <label
            className="text-xs font-semibold uppercase tracking-widest text-muted"
            htmlFor="feedback-name"
          >
            Your name
          </label>
          <input
            id="feedback-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Optional"
            className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand"
          />
        </div>
      </div>

      <div className="mt-4">
        <label
          className="text-xs font-semibold uppercase tracking-widest text-muted"
          htmlFor="feedback-details"
        >
          Details
        </label>
        <textarea
          id="feedback-details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          rows={5}
          placeholder="Describe the feature, screen, flow, pain point, evidence, or expected outcome."
          className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand"
        />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface p-4">
        <CardLabel>Email preview</CardLabel>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-5 text-muted">
          {draftPreview}
        </pre>
      </div>

      {message ? (
        <div
          className={cn(
            "mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm",
            state === "sent" && "border-green-200 bg-green-50 text-green-700",
            state === "fallback" && "border-amber-200 bg-amber-50 text-amber-800",
            state === "error" && "border-red-200 bg-red-50 text-red-700"
          )}
        >
          {state === "sent" ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
          )}
          <div>
            <p className="font-medium">{message}</p>
            {state === "fallback" && mailtoUrl ? (
              <a
                href={mailtoUrl}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background"
              >
                <Mail size={14} />
                Open email draft
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-muted">
          Feedback is addressed to {recipient}. Configure `RESEND_API_KEY` for
          direct sending in deployed environments.
        </p>
        <button
          onClick={() => void submit()}
          disabled={!canSubmit || state === "sending"}
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "sending" ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending
            </>
          ) : (
            <>
              <Send size={16} />
              Send feedback
            </>
          )}
        </button>
      </div>
    </Card>
  );
}
