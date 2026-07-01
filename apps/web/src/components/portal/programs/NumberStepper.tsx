interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function NumberStepper({
  label,
  value,
  onChange,
  min = 1,
  max = 52,
}: NumberStepperProps) {
  return (
    <div>
      <label className="text-portal-text2 mb-1.5 block text-xs font-semibold">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="border-portal-border bg-portal-bg text-portal-text2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-lg disabled:opacity-40">
          −
        </button>
        <div className="border-portal-border bg-portal-card flex h-9 flex-1 items-center justify-center rounded-lg border">
          <span className="font-title text-portal-text1 text-lg font-black">
            {value}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="border-portal-border bg-portal-bg text-portal-text2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border text-lg disabled:opacity-40">
          +
        </button>
      </div>
    </div>
  );
}
