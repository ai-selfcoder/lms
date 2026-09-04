"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Callout, Card, Logo } from "@/ds";
import { apiUrl, useAuth, AuthError, type AuthLevel } from "@/lib/auth";

type Mode = "login" | "register" | "verify" | "reset" | "onboarding";
type Level = AuthLevel;

const LEVELS: { value: Level; title: string; hint: string }[] = [
  { value: "junior", title: "Junior", hint: "осваиваю горутины и каналы" },
  { value: "middle", title: "Middle", hint: "готовлюсь к senior-собесам" },
  { value: "senior", title: "Senior", hint: "повторяю сложные паттерны" },
];

/** Sends the browser to the backend OAuth entry point. */
function startOAuth(provider: "github" | "google") {
  window.location.href = `${apiUrl()}/auth/${provider}`;
}

export function AuthView() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [level, setLevel] = useState<Level>("middle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Pending registration credentials carried from step 1 into onboarding.
  const [pending, setPending] = useState<{ email: string; password: string } | null>(null);

  function goto(next: Mode) {
    setMode(next);
    setError(null);
  }

  function fail(err: unknown) {
    setError(
      err instanceof AuthError
        ? err.message
        : "Что-то пошло не так. Попробуй ещё раз."
    );
  }

  async function handleLogin(email: string, password: string) {
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/account");
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  // Step 1 of register: stash creds, then go pick a level.
  function handleRegisterStart(email: string, password: string) {
    setPending({ email, password });
    setError(null);
    setMode("onboarding");
  }

  // Final register: create the account with the chosen level.
  async function handleRegisterFinish() {
    if (!pending) {
      setError("Заполни почту и пароль на предыдущем шаге.");
      setMode("register");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register(pending.email, pending.password, level);
      router.push("/account");
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - var(--header-h))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px 72px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-flex" }}>
            <Logo size={26} />
          </Link>
        </div>

        <Card padding={28}>
          {mode === "login" && (
            <LoginForm
              busy={busy}
              onRegister={() => goto("register")}
              onReset={() => goto("reset")}
              onSubmit={handleLogin}
            />
          )}
          {mode === "register" && (
            <RegisterForm
              onLogin={() => goto("login")}
              onContinue={handleRegisterStart}
            />
          )}
          {mode === "verify" && (
            <VerifyForm
              onBack={() => goto("register")}
              onContinue={() => goto("onboarding")}
            />
          )}
          {mode === "onboarding" && (
            <OnboardingForm
              level={level}
              setLevel={setLevel}
              busy={busy}
              onSubmit={handleRegisterFinish}
            />
          )}
          {mode === "reset" && <ResetForm onBack={() => goto("login")} />}

          {error && (
            <div style={{ marginTop: 20 }}>
              <Callout tone="danger" title="Не получилось">
                {error}
              </Callout>
            </div>
          )}

          <div style={{ marginTop: 22 }}>
            <Link
              href="/go/topics"
              style={{ textDecoration: "none", display: "block" }}
            >
              <Button hierarchy="secondary" fullWidth>
                Продолжить без аккаунта →
              </Button>
            </Link>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
                lineHeight: "18px",
                color: "var(--text-tertiary)",
                textAlign: "center",
                margin: "12px 0 0",
              }}
            >
              // регистрация не обязательна — прогресс работает и локально
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h1
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: "var(--fw-bold)",
          fontSize: 24,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          margin: "0 0 6px",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14.5,
          lineHeight: "22px",
          color: "var(--text-secondary)",
          margin: 0,
        }}
      >
        {sub}
      </p>
    </div>
  );
}

function Steps({ active }: { active: 1 | 2 | 3 }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            height: 3,
            flex: 1,
            borderRadius: 2,
            background:
              i <= active ? "var(--accent)" : "var(--border-default)",
            transition: "background var(--dur-base)",
          }}
        />
      ))}
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  mono = false,
  autoComplete,
  value,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  mono?: boolean;
  autoComplete?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          fontWeight: "var(--fw-medium)",
          color: "var(--text-secondary)",
          margin: "0 0 7px",
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: "100%",
          height: 44,
          padding: "0 14px",
          background: "var(--bg-inset)",
          border: `var(--border-width) solid ${
            focus ? "var(--accent)" : "var(--border-default)"
          }`,
          boxShadow: focus ? "0 0 0 3px var(--accent-subtle)" : "none",
          borderRadius: "var(--radius-md)",
          color: "var(--text-primary)",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
          fontSize: 15,
          outline: "none",
          transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function PasswordField({
  id,
  label,
  placeholder,
  hint,
  autoComplete,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder?: string;
  hint?: React.ReactNode;
  autoComplete?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const [focus, setFocus] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <label
          htmlFor={id}
          style={{
            display: "block",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: "var(--fw-medium)",
            color: "var(--text-secondary)",
            margin: "0 0 7px",
          }}
        >
          {label}
        </label>
        {hint}
      </div>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: "100%",
            height: 44,
            padding: "0 44px 0 14px",
            background: "var(--bg-inset)",
            border: `var(--border-width) solid ${
              focus ? "var(--accent)" : "var(--border-default)"
            }`,
            boxShadow: focus ? "0 0 0 3px var(--accent-subtle)" : "none",
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            outline: "none",
            transition:
              "border-color var(--dur-fast), box-shadow var(--dur-fast)",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Скрыть пароль" : "Показать пароль"}
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            width: 32,
            height: 32,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            color: "var(--text-tertiary)",
            cursor: "pointer",
            borderRadius: 6,
          }}
        >
          {show ? <EyeOff /> : <Eye />}
        </button>
      </div>
    </div>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "20px 0",
        color: "var(--text-tertiary)",
        fontFamily: "var(--font-sans)",
        fontSize: 12,
      }}
    >
      <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
      {children}
      <span style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
    </div>
  );
}

