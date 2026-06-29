import { Card } from "@/src/components/ui/Card";

/**
 * Shown when a user is authenticated but does not hold the coach role.
 * The portal is coach-only; athletes and parents use the mobile app.
 */
export default function NotAuthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Coaches only</h1>
        <p className="mt-3 text-white/70">
          The Hooper portal is for coaches. Athletes and parents should use the
          Hooper mobile app.
        </p>
      </Card>
    </main>
  );
}
