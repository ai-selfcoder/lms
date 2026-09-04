import { ChromeShell } from "@/components/ChromeShell";

export default function GoBasicsChromeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChromeShell>{children}</ChromeShell>;
}
