// Minimal Jira Cloud REST client. Configured via env:
//   JIRA_BASE_URL   e.g. https://your-org.atlassian.net
//   JIRA_EMAIL      the account email
//   JIRA_API_TOKEN  an API token (id.atlassian.com → Security → API tokens)
//   JIRA_PROJECT_KEY  e.g. ZIG
//   JIRA_ISSUE_TYPE   optional, defaults to "Story"

export type JiraConfig = {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  issueType: string;
};

export function getJiraConfig(): JiraConfig | null {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY;
  if (!baseUrl || !email || !apiToken || !projectKey) return null;
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    email,
    apiToken,
    projectKey,
    issueType: process.env.JIRA_ISSUE_TYPE || "Story",
  };
}

export function isJiraConfigured() {
  return getJiraConfig() !== null;
}

type ADFNode = { type: "text"; text: string } | { type: "hardBreak" };

/** Turn plain text (with blank-line paragraphs) into Atlassian Document Format. */
function toADF(text: string) {
  const paragraphs = text.split(/\n{2,}/).map((block) => {
    const lines = block.split("\n");
    const content: ADFNode[] = [];
    lines.forEach((line, i) => {
      if (line.length > 0) content.push({ type: "text", text: line });
      if (i < lines.length - 1) content.push({ type: "hardBreak" });
    });
    return { type: "paragraph", content };
  });
  return {
    type: "doc",
    version: 1,
    content: paragraphs.length ? paragraphs : [{ type: "paragraph", content: [] }],
  };
}

export type CreateIssueInput = {
  title: string;
  description: string;
  severity: string; // High | Medium | Low
  labels?: string[];
};

export type CreateIssueResult =
  | { ok: true; key: string; url: string }
  | { ok: false; error: string };

export async function createJiraIssue(
  input: CreateIssueInput
): Promise<CreateIssueResult> {
  const config = getJiraConfig();
  if (!config) return { ok: false, error: "Jira is not configured." };

  const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString("base64");
  const labels = [
    "zig-beacon",
    `severity-${input.severity.toLowerCase()}`,
    ...(input.labels ?? []),
  ].map((l) => l.replace(/\s+/g, "-"));

  let res: Response;
  try {
    res = await fetch(`${config.baseUrl}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        fields: {
          project: { key: config.projectKey },
          summary: input.title.slice(0, 250),
          description: toADF(input.description),
          issuetype: { name: config.issueType },
          labels,
        },
      }),
    });
  } catch (error) {
    return {
      ok: false,
      error: `Could not reach Jira: ${error instanceof Error ? error.message : "network error"}`,
    };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, error: `Jira returned ${res.status}: ${detail.slice(0, 300)}` };
  }

  const data = (await res.json()) as { key?: string };
  if (!data.key) return { ok: false, error: "Jira did not return an issue key." };
  return { ok: true, key: data.key, url: `${config.baseUrl}/browse/${data.key}` };
}
