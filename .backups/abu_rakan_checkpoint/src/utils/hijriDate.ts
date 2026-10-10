/**
 * Hijri Date & Time Formatter Utilities
 * Formats dates into Hijri calendar (Umm al-Qura) with day, date, and time in Arabic.
 */

export interface HijriDateTimeResult {
  hijriStr: string;
  timeStr: string;
  fullStr: string;
  dayName: string;
  isAvailable: boolean;
}

export function formatHijriFullDateTime(dateInput?: string | Date | null): HijriDateTimeResult {
  if (!dateInput) {
    return {
      hijriStr: 'غير محدد',
      timeStr: '',
      fullStr: 'لم يتم الإرسال بعد ⏳',
      dayName: '',
      isAvailable: false
    };
  }

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (!d || isNaN(d.getTime())) {
      return {
        hijriStr: 'غير محدد',
        timeStr: '',
        fullStr: 'لم يتم الإرسال بعد ⏳',
        dayName: '',
        isAvailable: false
      };
    }

    const dayFormatter = new Intl.DateTimeFormat('ar-SA', { weekday: 'long' });
    const dayName = dayFormatter.format(d);

    const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const timeFormatter = new Intl.DateTimeFormat('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const hijriStr = hijriFormatter.format(d);
    const timeStr = timeFormatter.format(d);
    const fullStr = `${hijriStr} - الساعة ${timeStr}`;

    return {
      hijriStr,
      timeStr,
      fullStr,
      dayName,
      isAvailable: true
    };
  } catch (err) {
    return {
      hijriStr: 'غير محدد',
      timeStr: '',
      fullStr: 'لم يتم الإرسال بعد ⏳',
      dayName: '',
      isAvailable: false
    };
  }
}
