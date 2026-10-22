import { AuthWrap, DarkCard, Hed } from "@/src/components/auth/AuthWrap";
import { AlertIcon } from "@/src/components/icons";
import { btnClass } from "@/src/components/ui/Btn";
import { AppLink } from "@hooper/shared/next";

/** Shown when ?package= points at an unknown or deleted package. */
export function PackageUnavailable() {
  return (
    <AuthWrap>
      <div className="bg-orange/15 text-orange mb-[22px] flex size-[46px] items-center justify-center rounded-xl">
        <AlertIcon size={21} />
      </div>
      <Hed sub="The link you followed points to a package that's been removed or doesn't exist. Check with your coach for an up-to-date link.">
        Package not available.
      </Hed>
      <DarkCard className="p-[18px] text-[13.5px] text-white/60">
        Already have a Hooper account? You can still sign in to manage your
        billing.
        <div className="mt-4">
          <AppLink
            href="/signin"
            className={btnClass({
              variant: "ghostDark",
              size: "lg",
              full: true,
            })}>
            Sign in
          </AppLink>
        </div>
      </DarkCard>
    </AuthWrap>
  );
}
