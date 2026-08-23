import type { LocalizedString, LocalizedStrings, Variables } from "@internationalized/string";

/** Every message key the drag and drop strings define. */
export type DndStringKey =
  | "dragItem"
  | "dragSelectedItems"
  | "dragDescriptionKeyboard"
  | "dragDescriptionKeyboardAlt"
  | "dragDescriptionTouch"
  | "dragDescriptionVirtual"
  | "dragDescriptionLongPress"
  | "dragSelectedKeyboard"
  | "dragSelectedKeyboardAlt"
  | "dragSelectedLongPress"
  | "dragStartedKeyboard"
  | "dragStartedTouch"
  | "dragStartedVirtual"
  | "endDragKeyboard"
  | "endDragTouch"
  | "endDragVirtual"
  | "dropDescriptionKeyboard"
  | "dropDescriptionTouch"
  | "dropDescriptionVirtual"
  | "dropCanceled"
  | "dropComplete"
  | "dropIndicator"
  | "dropOnRoot"
  | "dropOnItem"
  | "insertBefore"
  | "insertBetween"
  | "insertAfter";

/**
 * Localized strings for drag and drop, copied from react-aria 3.51.0
 * (`packages/react-aria/intl/dnd/*.json`).
 *
 * Messages arrive already compiled: a value is a plain string when it has no variables, and a
 * function of its arguments when it does, which is the `LocalizedString` shape
 * `LocalizedStringFormatter` expects. Generated — edit the source strings upstream, not here.
 */

/**
 * The formatter surface a compiled message actually uses.
 *
 * `plural` and `number` are **protected** on `LocalizedStringFormatter`, so a message that
 * pluralizes cannot be typed against the public class at all — which is why no other table here
 * needs this and drag and drop, the first one with plurals, does. Upstream never hits it because
 * its tables are JSON compiled to untyped JavaScript.
 */
interface MessageFormatter {
  plural: (
    count: number,
    options: Record<string, string | (() => string)>,
    type?: Intl.PluralRuleType,
  ) => string;
  number: (value: number) => string;
}

