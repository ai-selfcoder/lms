import type { Metadata } from "next";
import { AdminView } from "@/components/admin/AdminView";
import { getContentHealth } from "@/lib/contentHealth";

export const metadata: Metadata = { title: "Админ-консоль" };

export default function AdminPage() { return <AdminView contentHealth={getContentHealth()} />; }
