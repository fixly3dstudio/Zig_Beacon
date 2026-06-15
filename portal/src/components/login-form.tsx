"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2, Lock, User } from "lucide-react";
import { loginAction, type LoginState } from "@/app/login/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm({ from }: { from: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {
    error: null,
  });

  return (
    <form action={formAction} className="space-y-3.5">
      <input type="hidden" name="from" value={from} />

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-foreground">Username</span>
        <div className="relative">
          <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            name="username"
            autoComplete="username"
            autoFocus
            required
            placeholder="admin"
            className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-foreground">Password</span>
        <div className="relative">
          <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand"
          />
        </div>
      </label>

      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
          <AlertCircle size={15} className="shrink-0" />
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
