'use client';
import { useTranslation } from 'react-i18next';
import { SIGNAL_NET, SELF_NODE_ID } from '../../constants/signalNet';

/**
 * SIGNAL_NET — 3표면 상호 링크 (STANN OS 불변 글루, 설계 §4-2).
 * 현재 표면(SL-01)은 링크 대신 액센트 마커로 표시.
 */
const SignalNet = () => {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('footer_signal_net_aria')} className="flex flex-col gap-1">
      <span className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-widest">
        SIGNAL_NET
      </span>
      <span className="flex flex-col items-start sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
        {SIGNAL_NET.map((node) =>
          node.id === SELF_NODE_ID ? (
            <span
              key={node.id}
              aria-current="page"
              className="inline-flex min-h-11 items-center text-xs font-mono tracking-widest text-[var(--color-accent)]"
            >
              ● [{node.label}] {node.id}
            </span>
          ) : (
            // 같은 OS의 표면 이동이므로 의도적으로 같은 탭 (target 미지정)
            <a
              key={node.id}
              href={node.href}
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-xs font-mono tracking-widest text-[var(--color-secondary)] transition-colors duration-[var(--os-dur-fast)] hover:text-[var(--color-accent)]"
            >
              [{node.label}] {node.id}
            </a>
          ),
        )}
      </span>
    </nav>
  );
};

export default SignalNet;
