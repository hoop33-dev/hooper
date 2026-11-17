"use client";

import { AuthInput } from "@/src/components/ui/AuthInput";
import { Spinner } from "@/src/components/ui/Spinner";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "./actions";

interface Errors {
  username?: string;
  password?: string;
  form?: string;
}

function PersonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function EyeToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      className="text-neutral-dark/35 hover:text-neutral-dark/60 transition-colors">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true">
        {visible ? (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        ) : (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        )}
      </svg>
    </button>
  );
}

function PasswordField({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [showPw, setShowPw] = useState(false);
  return (
    <AuthInput
      id="password"
      label="Password"
      type={showPw ? "text" : "password"}
      placeholder="••••••••••"
      autoComplete="current-password"
      error={error}
      value={value}
      prefix={<LockIcon />}
      suffix={
        <EyeToggle visible={showPw} onToggle={() => setShowPw((v) => !v)} />
      }
      onChange={onChange}
    />
  );
}

function SubmitButton({ loading }: { loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="bg-primary-orange mt-1 flex h-[52px] w-full items-center justify-center rounded-xl text-[15px] font-bold text-white transition-[opacity,transform] duration-150 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
      {loading ? (
        <Spinner
          className="size-5 border-white/30 border-t-white"
          label="Signing in"
        />
      ) : (
        "Sign in"
      )}
    </button>
  );
}

function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  // `loading` covers the sign-in request; `isPending` keeps the button busy
  // through the navigation + dashboard render so there's no dead gap between
  // the spinner stopping and the page changing.
  const [isPending, startTransition] = useTransition();

  function clearField(field: keyof Errors) {
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    const e: Errors = {};
    if (!username.trim()) e.username = "Required";
    if (!password) e.password = "Required";
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);
    let result;
    try {
      result = await signIn(username, password);
    } catch {
      setLoading(false);
      setErrors({ form: "Something went wrong. Please try again." });
      return;
    }
    if (!result.ok) {
      setLoading(false);
      setErrors({ form: result.error });
      return;
    }
    // Keep `loading` true — the component unmounts once the dashboard renders,
    // so the spinner runs straight through the navigation with no gap.
    startTransition(() => {
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-8 flex flex-col gap-5">
      <AuthInput
        id="username"
        label="Username"
        type="text"
        placeholder="your_username"
        autoComplete="username"
        error={errors.username}
        value={username}
        prefix={<PersonIcon />}
        onChange={(e) => {
          setUsername(e.target.value);
          clearField("username");
        }}
      />
      <PasswordField
        value={password}
        error={errors.password}
        onChange={(e) => {
          setPassword(e.target.value);
          clearField("password");
        }}
      />
      {errors.form && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errors.form}
        </p>
      )}
      <SubmitButton loading={loading || isPending} />
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-[400px]">
      <h1 className="font-title text-neutral-dark text-5xl leading-none font-black tracking-[-0.02em] uppercase">
        Sign in
      </h1>
      <p className="text-neutral-dark/55 mt-2 text-[15px]">
        Welcome back, Coach.
      </p>
      <LoginForm />
      <p className="text-neutral-dark/40 mt-6 text-center text-[13px]">
        New to Hooper? Download the app to get started.
      </p>
    </div>
  );
}
