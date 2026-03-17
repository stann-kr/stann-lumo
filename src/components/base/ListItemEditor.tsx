import { useTranslation } from 'react-i18next';
import { createBorderMid, createBorderAccent } from '../../utils/colorMix';

interface ListItemEditorProps {
  label: string;
  items: string[];
  onUpdate: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

/**
 * 어드민 리스트 항목 편집 컴포넌트
 * - 배열 데이터 CRUD UI 통합
 * - 추가/수정/삭제 기능 제공
 */
const ListItemEditor = ({
  label,
  items,
  onUpdate,
  onAdd,
  onRemove
}: ListItemEditorProps) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs text-[var(--color-accent)] tracking-widest">
          {label}
        </label>
        <button
          onClick={onAdd}
          className="text-xs text-[var(--color-accent)] hover:text-[var(--color-secondary)] transition-colors cursor-pointer whitespace-nowrap"
        >
          + {t('btn_add')}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-[var(--color-accent)] text-xs">—</span>
            <input
              type="text"
              value={item}
              onChange={(e) => onUpdate(index, e.target.value)}
              className="flex-1 bg-transparent border-b text-[var(--color-secondary)] text-sm tracking-wider py-1.5 focus:outline-none transition-colors"
              style={createBorderMid()}
              onFocus={(e) => Object.assign(e.target.style, createBorderAccent())}
              onBlur={(e) => Object.assign(e.target.style, createBorderMid())}
            />
            <button
              onClick={() => onRemove(index)}
              className="w-6 h-6 flex items-center justify-center text-red-400/60 hover:text-red-400 transition-colors cursor-pointer"
              aria-label={t('btn_delete')}
            >
              <i className="ri-close-line text-xs"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListItemEditor;
