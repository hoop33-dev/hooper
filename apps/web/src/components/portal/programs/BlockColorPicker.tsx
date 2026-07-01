"use client";

import { BLOCK_COLOR_PALETTE } from "@hooper/shared";
import { useEffect, useRef, useState } from "react";

interface BlockColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function BlockColorPicker({ color, onChange }: BlockColorPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border-portal-border h-5 w-5 rounded-full border"
        style={{ backgroundColor: color }}
        aria-label="Change block color"
      />
      {open && (
        <div className="border-portal-border bg-portal-card shadow-ambient absolute top-6 right-0 z-10 grid grid-cols-4 gap-1.5 rounded-lg border p-2">
          {BLOCK_COLOR_PALETTE.map((swatch) => (
            <button
              key={swatch}
              type="button"
              onClick={() => {
                onChange(swatch);
                setOpen(false);
              }}
              className="h-5 w-5 rounded-full border-2"
              style={{
                backgroundColor: swatch,
                borderColor: swatch === color ? "#1A1718" : "transparent",
              }}
              aria-label={`Set color to ${swatch}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
