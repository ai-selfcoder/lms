import type { Metadata } from "next";
import { AuthView } from "@/components/auth/AuthView";

export const metadata: Metadata = {
  title: "Вход",
  description:
    "Аккаунт и синхронизация прогресса между устройствами. Регистрация не обязательна — прогресс работает и локально.",
};

export default function AuthPage() {
  return <AuthView />;
}
