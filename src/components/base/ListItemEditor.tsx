import FormInput from './FormInput';
import collection from '@/capabilities/admin/AdminCollection.module.css';

interface ListItemEditorProps {
  label: string;
  items: string[];
  onUpdate: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export default function ListItemEditor({ label, items, onUpdate, onAdd, onRemove }: ListItemEditorProps) {
  return <div className={collection.stack}>
    <div className={collection.sectionHeader}>
      <h3>{label}</h3>
      <button type="button" className={collection.button} aria-label={`${label} 추가`} onClick={onAdd}>추가</button>
    </div>
    {items.map((item, index) => <div key={index} className={collection.inlineItem}>
      <FormInput label={`${label} ${index + 1}`} value={item} onChange={(value) => onUpdate(index, value)} />
      <button type="button" className={collection.dangerButton} aria-label={`${label} ${index + 1} 삭제`} onClick={() => onRemove(index)}>삭제</button>
    </div>)}
    {!items.length && <p className={collection.notice}>등록한 항목이 없습니다.</p>}
  </div>;
}
