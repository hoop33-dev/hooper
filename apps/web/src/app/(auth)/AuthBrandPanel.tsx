function HooperMark() {
  return (
    <div className="bg-primary-orange flex size-11 shrink-0 items-center justify-center rounded-xl p-[3px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Hoop33"
        className="h-full w-full rounded-[9px] object-contain"
      />
    </div>
  );
}

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <HooperMark />
      <div>
        <div className="font-title text-lg font-black tracking-[0.12em] text-white">
          HOOPER
        </div>
        <div className="text-[10px] font-semibold tracking-[0.14em] text-white/40 uppercase">
          COACH PORTAL
        </div>
      </div>
    </div>
  );
}

function BrandHeadline() {
  return (
    <div>
      <h1 className="font-title text-[64px] leading-[0.88] font-black tracking-[-0.02em] text-white uppercase">
        YOUR TEAM.
        <br />
        YOUR
        <br />
        PROGRAMS.
      </h1>
      <p className="mt-7 max-w-xs text-sm leading-relaxed text-white/45">
        Build structured training programs, track athlete progress, and manage
        your full roster — all in one place.
      </p>
    </div>
  );
}

function BrandFooter() {
  return (
    <div>
      <div className="mb-6 h-px bg-white/10" />
      <p className="text-xs leading-relaxed text-white/30">
        Registration and password management is done through the Hooper mobile
        app.
      </p>
    </div>
  );
}

export function AuthBrandPanel() {
  return (
    <aside className="bg-neutral-dark flex w-[440px] shrink-0 flex-col justify-between p-12">
      <BrandLogo />
      <BrandHeadline />
      <BrandFooter />
    </aside>
  );
}
