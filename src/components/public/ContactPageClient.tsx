"use client";

import { useTranslation } from "react-i18next";
import PageLayout from "@/components/feature/PageLayout";
import type { ContactItem, ContactPageMeta } from "@/capabilities/content/content";
import type { EventsInfo } from "@/capabilities/events/events";
import styles from './ContactPageClient.module.css';

interface ContactPageClientProps { bookingInfo: EventsInfo; contactInfo: ContactItem[]; contactMeta: ContactPageMeta; }

export default function ContactPageClient({ bookingInfo, contactInfo, contactMeta }: ContactPageClientProps) {
  const { t } = useTranslation();
  const isBookingAddressListed = contactInfo.some((item) => item.value.trim().toLowerCase() === bookingInfo.contactEmail.trim().toLowerCase());
  return (
    <PageLayout title={contactMeta.title || t("contact_title")} subtitle={/guestbook|방명록/i.test(contactMeta.subtitle) ? undefined : contactMeta.subtitle}>
      <section className={styles.direct}>
        <h2 className="sr-only">{contactMeta.directTitle || t("contact_direct")}</h2>
        {contactInfo.map((item, index) => (
          <div key={index} className={styles.contact}>
            <h3>{item.label}</h3>
            {item.value.includes('@') ? <a href={`mailto:${item.value}`} data-hover><span className={styles.address} data-hover-label>{item.value}</span><i className={styles.linkRule} data-hover-rule aria-hidden="true" /></a> : <p>{item.value}</p>}
          </div>
        ))}
      </section>
      <section className={styles.booking}>
        <h2>{contactMeta.bookingTitle || t("contact_booking_info")}</h2>
        <div className={styles.details}>
          {!!bookingInfo.setDurations.length && <div><h3>{t("events_set_duration")}</h3><ul>{bookingInfo.setDurations.map((duration, index) => <li key={index}>{duration}</li>)}</ul></div>}
          {!!bookingInfo.technicalRequirements.length && <div><h3>{t("events_technical")}</h3><ul>{bookingInfo.technicalRequirements.map((requirement, index) => <li key={index}>{requirement}</li>)}</ul></div>}
          {((bookingInfo.contactEmail && !isBookingAddressListed) || bookingInfo.responseTime) && <div><h3>{t("events_contact")}</h3>
            {bookingInfo.contactEmail && !isBookingAddressListed && <a href={`mailto:${bookingInfo.contactEmail}`}>{bookingInfo.contactEmail}</a>}
            {bookingInfo.responseTime && <p>{bookingInfo.responseTime}</p>}
          </div>}
        </div>
      </section>
    </PageLayout>
  );
}
