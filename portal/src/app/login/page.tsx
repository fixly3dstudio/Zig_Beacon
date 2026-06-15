import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Sign in — Zig Beacon" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4">
      {/* Ambient brand glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            <Image src="/zig-logo.png" alt="Zig" width={48} height={48} className="h-full w-full object-cover" priority />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
            Zig <span className="font-bold">Beacon</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to the internal product intelligence portal.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <LoginForm from={from ?? "/"} />
        </div>

        <p className="mt-6 text-center text-[11px] text-muted">
          ComfortDelGro Zig · Internal use only
        </p>
      </div>
    </div>
  );
}
