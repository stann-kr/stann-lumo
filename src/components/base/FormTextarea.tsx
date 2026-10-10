import { useId, type TextareaHTMLAttributes } from 'react';
import styles from './AdminField.module.css';

interface FormTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Container classes; the textarea uses the shared field style. */
  className?: string;
}

export default function FormTextarea({ label, value, onChange, rows = 4, className = '', id, name, ...props }: FormTextareaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return <div className={`${styles.field} ${className}`}>
    <label htmlFor={inputId} className={styles.label}>{label}</label>
    <textarea {...props} id={inputId} name={name ?? inputId} value={value} rows={rows}
      onChange={(event) => onChange(event.target.value)} className={styles.control} />
  </div>;
}
