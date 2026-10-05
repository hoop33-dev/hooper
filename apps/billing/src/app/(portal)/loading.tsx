import { Spinner } from "@/src/components/ui/Btn";

/** Fallback for any portal route without its own `loading.tsx`, so a click
 * never looks ignored. */
export default function PortalLoading() {
  return (
    <div className="text-bp-text3 flex flex-1 items-center justify-center py-24">
      <Spinner className="size-7" />
    </div>
  );
}
