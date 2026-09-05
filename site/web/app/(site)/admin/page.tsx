import type { Metadata } from "next";
import { AdminView } from "@/components/admin/AdminView";

export const metadata: Metadata = { title: "Админ-консоль" };

export default function AdminPage() { return <AdminView />; }
