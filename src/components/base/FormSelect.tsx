import { useId, type SelectHTMLAttributes } from 'react';
import styles from './AdminField.module.css';

interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  onChange: (value: string) => void;
  labelClassName?: string;
}

export default function FormSelect({ label, onChange, id, name, className = '', labelClassName, ...props }: FormSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return <div className={styles.field}>
    <label htmlFor={selectId} className={labelClassName ?? styles.label}>{label}</label>
    <select {...props} id={selectId} name={name ?? selectId}
      onChange={(event) => onChange(event.target.value)} className={`${styles.control} ${className}`} />
  </div>;
}
