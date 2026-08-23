import type { LocalizedString, LocalizedStrings, Variables } from "@internationalized/string";

/** Every message key the combo box strings define. */
export type ComboBoxStringKey =
  | "focusAnnouncement"
  | "countAnnouncement"
  | "selectedAnnouncement"
  | "buttonLabel"
  | "listboxLabel";

/**
 * Localized strings for the combo box, copied from react-aria 3.51.0
 * (`packages/react-aria/intl/combobox/*.json`).
 *
 * Messages arrive already compiled: a value is a plain string when it has no variables, and a
 * function of its arguments when it does, which is the `LocalizedString` shape
 * `LocalizedStringFormatter` expects. Generated — edit the source strings upstream, not here.
 */

/**
 * The formatter surface a compiled message actually uses.
 *
 * `plural`, `number` and `select` are **protected** on `LocalizedStringFormatter`, so a message
 * that pluralizes or branches cannot be typed against the public class at all. Same reason the
 * drag and drop table declares one of these.
 */
interface MessageFormatter {
  plural: (
    count: number,
    options: Record<string, string | (() => string)>,
    type?: Intl.PluralRuleType,
  ) => string;
  number: (value: number) => string;
  select: (options: Record<string, string | (() => string)>, value: string) => string;
}

/* eslint-disable sort-keys, sort-keys-fix/sort-keys-fix */
// The branch names inside a `select` message — `true` and `other` — are ICU message data, not
// keys anyone chose, so they stay in the order the compiled strings arrive in. Message *names* are
// sorted; see `messagesOf` in the generator.
const strings = {
  "ar-AE": {
    buttonLabel: `\u{639}\u{631}\u{636} \u{627}\u{644}\u{645}\u{642}\u{62A}\u{631}\u{62D}\u{627}\u{62A}`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () =>
          `${formatter.number(Number(args?.["optionCount"]))} \u{62E}\u{64A}\u{627}\u{631}`,
        other: () =>
          `${formatter.number(Number(args?.["optionCount"]))} \u{62E}\u{64A}\u{627}\u{631}\u{627}\u{62A}`,
      })} \u{645}\u{62A}\u{627}\u{62D}\u{629}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `\u{627}\u{644}\u{645}\u{62C}\u{645}\u{648}\u{639}\u{629} \u{627}\u{644}\u{645}\u{62F}\u{62E}\u{644}\u{629} ${args?.["groupTitle"]}, \u{645}\u{639} ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{62E}\u{64A}\u{627}\u{631}`,
                other: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{62E}\u{64A}\u{627}\u{631}\u{627}\u{62A}`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, \u{645}\u{62D}\u{62F}\u{62F}`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `\u{645}\u{642}\u{62A}\u{631}\u{62D}\u{627}\u{62A}`,
    selectedAnnouncement: (args: Variables) =>
      `${args?.["optionText"]}\u{60C} \u{645}\u{62D}\u{62F}\u{62F}`,
  },
  "bg-BG": {
    buttonLabel: `\u{41F}\u{43E}\u{43A}\u{430}\u{436}\u{438} \u{43F}\u{440}\u{435}\u{434}\u{43B}\u{43E}\u{436}\u{435}\u{43D}\u{438}\u{44F}`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () =>
          `${formatter.number(Number(args?.["optionCount"]))} \u{43E}\u{43F}\u{446}\u{438}\u{44F}`,
        other: () =>
          `${formatter.number(Number(args?.["optionCount"]))} \u{43E}\u{43F}\u{446}\u{438}\u{438}`,
      })} \u{43D}\u{430} \u{440}\u{430}\u{437}\u{43F}\u{43E}\u{43B}\u{43E}\u{436}\u{435}\u{43D}\u{438}\u{435}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `\u{412}\u{44A}\u{432}\u{435}\u{434}\u{435}\u{43D}\u{430} \u{433}\u{440}\u{443}\u{43F}\u{430} ${args?.["groupTitle"]}, \u{441} ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{43E}\u{43F}\u{446}\u{438}\u{44F}`,
                other: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{43E}\u{43F}\u{446}\u{438}\u{438}`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, \u{438}\u{437}\u{431}\u{440}\u{430}\u{43D}\u{438}`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `\u{41F}\u{440}\u{435}\u{434}\u{43B}\u{43E}\u{436}\u{435}\u{43D}\u{438}\u{44F}`,
    selectedAnnouncement: (args: Variables) =>
      `${args?.["optionText"]}, \u{438}\u{437}\u{431}\u{440}\u{430}\u{43D}\u{438}`,
  },
  "cs-CZ": {
    buttonLabel: `Zobrazit doporu\u{10D}en\xed`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `K dispozici ${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `je ${formatter.number(Number(args?.["optionCount"]))} mo\u{17E}nost`,
        other: () =>
          `jsou/je ${formatter.number(Number(args?.["optionCount"]))} mo\u{17E}nosti/-\xed`,
      })}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Zadan\xe1 skupina \u{201E}${args?.["groupTitle"]}\u{201C} ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `s ${formatter.number(Number(args?.["groupCount"]))} mo\u{17E}nost\xed`,
                other: () => `se ${formatter.number(Number(args?.["groupCount"]))} mo\u{17E}nostmi`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: ` (vybr\xe1no)`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `N\xe1vrhy`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, vybr\xe1no`,
  },
  "da-DK": {
    buttonLabel: `Vis forslag`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} mulighed tilg\xe6ngelig`,
        other: () =>
          `${formatter.number(Number(args?.["optionCount"]))} muligheder tilg\xe6ngelige`,
      })}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Angivet gruppe ${args?.["groupTitle"]}, med ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} mulighed`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} muligheder`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, valgt`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Forslag`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, valgt`,
  },
  "de-DE": {
    buttonLabel: `Empfehlungen anzeigen`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} Option`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} Optionen`,
      })} verf\xfcgbar.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Eingetretene Gruppe ${args?.["groupTitle"]}, mit ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} Option`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} Optionen`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, ausgew\xe4hlt`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Empfehlungen`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, ausgew\xe4hlt`,
  },
  "el-GR": {
    buttonLabel: `\u{3A0}\u{3C1}\u{3BF}\u{3B2}\u{3BF}\u{3BB}\u{3AE} \u{3C0}\u{3C1}\u{3BF}\u{3C4}\u{3AC}\u{3C3}\u{3B5}\u{3C9}\u{3BD}`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () =>
          `${formatter.number(Number(args?.["optionCount"]))} \u{3B5}\u{3C0}\u{3B9}\u{3BB}\u{3BF}\u{3B3}\u{3AE}`,
        other: () =>
          `${formatter.number(Number(args?.["optionCount"]))} \u{3B5}\u{3C0}\u{3B9}\u{3BB}\u{3BF}\u{3B3}\u{3AD}\u{3C2} `,
      })} \u{3B4}\u{3B9}\u{3B1}\u{3B8}\u{3AD}\u{3C3}\u{3B9}\u{3BC}\u{3B5}\u{3C2}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `\u{395}\u{3B9}\u{3C3}\u{3B1}\u{3B3}\u{3BC}\u{3AD}\u{3BD}\u{3B7} \u{3BF}\u{3BC}\u{3AC}\u{3B4}\u{3B1} ${args?.["groupTitle"]}, \u{3BC}\u{3B5} ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{3B5}\u{3C0}\u{3B9}\u{3BB}\u{3BF}\u{3B3}\u{3AE}`,
                other: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{3B5}\u{3C0}\u{3B9}\u{3BB}\u{3BF}\u{3B3}\u{3AD}\u{3C2}`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, \u{3B5}\u{3C0}\u{3B9}\u{3BB}\u{3B5}\u{3B3}\u{3BC}\u{3AD}\u{3BD}\u{3BF}`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `\u{3A0}\u{3C1}\u{3BF}\u{3C4}\u{3AC}\u{3C3}\u{3B5}\u{3B9}\u{3C2}`,
    selectedAnnouncement: (args: Variables) =>
      `${args?.["optionText"]}, \u{3B5}\u{3C0}\u{3B9}\u{3BB}\u{3AD}\u{3C7}\u{3B8}\u{3B7}\u{3BA}\u{3B5}`,
  },
  "en-US": {
    buttonLabel: `Show suggestions`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} option`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} options`,
      })} available.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Entered group ${args?.["groupTitle"]}, with ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} option`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} options`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, selected`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Suggestions`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, selected`,
  },
  "es-ES": {
    buttonLabel: `Mostrar sugerencias`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} opci\xf3n`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} opciones`,
      })} disponible(s).`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Se ha unido al grupo ${args?.["groupTitle"]}, con ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} opci\xf3n`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} opciones`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, seleccionado`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Sugerencias`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, seleccionado`,
  },
  "et-EE": {
    buttonLabel: `Kuva soovitused`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} valik`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} valikud`,
      })} saadaval.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Sisestatud r\xfchm ${args?.["groupTitle"]}, valikuga ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} valik`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} valikud`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, valitud`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Soovitused`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, valitud`,
  },
  "fi-FI": {
    buttonLabel: `N\xe4yt\xe4 ehdotukset`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} vaihtoehto`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} vaihtoehtoa`,
      })} saatavilla.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Siirtyi ryhm\xe4\xe4n ${args?.["groupTitle"]}, jossa ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} vaihtoehto`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} vaihtoehtoa`,
              },
            )}.`,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, valittu`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Ehdotukset`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, valittu`,
  },
  "fr-FR": {
    buttonLabel: `Afficher les suggestions`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} option`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} options`,
      })} disponible(s).`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Groupe ${args?.["groupTitle"]} rejoint, avec ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} option`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} options`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, s\xe9lectionn\xe9(s)`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Suggestions`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, s\xe9lectionn\xe9`,
  },
  "he-IL": {
    buttonLabel: `\u{5D4}\u{5E6}\u{5D2} \u{5D4}\u{5E6}\u{5E2}\u{5D5}\u{5EA}`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () =>
          `\u{5D0}\u{5E4}\u{5E9}\u{5E8}\u{5D5}\u{5EA} ${formatter.number(Number(args?.["optionCount"]))}`,
        other: () =>
          `${formatter.number(Number(args?.["optionCount"]))} \u{5D0}\u{5E4}\u{5E9}\u{5E8}\u{5D5}\u{5D9}\u{5D5}\u{5EA}`,
      })} \u{5D1}\u{5DE}\u{5E6}\u{5D1} \u{5D6}\u{5DE}\u{5D9}\u{5DF}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `\u{5E0}\u{5DB}\u{5E0}\u{5E1} \u{5DC}\u{5E7}\u{5D1}\u{5D5}\u{5E6}\u{5D4} ${args?.["groupTitle"]}, \u{5E2}\u{5DD} ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () =>
                  `\u{5D0}\u{5E4}\u{5E9}\u{5E8}\u{5D5}\u{5EA} ${formatter.number(Number(args?.["groupCount"]))}`,
                other: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{5D0}\u{5E4}\u{5E9}\u{5E8}\u{5D5}\u{5D9}\u{5D5}\u{5EA}`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, \u{5E0}\u{5D1}\u{5D7}\u{5E8}`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `\u{5D4}\u{5E6}\u{5E2}\u{5D5}\u{5EA}`,
    selectedAnnouncement: (args: Variables) =>
      `${args?.["optionText"]}, \u{5E0}\u{5D1}\u{5D7}\u{5E8}`,
  },
  "hr-HR": {
    buttonLabel: `Prika\u{17E}i prijedloge`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `Dostupno jo\u{161}: ${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} opcija`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} opcije/a`,
      })}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Unesena skupina ${args?.["groupTitle"]}, s ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} opcijom`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} opcije/a`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, odabranih`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Prijedlozi`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, odabrano`,
  },
  "hu-HU": {
    buttonLabel: `Javaslatok megjelen\xedt\xe9se`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} lehet\u{151}s\xe9g`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} lehet\u{151}s\xe9g`,
      })} \xe1ll rendelkez\xe9sre.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Bel\xe9pett a(z) ${args?.["groupTitle"]} csoportba, amely ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} lehet\u{151}s\xe9get`,
                other: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} lehet\u{151}s\xe9get`,
              },
            )} tartalmaz. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, kijel\xf6lve`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Javaslatok`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, kijel\xf6lve`,
  },
  "it-IT": {
    buttonLabel: `Mostra suggerimenti`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} opzione disponibile`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} opzioni disponibili`,
      })}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Ingresso nel gruppo ${args?.["groupTitle"]}, con ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} opzione`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} opzioni`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, selezionato`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Suggerimenti`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, selezionato`,
  },
  "ja-JP": {
    buttonLabel: `\u{5019}\u{88DC}\u{3092}\u{8868}\u{793A}`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () =>
          `${formatter.number(Number(args?.["optionCount"]))} \u{500B}\u{306E}\u{30AA}\u{30D7}\u{30B7}\u{30E7}\u{30F3}`,
        other: () =>
          `${formatter.number(Number(args?.["optionCount"]))} \u{500B}\u{306E}\u{30AA}\u{30D7}\u{30B7}\u{30E7}\u{30F3}`,
      })}\u{3092}\u{5229}\u{7528}\u{3067}\u{304D}\u{307E}\u{3059}\u{3002}`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `\u{5165}\u{529B}\u{3055}\u{308C}\u{305F}\u{30B0}\u{30EB}\u{30FC}\u{30D7} ${args?.["groupTitle"]}\u{3001}${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{500B}\u{306E}\u{30AA}\u{30D7}\u{30B7}\u{30E7}\u{30F3}`,
                other: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{500B}\u{306E}\u{30AA}\u{30D7}\u{30B7}\u{30E7}\u{30F3}`,
              },
            )}\u{3092}\u{542B}\u{3080}\u{3002}`,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `\u{3001}\u{9078}\u{629E}\u{6E08}\u{307F}`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `\u{5019}\u{88DC}`,
    selectedAnnouncement: (args: Variables) =>
      `${args?.["optionText"]}\u{3001}\u{9078}\u{629E}\u{6E08}\u{307F}`,
  },
  "ko-KR": {
    buttonLabel: `\u{C81C}\u{C548} \u{C0AC}\u{D56D} \u{D45C}\u{C2DC}`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))}\u{AC1C} \u{C635}\u{C158}`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))}\u{AC1C} \u{C635}\u{C158}`,
      })}\u{C744} \u{C0AC}\u{C6A9}\u{D560} \u{C218} \u{C788}\u{C2B5}\u{B2C8}\u{B2E4}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `\u{C785}\u{B825}\u{D55C} \u{ADF8}\u{B8F9} ${args?.["groupTitle"]}, ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () =>
                  `${formatter.number(Number(args?.["groupCount"]))}\u{AC1C} \u{C635}\u{C158}`,
                other: () =>
                  `${formatter.number(Number(args?.["groupCount"]))}\u{AC1C} \u{C635}\u{C158}`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, \u{C120}\u{D0DD}\u{B428}`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `\u{C81C}\u{C548}`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, \u{C120}\u{D0DD}\u{B428}`,
  },
  "lt-LT": {
    buttonLabel: `Rodyti pasi\u{16B}lymus`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `Yra ${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} parinktis`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} parinktys (-i\u{173})`,
      })}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `\u{12E}vesta grup\u{117} ${args?.["groupTitle"]}, su ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} parinktimi`,
                other: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} parinktimis (-i\u{173})`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, pasirinkta`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Pasi\u{16B}lymai`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, pasirinkta`,
  },
  "lv-LV": {
    buttonLabel: `R\u{101}d\u{12B}t ieteikumus`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `Pieejamo opciju skaits: ${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} opcija`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} opcijas`,
      })}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Ievad\u{12B}ta grupa ${args?.["groupTitle"]}, ar ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} opciju`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} opcij\u{101}m`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, atlas\u{12B}ta`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Ieteikumi`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, atlas\u{12B}ta`,
  },
  "nb-NO": {
    buttonLabel: `Vis forslag`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} alternativ`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} alternativer`,
      })} finnes.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Angitt gruppe ${args?.["groupTitle"]}, med ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} alternativ`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} alternativer`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, valgt`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Forslag`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, valgt`,
  },
  "nl-NL": {
    buttonLabel: `Suggesties weergeven`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} optie`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} opties`,
      })} beschikbaar.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Groep ${args?.["groupTitle"]} ingevoerd met ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} optie`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} opties`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, geselecteerd`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Suggesties`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, geselecteerd`,
  },
  "pl-PL": {
    buttonLabel: `Wy\u{15B}wietlaj sugestie`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `dost\u{119}pna/dost\u{119}pne(-nych) ${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} opcja`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} opcje(-i)`,
      })}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Do\u{142}\u{105}czono do grupy ${args?.["groupTitle"]}, z ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} opcj\u{105}`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} opcjami`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, wybrano`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Sugestie`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, wybrano`,
  },
  "pt-BR": {
    buttonLabel: `Mostrar sugest\xf5es`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} op\xe7\xe3o`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} op\xe7\xf5es`,
      })} dispon\xedvel.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Grupo inserido ${args?.["groupTitle"]}, com ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} op\xe7\xe3o`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} op\xe7\xf5es`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, selecionado`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Sugest\xf5es`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, selecionado`,
  },
  "pt-PT": {
    buttonLabel: `Apresentar sugest\xf5es`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} op\xe7\xe3o`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} op\xe7\xf5es`,
      })} dispon\xedvel.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Grupo introduzido ${args?.["groupTitle"]}, com ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} op\xe7\xe3o`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} op\xe7\xf5es`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, selecionado`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Sugest\xf5es`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, selecionado`,
  },
  "ro-RO": {
    buttonLabel: `Afi\u{219}are sugestii`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} op\u{21B}iune`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} op\u{21B}iuni`,
      })} disponibile.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Grup ${args?.["groupTitle"]} introdus, cu ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} op\u{21B}iune`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} op\u{21B}iuni`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, selectat`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Sugestii`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, selectat`,
  },
  "ru-RU": {
    buttonLabel: `\u{41F}\u{43E}\u{43A}\u{430}\u{437}\u{430}\u{442}\u{44C} \u{43F}\u{440}\u{435}\u{434}\u{43B}\u{43E}\u{436}\u{435}\u{43D}\u{438}\u{44F}`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () =>
          `${formatter.number(Number(args?.["optionCount"]))} \u{43F}\u{430}\u{440}\u{430}\u{43C}\u{435}\u{442}\u{440}`,
        other: () =>
          `${formatter.number(Number(args?.["optionCount"]))} \u{43F}\u{430}\u{440}\u{430}\u{43C}\u{435}\u{442}\u{440}\u{43E}\u{432}`,
      })} \u{434}\u{43E}\u{441}\u{442}\u{443}\u{43F}\u{43D}\u{43E}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `\u{412}\u{432}\u{435}\u{434}\u{435}\u{43D}\u{43D}\u{430}\u{44F} \u{433}\u{440}\u{443}\u{43F}\u{43F}\u{430} ${args?.["groupTitle"]}, \u{441} ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{43F}\u{430}\u{440}\u{430}\u{43C}\u{435}\u{442}\u{440}\u{43E}\u{43C}`,
                other: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{43F}\u{430}\u{440}\u{430}\u{43C}\u{435}\u{442}\u{440}\u{430}\u{43C}\u{438}`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, \u{432}\u{44B}\u{431}\u{440}\u{430}\u{43D}\u{43D}\u{44B}\u{43C}\u{438}`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `\u{41F}\u{440}\u{435}\u{434}\u{43B}\u{43E}\u{436}\u{435}\u{43D}\u{438}\u{44F}`,
    selectedAnnouncement: (args: Variables) =>
      `${args?.["optionText"]}, \u{432}\u{44B}\u{431}\u{440}\u{430}\u{43D}\u{43E}`,
  },
  "sk-SK": {
    buttonLabel: `Zobrazi\u{165} n\xe1vrhy`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} mo\u{17E}nos\u{165}`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} mo\u{17E}nosti/-\xed`,
      })} k dispoz\xedcii.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Zadan\xe1 skupina ${args?.["groupTitle"]}, s ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} mo\u{17E}nos\u{165}ou`,
                other: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} mo\u{17E}nos\u{165}ami`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, vybrat\xe9`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `N\xe1vrhy`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, vybrat\xe9`,
  },
  "sl-SI": {
    buttonLabel: `Prika\u{17E}i predloge`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `Na voljo je ${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} opcija`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} opcije`,
      })}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Vnesena skupina ${args?.["groupTitle"]}, z ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} opcija`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} opcije`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, izbrano`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Predlogi`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, izbrano`,
  },
  "sr-SP": {
    buttonLabel: `Prika\u{17E}i predloge`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `Dostupno jo\u{161}: ${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} opcija`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} opcije/a`,
      })}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Unesena grupa ${args?.["groupTitle"]}, s ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} opcijom`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} optione/a`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, izabranih`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `Predlozi`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, izabrano`,
  },
  "sv-SE": {
    buttonLabel: `Visa f\xf6rslag`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} alternativ`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} alternativ`,
      })} tillg\xe4ngliga.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Ingick i gruppen ${args?.["groupTitle"]} med ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} alternativ`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} alternativ`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, valda`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `F\xf6rslag`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, valda`,
  },
  "tr-TR": {
    buttonLabel: `\xd6nerileri g\xf6ster`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} se\xe7enek`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} se\xe7enekler`,
      })} kullan\u{131}labilir.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `Girilen grup ${args?.["groupTitle"]}, ile ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} se\xe7enek`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} se\xe7enekler`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, se\xe7ildi`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `\xd6neriler`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, se\xe7ildi`,
  },
  "uk-UA": {
    buttonLabel: `\u{41F}\u{43E}\u{43A}\u{430}\u{437}\u{430}\u{442}\u{438} \u{43F}\u{440}\u{43E}\u{43F}\u{43E}\u{437}\u{438}\u{446}\u{456}\u{457}`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () =>
          `${formatter.number(Number(args?.["optionCount"]))} \u{43F}\u{430}\u{440}\u{430}\u{43C}\u{435}\u{442}\u{440}`,
        other: () =>
          `${formatter.number(Number(args?.["optionCount"]))} \u{43F}\u{430}\u{440}\u{430}\u{43C}\u{435}\u{442}\u{440}\u{438}(-\u{456}\u{432})`,
      })} \u{434}\u{43E}\u{441}\u{442}\u{443}\u{43F}\u{43D}\u{43E}.`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `\u{412}\u{432}\u{435}\u{434}\u{435}\u{43D}\u{430} \u{433}\u{440}\u{443}\u{43F}\u{430} ${args?.["groupTitle"]}, \u{437} ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{43F}\u{430}\u{440}\u{430}\u{43C}\u{435}\u{442}\u{440}`,
                other: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{43F}\u{430}\u{440}\u{430}\u{43C}\u{435}\u{442}\u{440}\u{438}(-\u{456}\u{432})`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, \u{432}\u{438}\u{431}\u{440}\u{430}\u{43D}\u{43E}`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `\u{41F}\u{440}\u{43E}\u{43F}\u{43E}\u{437}\u{438}\u{446}\u{456}\u{457}`,
    selectedAnnouncement: (args: Variables) =>
      `${args?.["optionText"]}, \u{432}\u{438}\u{431}\u{440}\u{430}\u{43D}\u{43E}`,
  },
  "zh-CN": {
    buttonLabel: `\u{663E}\u{793A}\u{5EFA}\u{8BAE}`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `\u{6709} ${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} \u{4E2A}\u{9009}\u{9879}`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} \u{4E2A}\u{9009}\u{9879}`,
      })}\u{53EF}\u{7528}\u{3002}`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `\u{8FDB}\u{5165}\u{4E86} ${args?.["groupTitle"]} \u{7EC4}\u{FF0C}\u{5176}\u{4E2D}\u{6709} ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{4E2A}\u{9009}\u{9879}`,
                other: () =>
                  `${formatter.number(Number(args?.["groupCount"]))} \u{4E2A}\u{9009}\u{9879}`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, \u{5DF2}\u{9009}\u{62E9}`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `\u{5EFA}\u{8BAE}`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, \u{5DF2}\u{9009}\u{62E9}`,
  },
  "zh-TW": {
    buttonLabel: `\u{986F}\u{793A}\u{5EFA}\u{8B70}`,
    countAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["optionCount"]), {
        one: () => `${formatter.number(Number(args?.["optionCount"]))} \u{9078}\u{9805}`,
        other: () => `${formatter.number(Number(args?.["optionCount"]))} \u{9078}\u{9805}`,
      })} \u{53EF}\u{7528}\u{3002}`,
    focusAnnouncement: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.select(
        {
          true: () =>
            `\u{8F38}\u{5165}\u{7684}\u{7FA4}\u{7D44} ${args?.["groupTitle"]}, \u{6709} ${formatter.plural(
              Number(args?.["groupCount"]),
              {
                one: () => `${formatter.number(Number(args?.["groupCount"]))} \u{9078}\u{9805}`,
                other: () => `${formatter.number(Number(args?.["groupCount"]))} \u{9078}\u{9805}`,
              },
            )}. `,
          other: ``,
        },
        String(args?.["isGroupChange"]),
      )}${args?.["optionText"]}${formatter.select(
        {
          true: `, \u{5DF2}\u{9078}\u{53D6}`,
          other: ``,
        },
        String(args?.["isSelected"]),
      )}`,
    listboxLabel: `\u{5EFA}\u{8B70}`,
    selectedAnnouncement: (args: Variables) => `${args?.["optionText"]}, \u{5DF2}\u{9078}\u{53D6}`,
  },
};
/* eslint-enable sort-keys, sort-keys-fix/sort-keys-fix */

/**
 * One assertion for the whole table, rather than a cast at each message that branches: the
 * formatter a message receives is the real class, whose `plural`, `number` and `select` are all
 * protected, so no structural type can describe both what the messages need and what the class
 * exposes.
 */
export const comboBoxStrings = strings as unknown as LocalizedStrings<
  ComboBoxStringKey,
  LocalizedString
>;