const strings = {
  "ar-AE": {
    dragDescriptionKeyboard: `اضغط Enter لبدء السحب.`,
    dragDescriptionKeyboardAlt: `اضغط على Alt + Enter لبدء السحب.`,
    dragDescriptionLongPress: `اضغط باستمرار لبدء السحب.`,
    dragDescriptionTouch: `اضغط مرتين لبدء السحب.`,
    dragDescriptionVirtual: `انقر لبدء السحب.`,
    dragItem: (args: Variables) => `اسحب ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `اسحب ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} عنصر محدد`,
        other: () => `${formatter.number(Number(args?.["count"]))} عناصر محددة`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `اضغط على Enter للسحب ${formatter.plural(Number(args?.["count"]), {
        one: `عدد العناصر المختارة`,
        other: `عدد العناصر المختارة`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `اضغط على مفتاحي Alt + Enter للسحب ${formatter.plural(Number(args?.["count"]), {
        one: `عدد العناصر المختارة`,
        other: `عدد العناصر المختارة`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `اضغط باستمرار للسحب ${formatter.plural(Number(args?.["count"]), {
        one: `عدد العناصر المختارة`,
        other: `عدد العناصر المختارة`,
      })}.`,
    dragStartedKeyboard: `بدأ السحب. اضغط Tab للانتقال إلى موضع الإفلات، ثم اضغط Enter للإفلات، أو اضغط Escape للإلغاء.`,
    dragStartedTouch: `بدأ السحب. انتقل إلى موضع الإفلات، ثم اضغط مرتين للإفلات.`,
    dragStartedVirtual: `بدأ السحب. انتقل إلى مكان الإفلات، ثم انقر أو اضغط Enter للإفلات.`,
    dropCanceled: `تم إلغاء الإفلات.`,
    dropComplete: `اكتمل الإفلات.`,
    dropDescriptionKeyboard: `اضغط Enter للإفلات. اضغط Escape لإلغاء السحب.`,
    dropDescriptionTouch: `اضغط مرتين للإفلات.`,
    dropDescriptionVirtual: `انقر للإفلات.`,
    dropIndicator: `مؤشر الإفلات`,
    dropOnItem: (args: Variables) => `إفلات ${args?.["itemText"]}`,
    dropOnRoot: `الإفلات`,
    endDragKeyboard: `السحب. اضغط Enter لإلغاء السحب.`,
    endDragTouch: `السحب. اضغط مرتين لإلغاء السحب.`,
    endDragVirtual: `السحب. انقر لإلغاء السحب.`,
    insertAfter: (args: Variables) => `أدخل بعد ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `أدخل قبل ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `أدخل بين ${args?.["beforeItemText"]} و ${args?.["afterItemText"]}`,
  },
  "bg-BG": {
    dragDescriptionKeyboard: `Натиснете „Enter“, за да започнете да плъзгате.`,
    dragDescriptionKeyboardAlt: `Натиснете Alt + Enter, за да започнете да плъзгате.`,
    dragDescriptionLongPress: `Натиснете продължително, за да започнете да плъзгате.`,
    dragDescriptionTouch: `Натиснете двукратно, за да започнете да плъзгате.`,
    dragDescriptionVirtual: `Щракнете, за да започнете да плъзгате.`,
    dragItem: (args: Variables) => `Плъзни ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Плъзни ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} избран елемент`,
        other: () => `${formatter.number(Number(args?.["count"]))} избрани елемента`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Натиснете Enter, за да плъзнете ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} избран елемент`,
        other: () => `${formatter.number(Number(args?.["count"]))} избрани елементи`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Натиснете Alt и Enter, за да плъзнете ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} избран елемент`,
        other: () => `${formatter.number(Number(args?.["count"]))} избрани елементи`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Натиснете продължително, за да плъзнете ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} избран елемент`,
        other: () => `${formatter.number(Number(args?.["count"]))} избрани елементи`,
      })}.`,
    dragStartedKeyboard: `Започна плъзгане. Натиснете „Tab“, за да се придвижите до целта, след което натиснете „Enter“ за пускане или натиснете „Escape“ за отмяна.`,
    dragStartedTouch: `Започна плъзгане. Придвижете се до целта, след което натиснете двукратно, за да пуснете.`,
    dragStartedVirtual: `Започна плъзгане. Придвижете се до целта, след което щракнете или натиснете „Enter“ за пускане.`,
    dropCanceled: `Пускането е отменено.`,
    dropComplete: `Пускането е завършено.`,
    dropDescriptionKeyboard: `Натиснете „Enter“ за пускане. Натиснете „Escape“ за отмяна на плъзгането.`,
    dropDescriptionTouch: `Натиснете двукратно за пускане.`,
    dropDescriptionVirtual: `Щракнете за пускане.`,
    dropIndicator: `индикатор за пускане`,
    dropOnItem: (args: Variables) => `Пусни върху ${args?.["itemText"]}`,
    dropOnRoot: `Пусни върху`,
    endDragKeyboard: `Плъзгане. Натиснете „Enter“ за отмяна на плъзгането.`,
    endDragTouch: `Плъзгане. Натиснете двукратно за отмяна на плъзгането.`,
    endDragVirtual: `Плъзгане. Щракнете за отмяна.`,
    insertAfter: (args: Variables) => `Вмъкни след ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Вмъкни преди ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Вмъкни между ${args?.["beforeItemText"]} и ${args?.["afterItemText"]}`,
  },
  "cs-CZ": {
    dragDescriptionKeyboard: `Stisknut\xedm kl\xe1vesy Enter začnete s přetahov\xe1n\xedm.`,
    dragDescriptionKeyboardAlt: `Stisknut\xedm Alt + Enter zah\xe1j\xedte přetahov\xe1n\xed.`,
    dragDescriptionLongPress: `Dlouh\xfdm stisknut\xedm zah\xe1j\xedte přetahov\xe1n\xed.`,
    dragDescriptionTouch: `Poklep\xe1n\xedm začnete s přetahov\xe1n\xedm.`,
    dragDescriptionVirtual: `Kliknut\xedm začnete s přetahov\xe1n\xedm.`,
    dragItem: (args: Variables) => `Přet\xe1hnout ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Přet\xe1hnout ${formatter.plural(Number(args?.["count"]), {
        few: () => `${formatter.number(Number(args?.["count"]))} vybran\xe9 položky`,
        one: () => `${formatter.number(Number(args?.["count"]))} vybranou položku`,
        other: () => `${formatter.number(Number(args?.["count"]))} vybran\xfdch položek`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Stisknut\xedm kl\xe1vesy Enter přet\xe1hněte ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} vybranou položku`,
        other: () => `${formatter.number(Number(args?.["count"]))} vybran\xe9 položky`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Stisknut\xedm Alt + Enter přet\xe1hněte ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} vybranou položku`,
        other: () => `${formatter.number(Number(args?.["count"]))} vybran\xe9 položky`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Dlouh\xfdm stisknut\xedm přet\xe1hnete ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} vybranou položku`,
        other: () => `${formatter.number(Number(args?.["count"]))} vybran\xe9 položky`,
      })}.`,
    dragStartedKeyboard: `Začněte s přetahov\xe1n\xedm. Po stisknut\xed kl\xe1vesy Tab najděte požadovan\xfd c\xedl a stisknut\xedm kl\xe1vesy Enter přetažen\xed dokončete nebo stisknut\xedm kl\xe1vesy Esc akci zrušte.`,
    dragStartedTouch: `Začněte s přetahov\xe1n\xedm. Najděte požadovan\xfd c\xedl a poklep\xe1n\xedm přetažen\xed dokončete.`,
    dragStartedVirtual: `Začněte s přetahov\xe1n\xedm. Najděte požadovan\xfd c\xedl a kliknut\xedm nebo stisknut\xedm kl\xe1vesy Enter přetažen\xed dokončete.`,
    dropCanceled: `Přetažen\xed bylo zrušeno.`,
    dropComplete: `Přetažen\xed bylo dokončeno.`,
    dropDescriptionKeyboard: `Stisknut\xedm kl\xe1vesy Enter přetažen\xed dokončete nebo stisknut\xedm kl\xe1vesy Esc akci zrušte.`,
    dropDescriptionTouch: `Poklep\xe1n\xedm přetažen\xed dokončete.`,
    dropDescriptionVirtual: `Kliknut\xedm objekt přet\xe1hněte.`,
    dropIndicator: `indik\xe1tor přetažen\xed`,
    dropOnItem: (args: Variables) => `Přet\xe1hnout na ${args?.["itemText"]}`,
    dropOnRoot: `Přet\xe1hnout na`,
    endDragKeyboard: `Prob\xedh\xe1 přetahov\xe1n\xed. Stisknut\xedm kl\xe1vesy Enter přetažen\xed zruš\xedte.`,
    endDragTouch: `Prob\xedh\xe1 přetahov\xe1n\xed. Poklep\xe1n\xedm přetažen\xed zruš\xedte.`,
    endDragVirtual: `Prob\xedh\xe1 přetahov\xe1n\xed. Kliknut\xedm přetažen\xed zruš\xedte.`,
    insertAfter: (args: Variables) => `Vložit za ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Vložit před ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Vložit mezi ${args?.["beforeItemText"]} a ${args?.["afterItemText"]}`,
  },
  "da-DK": {
    dragDescriptionKeyboard: `Tryk p\xe5 Enter for at starte med at tr\xe6kke.`,
    dragDescriptionKeyboardAlt: `Tryk p\xe5 Alt + Enter for at starte med at tr\xe6kke.`,
    dragDescriptionLongPress: `Tryk l\xe6nge for at starte med at tr\xe6kke.`,
    dragDescriptionTouch: `Dobbelttryk for at starte med at tr\xe6kke.`,
    dragDescriptionVirtual: `Klik for at starte med at tr\xe6kke.`,
    dragItem: (args: Variables) => `Tr\xe6k ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Tr\xe6k ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valgt element`,
        other: () => `${formatter.number(Number(args?.["count"]))} valgte elementer`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Tryk p\xe5 Enter for at tr\xe6kke ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valgte element`,
        other: () => `${formatter.number(Number(args?.["count"]))} valgte elementer`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Tryk p\xe5 Alt + Enter for at tr\xe6kke ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valgte element`,
        other: () => `${formatter.number(Number(args?.["count"]))} valgte elementer`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Tryk l\xe6nge for at tr\xe6kke ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valgte element`,
        other: () => `${formatter.number(Number(args?.["count"]))} valgte elementer`,
      })}.`,
    dragStartedKeyboard: `Startet med at tr\xe6kke. Tryk p\xe5 Tab for at g\xe5 til et slip-m\xe5l, tryk derefter p\xe5 Enter for at slippe, eller tryk p\xe5 Escape for at annullere.`,
    dragStartedTouch: `Startet med at tr\xe6kke. G\xe5 til et slip-m\xe5l, og dobbelttryk derefter for at slippe.`,
    dragStartedVirtual: `Startet med at tr\xe6kke. G\xe5 til et slip-m\xe5l, og klik eller tryk derefter p\xe5 enter for at slippe.`,
    dropCanceled: `Slip annulleret.`,
    dropComplete: `Slip fuldf\xf8rt.`,
    dropDescriptionKeyboard: `Tryk p\xe5 Enter for at slippe. Tryk p\xe5 Escape for at annullere tr\xe6kning.`,
    dropDescriptionTouch: `Dobbelttryk for at slippe.`,
    dropDescriptionVirtual: `Klik for at slippe.`,
    dropIndicator: `slip-indikator`,
    dropOnItem: (args: Variables) => `Slip p\xe5 ${args?.["itemText"]}`,
    dropOnRoot: `Slip p\xe5`,
    endDragKeyboard: `Tr\xe6kning. Tryk p\xe5 enter for at annullere tr\xe6k.`,
    endDragTouch: `Tr\xe6kning. Dobbelttryk for at annullere tr\xe6k.`,
    endDragVirtual: `Tr\xe6kning. Klik for at annullere tr\xe6kning.`,
    insertAfter: (args: Variables) => `Inds\xe6t efter ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Inds\xe6t f\xf8r ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Inds\xe6t mellem ${args?.["beforeItemText"]} og ${args?.["afterItemText"]}`,
  },
  "de-DE": {
    dragDescriptionKeyboard: `Dr\xfccken Sie die Eingabetaste, um den Ziehvorgang zu starten.`,
    dragDescriptionKeyboardAlt: `Alt + Eingabe dr\xfccken, um den Ziehvorgang zu starten.`,
    dragDescriptionLongPress: `Lang dr\xfccken, um mit dem Ziehen zu beginnen.`,
    dragDescriptionTouch: `Tippen Sie doppelt, um den Ziehvorgang zu starten.`,
    dragDescriptionVirtual: `Zum Starten des Ziehvorgangs klicken.`,
    dragItem: (args: Variables) => `${args?.["itemText"]} ziehen`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} ausgew\xe4hltes Objekt`,
        other: () => `${formatter.number(Number(args?.["count"]))} ausgew\xe4hlte Objekte`,
      })} ziehen`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Eingabetaste dr\xfccken, um ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} ausgew\xe4hltes Element`,
        other: () => `${formatter.number(Number(args?.["count"]))} ausgew\xe4hlte Elemente`,
      })} zu ziehen.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Alt + Eingabetaste dr\xfccken, um ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} ausgew\xe4hltes Element`,
        other: () => `${formatter.number(Number(args?.["count"]))} ausgew\xe4hlte Elemente`,
      })} zu ziehen.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Lang dr\xfccken, um ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} ausgew\xe4hltes Element`,
        other: () => `${formatter.number(Number(args?.["count"]))} ausgew\xe4hlte Elemente`,
      })} zu ziehen.`,
    dragStartedKeyboard: `Ziehvorgang gestartet. Dr\xfccken Sie die Tabulatortaste, um zu einem Ablegeziel zu navigieren und dr\xfccken Sie dann die Eingabetaste, um das Objekt abzulegen, oder Escape, um den Vorgang abzubrechen.`,
    dragStartedTouch: `Ziehvorgang gestartet. Navigieren Sie zu einem Ablegeziel und tippen Sie doppelt, um das Objekt abzulegen.`,
    dragStartedVirtual: `Ziehvorgang gestartet. Navigieren Sie zu einem Ablegeziel und klicken Sie oder dr\xfccken Sie die Eingabetaste, um das Objekt abzulegen.`,
    dropCanceled: `Ablegen abgebrochen.`,
    dropComplete: `Ablegen abgeschlossen.`,
    dropDescriptionKeyboard: `Dr\xfccken Sie die Eingabetaste, um das Objekt abzulegen. Dr\xfccken Sie Escape, um den Vorgang abzubrechen.`,
    dropDescriptionTouch: `Tippen Sie doppelt, um das Objekt abzulegen.`,
    dropDescriptionVirtual: `Zum Ablegen klicken.`,
    dropIndicator: `Ablegeanzeiger`,
    dropOnItem: (args: Variables) => `Auf ${args?.["itemText"]} ablegen`,
    dropOnRoot: `Ablegen auf`,
    endDragKeyboard: `Ziehvorgang l\xe4uft. Dr\xfccken Sie die Eingabetaste, um den Vorgang abzubrechen.`,
    endDragTouch: `Ziehvorgang l\xe4uft. Tippen Sie doppelt, um den Vorgang abzubrechen.`,
    endDragVirtual: `Ziehvorgang l\xe4uft. Klicken Sie, um den Vorgang abzubrechen.`,
    insertAfter: (args: Variables) => `Nach ${args?.["itemText"]} einf\xfcgen`,
    insertBefore: (args: Variables) => `Vor ${args?.["itemText"]} einf\xfcgen`,
    insertBetween: (args: Variables) =>
      `Zwischen ${args?.["beforeItemText"]} und ${args?.["afterItemText"]} einf\xfcgen`,
  },
  "el-GR": {
    dragDescriptionKeyboard: `Πατήστε Enter για έναρξη της μεταφοράς.`,
    dragDescriptionKeyboardAlt: `Πατήστε Alt + Enter για έναρξη της μεταφοράς.`,
    dragDescriptionLongPress: `Πατήστε παρατεταμένα για να ξεκινήσετε τη μεταφορά.`,
    dragDescriptionTouch: `Πατήστε δύο φορές για έναρξη της μεταφοράς.`,
    dragDescriptionVirtual: `Κάντε κλικ για να ξεκινήσετε τη μεταφορά.`,
    dragItem: (args: Variables) => `Μεταφορά ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Μεταφορά σε ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} επιλεγμένο στοιχείο`,
        other: () => `${formatter.number(Number(args?.["count"]))} επιλεγμένα στοιχεία`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Πατήστε Enter για να σύρετε ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} επιλεγμένο στοιχείο`,
        other: () => `${formatter.number(Number(args?.["count"]))} επιλεγμένα στοιχεία`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Πατήστε Alt + Enter για να σύρετε ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} επιλεγμένο στοιχείο`,
        other: () => `${formatter.number(Number(args?.["count"]))} επιλεγμένα στοιχεία`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Πατήστε παρατεταμένα για να σύρετε ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} επιλεγμένο στοιχείο`,
        other: () => `${formatter.number(Number(args?.["count"]))} επιλεγμένα στοιχεία`,
      })}.`,
    dragStartedKeyboard: `Η μεταφορά ξεκίνησε. Πατήστε το πλήκτρο Tab για να μεταβείτε σε έναν προορισμό απόθεσης και, στη συνέχεια, πατήστε Enter για απόθεση ή πατήστε Escape για ακύρωση.`,
    dragStartedTouch: `Η μεταφορά ξεκίνησε. Μεταβείτε σε έναν προορισμό απόθεσης και, στη συνέχεια, πατήστε δύο φορές για απόθεση.`,
    dragStartedVirtual: `Η μεταφορά ξεκίνησε. Μεταβείτε σε έναν προορισμό απόθεσης και, στη συνέχεια, κάντε κλικ ή πατήστε Enter για απόθεση.`,
    dropCanceled: `Η απόθεση ακυρώθηκε.`,
    dropComplete: `Η απόθεση ολοκληρώθηκε.`,
    dropDescriptionKeyboard: `Πατήστε Enter για απόθεση. Πατήστε Escape για ακύρωση της μεταφοράς.`,
    dropDescriptionTouch: `Πατήστε δύο φορές για απόθεση.`,
    dropDescriptionVirtual: `Κάντε κλικ για απόθεση.`,
    dropIndicator: `δείκτης απόθεσης`,
    dropOnItem: (args: Variables) => `Απόθεση σε ${args?.["itemText"]}`,
    dropOnRoot: `Απόθεση σε`,
    endDragKeyboard: `Μεταφορά σε εξέλιξη. Πατήστε Enter για ακύρωση της μεταφοράς.`,
    endDragTouch: `Μεταφορά σε εξέλιξη. Πατήστε δύο φορές για ακύρωση της μεταφοράς.`,
    endDragVirtual: `Μεταφορά σε εξέλιξη. Κάντε κλικ για ακύρωση της μεταφοράς.`,
    insertAfter: (args: Variables) => `Εισαγωγή μετά από ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Εισαγωγή πριν από ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Εισαγωγή μεταξύ ${args?.["beforeItemText"]} και ${args?.["afterItemText"]}`,
  },
  "en-US": {
    dragDescriptionKeyboard: `Press Enter to start dragging.`,
    dragDescriptionKeyboardAlt: `Press Alt + Enter to start dragging.`,
    dragDescriptionLongPress: `Long press to start dragging.`,
    dragDescriptionTouch: `Double tap to start dragging.`,
    dragDescriptionVirtual: `Click to start dragging.`,
    dragItem: (args: Variables) => `Drag ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Drag ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} selected item`,
        other: () => `${formatter.number(Number(args?.["count"]))} selected items`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Press Enter to drag ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} selected item`,
        other: () => `${formatter.number(Number(args?.["count"]))} selected items`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Press Alt + Enter to drag ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} selected item`,
        other: () => `${formatter.number(Number(args?.["count"]))} selected items`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Long press to drag ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} selected item`,
        other: () => `${formatter.number(Number(args?.["count"]))} selected items`,
      })}.`,
    dragStartedKeyboard: `Started dragging. Press Tab to navigate to a drop target, then press Enter to drop, or press Escape to cancel.`,
    dragStartedTouch: `Started dragging. Navigate to a drop target, then double tap to drop.`,
    dragStartedVirtual: `Started dragging. Navigate to a drop target, then click or press Enter to drop.`,
    dropCanceled: `Drop canceled.`,
    dropComplete: `Drop complete.`,
    dropDescriptionKeyboard: `Press Enter to drop. Press Escape to cancel drag.`,
    dropDescriptionTouch: `Double tap to drop.`,
    dropDescriptionVirtual: `Click to drop.`,
    dropIndicator: `drop indicator`,
    dropOnItem: (args: Variables) => `Drop on ${args?.["itemText"]}`,
    dropOnRoot: `Drop on`,
    endDragKeyboard: `Dragging. Press Enter to cancel drag.`,
    endDragTouch: `Dragging. Double tap to cancel drag.`,
    endDragVirtual: `Dragging. Click to cancel drag.`,
    insertAfter: (args: Variables) => `Insert after ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Insert before ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Insert between ${args?.["beforeItemText"]} and ${args?.["afterItemText"]}`,
  },
  "es-ES": {
    dragDescriptionKeyboard: `Pulse Intro para empezar a arrastrar.`,
    dragDescriptionKeyboardAlt: `Pulse Intro para empezar a arrastrar.`,
    dragDescriptionLongPress: `Mantenga pulsado para comenzar a arrastrar.`,
    dragDescriptionTouch: `Pulse dos veces para iniciar el arrastre.`,
    dragDescriptionVirtual: `Haga clic para iniciar el arrastre.`,
    dragItem: (args: Variables) => `Arrastrar ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Arrastrar ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} elemento seleccionado`,
        other: () => `${formatter.number(Number(args?.["count"]))} elementos seleccionados`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Pulse Intro para arrastrar ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} elemento seleccionado`,
        other: () => `${formatter.number(Number(args?.["count"]))} elementos seleccionados`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Pulse Alt + Intro para arrastrar ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} elemento seleccionado`,
        other: () => `${formatter.number(Number(args?.["count"]))} elementos seleccionados`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Mantenga pulsado para arrastrar ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} elemento seleccionado`,
        other: () => `${formatter.number(Number(args?.["count"]))} elementos seleccionados`,
      })}.`,
    dragStartedKeyboard: `Se ha empezado a arrastrar. Pulse el tabulador para ir al destino donde se vaya a colocar y, a continuaci\xf3n, pulse Intro para soltar, o pulse Escape para cancelar.`,
    dragStartedTouch: `Se ha empezado a arrastrar. Vaya al destino donde se vaya a colocar y, a continuaci\xf3n, pulse dos veces para soltar.`,
    dragStartedVirtual: `Se ha empezado a arrastrar. Vaya al destino donde se vaya a colocar y, a continuaci\xf3n, haga clic o pulse Intro para soltar.`,
    dropCanceled: `Se ha cancelado la colocaci\xf3n.`,
    dropComplete: `Colocaci\xf3n finalizada.`,
    dropDescriptionKeyboard: `Pulse Intro para soltar. Pulse Escape para cancelar el arrastre.`,
    dropDescriptionTouch: `Pulse dos veces para soltar.`,
    dropDescriptionVirtual: `Haga clic para soltar.`,
    dropIndicator: `indicador de colocaci\xf3n`,
    dropOnItem: (args: Variables) => `Soltar en ${args?.["itemText"]}`,
    dropOnRoot: `Soltar en`,
    endDragKeyboard: `Arrastrando. Pulse Intro para cancelar el arrastre.`,
    endDragTouch: `Arrastrando. Pulse dos veces para cancelar el arrastre.`,
    endDragVirtual: `Arrastrando. Haga clic para cancelar el arrastre.`,
    insertAfter: (args: Variables) => `Insertar despu\xe9s de ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Insertar antes de ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Insertar entre ${args?.["beforeItemText"]} y ${args?.["afterItemText"]}`,
  },
  "et-EE": {
    dragDescriptionKeyboard: `Lohistamise alustamiseks vajutage klahvi Enter.`,
    dragDescriptionKeyboardAlt: `Lohistamise alustamiseks vajutage klahvikombinatsiooni Alt + Enter.`,
    dragDescriptionLongPress: `Vajutage pikalt lohistamise alustamiseks.`,
    dragDescriptionTouch: `Topeltpuudutage lohistamise alustamiseks.`,
    dragDescriptionVirtual: `Kl\xf5psake lohistamise alustamiseks.`,
    dragItem: (args: Variables) => `Lohista ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Lohista ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valitud \xfcksust`,
        other: () => `${formatter.number(Number(args?.["count"]))} valitud \xfcksust`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valitud \xfcksuse`,
        other: () => `${formatter.number(Number(args?.["count"]))} valitud \xfcksuse`,
      })} lohistamiseks vajutage sisestusklahvi Enter.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Lohistamiseks vajutage klahvikombinatsiooni Alt + Enter ${formatter.plural(
        Number(args?.["count"]),
        {
          one: () => `${formatter.number(Number(args?.["count"]))} valitud \xfcksuse`,
          other: () => `${formatter.number(Number(args?.["count"]))} valitud \xfcksuse`,
        },
      )} jaoks.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Pikk vajutus ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valitud \xfcksuse`,
        other: () => `${formatter.number(Number(args?.["count"]))} valitud \xfcksuse`,
      })} lohistamiseks.`,
    dragStartedKeyboard: `Alustati lohistamist. Kukutamise sihtm\xe4rgi juurde navigeerimiseks vajutage klahvi Tab, seej\xe4rel vajutage kukutamiseks klahvi Enter v\xf5i loobumiseks klahvi Escape.`,
    dragStartedTouch: `Alustati lohistamist. Navigeerige kukutamise sihtm\xe4rgi juurde ja topeltpuudutage kukutamiseks.`,
    dragStartedVirtual: `Alustati lohistamist. Navigeerige kukutamise sihtm\xe4rgi juurde ja kukutamiseks kl\xf5psake v\xf5i vajutage klahvi Enter.`,
    dropCanceled: `Lohistamisest loobuti.`,
    dropComplete: `Lohistamine on tehtud.`,
    dropDescriptionKeyboard: `Kukutamiseks vajutage klahvi Enter. Lohistamisest loobumiseks vajutage klahvi Escape.`,
    dropDescriptionTouch: `Kukutamiseks topeltpuudutage.`,
    dropDescriptionVirtual: `Kukutamiseks kl\xf5psake.`,
    dropIndicator: `lohistamise indikaator`,
    dropOnItem: (args: Variables) => `Kukuta asukohta ${args?.["itemText"]}`,
    dropOnRoot: `Kukuta asukohta`,
    endDragKeyboard: `Lohistamine. Lohistamisest loobumiseks vajutage klahvi Enter.`,
    endDragTouch: `Lohistamine. Lohistamisest loobumiseks topeltpuudutage.`,
    endDragVirtual: `Lohistamine. Lohistamisest loobumiseks kl\xf5psake.`,
    insertAfter: (args: Variables) => `Sisesta ${args?.["itemText"]} j\xe4rele`,
    insertBefore: (args: Variables) => `Sisesta ${args?.["itemText"]} ette`,
    insertBetween: (args: Variables) =>
      `Sisesta ${args?.["beforeItemText"]} ja ${args?.["afterItemText"]} vahele`,
  },
  "fi-FI": {
    dragDescriptionKeyboard: `Aloita vet\xe4minen painamalla Enter-n\xe4pp\xe4int\xe4.`,
    dragDescriptionKeyboardAlt: `Aloita vet\xe4minen painamalla Alt + Enter -n\xe4pp\xe4inyhdistelm\xe4\xe4.`,
    dragDescriptionLongPress: `Aloita vet\xe4minen pit\xe4m\xe4ll\xe4 painettuna.`,
    dragDescriptionTouch: `Aloita vet\xe4minen kaksoisnapauttamalla.`,
    dragDescriptionVirtual: `Aloita vet\xe4minen napsauttamalla.`,
    dragItem: (args: Variables) => `Ved\xe4 kohdetta ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Ved\xe4 ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valittua kohdetta`,
        other: () => `${formatter.number(Number(args?.["count"]))} valittua kohdetta`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Ved\xe4 painamalla Enter ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valittu kohde`,
        other: () => `${formatter.number(Number(args?.["count"]))} valittua kohdetta`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Ved\xe4 painamalla Alt + Enter ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valittu kohde`,
        other: () => `${formatter.number(Number(args?.["count"]))} valittua kohdetta`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Ved\xe4 pit\xe4m\xe4ll\xe4 painettuna ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valittu kohde`,
        other: () => `${formatter.number(Number(args?.["count"]))} valittua kohdetta`,
      })}.`,
    dragStartedKeyboard: `Vet\xe4minen aloitettu. Siirry pudotuskohteeseen painamalla sarkainn\xe4pp\xe4int\xe4 ja sitten pudota painamalla Enter-n\xe4pp\xe4int\xe4 tai peruuta painamalla Escape-n\xe4pp\xe4int\xe4.`,
    dragStartedTouch: `Vet\xe4minen aloitettu. Siirry pudotuskohteeseen ja pudota kaksoisnapauttamalla.`,
    dragStartedVirtual: `Vet\xe4minen aloitettu. Siirry pudotuskohteeseen ja pudota napsauttamalla tai painamalla Enter-n\xe4pp\xe4int\xe4.`,
    dropCanceled: `Pudotus peruutettu.`,
    dropComplete: `Pudotus suoritettu.`,
    dropDescriptionKeyboard: `Pudota painamalla Enter-n\xe4pp\xe4int\xe4. Peruuta vet\xe4minen painamalla Escape-n\xe4pp\xe4int\xe4.`,
    dropDescriptionTouch: `Pudota kaksoisnapauttamalla.`,
    dropDescriptionVirtual: `Pudota napsauttamalla.`,
    dropIndicator: `pudotuksen ilmaisin`,
    dropOnItem: (args: Variables) => `Pudota kohteeseen ${args?.["itemText"]}`,
    dropOnRoot: `Pudota kohteeseen`,
    endDragKeyboard: `Vedet\xe4\xe4n. Peruuta vet\xe4minen painamalla Enter-n\xe4pp\xe4int\xe4.`,
    endDragTouch: `Vedet\xe4\xe4n. Peruuta vet\xe4minen kaksoisnapauttamalla.`,
    endDragVirtual: `Vedet\xe4\xe4n. Peruuta vet\xe4minen napsauttamalla.`,
    insertAfter: (args: Variables) => `Lis\xe4\xe4 kohteen ${args?.["itemText"]} j\xe4lkeen`,
    insertBefore: (args: Variables) => `Lis\xe4\xe4 ennen kohdetta ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Lis\xe4\xe4 kohteiden ${args?.["beforeItemText"]} ja ${args?.["afterItemText"]} v\xe4liin`,
  },
  "fr-FR": {
    dragDescriptionKeyboard: `Appuyez sur Entr\xe9e pour commencer le d\xe9placement.`,
    dragDescriptionKeyboardAlt: `Appuyez sur Alt\xa0+\xa0Entr\xe9e pour commencer \xe0 faire glisser.`,
    dragDescriptionLongPress: `Appuyez de mani\xe8re prolong\xe9e pour commencer \xe0 faire glisser.`,
    dragDescriptionTouch: `Touchez deux fois pour commencer le d\xe9placement.`,
    dragDescriptionVirtual: `Cliquez pour commencer le d\xe9placement.`,
    dragItem: (args: Variables) => `D\xe9placer ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `D\xe9placer ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} \xe9l\xe9ment s\xe9lectionn\xe9`,
        other: () =>
          `${formatter.number(Number(args?.["count"]))} \xe9l\xe9ments s\xe9lectionn\xe9s`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Appuyez sur Entr\xe9e pour faire glisser ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} \xe9l\xe9ment s\xe9lectionn\xe9`,
        other: () =>
          `${formatter.number(Number(args?.["count"]))} \xe9l\xe9ments s\xe9lectionn\xe9s`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Appuyez sur Alt\xa0+\xa0Entr\xe9e pour faire glisser ${formatter.plural(
        Number(args?.["count"]),
        {
          one: () => `${formatter.number(Number(args?.["count"]))} \xe9l\xe9ment s\xe9lectionn\xe9`,
          other: () =>
            `${formatter.number(Number(args?.["count"]))} \xe9l\xe9ments s\xe9lectionn\xe9s`,
        },
      )}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Appuyez de mani\xe8re prolong\xe9e pour faire glisser ${formatter.plural(
        Number(args?.["count"]),
        {
          one: () => `${formatter.number(Number(args?.["count"]))} \xe9l\xe9ment s\xe9lectionn\xe9`,
          other: () =>
            `${formatter.number(Number(args?.["count"]))} \xe9l\xe9ments s\xe9lectionn\xe9s`,
        },
      )}.`,
    dragStartedKeyboard: `D\xe9placement commenc\xe9. Appuyez sur Tabulation pour acc\xe9der \xe0 une cible de d\xe9p\xf4t, puis appuyez sur Entr\xe9e pour d\xe9poser, ou appuyez sur \xc9chap pour annuler.`,
    dragStartedTouch: `D\xe9placement commenc\xe9. Acc\xe9dez \xe0 une cible de d\xe9p\xf4t, puis touchez deux fois pour d\xe9poser.`,
    dragStartedVirtual: `D\xe9placement commenc\xe9. Acc\xe9dez \xe0 une cible de d\xe9p\xf4t, puis cliquez ou appuyez sur Entr\xe9e pour d\xe9poser.`,
    dropCanceled: `D\xe9p\xf4t annul\xe9.`,
    dropComplete: `D\xe9p\xf4t termin\xe9.`,
    dropDescriptionKeyboard: `Appuyez sur Entr\xe9e pour d\xe9poser. Appuyez sur \xc9chap pour annuler le d\xe9placement.`,
    dropDescriptionTouch: `Touchez deux fois pour d\xe9poser.`,
    dropDescriptionVirtual: `Cliquez pour d\xe9poser.`,
    dropIndicator: `indicateur de d\xe9p\xf4t`,
    dropOnItem: (args: Variables) => `D\xe9poser sur ${args?.["itemText"]}`,
    dropOnRoot: `D\xe9poser sur`,
    endDragKeyboard: `D\xe9placement. Appuyez sur Entr\xe9e pour annuler le d\xe9placement.`,
    endDragTouch: `D\xe9placement. Touchez deux fois pour annuler le d\xe9placement.`,
    endDragVirtual: `D\xe9placement. Cliquez pour annuler le d\xe9placement.`,
    insertAfter: (args: Variables) => `Ins\xe9rer apr\xe8s ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Ins\xe9rer avant ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Ins\xe9rer entre ${args?.["beforeItemText"]} et ${args?.["afterItemText"]}`,
  },
  "he-IL": {
    dragDescriptionKeyboard: `הקש על Enter כדי להתחיל לגרור.`,
    dragDescriptionKeyboardAlt: `הקש Alt + Enter כדי להתחיל לגרור.`,
    dragDescriptionLongPress: `לחץ לחיצה ארוכה כדי להתחיל לגרור.`,
    dragDescriptionTouch: `הקש פעמיים כדי להתחיל בגרירה.`,
    dragDescriptionVirtual: `לחץ כדי להתחיל לגרור.`,
    dragItem: (args: Variables) => `גרור את ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `גרור ${formatter.plural(Number(args?.["count"]), {
        one: () => `פריט נבחר ${formatter.number(Number(args?.["count"]))}`,
        other: () => `${formatter.number(Number(args?.["count"]))} פריטים שנבחרו`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `הקש על Enter כדי לגרור ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} פריט שנבחר`,
        other: () => `${formatter.number(Number(args?.["count"]))} פריטים שנבחרו`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `הקש Alt + Enter כדי לגרור ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} פריט שנבחר`,
        other: () => `${formatter.number(Number(args?.["count"]))} פריטים שנבחרו`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `לחץ לחיצה ארוכה כדי לגרור ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} פריט שנבחר`,
        other: () => `${formatter.number(Number(args?.["count"]))} פריטים שנבחרו`,
      })}.`,
    dragStartedKeyboard: `התחלת לגרור. הקש על Tab כדי לנווט לנקודת הגרירה ולאחר מכן הקש על Enter כדי לשחרר או על Escape כדי לבטל.`,
    dragStartedTouch: `התחלת לגרור. נווט לנקודת השחרור ולאחר מכן הקש פעמיים כדי לשחרר.`,
    dragStartedVirtual: `התחלת לגרור. נווט לנקודת השחרור ולאחר מכן לחץ או הקש על Enter כדי לשחרר.`,
    dropCanceled: `השחרור בוטל.`,
    dropComplete: `השחרור הושלם.`,
    dropDescriptionKeyboard: `הקש על Enter כדי לשחרר. הקש על Escape כדי לבטל את הגרירה.`,
    dropDescriptionTouch: `הקש פעמיים כדי לשחרר.`,
    dropDescriptionVirtual: `לחץ כדי לשחרר.`,
    dropIndicator: `מחוון שחרור`,
    dropOnItem: (args: Variables) => `שחרר על ${args?.["itemText"]}`,
    dropOnRoot: `שחרר על`,
    endDragKeyboard: `גורר. הקש על Enter כדי לבטל את הגרירה.`,
    endDragTouch: `גורר. הקש פעמיים כדי לבטל את הגרירה.`,
    endDragVirtual: `גורר. לחץ כדי לבטל את הגרירה.`,
    insertAfter: (args: Variables) => `הוסף אחרי ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `הוסף לפני ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `הוסף בין ${args?.["beforeItemText"]} לבין ${args?.["afterItemText"]}`,
  },
  "hr-HR": {
    dragDescriptionKeyboard: `Pritisnite Enter da biste počeli povlačiti.`,
    dragDescriptionKeyboardAlt: `Pritisnite Alt + Enter za početak povlačenja.`,
    dragDescriptionLongPress: `Dugo pritisnite za početak povlačenja.`,
    dragDescriptionTouch: `Dvaput dodirnite da biste počeli povlačiti.`,
    dragDescriptionVirtual: `Kliknite da biste počeli povlačiti.`,
    dragItem: (args: Variables) => `Povucite stavku ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Povucite ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} odabranu stavku`,
        other: () => `ovoliko odabranih stavki: ${formatter.number(Number(args?.["count"]))}`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Pritisnite Enter za povlačenje ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} odabrana stavka`,
        other: () => `${formatter.number(Number(args?.["count"]))} odabrane stavke`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Pritisnite Alt + Enter za povlačenje ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} odabrana stavka`,
        other: () => `${formatter.number(Number(args?.["count"]))} odabrane stavke`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Dugo pritisnite za povlačenje ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} odabrana stavka`,
        other: () => `${formatter.number(Number(args?.["count"]))} odabrane stavke`,
      })}.`,
    dragStartedKeyboard: `Počeli ste povlačiti. Pritisnite tipku tabulatora da biste došli do cilja ispuštanja, a zatim Enter da biste ispustili stavku ili Escape da biste prekinuli povlačenje.`,
    dragStartedTouch: `Počeli ste povlačiti. Dođite do cilja ispuštanja, a zatim dvaput dodirnite da biste ispustili stavku.`,
    dragStartedVirtual: `Počeli ste povlačiti. Dođite do cilja ispuštanja, a zatim kliknite ili pritisnite Enter da biste ispustili stavku.`,
    dropCanceled: `Povlačenje je prekinuto.`,
    dropComplete: `Ispuštanje je dovršeno.`,
    dropDescriptionKeyboard: `Pritisnite Enter da biste ispustili stavku. Pritisnite Escape da biste prekinuli povlačenje.`,
    dropDescriptionTouch: `Dvaput dodirnite da biste ispustili stavku.`,
    dropDescriptionVirtual: `Kliknite da biste ispustili stavku.`,
    dropIndicator: `pokazatelj ispuštanja`,
    dropOnItem: (args: Variables) => `Ispustite na stavku ${args?.["itemText"]}`,
    dropOnRoot: `Ispustite na`,
    endDragKeyboard: `Povlačenje. Pritisnite Enter da biste prekinuli povlačenje.`,
    endDragTouch: `Povlačenje. Dvaput dodirnite da biste prekinuli povlačenje.`,
    endDragVirtual: `Povlačenje. Kliknite da biste prekinuli povlačenje.`,
    insertAfter: (args: Variables) => `Umetnite iza stavke ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Ispustite ispred stavke ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Umetnite između stavki ${args?.["beforeItemText"]} i ${args?.["afterItemText"]}`,
  },
  "hu-HU": {
    dragDescriptionKeyboard: `Nyomja le az Enter billentyűt a h\xfaz\xe1s megkezd\xe9s\xe9hez.`,
    dragDescriptionKeyboardAlt: `Nyomja le az Alt + Enter billentyűket a h\xfaz\xe1s megkezd\xe9s\xe9hez.`,
    dragDescriptionLongPress: `Hosszan nyomja meg a h\xfaz\xe1s elind\xedt\xe1s\xe1hoz.`,
    dragDescriptionTouch: `Koppintson dupl\xe1n a h\xfaz\xe1s megkezd\xe9s\xe9hez.`,
    dragDescriptionVirtual: `Kattintson a h\xfaz\xe1s megkezd\xe9s\xe9hez.`,
    dragItem: (args: Variables) => `${args?.["itemText"]} h\xfaz\xe1sa`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} kijel\xf6lt elem`,
        other: () => `${formatter.number(Number(args?.["count"]))} kijel\xf6lt elem`,
      })} h\xfaz\xe1sa`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Nyomja meg az Entert ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} kijel\xf6lt elem`,
        other: () => `${formatter.number(Number(args?.["count"]))} kijel\xf6lt elem`,
      })} h\xfaz\xe1s\xe1hoz.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Nyomja meg az Alt + Enter billentyűket ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} kijel\xf6lt elem`,
        other: () => `${formatter.number(Number(args?.["count"]))} kijel\xf6lt elem`,
      })} h\xfaz\xe1s\xe1hoz.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Tartsa lenyomva hosszan ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} kijel\xf6lt elem`,
        other: () => `${formatter.number(Number(args?.["count"]))} kijel\xf6lt elem`,
      })} h\xfaz\xe1s\xe1hoz.`,
    dragStartedKeyboard: `H\xfaz\xe1s megkezdve. Nyomja le a Tab billentyűt az elenged\xe9si c\xe9lhoz navig\xe1l\xe1s\xe1hoz, majd nyomja le az Enter billentyűt az elenged\xe9shez, vagy nyomja le az Escape billentyűt a megszak\xedt\xe1shoz.`,
    dragStartedTouch: `H\xfaz\xe1s megkezdve. Navig\xe1ljon egy elenged\xe9si c\xe9lhoz, majd koppintson dupl\xe1n az elenged\xe9shez.`,
    dragStartedVirtual: `H\xfaz\xe1s megkezdve. Navig\xe1ljon egy elenged\xe9si c\xe9lhoz, majd kattintson vagy nyomja le az Enter billentyűt az elenged\xe9shez.`,
    dropCanceled: `Elenged\xe9s megszak\xedtva.`,
    dropComplete: `Elenged\xe9s teljes\xedtve.`,
    dropDescriptionKeyboard: `Nyomja le az Enter billentyűt az elenged\xe9shez. Nyomja le az Escape billentyűt a h\xfaz\xe1s megszak\xedt\xe1s\xe1hoz.`,
    dropDescriptionTouch: `Koppintson dupl\xe1n az elenged\xe9shez.`,
    dropDescriptionVirtual: `Kattintson az elenged\xe9shez.`,
    dropIndicator: `elenged\xe9sjelző`,
    dropOnItem: (args: Variables) => `Elenged\xe9s erre: ${args?.["itemText"]}`,
    dropOnRoot: `Elenged\xe9s erre:`,
    endDragKeyboard: `H\xfaz\xe1s folyamatban. Nyomja le az Enter billentyűt a h\xfaz\xe1s megszak\xedt\xe1s\xe1hoz.`,
    endDragTouch: `H\xfaz\xe1s folyamatban. Koppintson dupl\xe1n a h\xfaz\xe1s megszak\xedt\xe1s\xe1hoz.`,
    endDragVirtual: `H\xfaz\xe1s folyamatban. Kattintson a h\xfaz\xe1s megszak\xedt\xe1s\xe1hoz.`,
    insertAfter: (args: Variables) => `Besz\xfar\xe1s ${args?.["itemText"]} ut\xe1n`,
    insertBefore: (args: Variables) => `Besz\xfar\xe1s ${args?.["itemText"]} el\xe9`,
    insertBetween: (args: Variables) =>
      `Besz\xfar\xe1s ${args?.["beforeItemText"]} \xe9s ${args?.["afterItemText"]} k\xf6z\xe9`,
  },
  "it-IT": {
    dragDescriptionKeyboard: `Premi Invio per iniziare a trascinare.`,
    dragDescriptionKeyboardAlt: `Premi Alt + Invio per iniziare a trascinare.`,
    dragDescriptionLongPress: `Premi a lungo per iniziare a trascinare.`,
    dragDescriptionTouch: `Tocca due volte per iniziare a trascinare.`,
    dragDescriptionVirtual: `Fai clic per iniziare a trascinare.`,
    dragItem: (args: Variables) => `Trascina ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Trascina ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} altro elemento selezionato`,
        other: () => `${formatter.number(Number(args?.["count"]))} altri elementi selezionati`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Premi Invio per trascinare ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} elemento selezionato`,
        other: () => `${formatter.number(Number(args?.["count"]))} elementi selezionati`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Premi Alt + Invio per trascinare ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} elemento selezionato`,
        other: () => `${formatter.number(Number(args?.["count"]))} elementi selezionati`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Premi a lungo per trascinare ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} elemento selezionato`,
        other: () => `${formatter.number(Number(args?.["count"]))} elementi selezionati`,
      })}.`,
    dragStartedKeyboard: `Hai iniziato a trascinare. Premi Tab per arrivare sull’area di destinazione, quindi premi Invio per rilasciare o Esc per annullare.`,
    dragStartedTouch: `Hai iniziato a trascinare. Arriva sull’area di destinazione, quindi tocca due volte per rilasciare.`,
    dragStartedVirtual: `Hai iniziato a trascinare. Arriva sull’area di destinazione, quindi fai clic o premi Invio per rilasciare.`,
    dropCanceled: `Rilascio annullato.`,
    dropComplete: `Rilascio completato.`,
    dropDescriptionKeyboard: `Premi Invio per rilasciare. Premi Esc per annullare.`,
    dropDescriptionTouch: `Tocca due volte per rilasciare.`,
    dropDescriptionVirtual: `Fai clic per rilasciare.`,
    dropIndicator: `indicatore di rilascio`,
    dropOnItem: (args: Variables) => `Rilascia su ${args?.["itemText"]}`,
    dropOnRoot: `Rilascia su`,
    endDragKeyboard: `Trascinamento. Premi Invio per annullare.`,
    endDragTouch: `Trascinamento. Tocca due volte per annullare.`,
    endDragVirtual: `Trascinamento. Fai clic per annullare.`,
    insertAfter: (args: Variables) => `Inserisci dopo ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Inserisci prima di ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Inserisci tra ${args?.["beforeItemText"]} e ${args?.["afterItemText"]}`,
  },
  "ja-JP": {
    dragDescriptionKeyboard: `Enter キーを押してドラッグを開始してください。`,
    dragDescriptionKeyboardAlt: `Alt+Enter キーを押してドラッグを開始します。`,
    dragDescriptionLongPress: `長押ししてドラッグを開始します。`,
    dragDescriptionTouch: `ダブルタップしてドラッグを開始します。`,
    dragDescriptionVirtual: `クリックしてドラッグを開始します。`,
    dragItem: (args: Variables) => `${args?.["itemText"]} をドラッグ`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 個の選択項目`,
        other: () => `${formatter.number(Number(args?.["count"]))} 個の選択項目`,
      })} をドラッグ`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Enter キーを押して、${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 選択した項目`,
        other: () => `${formatter.number(Number(args?.["count"]))} 選択した項目`,
      })}をドラッグします。`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Alt+Enter キーを押して、${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 選択した項目`,
        other: () => `${formatter.number(Number(args?.["count"]))} 選択した項目`,
      })}をドラッグします。`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `長押しして、${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 選択した項目`,
        other: () => `${formatter.number(Number(args?.["count"]))} 選択した項目`,
      })}をドラッグします。`,
    dragStartedKeyboard: `ドラッグを開始します。Tab キーを押してドロップターゲットにいどうし、Enter キーを押してドロップするか、Esc キーを押してキャンセルします。`,
    dragStartedTouch: `ドラッグを開始しました。ドロップのターゲットに移動し、ダブルタップしてドロップします。`,
    dragStartedVirtual: `ドラッグを開始しました。ドロップのターゲットに移動し、クリックまたは Enter キーを押してドロップします。`,
    dropCanceled: `ドロップがキャンセルされました。`,
    dropComplete: `ドロップが完了しました。`,
    dropDescriptionKeyboard: `Enter キーを押してドロップします。Esc キーを押してドラッグをキャンセルします。`,
    dropDescriptionTouch: `ダブルタップしてドロップします。`,
    dropDescriptionVirtual: `クリックしてドロップします。`,
    dropIndicator: `ドロップインジケーター`,
    dropOnItem: (args: Variables) => `${args?.["itemText"]} にドロップ`,
    dropOnRoot: `ドロップ場所`,
    endDragKeyboard: `ドラッグしています。Enter キーを押してドラッグをキャンセルします。`,
    endDragTouch: `ドラッグしています。ダブルタップしてドラッグをキャンセルします。`,
    endDragVirtual: `ドラッグしています。クリックしてドラッグをキャンセルします。`,
    insertAfter: (args: Variables) => `${args?.["itemText"]} の後に挿入`,
    insertBefore: (args: Variables) => `${args?.["itemText"]} の前に挿入`,
    insertBetween: (args: Variables) =>
      `${args?.["beforeItemText"]} と ${args?.["afterItemText"]} の間に挿入`,
  },
  "ko-KR": {
    dragDescriptionKeyboard: `드래그를 시작하려면 Enter를 누르세요.`,
    dragDescriptionKeyboardAlt: `드래그를 시작하려면 Alt + Enter를 누르십시오.`,
    dragDescriptionLongPress: `드래그를 시작하려면 길게 누르십시오.`,
    dragDescriptionTouch: `드래그를 시작하려면 더블 탭하세요.`,
    dragDescriptionVirtual: `드래그를 시작하려면 클릭하세요.`,
    dragItem: (args: Variables) => `${args?.["itemText"]} 드래그`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))}개 선택 항목`,
        other: () => `${formatter.number(Number(args?.["count"]))}개 선택 항목`,
      })} 드래그`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))}개 선택 항목`,
        other: () => `${formatter.number(Number(args?.["count"]))}개 선택 항목`,
      })}을 드래그하려면 Enter를 누르십시오.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))}개 선택 항목`,
        other: () => `${formatter.number(Number(args?.["count"]))}개 선택 항목`,
      })}을 드래그하려면 Alt + Enter를 누르십시오.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))}개 선택 항목`,
        other: () => `${formatter.number(Number(args?.["count"]))}개 선택 항목`,
      })}을 드래그하려면 길게 누르십시오.`,
    dragStartedKeyboard: `드래그가 시작되었습니다. Tab을 눌러 드롭 대상으로 이동한 다음 Enter를 눌러 드롭하거나 Esc를 눌러 취소하세요.`,
    dragStartedTouch: `드래그가 시작되었습니다. 드롭 대상으로 이동한 다음 더블 탭하여 드롭하세요.`,
    dragStartedVirtual: `드래그가 시작되었습니다. 드롭 대상으로 이동한 다음 클릭하거나 Enter를 눌러 드롭하세요.`,
    dropCanceled: `드롭이 취소되었습니다.`,
    dropComplete: `드롭이 완료되었습니다.`,
    dropDescriptionKeyboard: `드롭하려면 Enter를 누르세요. 드래그를 취소하려면 Esc를 누르세요.`,
    dropDescriptionTouch: `더블 탭하여 드롭하세요.`,
    dropDescriptionVirtual: `드롭하려면 클릭하세요.`,
    dropIndicator: `드롭 표시기`,
    dropOnItem: (args: Variables) => `${args?.["itemText"]}에 드롭`,
    dropOnRoot: `드롭 대상`,
    endDragKeyboard: `드래그 중입니다. 드래그를 취소하려면 Enter를 누르세요.`,
    endDragTouch: `드래그 중입니다. 드래그를 취소하려면 더블 탭하세요.`,
    endDragVirtual: `드래그 중입니다. 드래그를 취소하려면 클릭하세요.`,
    insertAfter: (args: Variables) => `${args?.["itemText"]} 이후에 삽입`,
    insertBefore: (args: Variables) => `${args?.["itemText"]} 이전에 삽입`,
    insertBetween: (args: Variables) =>
      `${args?.["beforeItemText"]} 및 ${args?.["afterItemText"]} 사이에 삽입`,
  },
  "lt-LT": {
    dragDescriptionKeyboard: `Paspauskite „Enter“, kad pradėtumėte vilkti.`,
    dragDescriptionKeyboardAlt: `Paspauskite „Alt + Enter“, kad pradėtumėte vilkti.`,
    dragDescriptionLongPress: `Palaikykite nuspaudę, kad pradėtumėte vilkti.`,
    dragDescriptionTouch: `Palieskite dukart, kad pradėtumėte vilkti.`,
    dragDescriptionVirtual: `Spustelėkite, kad pradėtumėte vilkti.`,
    dragItem: (args: Variables) => `Vilkti ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Vilkti ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} pasirinktą elementą`,
        other: () => `${formatter.number(Number(args?.["count"]))} pasirinktus elementus`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Paspauskite „Enter“, jei norite nuvilkti ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} pasirinktą elementą`,
        other: () => `${formatter.number(Number(args?.["count"]))} pasirinktus elementus`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Paspauskite „Alt + Enter“, kad nuvilktumėte ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} pasirinktą elementą`,
        other: () => `${formatter.number(Number(args?.["count"]))} pasirinktus elementus`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Nuspaudę palaikykite, kad nuvilktumėte ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} pasirinktą elementą`,
        other: () => `${formatter.number(Number(args?.["count"]))} pasirinktus elementus`,
      })}.`,
    dragStartedKeyboard: `Pradėta vilkti. Paspauskite „Tab“, kad pereitumėte į tiesioginę paskirties vietą, tada paspauskite „Enter“, kad numestumėte, arba „Escape“, kad atšauktumėte.`,
    dragStartedTouch: `Pradėta vilkti. Eikite į tiesioginę paskirties vietą, tada palieskite dukart, kad numestumėte.`,
    dragStartedVirtual: `Pradėta vilkti. Eikite į tiesioginę paskirties vietą ir spustelėkite arba paspauskite „Enter“, kad numestumėte.`,
    dropCanceled: `Numetimas atšauktas.`,
    dropComplete: `Numesta.`,
    dropDescriptionKeyboard: `Paspauskite „Enter“, kad numestumėte. Paspauskite „Escape“, kad atšauktumėte vilkimą.`,
    dropDescriptionTouch: `Palieskite dukart, kad numestumėte.`,
    dropDescriptionVirtual: `Spustelėkite, kad numestumėte.`,
    dropIndicator: `numetimo indikatorius`,
    dropOnItem: (args: Variables) => `Numesti ant ${args?.["itemText"]}`,
    dropOnRoot: `Numesti ant`,
    endDragKeyboard: `Velkama. Paspauskite „Enter“, kad atšauktumėte vilkimą.`,
    endDragTouch: `Velkama. Spustelėkite dukart, kad atšauktumėte vilkimą.`,
    endDragVirtual: `Velkama. Spustelėkite, kad atšauktumėte vilkimą.`,
    insertAfter: (args: Variables) => `Įterpti po ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Įterpti prieš ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Įterpti tarp ${args?.["beforeItemText"]} ir ${args?.["afterItemText"]}`,
  },
  "lv-LV": {
    dragDescriptionKeyboard: `Nospiediet Enter, lai sāktu vilkšanu.`,
    dragDescriptionKeyboardAlt: `Nospiediet taustiņu kombināciju Alt+Enter, lai sāktu vilkšanu.`,
    dragDescriptionLongPress: `Turiet nospiestu, lai sāktu vilkšanu.`,
    dragDescriptionTouch: `Veiciet dubultskārienu, lai sāktu vilkšanu.`,
    dragDescriptionVirtual: `Noklikšķiniet, lai sāktu vilkšanu.`,
    dragItem: (args: Variables) => `Velciet ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Velciet ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} atlasīto vienumu`,
        other: () => `${formatter.number(Number(args?.["count"]))} atlasītos vienumus`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Nospiediet taustiņu Enter, lai vilktu ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} atlasīto vienumu`,
        other: () => `${formatter.number(Number(args?.["count"]))} atlasītos vienumus`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Nospiediet taustiņu kombināciju Alt+Enter, lai vilktu ${formatter.plural(
        Number(args?.["count"]),
        {
          one: () => `${formatter.number(Number(args?.["count"]))} atlasīto vienumu`,
          other: () => `${formatter.number(Number(args?.["count"]))} atlasītos vienumus`,
        },
      )}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Turiet nospiestu, lai vilktu ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} atlasīto vienumu`,
        other: () => `${formatter.number(Number(args?.["count"]))} atlasītos vienumus`,
      })}.`,
    dragStartedKeyboard: `Uzsākta vilkšana. Nospiediet taustiņu Tab, lai pārietu uz nomešanas mērķi, pēc tam nospiediet Enter, lai nomestu, vai nospiediet Escape, lai atceltu.`,
    dragStartedTouch: `Uzsākta vilkšana. Pārejiet uz nomešanas mērķi, pēc tam veiciet dubultskārienu, lai nomestu.`,
    dragStartedVirtual: `Uzsākta vilkšana. Pārejiet uz nomešanas mērķi, pēc tam nospiediet Enter, lai nomestu.`,
    dropCanceled: `Nomešana atcelta.`,
    dropComplete: `Nomešana pabeigta.`,
    dropDescriptionKeyboard: `Nospiediet Enter, lai nomestu. Nospiediet Escape, lai atceltu vilkšanu.`,
    dropDescriptionTouch: `Veiciet dubultskārienu, lai nomestu.`,
    dropDescriptionVirtual: `Noklikšķiniet, lai nomestu.`,
    dropIndicator: `nomešanas indikators`,
    dropOnItem: (args: Variables) => `Nometiet uz ${args?.["itemText"]}`,
    dropOnRoot: `Nometiet uz`,
    endDragKeyboard: `Notiek vilkšana. Nospiediet Enter, lai atceltu vilkšanu.`,
    endDragTouch: `Notiek vilkšana. Veiciet dubultskārienu, lai atceltu vilkšanu.`,
    endDragVirtual: `Notiek vilkšana. Noklikšķiniet, lai atceltu vilkšanu.`,
    insertAfter: (args: Variables) => `Ievietojiet pēc ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Ievietojiet pirms ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Ievietojiet starp ${args?.["beforeItemText"]} un ${args?.["afterItemText"]}`,
  },
  "nb-NO": {
    dragDescriptionKeyboard: `Trykk p\xe5 Enter for \xe5 begynne \xe5 dra.`,
    dragDescriptionKeyboardAlt: `Trykk p\xe5 Alt + Enter for \xe5 begynne \xe5 dra.`,
    dragDescriptionLongPress: `Trykk lenge for \xe5 begynne \xe5 dra.`,
    dragDescriptionTouch: `Dobbelttrykk for \xe5 begynne \xe5 dra.`,
    dragDescriptionVirtual: `Klikk for \xe5 begynne \xe5 dra.`,
    dragItem: (args: Variables) => `Dra ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Dra ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} merket element`,
        other: () => `${formatter.number(Number(args?.["count"]))} merkede elementer`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Trykk Enter for \xe5 dra ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valgt element`,
        other: () => `${formatter.number(Number(args?.["count"]))} valgte elementer`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Trykk p\xe5 Alt + Enter for \xe5 dra ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valgt element`,
        other: () => `${formatter.number(Number(args?.["count"]))} valgte elementer`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Trykk lenge for \xe5 dra ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valgt element`,
        other: () => `${formatter.number(Number(args?.["count"]))} valgte elementer`,
      })}.`,
    dragStartedKeyboard: `Begynte \xe5 dra. Trykk p\xe5 Tab for \xe5 navigere til et m\xe5l, og trykk deretter p\xe5 Enter for \xe5 slippe eller p\xe5 Esc for \xe5 avbryte.`,
    dragStartedTouch: `Begynte \xe5 dra. Naviger til et m\xe5l, og dobbelttrykk for \xe5 slippe.`,
    dragStartedVirtual: `Begynte \xe5 dra. Naviger til et m\xe5l, og klikk eller trykk p\xe5 Enter for \xe5 slippe.`,
    dropCanceled: `Avbr\xf8t slipping.`,
    dropComplete: `Slippingen er fullf\xf8rt.`,
    dropDescriptionKeyboard: `Trykk p\xe5 Enter for \xe5 slippe. Trykk p\xe5 Esc hvis du vil avbryte draingen.`,
    dropDescriptionTouch: `Dobbelttrykk for \xe5 slippe.`,
    dropDescriptionVirtual: `Klikk for \xe5 slippe.`,
    dropIndicator: `slippeindikator`,
    dropOnItem: (args: Variables) => `Slipp p\xe5 ${args?.["itemText"]}`,
    dropOnRoot: `Slipp p\xe5`,
    endDragKeyboard: `Drar. Trykk p\xe5 Enter hvis du vil avbryte.`,
    endDragTouch: `Drar. Dobbelttrykk hvis du vil avbryte.`,
    endDragVirtual: `Drar. Klikk hvis du vil avbryte.`,
    insertAfter: (args: Variables) => `Sett inn etter ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Sett inn f\xf8r ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Sett inn mellom ${args?.["beforeItemText"]} og ${args?.["afterItemText"]}`,
  },
  "nl-NL": {
    dragDescriptionKeyboard: `Druk op Enter om te slepen.`,
    dragDescriptionKeyboardAlt: `Druk op Alt + Enter om te slepen.`,
    dragDescriptionLongPress: `Houd lang ingedrukt om te slepen.`,
    dragDescriptionTouch: `Dubbeltik om te slepen.`,
    dragDescriptionVirtual: `Klik om met slepen te starten.`,
    dragItem: (args: Variables) => `${args?.["itemText"]} slepen`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} geselecteerd item`,
        other: () => `${formatter.number(Number(args?.["count"]))} geselecteerde items`,
      })} slepen`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Druk op Enter om ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} geselecteerd item`,
        other: () => `${formatter.number(Number(args?.["count"]))} geselecteerde items`,
      })} te slepen.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Druk op Alt + Enter om ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} geselecteerd item`,
        other: () => `${formatter.number(Number(args?.["count"]))} geselecteerde items`,
      })} te slepen.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Houd lang ingedrukt om ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} geselecteerd item`,
        other: () => `${formatter.number(Number(args?.["count"]))} geselecteerde items`,
      })} te slepen.`,
    dragStartedKeyboard: `Begonnen met slepen. Druk op Tab om naar een locatie te gaan. Druk dan op Enter om neer te zetten, of op Esc om te annuleren.`,
    dragStartedTouch: `Begonnen met slepen. Ga naar de gewenste locatie en dubbeltik om neer te zetten.`,
    dragStartedVirtual: `Begonnen met slepen. Ga naar de gewenste locatie en klik of druk op Enter om neer te zetten.`,
    dropCanceled: `Neerzetten geannuleerd.`,
    dropComplete: `Neerzetten voltooid.`,
    dropDescriptionKeyboard: `Druk op Enter om neer te zetten. Druk op Esc om het slepen te annuleren.`,
    dropDescriptionTouch: `Dubbeltik om neer te zetten.`,
    dropDescriptionVirtual: `Klik om neer te zetten.`,
    dropIndicator: `aanwijzer voor neerzetten`,
    dropOnItem: (args: Variables) => `Neerzetten op ${args?.["itemText"]}`,
    dropOnRoot: `Neerzetten op`,
    endDragKeyboard: `Bezig met slepen. Druk op Enter om te annuleren.`,
    endDragTouch: `Bezig met slepen. Dubbeltik om te annuleren.`,
    endDragVirtual: `Bezig met slepen. Klik om te annuleren.`,
    insertAfter: (args: Variables) => `Plaatsen na ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Plaatsen v\xf3\xf3r ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Plaatsen tussen ${args?.["beforeItemText"]} en ${args?.["afterItemText"]}`,
  },
  "pl-PL": {
    dragDescriptionKeyboard: `Naciśnij Enter, aby rozpocząć przeciąganie.`,
    dragDescriptionKeyboardAlt: `Naciśnij Alt + Enter, aby rozpocząć przeciąganie.`,
    dragDescriptionLongPress: `Naciśnij i przytrzymaj, aby rozpocząć przeciąganie.`,
    dragDescriptionTouch: `Dotknij dwukrotnie, aby rozpocząć przeciąganie.`,
    dragDescriptionVirtual: `Kliknij, aby rozpocząć przeciąganie.`,
    dragItem: (args: Variables) => `Przeciągnij ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Przeciągnij ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} wybrany element`,
        other: () => `${formatter.number(Number(args?.["count"]))} wybranych element\xf3w`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Naciśnij Enter, aby przeciągnąć ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} wybrany element`,
        other: () => `${formatter.number(Number(args?.["count"]))} wybrane(-ych) elementy(-\xf3w)`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Naciśnij Alt + Enter, aby przeciągnąć ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} wybrany element`,
        other: () => `${formatter.number(Number(args?.["count"]))} wybrane(-ych) elementy(-\xf3w)`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Naciśnij i przytrzymaj, aby przeciągnąć ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} wybrany element`,
        other: () => `${formatter.number(Number(args?.["count"]))} wybrane(-ych) elementy(-\xf3w)`,
      })}.`,
    dragStartedKeyboard: `Rozpoczęto przeciąganie. Naciśnij Tab, aby wybrać miejsce docelowe, a następnie naciśnij Enter, aby upuścić, lub Escape, aby anulować.`,
    dragStartedTouch: `Rozpoczęto przeciąganie. Wybierz miejsce, w kt\xf3rym chcesz upuścić element, a następnie dotknij dwukrotnie, aby upuścić.F`,
    dragStartedVirtual: `Rozpoczęto przeciąganie. Wybierz miejsce, w kt\xf3rym chcesz upuścić element, a następnie kliknij lub naciśnij Enter, aby upuścić.`,
    dropCanceled: `Anulowano upuszczenie.`,
    dropComplete: `Zakończono upuszczanie.`,
    dropDescriptionKeyboard: `Naciśnij Enter, aby upuścić. Naciśnij Escape, aby anulować przeciągnięcie.`,
    dropDescriptionTouch: `Dotknij dwukrotnie, aby upuścić.`,
    dropDescriptionVirtual: `Kliknij, aby upuścić.`,
    dropIndicator: `wskaźnik upuszczenia`,
    dropOnItem: (args: Variables) => `Upuść na ${args?.["itemText"]}`,
    dropOnRoot: `Upuść`,
    endDragKeyboard: `Przeciąganie. Naciśnij Enter, aby anulować przeciągnięcie.`,
    endDragTouch: `Przeciąganie. Kliknij dwukrotnie, aby anulować przeciągnięcie.`,
    endDragVirtual: `Przeciąganie. Kliknij, aby anulować przeciąganie.`,
    insertAfter: (args: Variables) => `Umieść za ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Umieść przed ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Umieść między ${args?.["beforeItemText"]} i ${args?.["afterItemText"]}`,
  },
  "pt-BR": {
    dragDescriptionKeyboard: `Pressione Enter para come\xe7ar a arrastar.`,
    dragDescriptionKeyboardAlt: `Pressione Alt + Enter para come\xe7ar a arrastar.`,
    dragDescriptionLongPress: `Pressione e segure para come\xe7ar a arrastar.`,
    dragDescriptionTouch: `Toque duas vezes para come\xe7ar a arrastar.`,
    dragDescriptionVirtual: `Clique para come\xe7ar a arrastar.`,
    dragItem: (args: Variables) => `Arrastar ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Arrastar ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} item selecionado`,
        other: () => `${formatter.number(Number(args?.["count"]))} itens selecionados`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Pressione Enter para arrastar ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} o item selecionado`,
        other: () => `${formatter.number(Number(args?.["count"]))} os itens selecionados`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Pressione Alt + Enter para arrastar ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} o item selecionado`,
        other: () => `${formatter.number(Number(args?.["count"]))} os itens selecionados`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Pressione e segure para arrastar ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} o item selecionado`,
        other: () => `${formatter.number(Number(args?.["count"]))} os itens selecionados`,
      })}.`,
    dragStartedKeyboard: `Comece a arrastar. Pressione Tab para navegar at\xe9 um alvo e, em seguida, pressione Enter para soltar ou pressione Escape para cancelar.`,
    dragStartedTouch: `Comece a arrastar. Navegue at\xe9 um alvo e toque duas vezes para soltar.`,
    dragStartedVirtual: `Comece a arrastar. Navegue at\xe9 um alvo e clique ou pressione Enter para soltar.`,
    dropCanceled: `Libera\xe7\xe3o cancelada.`,
    dropComplete: `Libera\xe7\xe3o conclu\xedda.`,
    dropDescriptionKeyboard: `Pressione Enter para soltar. Pressione Escape para cancelar.`,
    dropDescriptionTouch: `Toque duas vezes para soltar.`,
    dropDescriptionVirtual: `Clique para soltar.`,
    dropIndicator: `indicador de libera\xe7\xe3o`,
    dropOnItem: (args: Variables) => `Soltar em ${args?.["itemText"]}`,
    dropOnRoot: `Soltar`,
    endDragKeyboard: `Arrastando. Pressione Enter para cancelar.`,
    endDragTouch: `Arrastando. Toque duas vezes para cancelar.`,
    endDragVirtual: `Arrastando. Clique para cancelar.`,
    insertAfter: (args: Variables) => `Inserir ap\xf3s ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Inserir antes de ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Inserir entre ${args?.["beforeItemText"]} e ${args?.["afterItemText"]}`,
  },
  "pt-PT": {
    dragDescriptionKeyboard: `Prima Enter para iniciar o arrasto.`,
    dragDescriptionKeyboardAlt: `Prima Alt + Enter para iniciar o arrasto.`,
    dragDescriptionLongPress: `Prima longamente para come\xe7ar a arrastar.`,
    dragDescriptionTouch: `Fa\xe7a duplo toque para come\xe7ar a arrastar.`,
    dragDescriptionVirtual: `Clique para iniciar o arrasto.`,
    dragItem: (args: Variables) => `Arrastar ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Arrastar ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} item selecionado`,
        other: () => `${formatter.number(Number(args?.["count"]))} itens selecionados`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Prima Enter para arrastar ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} o item selecionado`,
        other: () => `${formatter.number(Number(args?.["count"]))} os itens selecionados`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Prima Alt + Enter para arrastar ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} o item selecionado`,
        other: () => `${formatter.number(Number(args?.["count"]))} os itens selecionados`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Prima longamente para arrastar ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} o item selecionado`,
        other: () => `${formatter.number(Number(args?.["count"]))} os itens selecionados`,
      })}.`,
    dragStartedKeyboard: `Arrasto iniciado. Prima a tecla de tabula\xe7\xe3o para navegar para um destino para largar, e em seguida prima Enter para largar ou prima Escape para cancelar.`,
    dragStartedTouch: `Arrasto iniciado. Navegue para um destino para largar, e em seguida fa\xe7a duplo toque para largar.`,
    dragStartedVirtual: `Arrasto iniciado. Navegue para um destino para largar, e em seguida clique ou prima Enter para largar.`,
    dropCanceled: `Largar cancelado.`,
    dropComplete: `Largar completo.`,
    dropDescriptionKeyboard: `Prima Enter para largar. Prima Escape para cancelar o arrasto.`,
    dropDescriptionTouch: `Fa\xe7a duplo toque para largar.`,
    dropDescriptionVirtual: `Clique para largar.`,
    dropIndicator: `Indicador de largar`,
    dropOnItem: (args: Variables) => `Largar em ${args?.["itemText"]}`,
    dropOnRoot: `Largar em`,
    endDragKeyboard: `A arrastar. Prima Enter para cancelar o arrasto.`,
    endDragTouch: `A arrastar. Fa\xe7a duplo toque para cancelar o arrasto.`,
    endDragVirtual: `A arrastar. Clique para cancelar o arrasto.`,
    insertAfter: (args: Variables) => `Inserir depois de ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Inserir antes de ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Inserir entre ${args?.["beforeItemText"]} e ${args?.["afterItemText"]}`,
  },
  "ro-RO": {
    dragDescriptionKeyboard: `Apăsați pe Enter pentru a \xeencepe glisarea.`,
    dragDescriptionKeyboardAlt: `Apăsați pe Alt + Enter pentru a \xeencepe glisarea.`,
    dragDescriptionLongPress: `Apăsați lung pentru a \xeencepe glisarea.`,
    dragDescriptionTouch: `Atingeți de două ori pentru a \xeencepe să glisați.`,
    dragDescriptionVirtual: `Faceți clic pentru a \xeencepe glisarea.`,
    dragItem: (args: Variables) => `Glisați ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Glisați ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} element selectat`,
        other: () => `${formatter.number(Number(args?.["count"]))} elemente selectate`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Apăsați pe Enter pentru a glisa ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} element selectat`,
        other: () => `${formatter.number(Number(args?.["count"]))} elemente selectate`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Apăsați pe Alt + Enter pentru a glisa ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} element selectat`,
        other: () => `${formatter.number(Number(args?.["count"]))} elemente selectate`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Apăsați lung pentru a glisa ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} element selectat`,
        other: () => `${formatter.number(Number(args?.["count"]))} elemente selectate`,
      })}.`,
    dragStartedKeyboard: `A \xeenceput glisarea. Apăsați pe Tab pentru a naviga la o țintă de fixare, apoi apăsați pe Enter pentru a fixa sau apăsați pe Escape pentru a anula glisarea.`,
    dragStartedTouch: `A \xeenceput glisarea. Navigați la o țintă de fixare, apoi atingeți de două ori pentru a fixa.`,
    dragStartedVirtual: `A \xeenceput glisarea. Navigați la o țintă de fixare, apoi faceți clic sau apăsați pe Enter pentru a fixa.`,
    dropCanceled: `Fixare anulată.`,
    dropComplete: `Fixare finalizată.`,
    dropDescriptionKeyboard: `Apăsați pe Enter pentru a fixa. Apăsați pe Escape pentru a anula glisarea.`,
    dropDescriptionTouch: `Atingeți de două ori pentru a fixa.`,
    dropDescriptionVirtual: `Faceți clic pentru a fixa.`,
    dropIndicator: `indicator de fixare`,
    dropOnItem: (args: Variables) => `Fixați pe ${args?.["itemText"]}`,
    dropOnRoot: `Fixare pe`,
    endDragKeyboard: `Se glisează. Apăsați pe Enter pentru a anula glisarea.`,
    endDragTouch: `Se glisează. Atingeți de două ori pentru a anula glisarea.`,
    endDragVirtual: `Se glisează. Faceți clic pentru a anula glisarea.`,
    insertAfter: (args: Variables) => `Inserați după ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Inserați \xeenainte de ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Inserați \xeentre ${args?.["beforeItemText"]} și ${args?.["afterItemText"]}`,
  },
  "ru-RU": {
    dragDescriptionKeyboard: `Нажмите клавишу Enter для начала перетаскивания.`,
    dragDescriptionKeyboardAlt: `Нажмите Alt + Enter, чтобы начать перетаскивать.`,
    dragDescriptionLongPress: `Нажмите и удерживайте, чтобы начать перетаскивать.`,
    dragDescriptionTouch: `Дважды нажмите для начала перетаскивания.`,
    dragDescriptionVirtual: `Щелкните для начала перетаскивания.`,
    dragItem: (args: Variables) => `Перетащить ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Перетащить ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} выбранный элемент`,
        other: () => `${formatter.number(Number(args?.["count"]))} выбранных элем`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Нажмите Enter для перетаскивания ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} выбранного элемента`,
        other: () => `${formatter.number(Number(args?.["count"]))} выбранных элементов`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Нажмите Alt + Enter для перетаскивания ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} выбранного элемента`,
        other: () => `${formatter.number(Number(args?.["count"]))} выбранных элементов`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Нажмите и удерживайте для перетаскивания ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} выбранного элемента`,
        other: () => `${formatter.number(Number(args?.["count"]))} выбранных элементов`,
      })}.`,
    dragStartedKeyboard: `Начато перетаскивание. Нажмите клавишу Tab для выбора цели, затем нажмите клавишу Enter, чтобы применить перетаскивание, или клавишу Escape для отмены действия.`,
    dragStartedTouch: `Начато перетаскивание. Выберите цель, затем дважды нажмите, чтобы применить перетаскивание.`,
    dragStartedVirtual: `Начато перетаскивание. Нажмите клавишу Tab для выбора цели, затем нажмите клавишу Enter, чтобы применить перетаскивание.`,
    dropCanceled: `Перетаскивание отменено.`,
    dropComplete: `Перетаскивание завершено.`,
    dropDescriptionKeyboard: `Нажмите клавишу Enter, чтобы применить перетаскивание. Нажмите клавишу Escape для отмены.`,
    dropDescriptionTouch: `Дважды нажмите, чтобы применить перетаскивание.`,
    dropDescriptionVirtual: `Щелкните, чтобы применить перетаскивание.`,
    dropIndicator: `индикатор перетаскивания`,
    dropOnItem: (args: Variables) => `Перетащить на ${args?.["itemText"]}`,
    dropOnRoot: `Перетащить на`,
    endDragKeyboard: `Перетаскивание. Нажмите клавишу Enter для отмены.`,
    endDragTouch: `Перетаскивание. Дважды нажмите для отмены.`,
    endDragVirtual: `Перетаскивание. Щелкните для отмены.`,
    insertAfter: (args: Variables) => `Вставить после ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Вставить перед ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Вставить между ${args?.["beforeItemText"]} и ${args?.["afterItemText"]}`,
  },
  "sk-SK": {
    dragDescriptionKeyboard: `Stlačen\xedm kl\xe1vesu Enter začnete pres\xfavanie.`,
    dragDescriptionKeyboardAlt: `Stlačen\xedm kl\xe1vesov Alt + Enter začnete pres\xfavanie.`,
    dragDescriptionLongPress: `Dlh\xfdm stlačen\xedm začnete pres\xfavanie.`,
    dragDescriptionTouch: `Dvojit\xfdm kliknut\xedm začnete pres\xfavanie.`,
    dragDescriptionVirtual: `Kliknut\xedm začnete pres\xfavanie.`,
    dragItem: (args: Variables) => `Presun\xfať položku ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Presun\xfať ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} vybrat\xfa položku`,
        other: () => `${formatter.number(Number(args?.["count"]))} vybrat\xe9 položky`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Stlačen\xedm kl\xe1vesu Enter presuniete ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} vybrat\xfa položku`,
        other: () => `${formatter.number(Number(args?.["count"]))} vybrat\xfdch položiek`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Stlačen\xedm kl\xe1vesov Alt + Enter presuniete ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} vybrat\xfa položku`,
        other: () => `${formatter.number(Number(args?.["count"]))} vybrat\xfdch položiek`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Dlh\xfdm stlačen\xedm presuniete ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} vybrat\xfa položku`,
        other: () => `${formatter.number(Number(args?.["count"]))} vybrat\xfdch položiek`,
      })}.`,
    dragStartedKeyboard: `Pres\xfavanie sa začalo. Do cieľov\xe9ho umiestnenia prejdete stlačen\xedm kl\xe1vesu Tab. Ak chcete položku umiestniť, stlačte kl\xe1ves Enter alebo stlačte kl\xe1ves Esc, ak chcete pres\xfavanie zrušiť.`,
    dragStartedTouch: `Pres\xfavanie sa začalo. Prejdite na cieľov\xe9 umiestnenie a dvojit\xfdm kliknut\xedm umiestnite položku.`,
    dragStartedVirtual: `Pres\xfavanie sa začalo. Prejdite na cieľov\xe9 umiestnenie a kliknut\xedm alebo stlačen\xedm kl\xe1vesu Enter umiestnite položku.`,
    dropCanceled: `Umiestnenie zrušen\xe9.`,
    dropComplete: `Umiestnenie dokončen\xe9.`,
    dropDescriptionKeyboard: `Stlačen\xedm kl\xe1vesu Enter umiestnite položku. Stlačen\xedm kl\xe1vesu Esc zruš\xedte pres\xfavanie.`,
    dropDescriptionTouch: `Dvojit\xfdm kliknut\xedm umiestnite položku.`,
    dropDescriptionVirtual: `Kliknut\xedm umiestnite položku.`,
    dropIndicator: `indik\xe1tor umiestnenia`,
    dropOnItem: (args: Variables) => `Umiestniť na položku ${args?.["itemText"]}`,
    dropOnRoot: `Umiestniť na`,
    endDragKeyboard: `Prebieha pres\xfavanie. Ak ho chcete zrušiť, stlačte kl\xe1ves Enter.`,
    endDragTouch: `Prebieha pres\xfavanie. Dvojit\xfdm kliknut\xedm ho m\xf4žete zrušiť.`,
    endDragVirtual: `Prebieha pres\xfavanie.`,
    insertAfter: (args: Variables) => `Vložiť za položku ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Vložiť pred položku ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Vložiť medzi položky ${args?.["beforeItemText"]} a ${args?.["afterItemText"]}`,
  },
  "sl-SI": {
    dragDescriptionKeyboard: `Pritisnite tipko Enter za začetek vlečenja.`,
    dragDescriptionKeyboardAlt: `Pritisnite tipki Alt + Enter za začetek vlečenja.`,
    dragDescriptionLongPress: `Pritisnite in zadržite za začetek vlečenja.`,
    dragDescriptionTouch: `Dvotapnite za začetek vlečenja.`,
    dragDescriptionVirtual: `Kliknite za začetek vlečenja.`,
    dragItem: (args: Variables) => `Povleci ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Povlecite ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} izbran element`,
        other: () => `izbrane elemente (${formatter.number(Number(args?.["count"]))})`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Pritisnite tipko Enter, da povlečete ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} izbrani element`,
        other: () => `${formatter.number(Number(args?.["count"]))} izbranih elementov`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Pritisnite tipki Alt + Enter, da povlečete ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} izbrani element`,
        other: () => `${formatter.number(Number(args?.["count"]))} izbranih elementov`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Pritisnite in zadržite, da povlečete ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} izbrani element`,
        other: () => `${formatter.number(Number(args?.["count"]))} izbranih elementov`,
      })}.`,
    dragStartedKeyboard: `Vlečenje se je začelo. Pritisnite tipko Tab za pomik na mesto, kamor želite spustiti elemente, in pritisnite tipko Enter, da jih spustite, ali tipko Escape, da prekličete postopek.`,
    dragStartedTouch: `Vlečenje se je začelo. Pomaknite se na mesto, kamor želite spustiti elemente, in dvotapnite, da jih spustite.`,
    dragStartedVirtual: `Vlečenje se je začelo. Pomaknite se na mesto, kamor želite spustiti elemente, in kliknite ali pritisnite tipko Enter, da jih spustite.`,
    dropCanceled: `Spust je preklican.`,
    dropComplete: `Spust je končan.`,
    dropDescriptionKeyboard: `Pritisnite tipko Enter, da spustite. Pritisnite tipko Escape, da prekličete vlečenje.`,
    dropDescriptionTouch: `Dvotapnite, da spustite.`,
    dropDescriptionVirtual: `Kliknite, da spustite.`,
    dropIndicator: `indikator spusta`,
    dropOnItem: (args: Variables) => `Spusti na mesto ${args?.["itemText"]}`,
    dropOnRoot: `Spusti na mesto`,
    endDragKeyboard: `Vlečenje. Pritisnite tipko Enter za preklic vlečenja.`,
    endDragTouch: `Vlečenje. Dvotapnite za preklic vlečenja.`,
    endDragVirtual: `Vlečenje. Kliknite, da prekličete vlečenje.`,
    insertAfter: (args: Variables) => `Vstavi za ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Vstavi pred ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Vstavi med ${args?.["beforeItemText"]} in ${args?.["afterItemText"]}`,
  },
  "sr-SP": {
    dragDescriptionKeyboard: `Pritisnite Enter da biste započeli prevlačenje.`,
    dragDescriptionKeyboardAlt: `Pritisnite Alt + Enter da biste započeli prevlačenje.`,
    dragDescriptionLongPress: `Pritisnite dugo da biste započeli prevlačenje.`,
    dragDescriptionTouch: `Dvaput dodirnite da biste započeli prevlačenje.`,
    dragDescriptionVirtual: `Kliknite da biste započeli prevlačenje.`,
    dragItem: (args: Variables) => `Prevucite ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Prevucite ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} izabranu stavku`,
        other: () => `${formatter.number(Number(args?.["count"]))} izabrane stavke`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Pritisnite Enter da biste prevukli ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} izabranu stavku`,
        other: () => `${formatter.number(Number(args?.["count"]))} izabranih stavki`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Pritisnite Alt + Enter da biste prevukli ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} izabranu stavku`,
        other: () => `${formatter.number(Number(args?.["count"]))} izabranih stavki`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Pritisnite dugo da biste prevukli ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} izabranu stavku`,
        other: () => `${formatter.number(Number(args?.["count"]))} izabranih stavki`,
      })}.`,
    dragStartedKeyboard: `Prevlačenje je započeto. Pritisnite Tab da biste otišli do cilja za otpuštanje, zatim pritisnite Enter za ispuštanje ili pritisnite Escape za otkazivanje.`,
    dragStartedTouch: `Prevlačenje je započeto. Idite do cilja za otpuštanje, a zatim dvaput dodirnite za otpuštanje.`,
    dragStartedVirtual: `Prevlačenje je započeto. Idite do cilja za otpuštanje, a zatim kliknite ili pritinite Enter za otpuštanje.`,
    dropCanceled: `Otpuštanje je otkazano.`,
    dropComplete: `Prevlačenje je završeno.`,
    dropDescriptionKeyboard: `Pritisnite Enter da biste otpustili. Pritisnite Escape da biste otkazali prevlačenje.`,
    dropDescriptionTouch: `Dvaput dodirnite za otpuštanje.`,
    dropDescriptionVirtual: `Kliknite za otpuštanje.`,
    dropIndicator: `Indikator otpuštanja`,
    dropOnItem: (args: Variables) => `Otpusti na ${args?.["itemText"]}`,
    dropOnRoot: `Otpusti na`,
    endDragKeyboard: `Prevlačenje u toku. Pritisnite Enter da biste otkazali prevlačenje.`,
    endDragTouch: `Prevlačenje u toku. Dvaput dodirnite da biste otkazali prevlačenje.`,
    endDragVirtual: `Prevlačenje u toku. Kliknite da biste otkazali prevlačenje.`,
    insertAfter: (args: Variables) => `Umetnite posle ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Umetnite ispred ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Umetnite između ${args?.["beforeItemText"]} i ${args?.["afterItemText"]}`,
  },
  "sv-SE": {
    dragDescriptionKeyboard: `Tryck p\xe5 enter f\xf6r att b\xf6rja dra.`,
    dragDescriptionKeyboardAlt: `Tryck p\xe5 Alt + Retur f\xf6r att b\xf6rja dra.`,
    dragDescriptionLongPress: `Tryck l\xe4nge f\xf6r att b\xf6rja dra.`,
    dragDescriptionTouch: `Dubbeltryck f\xf6r att b\xf6rja dra.`,
    dragDescriptionVirtual: `Klicka f\xf6r att b\xf6rja dra.`,
    dragItem: (args: Variables) => `Dra ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Dra ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} valt objekt`,
        other: () => `${formatter.number(Number(args?.["count"]))} valda objekt`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Tryck p\xe5 Retur f\xf6r att dra ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} markerat objekt`,
        other: () => `${formatter.number(Number(args?.["count"]))} markerade objekt`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Tryck p\xe5 Alt + Retur f\xf6r att dra ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} markerat objekt`,
        other: () => `${formatter.number(Number(args?.["count"]))} markerade objekt`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Tryck l\xe4nge f\xf6r att dra ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} markerat objekt`,
        other: () => `${formatter.number(Number(args?.["count"]))} markerade objekt`,
      })}.`,
    dragStartedKeyboard: `B\xf6rja dra. Tryck p\xe5 tabb f\xf6r att navigera till m\xe5let, tryck p\xe5 enter f\xf6r att sl\xe4ppa eller p\xe5 escape f\xf6r att avbryta.`,
    dragStartedTouch: `B\xf6rja dra. Navigera till ett m\xe5l och dubbeltryck f\xf6r att sl\xe4ppa.`,
    dragStartedVirtual: `B\xf6rja dra. Navigera till ett m\xe5l och klicka eller tryck p\xe5 enter f\xf6r att sl\xe4ppa.`,
    dropCanceled: `Sl\xe4pp\xe5tg\xe4rd avbr\xf6ts.`,
    dropComplete: `Sl\xe4pp\xe5tg\xe4rd klar.`,
    dropDescriptionKeyboard: `Tryck p\xe5 enter f\xf6r att sl\xe4ppa. Tryck p\xe5 escape f\xf6r att avbryta drag\xe5tg\xe4rd.`,
    dropDescriptionTouch: `Dubbeltryck f\xf6r att sl\xe4ppa.`,
    dropDescriptionVirtual: `Klicka f\xf6r att sl\xe4ppa.`,
    dropIndicator: `sl\xe4ppindikator`,
    dropOnItem: (args: Variables) => `Sl\xe4pp p\xe5 ${args?.["itemText"]}`,
    dropOnRoot: `Sl\xe4pp p\xe5`,
    endDragKeyboard: `Drar. Tryck p\xe5 enter f\xf6r att avbryta drag\xe5tg\xe4rd.`,
    endDragTouch: `Drar. Dubbeltryck f\xf6r att avbryta drag\xe5tg\xe4rd.`,
    endDragVirtual: `Drar. Klicka f\xf6r att avbryta drag\xe5tg\xe4rd.`,
    insertAfter: (args: Variables) => `Infoga efter ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Infoga f\xf6re ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Infoga mellan ${args?.["beforeItemText"]} och ${args?.["afterItemText"]}`,
  },
  "tr-TR": {
    dragDescriptionKeyboard: `S\xfcr\xfcklemeyi başlatmak i\xe7in Enter'a basın.`,
    dragDescriptionKeyboardAlt: `S\xfcr\xfcklemeyi başlatmak i\xe7in Alt + Enter'a basın.`,
    dragDescriptionLongPress: `S\xfcr\xfcklemeye başlamak i\xe7in uzun basın.`,
    dragDescriptionTouch: `S\xfcr\xfcklemeyi başlatmak i\xe7in \xe7ift tıklayın.`,
    dragDescriptionVirtual: `S\xfcr\xfcklemeyi başlatmak i\xe7in tıklayın.`,
    dragItem: (args: Variables) => `${args?.["itemText"]}’i s\xfcr\xfckle`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `S\xfcr\xfckle ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} se\xe7ili \xf6ge`,
        other: () => `${formatter.number(Number(args?.["count"]))} se\xe7ili \xf6ge`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} se\xe7ilmiş \xf6ğe`,
        other: () => `${formatter.number(Number(args?.["count"]))} se\xe7ilmiş \xf6ğe`,
      })} \xf6ğesini s\xfcr\xfcklemek i\xe7in Enter'a basın.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} se\xe7ilmiş \xf6ğe`,
        other: () => `${formatter.number(Number(args?.["count"]))} se\xe7ilmiş \xf6ğe`,
      })} \xf6ğesini s\xfcr\xfcklemek i\xe7in Alt + Enter tuşuna basın.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} se\xe7ilmiş \xf6ğe`,
        other: () => `${formatter.number(Number(args?.["count"]))} se\xe7ilmiş \xf6ğe`,
      })} \xf6ğesini s\xfcr\xfcklemek i\xe7in uzun basın.`,
    dragStartedKeyboard: `S\xfcr\xfckleme başlatıldı. Bir bırakma hedefine gitmek i\xe7in Tab’a basın, ardından bırakmak i\xe7in Enter’a basın veya iptal etmek i\xe7in Escape’e basın.`,
    dragStartedTouch: `S\xfcr\xfckleme başlatıldı. Bir bırakma hedefine gidin, ardından bırakmak i\xe7in \xe7ift tıklayın.`,
    dragStartedVirtual: `S\xfcr\xfckleme başlatıldı. Bir bırakma hedefine gidin, ardından bırakmak i\xe7in Enter’a tıklayın veya basın.`,
    dropCanceled: `Bırakma iptal edildi.`,
    dropComplete: `Bırakma tamamlandı.`,
    dropDescriptionKeyboard: `Bırakmak i\xe7in Enter'a basın. S\xfcr\xfcklemeyi iptal etmek i\xe7in Escape'e basın.`,
    dropDescriptionTouch: `Bırakmak i\xe7in \xe7ift tıklayın.`,
    dropDescriptionVirtual: `Bırakmak i\xe7in tıklayın.`,
    dropIndicator: `bırakma g\xf6stergesi`,
    dropOnItem: (args: Variables) => `${args?.["itemText"]} \xfczerine bırak`,
    dropOnRoot: `Bırakın`,
    endDragKeyboard: `S\xfcr\xfckleme. S\xfcr\xfcklemeyi iptal etmek i\xe7in Enter'a basın.`,
    endDragTouch: `S\xfcr\xfckleme. S\xfcr\xfcklemeyi iptal etmek i\xe7in \xe7ift tıklayın.`,
    endDragVirtual: `S\xfcr\xfckleme. S\xfcr\xfcklemeyi iptal etmek i\xe7in tıklayın.`,
    insertAfter: (args: Variables) => `${args?.["itemText"]}’den sonra gir`,
    insertBefore: (args: Variables) => `${args?.["itemText"]}’den \xf6nce gir`,
    insertBetween: (args: Variables) =>
      `${args?.["beforeItemText"]} ve ${args?.["afterItemText"]} arasına gir`,
  },
  "uk-UA": {
    dragDescriptionKeyboard: `Натисніть Enter, щоб почати перетягування.`,
    dragDescriptionKeyboardAlt: `Натисніть Alt + Enter, щоб почати перетягування.`,
    dragDescriptionLongPress: `Натисніть і утримуйте, щоб почати перетягування.`,
    dragDescriptionTouch: `Натисніть двічі, щоб почати перетягування.`,
    dragDescriptionVirtual: `Натисніть, щоб почати перетягування.`,
    dragItem: (args: Variables) => `Перетягнути ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `Перетягніть ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} вибраний елемент`,
        other: () => `${formatter.number(Number(args?.["count"]))} вибраних елем`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `Натисніть Enter, щоб перетягнути ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} вибраний елемент`,
        other: () => `${formatter.number(Number(args?.["count"]))} вибраних елементи(-ів)`,
      })}.`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `Натисніть Alt + Enter, щоб перетягнути ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} вибраний елемент`,
        other: () => `${formatter.number(Number(args?.["count"]))} вибраних елементи(-ів)`,
      })}.`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `Утримуйте, щоб перетягнути ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} вибраний елемент`,
        other: () => `${formatter.number(Number(args?.["count"]))} вибраних елементи(-ів)`,
      })}.`,
    dragStartedKeyboard: `Перетягування почалося. Натисніть Tab, щоб перейти до цілі перетягування, потім натисніть Enter, щоб перетягнути, або Escape, щоб скасувати.`,
    dragStartedTouch: `Перетягування почалося. Перейдіть до цілі перетягування, потім натисніть двічі, щоб перетягнути.`,
    dragStartedVirtual: `Перетягування почалося. Перейдіть до цілі перетягування, потім натисніть Enter, щоб перетягнути.`,
    dropCanceled: `Перетягування скасовано.`,
    dropComplete: `Перетягування завершено.`,
    dropDescriptionKeyboard: `Натисніть Enter, щоб перетягнути. Натисніть Escape, щоб скасувати перетягування.`,
    dropDescriptionTouch: `Натисніть двічі, щоб перетягнути.`,
    dropDescriptionVirtual: `Натисніть, щоб перетягнути.`,
    dropIndicator: `індикатор перетягування`,
    dropOnItem: (args: Variables) => `Перетягнути на ${args?.["itemText"]}`,
    dropOnRoot: `Перетягнути на`,
    endDragKeyboard: `Триває перетягування. Натисніть Enter, щоб скасувати перетягування.`,
    endDragTouch: `Триває перетягування. Натисніть двічі, щоб скасувати перетягування.`,
    endDragVirtual: `Триває перетягування. Натисніть, щоб скасувати перетягування.`,
    insertAfter: (args: Variables) => `Вставити після ${args?.["itemText"]}`,
    insertBefore: (args: Variables) => `Вставити перед ${args?.["itemText"]}`,
    insertBetween: (args: Variables) =>
      `Вставити між ${args?.["beforeItemText"]} і ${args?.["afterItemText"]}`,
  },
  "zh-CN": {
    dragDescriptionKeyboard: `按 Enter 开始拖动。`,
    dragDescriptionKeyboardAlt: `按 Alt + Enter 开始拖动。`,
    dragDescriptionLongPress: `长按以开始拖动。`,
    dragDescriptionTouch: `双击开始拖动。`,
    dragDescriptionVirtual: `单击开始拖动。`,
    dragItem: (args: Variables) => `拖动 ${args?.["itemText"]}`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `拖动 ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 选中项目`,
        other: () => `${formatter.number(Number(args?.["count"]))} 选中项目`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `按 Enter 以拖动 ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 个选定项`,
        other: () => `${formatter.number(Number(args?.["count"]))} 个选定项`,
      })}。`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `按 Alt + Enter 以拖动 ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 个选定项`,
        other: () => `${formatter.number(Number(args?.["count"]))} 个选定项`,
      })}。`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `长按以拖动 ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 个选定项`,
        other: () => `${formatter.number(Number(args?.["count"]))} 个选定项`,
      })}。`,
    dragStartedKeyboard: `已开始拖动。按 Tab 导航到放置目标，然后按 Enter 放置或按 Escape 取消。`,
    dragStartedTouch: `已开始拖动。导航到放置目标，然后双击放置。`,
    dragStartedVirtual: `已开始拖动。导航到放置目标，然后单击或按 Enter 放置。`,
    dropCanceled: `放置已取消。`,
    dropComplete: `放置已完成。`,
    dropDescriptionKeyboard: `按 Enter 放置。按 Escape 取消拖动。`,
    dropDescriptionTouch: `双击放置。`,
    dropDescriptionVirtual: `单击放置。`,
    dropIndicator: `放置标记`,
    dropOnItem: (args: Variables) => `放置于 ${args?.["itemText"]}`,
    dropOnRoot: `放置于`,
    endDragKeyboard: `正在拖动。按 Enter 取消拖动。`,
    endDragTouch: `正在拖动。双击取消拖动。`,
    endDragVirtual: `正在拖动。单击取消拖动。`,
    insertAfter: (args: Variables) => `插入到 ${args?.["itemText"]} 之后`,
    insertBefore: (args: Variables) => `插入到 ${args?.["itemText"]} 之前`,
    insertBetween: (args: Variables) =>
      `插入到 ${args?.["beforeItemText"]} 和 ${args?.["afterItemText"]} 之间`,
  },
  "zh-TW": {
    dragDescriptionKeyboard: `按 Enter 鍵以開始拖曳。`,
    dragDescriptionKeyboardAlt: `按 Alt+Enter 鍵以開始拖曳。`,
    dragDescriptionLongPress: `長按以開始拖曳。`,
    dragDescriptionTouch: `輕點兩下以開始拖曳。`,
    dragDescriptionVirtual: `按一下滑鼠以開始拖曳。`,
    dragItem: (args: Variables) => `拖曳「${args?.["itemText"]}」`,
    dragSelectedItems: (args: Variables, formatter: MessageFormatter) =>
      `拖曳 ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 個選定項目`,
        other: () => `${formatter.number(Number(args?.["count"]))} 個選定項目`,
      })}`,
    dragSelectedKeyboard: (args: Variables, formatter: MessageFormatter) =>
      `按 Enter 鍵以拖曳 ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 個選定項目`,
        other: () => `${formatter.number(Number(args?.["count"]))} 個選定項目`,
      })}。`,
    dragSelectedKeyboardAlt: (args: Variables, formatter: MessageFormatter) =>
      `按 Alt+Enter 鍵以拖曳 ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 個選定項目`,
        other: () => `${formatter.number(Number(args?.["count"]))} 個選定項目`,
      })}。`,
    dragSelectedLongPress: (args: Variables, formatter: MessageFormatter) =>
      `長按以拖曳 ${formatter.plural(Number(args?.["count"]), {
        one: () => `${formatter.number(Number(args?.["count"]))} 個選定項目`,
        other: () => `${formatter.number(Number(args?.["count"]))} 個選定項目`,
      })}。`,
    dragStartedKeyboard: `已開始拖曳。按 Tab 鍵以瀏覽至放置目標，然後按 Enter 鍵以放置，或按 Escape 鍵以取消。`,
    dragStartedTouch: `已開始拖曳。瀏覽至放置目標，然後輕點兩下以放置。`,
    dragStartedVirtual: `已開始拖曳。瀏覽至放置目標，然後按一下滑鼠或按 Enter 鍵以放置。`,
    dropCanceled: `放置已取消。`,
    dropComplete: `放置已完成。`,
    dropDescriptionKeyboard: `按 Enter 鍵以放置。按 Escape 鍵以取消拖曳。`,
    dropDescriptionTouch: `輕點兩下以放置。`,
    dropDescriptionVirtual: `按一下滑鼠以放置。`,
    dropIndicator: `放置指示器`,
    dropOnItem: (args: Variables) => `放置在「${args?.["itemText"]}」上`,
    dropOnRoot: `放置在`,
    endDragKeyboard: `拖曳中。按 Enter 鍵以取消拖曳。`,
    endDragTouch: `拖曳中。輕點兩下以取消拖曳。`,
    endDragVirtual: `拖曳中。按一下滑鼠以取消拖曳。`,
    insertAfter: (args: Variables) => `插入至「${args?.["itemText"]}」之後`,
    insertBefore: (args: Variables) => `插入至「${args?.["itemText"]}」之前`,
    insertBetween: (args: Variables) =>
      `插入至「${args?.["beforeItemText"]}」和「${args?.["afterItemText"]}」之間`,
  },
};

/**
 * One assertion for the whole table, rather than a cast at each of the 136 plural messages: the
 * formatter a message receives is the real class, whose `plural` is protected, so no structural
 * type can describe both what the messages need and what the class exposes.
 */
export const dndStrings = strings as unknown as LocalizedStrings<DndStringKey, LocalizedString>;
