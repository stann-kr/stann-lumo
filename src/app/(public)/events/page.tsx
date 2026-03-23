'use client';
import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useContent } from "@/contexts/ContentContext";
import PageLayout from "@/components/feature/PageLayout";
import { createBorderMid } from "@/utils/colorMix";

const EventsPage = () => {
  const { t } = useTranslation();
  const { eventsContent, content } = useContent();
  const borderMid = createBorderMid();

  const [visiblePastCount, setVisiblePastCount] = useState(10);

  // YYYY.MM.DD (RA) / YYYY-MM-DD (수동) 양쪽 형식 지원
  const parseEventDate = (dateStr: string): Date => {
    const normalized = dateStr.replace(/\./g, '-');
    return new Date(normalized);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = eventsContent.performances.filter((event) => {
    const eventDate = parseEventDate(event.date);
    return eventDate >= today;
  });

  const pastEvents = eventsContent.performances.filter((event) => {
    const eventDate = parseEventDate(event.date);
    return eventDate < today;
  });

  const visiblePastEvents = pastEvents.slice(0, visiblePastCount);
  const hasMorePastEvents = pastEvents.length > visiblePastCount;

  const handleLoadMore = () => {
    setVisiblePastCount((prev) => prev + 10);
  };

  return (
    <PageLayout
      title={content.pageMeta?.events?.title || t("events_title")}
      subtitle={content.pageMeta?.events?.subtitle || t("events_subtitle")}
    >
      {/* Upcoming Events */}
      <div className="space-y-6">
        <h2 className="text-sm font-mono font-semibold text-[var(--color-accent)] tracking-widest">
          {content.pageMeta?.events?.upcomingTitle || t("events_upcoming")}
        </h2>

        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-[var(--color-secondary)] opacity-40">
            {t("msg_no_items")}
          </p>
        ) : (
          <div className="hud-panel flex flex-col">
            {upcomingEvents.map((event, idx) => {
              const idStr = (idx + 1).toString().padStart(3, '0');
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group relative overflow-hidden border-b border-[var(--color-muted)]/20 last:border-b-0 transition-colors hover:bg-[var(--color-accent)]/5 flex flex-col md:flex-row md:items-center p-4 gap-4"
                >
                  <div className="w-8 font-mono text-[10px] text-[var(--color-accent)] hidden md:block">
                    [{idStr}]
                  </div>
                  
                  {event.posterImageId && (
                    <div className="w-12 h-12 bg-black border border-[var(--color-muted)] shrink-0 overflow-hidden relative">
                      <div className="absolute inset-0 bg-[var(--color-accent)] opacity-20 mix-blend-overlay"></div>
                      <img
                        src={`/api/media/${event.posterImageId}`}
                        alt={event.title}
                        className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-mono text-base tracking-[0.1em] text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] transition-colors uppercase truncate mb-1">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2 font-mono text-xs tracking-widest text-[var(--color-secondary)] opacity-60 uppercase">
                      <span>{event.venue}</span>
                      {event.location && (
                        <>
                          <span className="text-[var(--color-muted)]">/</span>
                          <span>{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end justify-center shrink-0 w-32 font-mono">
                    <p className="text-sm text-[var(--color-primary)] tracking-widest mb-1">
                      {event.date}
                    </p>
                    {event.time && (
                      <p className="text-xs text-[var(--color-accent)] opacity-80 tracking-widest">
                        {event.time}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Events */}
      <div className="space-y-6 pt-8 relative before:absolute before:top-0 before:left-0 before:w-16 before:h-px before:bg-[var(--color-accent)]">
        <h2 className="text-sm font-mono font-semibold text-[var(--color-secondary)] opacity-50 tracking-widest">
          {content.pageMeta?.events?.pastTitle || t("events_past")}
        </h2>

        {pastEvents.length === 0 ? (
          <p className="text-sm text-[var(--color-secondary)] opacity-40 font-mono">
            {t("msg_no_items")}
          </p>
        ) : (
          <>
            <div className="hud-panel flex flex-col opacity-50">
              {visiblePastEvents.map((event, idx) => {
                const idStr = (idx + 1).toString().padStart(3, '0');
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="group relative overflow-hidden border-b border-[var(--color-muted)]/20 last:border-b-0 transition-opacity hover:opacity-100 flex flex-col md:flex-row md:items-center p-4 gap-4"
                  >
                    <div className="w-8 font-mono text-[10px] text-[var(--color-secondary)] opacity-50 hidden md:block">
                      [{idStr}]
                    </div>
                    
                    {event.posterImageId && (
                      <div className="w-10 h-10 bg-black border border-[var(--color-muted)]/50 shrink-0 overflow-hidden">
                        <img
                          src={`/api/media/${event.posterImageId}`}
                          alt={event.title}
                          className="w-full h-full object-cover filter grayscale opacity-50 group-hover:opacity-100 transition-all duration-300"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-mono text-sm tracking-widest text-[var(--color-secondary)] group-hover:text-[var(--color-primary)] transition-colors uppercase truncate mb-1">
                        {event.title}
                      </h3>
                      <div className="font-mono text-[10px] tracking-widest text-[var(--color-secondary)] opacity-40 uppercase truncate">
                        {event.venue} {event.location && `/ ${event.location}`}
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end justify-center shrink-0 w-32 font-mono opacity-60">
                      <p className="text-xs text-[var(--color-secondary)] tracking-widest">
                        {event.date}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {hasMorePastEvents && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-3 border text-[var(--color-secondary)] text-sm tracking-widest hover:opacity-80 transition-all duration-300 cursor-pointer whitespace-nowrap"
                  style={borderMid}
                >
                  {t("events_load_more")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default EventsPage;
