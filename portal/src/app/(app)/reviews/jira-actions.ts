"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createJiraIssue, isJiraConfigured } from "@/lib/jira";

export type CreateTicketResult = {
  ok: boolean;
  key?: string;
  url?: string;
  message: string;
  notConfigured?: boolean;
};

export async function createTicketForReview(input: {
  reviewId: number;
  title: string;
  description: string;
  severity: string;
}): Promise<CreateTicketResult> {
  if (!input.title.trim() || !input.description.trim()) {
    return { ok: false, message: "Title and description are required." };
  }

  if (!isJiraConfigured()) {
    return {
      ok: false,
      notConfigured: true,
      message:
        "Jira isn't connected. Add JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN and JIRA_PROJECT_KEY to .env, then try again.",
    };
  }

  const result = await createJiraIssue({
    title: input.title.trim(),
    description: input.description.trim(),
    severity: input.severity,
    labels: ["app-review"],
  });

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  await prisma.signal
    .update({ where: { id: input.reviewId }, data: { jiraKey: result.key } })
    .catch(() => undefined);
  revalidatePath("/reviews");

  return {
    ok: true,
    key: result.key,
    url: result.url,
    message: `Created ${result.key} in Jira.`,
  };
}
