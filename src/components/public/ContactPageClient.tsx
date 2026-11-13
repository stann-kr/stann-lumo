"use client";

import { useTranslation } from "react-i18next";
import PageLayout from "@/components/feature/PageLayout";
import type { ContactItem, ContactPageMeta } from "@/capabilities/content/content";
import type { EventsInfo } from "@/capabilities/events/events";
import v5 from "@/styles/v5.module.css";
import styles from './ContactPageClient.module.css';

/* v5 contact (canvas Contact board): the bone plate carries the address; BOOKING INFO sits in three cells below it. */

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
      {/* Canvas Contact board: the bone plate is the call to action. A single address takes the whole plate as its link. */}
      <section className={styles.direct} aria-labelledby="contact-direct" data-single={contactInfo.length === 1}>
        <div className={styles.band}>
          <h2 id="contact-direct" className={v5.label}>{contactMeta.directTitle || 'Booking · Press'}</h2>
          <span className={v5.label} aria-hidden="true">Mail ↗</span>
        </div>
        {contactInfo.map((item, index) => item.value.includes('@')
          ? <a key={index} href={`mailto:${item.value}`} className={styles.address}>{item.value}</a>
          : (
            <div key={index} className={styles.contact}>
              <h3 className={v5.label}>{item.label}</h3>
              <p className={styles.value}>{item.value}</p>
            </div>
          ))}
      </section>
      <section className={v5.plate} aria-labelledby="contact-booking">
        <div className={v5.band}><h2 id="contact-booking" className={v5.label}>{contactMeta.bookingTitle || t("contact_booking_info")}</h2></div>
        <dl className={styles.details}>
          {details.map((detail) => (
            <div key={detail.id}>
              <dt className={`${v5.label} ${v5.muted}`}>{detail.title}</dt>
              {detail.items.map((value, index) => <dd key={index}>{value}</dd>)}
            </div>
          ))}
          {(showsBookingAddress || bookingInfo.responseTime) && <div>
            <dt className={`${v5.label} ${v5.muted}`}>{t(showsBookingAddress ? "events_contact" : "contact_response_time")}</dt>
            {showsBookingAddress && <dd className={v5.mono}><a className={styles.mail} href={`mailto:${bookingInfo.contactEmail}`}>{bookingInfo.contactEmail}</a></dd>}
            {bookingInfo.responseTime && <dd className={v5.mono}>{bookingInfo.responseTime}</dd>}
          </div>}
        </dl>
      </section>
    </PageLayout>
  );
}
