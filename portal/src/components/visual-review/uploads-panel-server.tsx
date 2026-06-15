import {
  getUploadsBySection,
  getRecentUploads,
  type UploadSection,
} from "@/lib/visual-uploads";
import { UploadsPanel } from "./uploads-panel";

/**
 * Server wrapper that fetches uploads and renders the client panel. Pass a
 * `section` to scope to one workspace area, or omit it for the latest across all.
 */
export async function UploadsPanelServer({
  section,
  title,
}: {
  section?: UploadSection;
  title?: string;
}) {
  const items = section
    ? await getUploadsBySection(section)
    : await getRecentUploads(5);
  return (
    <UploadsPanel
      items={items}
      title={title ?? (section ? "From Visual Trainer" : "Recent visual uploads")}
    />
  );
}
