import { ChromeShell } from "@/components/ChromeShell";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChromeShell>{children}</ChromeShell>;
}
