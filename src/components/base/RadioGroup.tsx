'use client';
import { createBorderFaint } from '@/utils/colorMix';

interface RadioGroupProps<T extends string | number> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

/**
 * 어드민 RadioGroup 공통 컴포넌트
 * 갤러리, Display Settings 등 모든 어드민 페이지에서 재사용
 */
function RadioGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: RadioGroupProps<T>) {
  const borderStyle = createBorderFaint();
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-[var(--color-accent)] tracking-widest">{label}</p>
      <div className="flex gap-3 flex-wrap">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 text-xs tracking-wider border transition-colors cursor-pointer ${
              value === opt.value
                ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/60 text-[var(--color-accent)]'
                : 'text-[var(--color-secondary)]/60 hover:text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5'
            }`}
            style={value !== opt.value ? borderStyle : undefined}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default RadioGroup;
