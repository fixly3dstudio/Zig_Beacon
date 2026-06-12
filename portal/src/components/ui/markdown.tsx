import type { ReactNode } from "react";

function formatInline(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, '<code class="rounded bg-zinc-100 px-1 py-0.5 text-xs font-mono">$1</code>')
    .replace(/🔴/g, '<span class="text-red-500">🔴</span>')
    .replace(/🟡/g, '<span class="text-yellow-500">🟡</span>')
    .replace(/🟢/g, '<span class="text-green-500">🟢</span>');
}

/**
 * Lightweight renderer for the markdown subset local models produce:
 * ## / ### headings, bullet and numbered lists, bold, inline code.
 */
export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ") || line.startsWith("## ")) {
      elements.push(
        <h3
          key={i}
          className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-wider text-foreground first:mt-0"
        >
          {line.replace(/^#+\s*/, "")}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="mb-3 space-y-1.5">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 text-sm leading-6">
              <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s*/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="mb-3 list-decimal space-y-1.5 pl-5">
          {items.map((item, j) => (
            <li key={j} className="text-sm leading-6">
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line.trim()) {
      elements.push(
        <p
          key={i}
          className="mb-3 text-sm leading-6 last:mb-0"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    }
    i++;
  }

  return <div>{elements}</div>;
}
