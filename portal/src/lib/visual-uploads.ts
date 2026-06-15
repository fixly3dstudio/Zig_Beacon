import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

export type UploadSection = "competitors" | "product-health" | "opportunities";

// Each Visual Trainer mode is auto-routed to the workspace section it informs.
const MODE_SECTION: Record<string, UploadSection> = {
  "Competitor teardown": "competitors",
  "Beacon Score review": "product-health",
  "Zig deep-dive": "product-health",
  "Explain this flow": "opportunities",
  "Pattern lessons": "opportunities",
};

export const SECTION_LABEL: Record<UploadSection, string> = {
  competitors: "Competitors",
  "product-health": "Product Health",
  opportunities: "Opportunity Hub",
};

export const SECTION_HREF: Record<UploadSection, string> = {
  competitors: "/competitors",
  "product-health": "/product-health",
  opportunities: "/opportunities",
};

export function sectionForMode(mode: string): UploadSection {
  return MODE_SECTION[mode] ?? "opportunities";
}

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Persists uploaded files to public/uploads and returns their public URLs. */
export async function saveUploadImages(files: File[]): Promise<string[]> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const urls: string[] = [];
  for (const file of files) {
    const ext = EXT[file.type] ?? "png";
    const name = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, name), buffer);
    urls.push(`/uploads/${name}`);
  }
  return urls;
}

export async function createVisualUpload(data: {
  section: UploadSection;
  analysisType: string;
  context: string;
  images: string[];
  analysis: string;
}) {
  return prisma.visualUpload.create({
    data: {
      section: data.section,
      analysisType: data.analysisType,
      context: data.context || null,
      images: data.images,
      imageCount: data.images.length,
      analysis: data.analysis,
    },
  });
}

export type VisualUploadItem = {
  id: string;
  section: string;
  analysisType: string;
  context: string | null;
  analysis: string;
  images: string[];
  imageCount: number;
  createdAt: string;
};

function toItem(u: {
  id: string;
  section: string;
  analysisType: string;
  context: string | null;
  analysis: string;
  images: string[];
  imageCount: number;
  createdAt: Date;
}): VisualUploadItem {
  return { ...u, createdAt: u.createdAt.toISOString() };
}

export async function getUploadsBySection(
  section: UploadSection,
  take = 12
): Promise<VisualUploadItem[]> {
  const rows = await prisma.visualUpload.findMany({
    where: { section },
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(toItem);
}

export async function getRecentUploads(take = 5): Promise<VisualUploadItem[]> {
  const rows = await prisma.visualUpload.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(toItem);
}

export async function countUploads(): Promise<number> {
  return prisma.visualUpload.count();
}
