import type {LocalizedString, LocalizedStrings, Variables} from "@internationalized/string";

/** Every message key the toast strings define. */
export type ToastStringKey = "notifications";

/**
 * The formatter surface a compiled message actually uses.
 *
 * `plural` and `number` are **protected** on `LocalizedStringFormatter`, so a message that
 * pluralizes cannot be typed against the public class at all. Declared per table rather than
 * shared, matching the drag and drop strings, which hit this first.
 */
interface MessageFormatter {
  plural: (
    count: number,
    options: Record<string, string | (() => string)>,
    type?: Intl.PluralRuleType,
  ) => string;
  number: (value: number) => string;
}

/**
 * Localized strings for the toast region, copied from react-aria 3.51.0
 * (`packages/@react-aria/toast/intl/*.json`).
 *
 * Upstream also defines a `close` message for the toast's close button, and it is deliberately
 * absent here because nothing can reach it: `CloseButton` writes `aria-label="Close"` itself, and
 * that hardcoded label wins over the message the toast offers through context — so the button is
 * English in every locale, upstream included. Adding the key would ship data no code reads.
 *
 * Messages arrive already compiled: a value is a plain string when it has no variables, and a
 * function of its arguments when it does. Generated — edit the source strings upstream, not here.
 */
const strings = {
  "ar-AE": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} إشعار`,
        other: () => `${formatter.number(Number(args?.["count"]))} إشعارات`,
      })}.`,
  },
  "bg-BG": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} известие`,
        other: () => `${formatter.number(Number(args?.["count"]))} известия`,
      })}.`,
  },
  "cs-CZ": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} oznámení`,
        other: () => `${formatter.number(Number(args?.["count"]))} oznámení`,
      })}.`,
  },
  "da-DK": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} besked`,
        other: () => `${formatter.number(Number(args?.["count"]))} beskeder`,
      })}.`,
  },
  "de-DE": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} Benachrichtigung`,
        other: () => `${formatter.number(Number(args?.["count"]))} Benachrichtigungen`,
      })}.`,
  },
  "el-GR": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} ειδοποίηση`,
        other: () => `${formatter.number(Number(args?.["count"]))} ειδοποιήσεις`,
      })}.`,
  },
  "en-US": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} notification`,
        other: () => `${formatter.number(Number(args?.["count"]))} notifications`,
      })}.`,
  },
  "es-ES": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} notificación`,
        other: () => `${formatter.number(Number(args?.["count"]))} notificaciones`,
      })}.`,
  },
  "et-EE": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} teatis`,
        other: () => `${formatter.number(Number(args?.["count"]))} teatist`,
      })}.`,
  },
  "fi-FI": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} ilmoitus`,
        other: () => `${formatter.number(Number(args?.["count"]))} ilmoitusta`,
      })}.`,
  },
  "fr-FR": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} notification`,
        other: () => `${formatter.number(Number(args?.["count"]))} notifications`,
      })}.`,
  },
  "he-IL": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} התראה`,
        other: () => `${formatter.number(Number(args?.["count"]))} התראות`,
      })}.`,
  },
  "hr-HR": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} obavijest`,
        other: () => `${formatter.number(Number(args?.["count"]))} obavijesti`,
      })}.`,
  },
  "hu-HU": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} értesítés`,
        other: () => `${formatter.number(Number(args?.["count"]))} értesítés`,
      })}.`,
  },
  "it-IT": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} notifica`,
        other: () => `${formatter.number(Number(args?.["count"]))} notifiche`,
      })}.`,
  },
  "ja-JP": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 個の通知`,
        other: () => `${formatter.number(Number(args?.["count"]))} 個の通知`,
      })}。`,
  },
  "ko-KR": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))}개 알림`,
        other: () => `${formatter.number(Number(args?.["count"]))}개 알림`,
      })}.`,
  },
  "lt-LT": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} pranešimas`,
        other: () => `${formatter.number(Number(args?.["count"]))} pranešimai`,
      })}.`,
  },
  "lv-LV": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} paziņojums`,
        other: () => `${formatter.number(Number(args?.["count"]))} paziņojumi`,
      })}.`,
  },
  "nb-NO": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} varsling`,
        other: () => `${formatter.number(Number(args?.["count"]))} varsler`,
      })}.`,
  },
  "nl-NL": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} melding`,
        other: () => `${formatter.number(Number(args?.["count"]))} meldingen`,
      })}.`,
  },
  "pl-PL": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        few: () => `${formatter.number(Number(args?.["count"]))} powiadomienia`,
        many: () => `${formatter.number(Number(args?.["count"]))} powiadomień`,
        one: () => `${formatter.number(Number(args?.["count"]))} powiadomienie`,
        other: () => `${formatter.number(Number(args?.["count"]))} powiadomienia`,
      })}.`,
  },
  "pt-BR": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} notificação`,
        other: () => `${formatter.number(Number(args?.["count"]))} notificações`,
      })}.`,
  },
  "pt-PT": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} notificação`,
        other: () => `${formatter.number(Number(args?.["count"]))} notificações`,
      })}.`,
  },
  "ro-RO": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} notificare`,
        other: () => `${formatter.number(Number(args?.["count"]))} notificări`,
      })}.`,
  },
  "ru-RU": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} уведомление`,
        other: () => `${formatter.number(Number(args?.["count"]))} уведомления`,
      })}.`,
  },
  "sk-SK": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        few: () => `${formatter.number(Number(args?.["count"]))} oznámenia`,
        one: () => `${formatter.number(Number(args?.["count"]))} oznámenie`,
        other: () => `${formatter.number(Number(args?.["count"]))} oznámení`,
      })}.`,
  },
  "sl-SI": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        few: () => `${formatter.number(Number(args?.["count"]))} obvestila`,
        one: () => `${formatter.number(Number(args?.["count"]))} obvestilo`,
        other: () => `${formatter.number(Number(args?.["count"]))} obvestil`,
        two: () => `${formatter.number(Number(args?.["count"]))} obvestili`,
      })}.`,
  },
  "sr-SP": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} obaveštenje`,
        other: () => `${formatter.number(Number(args?.["count"]))} obaveštenja`,
      })}.`,
  },
  "sv-SE": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} meddelande`,
        other: () => `${formatter.number(Number(args?.["count"]))} meddelanden`,
      })}.`,
  },
  "tr-TR": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} bildirim`,
        other: () => `${formatter.number(Number(args?.["count"]))} bildirim`,
      })}.`,
  },
  "uk-UA": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} сповіщення`,
        other: () => `${formatter.number(Number(args?.["count"]))} сповіщення`,
      })}.`,
  },
  "zh-CN": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 个通知`,
        other: () => `${formatter.number(Number(args?.["count"]))} 个通知`,
      })}。`,
  },
  "zh-TW": {
    notifications: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 個通知`,
        other: () => `${formatter.number(Number(args?.["count"]))} 個通知`,
      })}。`,
  },
};

/**
 * One assertion for the whole table rather than a cast at each message: the formatter a message
 * receives is the real class, whose `plural` is protected, so no structural type can describe both
 * what the messages need and what the class exposes.
 */
export const toastStrings = strings as unknown as LocalizedStrings<ToastStringKey, LocalizedString>;
