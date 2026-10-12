import { cn } from "@/src/lib/cn";
import { packageInitials } from "@/src/lib/purchases";

/** Design `PkgTile`: the package monogram, dimmed once it's ended. */
export function PackageTile({
  name,
  size = 40,
  dim,
}: {
  name: string;
  size?: number;
  dim?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px]",
        dim ? "border-bp-border bg-bp-bg border" : "bg-ink",
      )}
      style={{ width: size, height: size }}>
      <span
        className={cn(
          "font-title tracking-title font-black",
          dim ? "text-bp-text3" : "text-orange",
        )}
        style={{ fontSize: size * 0.4 }}>
        {packageInitials(name)}
      </span>
    </div>
  );
}
