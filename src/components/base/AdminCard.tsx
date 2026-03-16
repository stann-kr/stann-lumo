import { ReactNode } from 'react';
import { createBorderFaint } from '../../utils/colorMix';

/**
 * AdminCard Props 정의
 */
interface AdminCardProps {
  /** 카드 내부에 렌더링될 자식 요소 */
  children: ReactNode;
  /** 추가 CSS 클래스명 */
  className?: string;
}

/**
 * 어드민 페이지용 카드 컴포넌트
 * 
 * 통일된 스타일의 카드 레이아웃을 제공함
 * - 배경색, 테두리, 패딩 등 일관된 디자인 적용
 * - CSS 변수 기반 테마 색상 사용
 * 
 * @example
 * ```tsx
 * <AdminCard>
 *   <FormInput label="Name" value={name} onChange={setName} />
 * </AdminCard>
 * ```
 */
const AdminCard = ({ children, className = '' }: AdminCardProps) => {
  return (
    <div 
      className={`bg-[var(--color-secondary)]/5 border p-6 ${className}`}
      style={createBorderFaint()}
    >
      {children}
    </div>
  );
};

export default AdminCard;