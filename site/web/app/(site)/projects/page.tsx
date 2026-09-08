import type { Metadata } from "next";
import { ProjectsView } from "@/components/projects/ProjectsView";
import { PROJECT_TRACKS } from "@/lib/projectTracks";

export const metadata: Metadata = {
  title: "Проектные треки — GraphLMS",
  description: "Собери worker pool, rate limiter, mini scheduler или page cache из практических шагов GraphLMS.",
};

export default function ProjectsPage() {
  return <ProjectsView tracks={PROJECT_TRACKS} />;
}