function SwitchLine({
  text,
  action,
  onClick,
}: {
  text: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <p
      style={{
        textAlign: "center",
        fontFamily: "var(--font-sans)",
        fontSize: 14,
        color: "var(--text-secondary)",
        margin: "20px 0 0",
      }}
    >
      {text}{" "}
      <button
        type="button"
        onClick={onClick}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          font: "inherit",
          color: "var(--accent-text)",
          cursor: "pointer",
        }}
      >
        {action}
      </button>
    </p>
  );
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

function LoginForm({
  busy,
  onRegister,
  onReset,
  onSubmit,
}: {
  busy: boolean;
  onRegister: () => void;
  onReset: () => void;
  onSubmit: (email: string, password: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div>
      <Heading
        title="Вход"
        sub="Войди, чтобы синхронизировать прогресс между устройствами."
      />
      <div style={{ display: "grid", gap: 10 }}>
        <Button
          hierarchy="secondary"
          fullWidth
          iconLeft={<GitHubIcon />}
          onClick={() => startOAuth("github")}
        >
          Войти через GitHub
        </Button>
        <Button
          hierarchy="secondary"
          fullWidth
          iconLeft={<GoogleIcon />}
          onClick={() => startOAuth("google")}
        >
          Войти через Google
        </Button>
      </div>
      <Divider>или по почте</Divider>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(email, password);
        }}
        style={{ display: "grid", gap: 16 }}
      >
        <Field
          id="login-email"
          label="Почта"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <PasswordField
          id="login-pass"
          label="Пароль"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          hint={
            <button
              type="button"
              onClick={onReset}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                color: "var(--accent-text)",
                cursor: "pointer",
              }}
            >
              Забыли пароль?
            </button>
          }
        />
        <Button hierarchy="accent" fullWidth type="submit" loading={busy}>
          Войти
        </Button>
      </form>
      <SwitchLine text="Нет аккаунта?" action="Регистрация" onClick={onRegister} />
    </div>
  );
}

function RegisterForm({
  onLogin,
  onContinue,
}: {
  onLogin: () => void;
  onContinue: (email: string, password: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div>
      <Steps active={1} />
      <Heading
        title="Создать аккаунт"
        sub="Шаг 1 из 3 · почта и пароль. Это займёт минуту."
      />
      <div style={{ display: "grid", gap: 10 }}>
        <Button
          hierarchy="secondary"
          fullWidth
          iconLeft={<GitHubIcon />}
          onClick={() => startOAuth("github")}
        >
          Регистрация через GitHub
        </Button>
        <Button
          hierarchy="secondary"
          fullWidth
          iconLeft={<GoogleIcon />}
          onClick={() => startOAuth("google")}
        >
          Регистрация через Google
        </Button>
      </div>
      <Divider>или по почте</Divider>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onContinue(email, password);
        }}
        style={{ display: "grid", gap: 16 }}
      >
        <Field
          id="reg-email"
          label="Почта"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <PasswordField
          id="reg-pass"
          label="Пароль"
          placeholder="минимум 8 символов"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
        />
        <Button hierarchy="accent" fullWidth type="submit">
          Создать аккаунт
        </Button>
      </form>
      <p
        style={{
          textAlign: "center",
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          lineHeight: "19px",
          color: "var(--text-tertiary)",
          margin: "18px 0 0",
        }}
      >
        Регистрируясь, ты принимаешь условия и политику конфиденциальности.
      </p>
      <SwitchLine text="Уже есть аккаунт?" action="Войти" onClick={onLogin} />
    </div>
  );
}

