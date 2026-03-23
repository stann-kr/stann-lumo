'use client';
// import { useState } from 'react';          // TODO: 폼 활성화 시 주석 해제
// import type { FormEvent } from 'react';    // TODO: 폼 활성화 시 주석 해제
import { useTranslation } from 'react-i18next';
import { useContent } from '@/contexts/ContentContext';
import PageLayout from '@/components/feature/PageLayout';
import PageSection from '@/components/base/PageSection';
// import { createBorderMid } from '@/utils/colorMix'; // TODO: 폼 활성화 시 주석 해제

const ContactPage = () => {
  const { t } = useTranslation();
  const { contactContent, eventsContent, content } = useContent();
  // const borderMid = createBorderMid(); // TODO: 폼 활성화 시 주석 해제

  // TODO: 메일링 서비스(NEXT_PUBLIC_FORM_ENDPOINT) 연결 후 아래 블록 전체 주석 해제
  // const [formData, setFormData] = useState({ callsign: '', email: '', message: '' });
  // const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  // const charCount = formData.message.length;
  //
  // const handleSubmit = async (e: FormEvent) => {
  //   e.preventDefault();
  //   if (!formData.callsign || !formData.email || !formData.message || formData.message.length > settings.messageMaxLength) {
  //     setStatus('error');
  //     setTimeout(() => setStatus('idle'), 3000);
  //     return;
  //   }
  //   setStatus('sending');
  //   try {
  //     const body = new URLSearchParams();
  //     body.append('callsign', formData.callsign);
  //     body.append('email', formData.email);
  //     body.append('message', formData.message);
  //     const res = await fetch(process.env.NEXT_PUBLIC_FORM_ENDPOINT ?? '', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  //       body: body.toString(),
  //     });
  //     if (res.ok) {
  //       setStatus('success');
  //       setFormData({ callsign: '', email: '', message: '' });
  //       setTimeout(() => setStatus('idle'), 5000);
  //     } else {
  //       setStatus('error');
  //       setTimeout(() => setStatus('idle'), 3000);
  //     }
  //   } catch {
  //     setStatus('error');
  //     setTimeout(() => setStatus('idle'), 3000);
  //   }
  // };

  return (
    <PageLayout
      title={content.pageMeta?.contact?.title || t('contact_title')}
      subtitle={content.pageMeta?.contact?.subtitle || t('contact_subtitle')}
    >
      {/* Guestbook Form — 메일링 서비스 연결 후 활성화 예정 */}
      {/* TODO: NEXT_PUBLIC_FORM_ENDPOINT 환경변수 설정 후 아래 주석 블록 전체 해제 */}
      {/*
      <div className="space-y-8">
        <h2 className="text-xs font-semibold text-[var(--color-accent)] tracking-widest">
          {content.pageMeta?.contact?.guestbookTitle || t('contact_guestbook')}
        </h2>

        <form id="guestbook-form" data-readdy-form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-medium text-[var(--color-accent)] mb-3 tracking-widest">
                {t('contact_form_name')} <span className="text-[var(--color-secondary)] opacity-40">{t('contact_form_required')}</span>
              </label>
              <input type="text" name="callsign" value={formData.callsign}
                onChange={(e) => setFormData({ ...formData, callsign: e.target.value })}
                className="w-full bg-transparent border-b text-[var(--color-secondary)] px-0 py-3 text-sm focus:outline-none transition-colors placeholder:opacity-20"
                style={borderMid} placeholder={t('contact_form_placeholder_name')} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-accent)] mb-3 tracking-widest">
                {t('contact_form_email')} <span className="text-[var(--color-secondary)] opacity-40">{t('contact_form_required')}</span>
              </label>
              <input type="email" name="email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-transparent border-b text-[var(--color-secondary)] px-0 py-3 text-sm focus:outline-none transition-colors placeholder:opacity-20"
                style={borderMid} placeholder={t('contact_form_placeholder_email')} required />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-medium text-[var(--color-accent)] tracking-widest">
                {t('contact_form_message')} <span className="text-[var(--color-secondary)] opacity-40">{t('contact_form_required')}</span>
              </label>
              <span className={`text-xs ${charCount > settings.messageMaxLength * 0.9 ? 'opacity-70' : 'opacity-30'} text-[var(--color-secondary)]`}>
                {charCount}/{settings.messageMaxLength}
              </span>
            </div>
            <textarea name="message" value={formData.message}
              onChange={(e) => { if (e.target.value.length <= settings.messageMaxLength) setFormData({ ...formData, message: e.target.value }); }}
              rows={settings.textareaRows}
              className="w-full bg-transparent border-b text-[var(--color-secondary)] px-0 py-3 text-sm focus:outline-none transition-colors resize-none placeholder:opacity-20"
              style={borderMid} placeholder={t('contact_form_placeholder_message')} required maxLength={settings.messageMaxLength} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
            <button type="submit" disabled={status === 'sending'}
              className="px-8 py-3 border text-[var(--color-secondary)] text-xs tracking-widest hover:opacity-80 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              style={borderMid}>
              {status === 'sending' ? t('contact_btn_sending') : t('contact_btn_send')}
            </button>
            {status === 'success' && (
              <span className="text-[var(--color-muted)] text-xs flex items-center gap-2 tracking-wider">
                <i className="ri-checkbox-circle-line text-base"></i>{t('contact_success')}
              </span>
            )}
            {status === 'error' && (
              <span className="text-[var(--color-secondary)] opacity-60 text-xs flex items-center gap-2 tracking-wider">
                <i className="ri-close-circle-line text-base"></i>{t('contact_error')}
              </span>
            )}
          </div>
        </form>
      </div>
      */}

      {/* Direct Contact */}
      <PageSection
        title={content.pageMeta?.contact?.directTitle || t('contact_direct')}
        icon="ri-mail-line"
      >
        <div className="grid md:grid-cols-3 gap-6">
          {contactContent.contactInfo.map((item, index) => (
            <div key={index} className="hud-panel p-4 space-y-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className={`text-lg text-[var(--color-accent)] ${item.icon}`}></i>
              </div>
              <h3 className="text-xs font-mono text-[var(--color-accent)] tracking-widest">{item.label}</h3>
              {item.value.includes('@') ? (
                <a
                  href={`mailto:${item.value}`}
                  className="text-sm text-[var(--color-secondary)] opacity-80 hover:text-[var(--color-primary)] hover:opacity-100 transition-colors cursor-pointer"
                >
                  {item.value}
                </a>
              ) : (
                <p className="text-sm text-[var(--color-secondary)] opacity-80">{item.value}</p>
              )}
            </div>
          ))}
        </div>
      </PageSection>

      {/* Booking Info */}
      <PageSection
        title={content.pageMeta?.contact?.bookingTitle || t('contact_booking_info')}
        icon="ri-calendar-check-line"
      >
        <div className="grid md:grid-cols-3 gap-6">
          {/* Set Duration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <i className="ri-time-line text-base text-[var(--color-accent)]"></i>
              <h3 className="text-xs font-mono text-[var(--color-accent)] tracking-widest">{t('events_set_duration')}</h3>
            </div>
            <div className="space-y-2">
              {eventsContent.eventsInfo.setDurations.map((duration, index) => (
                <p key={index} className="text-sm text-[var(--color-secondary)] opacity-70">
                  — {duration}
                </p>
              ))}
            </div>
          </div>

          {/* Technical Requirements */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <i className="ri-settings-3-line text-base text-[var(--color-accent)]"></i>
              <h3 className="text-xs font-mono text-[var(--color-accent)] tracking-widest">{t('events_technical')}</h3>
            </div>
            <div className="space-y-2">
              {eventsContent.eventsInfo.technicalRequirements.map((req, index) => (
                <p key={index} className="text-sm text-[var(--color-secondary)] opacity-70">
                  — {req}
                </p>
              ))}
            </div>
          </div>

          {/* Booking Contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <i className="ri-mail-send-line text-base text-[var(--color-accent)]"></i>
              <h3 className="text-xs font-mono text-[var(--color-accent)] tracking-widest">{t('events_contact')}</h3>
            </div>
            <div className="space-y-3">
              <a
                href={`mailto:${eventsContent.eventsInfo.contactEmail}`}
                className="text-sm text-[var(--color-secondary)] opacity-80 hover:text-[var(--color-primary)] hover:opacity-100 transition-colors cursor-pointer block"
              >
                {eventsContent.eventsInfo.contactEmail}
              </a>
              <p className="text-sm text-[var(--color-secondary)] opacity-70">
                {eventsContent.eventsInfo.responseTime}
              </p>
            </div>
          </div>
        </div>
      </PageSection>
    </PageLayout>
  );
};

export default ContactPage;
