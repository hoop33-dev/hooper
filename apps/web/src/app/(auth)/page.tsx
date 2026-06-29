"use client";

import { AuthInput } from "@/src/components/ui/AuthInput";
import { Spinner } from "@/src/components/ui/Spinner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "./actions";

interface Errors {
  email?: string;
  password?: string;
  form?: string;
}

function EnvelopeIcon() {
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
      aria-hidden="true"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
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
      aria-hidden="true"
    >
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
      className="text-neutral-dark/35 hover:text-neutral-dark/60 transition-colors"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
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
      className="bg-primary-orange mt-1 flex h-[52px] w-full items-center justify-center rounded-xl text-[15px] font-bold text-white transition-[opacity,transform] duration-150 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  function clearField(field: keyof Errors) {
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    const e: Errors = {};
    if (!email.trim()) e.email = "Required";
    if (!password) e.password = "Required";
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (!result.ok) {
        setErrors({ form: result.error });
      } else {
        router.push("/");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-8 flex flex-col gap-5"
    >
      <AuthInput
        id="email"
        label="Email address"
        type="email"
        placeholder="email@hoop33.co.nz"
        autoComplete="email"
        error={errors.email}
        value={email}
        prefix={<EnvelopeIcon />}
        onChange={(e) => {
          setEmail(e.target.value);
          clearField("email");
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
      <SubmitButton loading={loading} />
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
