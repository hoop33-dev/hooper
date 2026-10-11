import { APP_LINK } from "@/src/components/app/AppLinks";
import { btnClass } from "@/src/components/ui/Btn";

/** Dark "Open in app" header button (desktop only, like the design). The
 * wrapper does the hiding — `hidden` can't override the button's own
 * inline-flex through `cn`. */
export function OpenAppButton() {
  return (
    <span className="hidden md:block">
      <a
        href={APP_LINK}
        target="_blank"
        rel="noreferrer"
        className={btnClass({ variant: "dark", size: "sm" })}>
        Open in app
      </a>
    </span>
  );
}
