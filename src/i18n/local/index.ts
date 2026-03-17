import en from './en/index';
import ko from './ko/index';

const messages: Record<string, { translation: Record<string, string> }> = {
  en: { translation: en },
  ko: { translation: ko },
};

export default messages;
