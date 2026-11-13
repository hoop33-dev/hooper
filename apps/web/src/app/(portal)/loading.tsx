import { Spinner } from "@/src/components/ui/Spinner";

/**
 * Generic fallback for any portal navigation whose route doesn't ship its own
 * `loading.tsx`. Renders the instant the router commits, so the click never
 * looks ignored.
 */
export default function PortalLoading() {
  return (
    <div className="flex h-full flex-1 items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
