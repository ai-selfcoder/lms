import type { MetadataRoute } from "next";
import {
  getAllTaskMeta,
  getAllSims,
  getBookChapters,
  getTopicGroups,
} from "@/lib/content";
import { getCourses } from "@/lib/courses";
import { SITE_URL as BASE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/projects`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/go/interview`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
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
    if (course.id === "os") {
      entries.push({ url: `${BASE}/os/labs`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
      for (const sim of getAllSims(course.id)) {
        entries.push({ url: `${BASE}/os/sim/${sim.id}`, lastModified: now, changeFrequency: "monthly", priority: 0.7 });
      }
    }
  }

  return entries;
}
