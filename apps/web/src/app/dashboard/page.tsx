import { signOut } from "@/src/app/(auth)/actions";

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen items-start justify-end bg-white p-6">
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