function VerifyForm({
  onBack,
  onContinue,
}: {
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <Steps active={2} />
      <Heading
        title="Подтверди почту"
        sub="Шаг 2 из 3 · мы отправили 6-значный код на твою почту."
      />
      <div
        style={{
          display: "flex",
          gap: 9,
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <PinCell key={i} />
        ))}
      </div>
      <Button
        hierarchy="accent"
        fullWidth
        onClick={onContinue}
        style={{ marginBottom: 14 }}
      >
        Подтвердить
      </Button>
      <p
        style={{
          textAlign: "center",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          color: "var(--text-secondary)",
          margin: 0,
        }}
      >
        Не пришёл код?{" "}
        <button
          type="button"
          onClick={onContinue}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            font: "inherit",
            color: "var(--accent-text)",
            cursor: "pointer",
          }}
        >
          Отправить снова
        </button>
      </p>
      <p style={{ textAlign: "center", margin: "16px 0 0" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            color: "var(--text-tertiary)",
            cursor: "pointer",
          }}
        >
          ← Изменить почту
        </button>
      </p>
    </div>
  );
}

function OnboardingForm({
  level,
  setLevel,
  busy,
  onSubmit,
}: {
  level: Level;
  setLevel: (l: Level) => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  return (
    <div>
      <Steps active={3} />
      <Heading
        title="Настроим профиль"
        sub="Шаг 3 из 3 · подскажем, с чего начать."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        style={{ display: "grid", gap: 16 }}
      >
        <Field id="ob-name" label="Имя" placeholder="Как тебя называть" />
        <Field
          id="ob-nick"
          label="Ник"
          placeholder="@username"
          mono
          autoComplete="username"
        />
        <div>
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: "var(--fw-medium)",
              color: "var(--text-secondary)",
              margin: "0 0 7px",
            }}
          >
            Текущий уровень
          </span>
          <div role="radiogroup" style={{ display: "grid", gap: 8 }}>
            {LEVELS.map((l) => (
              <LevelOption
                key={l.value}
                level={l}
                selected={level === l.value}
                onSelect={() => setLevel(l.value)}
              />
            ))}
          </div>
        </div>
        <Button hierarchy="accent" fullWidth type="submit" loading={busy}>
          Завершить регистрацию
        </Button>
      </form>
    </div>
  );
}

function ResetForm({ onBack }: { onBack: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div>
      <Heading
        title="Сброс пароля"
        sub="Укажи почту — пришлём ссылку для восстановления."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
        style={{ display: "grid", gap: 16 }}
      >
        <Field
          id="reset-email"
          label="Почта"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Button hierarchy="accent" fullWidth type="submit">
          Отправить ссылку
        </Button>
      </form>
      {sent && (
        <div style={{ marginTop: 16 }}>
          <Callout tone="note" title="Проверь почту">
            Если такой аккаунт существует, мы отправили ссылку для сброса пароля.
          </Callout>
        </div>
      )}
      <p style={{ textAlign: "center", margin: "18px 0 0" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          ← Вернуться ко входу
        </button>
      </p>
    </div>
  );
}

function LevelOption({
  level,
  selected,
  onSelect,
}: {
  level: { value: Level; title: string; hint: string };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        padding: "13px 14px",
        minHeight: 44,
        border: `var(--border-width) solid ${
          selected ? "var(--accent)" : "var(--border-default)"
        }`,
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        background: selected ? "var(--accent-subtle)" : "var(--bg-inset)",
        transition: "all var(--dur-fast)",
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: `2px solid ${
            selected ? "var(--accent)" : "var(--border-strong)"
          }`,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent)",
            }}
          />
        )}
      </span>
      <span>
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            fontWeight: "var(--fw-medium)",
            color: "var(--text-primary)",
          }}
        >
          {level.title}
        </span>
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-sans)",
            fontSize: 12.5,
            color: "var(--text-tertiary)",
          }}
        >
          {level.hint}
        </span>
      </span>
    </button>
  );
}

function PinCell() {
  const [focus, setFocus] = useState(false);
  return (
    <input
      aria-label="Цифра кода"
      maxLength={1}
      inputMode="numeric"
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: 48,
        height: 56,
        textAlign: "center",
        fontFamily: "var(--font-mono)",
        fontSize: 22,
        fontWeight: 600,
        background: "var(--bg-inset)",
        border: `var(--border-width) solid ${
          focus ? "var(--accent)" : "var(--border-default)"
        }`,
        boxShadow: focus ? "0 0 0 3px var(--accent-subtle)" : "none",
        borderRadius: "var(--radius-md)",
        color: "var(--text-primary)",
        outline: "none",
        transition: "all var(--dur-fast)",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Icons (Lucide-style inline SVG, inherit currentColor)
// ---------------------------------------------------------------------------

function Eye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a16.8 16.8 0 0 1-3.3 4M6.6 6.6A16.8 16.8 0 0 0 2 11s3.5 7 10 7a10.9 10.9 0 0 0 4.4-.9" />
      <path d="m2 2 20 20M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C18.6 4.5 19.6 4.8 19.6 4.8c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7C21.8 18.9 23 15.9 23 12.3Z" />
      <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21.4 7.6 24 12 24Z" />
      <path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6V7.1H1.8a12 12 0 0 0 0 10.7l3.8-3Z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.6 0 3.7 2.6 1.8 6.3l3.8 3c.9-2.7 3.4-4.5 6.4-4.5Z" />
    </svg>
  );
}
