import { useId, type InputHTMLAttributes } from 'react';
import styles from './AdminField.module.css';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function FormInput({ label, value, onChange, id, name, className = '', ...props }: FormInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return <div className={styles.field}>
    <label htmlFor={inputId} className={styles.label}>{label}</label>
    <input {...props} id={inputId} name={name ?? inputId} value={value}
      onChange={(event) => onChange(event.target.value)} className={`${styles.control} ${className}`} />
  </div>;
}
