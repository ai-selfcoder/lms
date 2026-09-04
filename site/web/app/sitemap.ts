import type { MetadataRoute } from "next";
import {
  getAllTaskMeta,
  getBookChapters,
  getTopicGroups,
} from "@/lib/content";
import { getCourses } from "@/lib/courses";
import { SITE_URL as BASE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
  ];

  for (const course of getCourses()) {
    entries.push({ url: `${BASE}/${course.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.9 });

    for (const c of getBookChapters(course.id)) {
      entries.push({ url: `${BASE}/${course.slug}/book/${c.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
    }
    for (const t of getTopicGroups(course.id)) {
      entries.push({ url: `${BASE}/${course.slug}/topics/${t.num}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
    }
    for (const t of getAllTaskMeta(course.id)) {
      entries.push({ url: `${BASE}/${course.slug}/tasks/${t.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
    }
  }

  return entries;
}
