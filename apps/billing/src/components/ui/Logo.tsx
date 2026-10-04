import Image from "next/image";

/** Hooper app mark on an orange tile, matching the coach portal sidebar. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <div
      className="bg-orange flex shrink-0 items-center justify-center rounded-lg p-0.5"
      style={{ width: size, height: size }}>
      <Image
        src="/logo.png"
        alt="Hooper"
        width={size - 4}
        height={size - 4}
        className="rounded-md object-contain"
      />
    </div>
  );
}
