"use client";

import { useState } from "react";
import type { RaSyncStatus } from "./raSync";

interface RaSyncPanelProps {
  status: RaSyncStatus | null;
  isLoading: boolean;
  isRunning: boolean;
  error: string;
  success: string;
  isRunDisabled: boolean;
  disabledReason: string;
  onRun: () => void;
  onRestoreExclusion: (raEventId: string) => Promise<void>;
}

const formatDateTime = (value: number | null) =>
  value === null
    ? "기록 없음"
    : new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Seoul",
      }).format(value);

const statusLabel: Record<RaSyncStatus["lastStatus"], string> = {
  never: "아직 실행되지 않음",
  running: "실행 중",
  success: "최근 실행 성공",
  failed: "최근 실행 실패",
  "not-configured": "RA API 설정 필요",
};

export default function RaSyncPanel({
  status,
  isLoading,
  isRunning,
  error,
  success,
  isRunDisabled,
  disabledReason,
  onRun,
  onRestoreExclusion,
}: RaSyncPanelProps) {
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const restore = async (raEventId: string) => {
    setRestoringId(raEventId);
    try {
      await onRestoreExclusion(raEventId);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <section aria-labelledby="ra-sync-title" className="space-y-4">
      <div>
        <h3
          id="ra-sync-title"
          className="text-sm font-bold text-[var(--color-secondary)] tracking-wider"
        >
          RA 동기화 상태
        </h3>
        <p className="mt-1 text-xs text-[var(--color-secondary)]/60 tracking-wider">
          매일 오전 4:15(KST)에 확인하며, 정상 동기화는 2주마다 실행됩니다.
        </p>
      </div>

      {isLoading ? (
        <p role="status" className="text-sm text-[var(--color-secondary)]/70">
          동기화 상태를 불러오는 중입니다.
        </p>
      ) : status ? (
        <div className="grid grid-cols-1 gap-2 text-xs tracking-wider text-[var(--color-secondary)]/75 md:grid-cols-2">
          <p>
            상태:{" "}
            <span className="text-[var(--color-secondary)]">
              {statusLabel[status.lastStatus]}
            </span>
          </p>
          <p>
            마지막 성공:{" "}
            <span className="text-[var(--color-secondary)]">
              {formatDateTime(status.lastSuccessAt)}
            </span>
          </p>
          <p>
            최근 결과:{" "}
            <span className="text-[var(--color-secondary)]">
              {status.fetched}개 확인 · {status.inserted}개 추가 ·{" "}
              {status.skippedExcluded}개 제외
            </span>
          </p>
          <p>
            다음 실행:{" "}
            <span className="text-[var(--color-secondary)]">
              {formatDateTime(status.nextRetryAt ?? status.nextScheduledAt)}
            </span>
          </p>
          {status.lastErrorCode && (
            <p className="text-red-400">최근 오류: {status.lastErrorCode}</p>
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        <button
          type="button"
          onClick={onRun}
          disabled={isRunDisabled}
          className="px-6 py-2 bg-[var(--color-accent)] text-[var(--color-bg)] tracking-wider text-sm hover:bg-[var(--color-primary)] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? "동기화 중…" : "RA 정보 가져오기"}
        </button>
        {disabledReason && (
          <p className="text-xs text-[var(--color-secondary)]/60">
            {disabledReason}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-400 tracking-wider">
            {error}
          </p>
        )}
        {success && (
          <p
            role="status"
            aria-live="polite"
            className="text-sm text-green-400 tracking-wider"
          >
            {success}
          </p>
        )}
      </div>

      {status && status.exclusions.length > 0 && (
        <div className="border-t border-[color:color-mix(in_srgb,var(--color-secondary)_15%,transparent)] pt-4">
          <h4 className="text-xs font-bold text-[var(--color-secondary)] tracking-wider">
            동기화 제외 목록
          </h4>
          <p className="mt-1 text-xs text-[var(--color-secondary)]/60">
            삭제 후 제외된 RA 이벤트입니다. 복원해도 즉시 가져오지는 않으며 다음
            수동 또는 정기 동기화에서 다시 확인합니다.
          </p>
          <ul className="mt-3 space-y-2">
            {status.exclusions.map((exclusion) => (
              <li
                key={exclusion.raEventId}
                className="flex flex-wrap items-center justify-between gap-2 text-xs tracking-wider"
              >
                <span>
                  {exclusion.title || `RA ${exclusion.raEventId}`} ·{" "}
                  {formatDateTime(exclusion.excludedAt)}
                </span>
                <button
                  type="button"
                  onClick={() => void restore(exclusion.raEventId)}
                  disabled={restoringId !== null || isRunning}
                  className="min-h-9 px-3 border border-[var(--color-secondary)]/30 text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/10 disabled:opacity-50"
                >
                  {restoringId === exclusion.raEventId
                    ? "복원 중…"
                    : "복원"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
