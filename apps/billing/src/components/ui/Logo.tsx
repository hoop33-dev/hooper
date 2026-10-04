import Image from "next/image";

/** The hoop33 logo (transparent PNG, 218×256), sized by height. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Hooper"
      width={Math.round((size * 218) / 256)}
      height={size}
      className="shrink-0 object-contain"
    />
  );
}
