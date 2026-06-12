import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECIPIENT = "manoharanharsaikron@comfortdelgro.com";
const FROM_EMAIL =
  process.env.FEEDBACK_FROM_EMAIL ?? "Zig Beacon <onboarding@resend.dev>";

type FeedbackPayload = {
  type?: string;
  title?: string;
  details?: string;
  name?: string;
  priority?: string;
  page?: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildSubject(payload: Required<FeedbackPayload>) {
  return `[Zig Beacon Feedback] ${payload.priority} · ${payload.type} · ${payload.title}`;
}

function buildBody(payload: Required<FeedbackPayload>) {
  return [
    "New Zig Beacon feedback",
    "",
    `Type: ${payload.type}`,
    `Priority: ${payload.priority}`,
    `Page: ${payload.page}`,
    `Submitted by: ${payload.name || "Anonymous"}`,
    `Recipient: ${RECIPIENT}`,
    "",
    "Title",
    payload.title,
    "",
    "Details",
    payload.details,
  ].join("\n");
}

function mailtoUrl(subject: string, body: string) {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${RECIPIENT}?${params.toString()}`;
}

export async function POST(request: Request) {
  let raw: FeedbackPayload;
  try {
    raw = (await request.json()) as FeedbackPayload;
  } catch {
    return NextResponse.json({ message: "Invalid feedback payload" }, { status: 400 });
  }

  const payload: Required<FeedbackPayload> = {
    type: text(raw.type) || "Feature request",
    title: text(raw.title),
    details: text(raw.details),
    name: text(raw.name),
    priority: text(raw.priority) || "Medium",
    page: text(raw.page) || "Settings",
  };

  if (payload.title.length < 3 || payload.details.length < 9) {
    return NextResponse.json(
      { message: "Please add a title and useful feedback details." },
      { status: 400 }
    );
  }

  const subject = buildSubject(payload);
  const body = buildBody(payload);
  const fallback = mailtoUrl(subject, body);

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({
      fallback: true,
      mailto: fallback,
      message:
        "Direct email needs RESEND_API_KEY. Open the draft email to send it now.",
    });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [RECIPIENT],
        subject,
        text: body,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          fallback: true,
          mailto: fallback,
          message:
            "Email provider could not send this. Open the draft email instead.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Feedback sent to ${RECIPIENT}.`,
    });
  } catch {
    return NextResponse.json(
      {
        fallback: true,
        mailto: fallback,
        message:
          "Could not reach the email provider. Open the draft email to send this feedback.",
      },
      { status: 503 }
    );
  }
}
