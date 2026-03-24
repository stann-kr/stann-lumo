import { useState } from 'react';
import { createBorderMid, createBorderAccent } from '../../utils/colorMix';

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
}

/**
 * 어드민 폼 텍스트 영역 컴포넌트
 * - label + textarea 반복 패턴 통합
 * - 일관된 스타일 및 포커스 효과 제공
 */
const FormTextarea = ({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  className = ''
}: FormTextareaProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={className}>
      <label className="block text-xs text-[var(--color-accent)] tracking-widest mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-transparent border text-[var(--color-secondary)] text-sm leading-relaxed p-3 focus:outline-none transition-colors resize-none"
        style={isFocused ? createBorderAccent() : createBorderMid()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </div>
  );
};

export default FormTextarea;