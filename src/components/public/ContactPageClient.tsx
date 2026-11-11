"use client";

import { useTranslation } from "react-i18next";
import PageLayout from "@/components/feature/PageLayout";
import type { ContactItem, ContactPageMeta } from "@/capabilities/content/content";
import type { EventsInfo } from "@/capabilities/events/events";
import v5 from "@/styles/v5.module.css";
import styles from './ContactPageClient.module.css';

/* v5 contact: the canvas booking plate (bone) carries the address; booking details sit on dark plates beside it. */

interface ContactPageClientProps { bookingInfo: EventsInfo; contactInfo: ContactItem[]; contactMeta: ContactPageMeta; }

export default function ContactPageClient({ bookingInfo, contactInfo, contactMeta }: ContactPageClientProps) {
  const { t } = useTranslation();
  const isBookingAddressListed = contactInfo.some((item) => item.value.trim().toLowerCase() === bookingInfo.contactEmail.trim().toLowerCase());
  const showsBookingAddress = !!bookingInfo.contactEmail && !isBookingAddressListed;
  const details = [
    { id: 'durations', title: t("events_set_duration"), items: bookingInfo.setDurations },
    { id: 'technical', title: t("events_technical"), items: bookingInfo.technicalRequirements },
  ].filter((detail) => detail.items.length > 0);
  return (
    <PageLayout title={contactMeta.title || t("contact_title")} subtitle={/guestbook|방명록/i.test(contactMeta.subtitle) ? undefined : contactMeta.subtitle}>
      <section className={styles.direct} aria-labelledby="contact-direct">
        <div className={styles.band}><h2 id="contact-direct" className={v5.label}>{contactMeta.directTitle || 'Booking · Press'}</h2></div>
        {contactInfo.map((item, index) => (
          <div key={index} className={styles.contact}>
            <h3 className={v5.label}>{item.label}</h3>
            {item.value.includes('@') ? <a href={`mailto:${item.value}`} className={styles.address}>{item.value}</a> : <p className={styles.value}>{item.value}</p>}
          </div>
        ))}
      </section>
      <section className={styles.booking} aria-labelledby="contact-booking">
        <div className={`${v5.band} ${styles.bookingBand}`}><h2 id="contact-booking" className={v5.label}>{contactMeta.bookingTitle || t("contact_booking_info")}</h2></div>
        <div className={styles.details}>
          {details.map((detail) => (
            <div key={detail.id} className={v5.plate}>
              <h3 className={`${v5.label} ${styles.detailTitle}`}>{detail.title}</h3>
              <ul className={v5.rows}>{detail.items.map((value, index) => <li key={index} className={styles.detailRow}>{value}</li>)}</ul>
            </div>
          ))}
          {(showsBookingAddress || bookingInfo.responseTime) && <div className={v5.plate}>
            <h3 className={`${v5.label} ${styles.detailTitle}`}>{t(showsBookingAddress ? "events_contact" : "contact_response_time")}</h3>
            <div className={v5.rows}>
              {showsBookingAddress && <a className={`${styles.detailRow} ${styles.mail}`} href={`mailto:${bookingInfo.contactEmail}`}>{bookingInfo.contactEmail}</a>}
              {bookingInfo.responseTime && <p className={styles.detailRow}>{bookingInfo.responseTime}</p>}
            </div>
          </div>}
        </div>
      </section>
    </PageLayout>
  );
}
