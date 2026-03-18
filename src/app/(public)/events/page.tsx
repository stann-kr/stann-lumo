'use client';
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useContent } from "@/contexts/ContentContext";
import PageLayout from "@/components/feature/PageLayout";
import { createBorderFaint, createBorderMid } from "@/utils/colorMix";

const EventsPage = () => {
  const { t } = useTranslation();
  const { eventsContent, content } = useContent();
  const borderFaint = createBorderFaint();
  const borderMid = createBorderMid();

  const [visiblePastCount, setVisiblePastCount] = useState(10);

  const upcomingEvents = eventsContent.performances.filter((event) => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });

  const pastEvents = eventsContent.performances.filter((event) => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
      spacing="lg"
    >
      {/* Upcoming Events */}
      <div className="space-y-6">
        <h2 className="text-xs font-semibold text-[var(--color-accent)] tracking-widest">
          {content.pageMeta?.events?.upcomingTitle || t("events_upcoming")}
        </h2>

        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-[var(--color-secondary)] opacity-40">
            {t("msg_no_items")}
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="group border p-5 transition-all duration-300"
                style={borderFaint}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="text-[var(--color-secondary)] font-semibold text-base tracking-wide group-hover:text-[var(--color-primary)] transition-colors">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="text-[var(--color-secondary)] opacity-50">
                        {event.venue}
                      </span>
                      {event.location && (
                        <>
                          <span className="text-[var(--color-secondary)] opacity-25">
                            ·
                          </span>
                          <span className="text-[var(--color-secondary)] opacity-40">
                            {event.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1 shrink-0">
                    <p className="text-sm font-mono text-[var(--color-secondary)] opacity-80">
                      {event.date}
                    </p>
                    {event.time && (
                      <p className="text-xs font-mono text-[var(--color-secondary)] opacity-40">
                        {event.time}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Events */}
      <div className="space-y-6 pt-8 border-t" style={borderFaint}>
        <h2 className="text-xs font-semibold text-[var(--color-accent)] tracking-widest">
          {content.pageMeta?.events?.pastTitle || t("events_past")}
        </h2>

        {pastEvents.length === 0 ? (
          <p className="text-sm text-[var(--color-secondary)] opacity-40">
            {t("msg_no_items")}
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {visiblePastEvents.map((event) => (
                <div
                  key={event.id}
                  className="group border p-5 transition-all duration-300 opacity-50 hover:opacity-75"
                  style={borderFaint}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="text-[var(--color-secondary)] font-semibold text-base tracking-wide group-hover:text-[var(--color-primary)] transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-[var(--color-secondary)] opacity-50">
                          {event.venue}
                        </span>
                        {event.location && (
                          <>
                            <span className="text-[var(--color-secondary)] opacity-25">
                              ·
                            </span>
                            <span className="text-[var(--color-secondary)] opacity-40">
                              {event.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1 shrink-0">
                      <p className="text-sm font-mono text-[var(--color-secondary)] opacity-80">
                        {event.date}
                      </p>
                      {event.time && (
                        <p className="text-xs font-mono text-[var(--color-secondary)] opacity-40">
                          {event.time}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMorePastEvents && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-3 border text-[var(--color-secondary)] text-xs tracking-widest hover:opacity-80 transition-all duration-300 cursor-pointer whitespace-nowrap"
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
