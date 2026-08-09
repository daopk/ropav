import type {LocalizedString, LocalizedStrings} from "@internationalized/string";

/** Every message key the date validation strings define. */
export type DateValidationStringKey =
  | "rangeUnderflow"
  | "rangeOverflow"
  | "rangeReversed"
  | "unavailableDate";

/**
 * The messages a date field reports when its value falls outside the allowed range, copied from
 * react-stately 3.49.0 (`packages/react-stately/intl/datepicker/*.json`).
 *
 * A separate table from the aria strings of the same name: these are validation messages meant to
 * sit beside the browser's own, which is why they are read in the *browser's* locale rather than
 * the one a provider chose.
 *
 * Messages arrive already compiled: a value is a plain string when it has no variables, and a
 * function of its arguments when it does, which is the `LocalizedString` shape
 * `LocalizedStringFormatter` expects. Generated — edit the source strings upstream, not here.
 */
export const dateValidationStrings: LocalizedStrings<DateValidationStringKey, LocalizedString> = {
  "ar-AE": {
    rangeOverflow: (args) => `يجب أن تكون القيمة ${args?.["maxValue"]} أو قبل ذلك.`,
    rangeReversed: `تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء.`,
    rangeUnderflow: (args) => `يجب أن تكون القيمة ${args?.["minValue"]} أو بعد ذلك.`,
    unavailableDate: `البيانات المحددة غير متاحة.`,
  },
  "bg-BG": {
    rangeOverflow: (args) => `Стойността трябва да е ${args?.["maxValue"]} или по-ранна.`,
    rangeReversed: `Началната дата трябва да е преди крайната.`,
    rangeUnderflow: (args) => `Стойността трябва да е ${args?.["minValue"]} или по-късно.`,
    unavailableDate: `Избраната дата не е налична.`,
  },
  "cs-CZ": {
    rangeOverflow: (args) => `Hodnota mus\xed b\xfdt ${args?.["maxValue"]} nebo dř\xedvějš\xed.`,
    rangeReversed: `Datum zah\xe1jen\xed mus\xed předch\xe1zet datu ukončen\xed.`,
    rangeUnderflow: (args) => `Hodnota mus\xed b\xfdt ${args?.["minValue"]} nebo pozdějš\xed.`,
    unavailableDate: `Vybran\xe9 datum nen\xed k dispozici.`,
  },
  "da-DK": {
    rangeOverflow: (args) => `V\xe6rdien skal v\xe6re ${args?.["maxValue"]} eller tidligere.`,
    rangeReversed: `Startdatoen skal v\xe6re f\xf8r slutdatoen.`,
    rangeUnderflow: (args) => `V\xe6rdien skal v\xe6re ${args?.["minValue"]} eller nyere.`,
    unavailableDate: `Den valgte dato er ikke tilg\xe6ngelig.`,
  },
  "de-DE": {
    rangeOverflow: (args) => `Der Wert muss ${args?.["maxValue"]} oder fr\xfcher sein.`,
    rangeReversed: `Das Startdatum muss vor dem Enddatum liegen.`,
    rangeUnderflow: (args) => `Der Wert muss ${args?.["minValue"]} oder sp\xe4ter sein.`,
    unavailableDate: `Das ausgew\xe4hlte Datum ist nicht verf\xfcgbar.`,
  },
  "el-GR": {
    rangeOverflow: (args) => `Η τιμή πρέπει να είναι ${args?.["maxValue"]} ή παλαιότερη.`,
    rangeReversed: `Η ημερομηνία έναρξης πρέπει να είναι πριν από την ημερομηνία λήξης.`,
    rangeUnderflow: (args) => `Η τιμή πρέπει να είναι ${args?.["minValue"]} ή μεταγενέστερη.`,
    unavailableDate: `Η επιλεγμένη ημερομηνία δεν είναι διαθέσιμη.`,
  },
  "en-US": {
    rangeOverflow: (args) => `Value must be ${args?.["maxValue"]} or earlier.`,
    rangeReversed: `Start date must be before end date.`,
    rangeUnderflow: (args) => `Value must be ${args?.["minValue"]} or later.`,
    unavailableDate: `Selected date unavailable.`,
  },
  "es-ES": {
    rangeOverflow: (args) => `El valor debe ser ${args?.["maxValue"]} o anterior.`,
    rangeReversed: `La fecha de inicio debe ser anterior a la fecha de finalizaci\xf3n.`,
    rangeUnderflow: (args) => `El valor debe ser ${args?.["minValue"]} o posterior.`,
    unavailableDate: `Fecha seleccionada no disponible.`,
  },
  "et-EE": {
    rangeOverflow: (args) => `V\xe4\xe4rtus peab olema ${args?.["maxValue"]} v\xf5i varasem.`,
    rangeReversed: `Alguskuup\xe4ev peab olema enne l\xf5ppkuup\xe4eva.`,
    rangeUnderflow: (args) => `V\xe4\xe4rtus peab olema ${args?.["minValue"]} v\xf5i hilisem.`,
    unavailableDate: `Valitud kuup\xe4ev pole saadaval.`,
  },
  "fi-FI": {
    rangeOverflow: (args) => `Arvon on oltava ${args?.["maxValue"]} tai sit\xe4 aikaisempi.`,
    rangeReversed: `Aloitusp\xe4iv\xe4n on oltava ennen lopetusp\xe4iv\xe4\xe4.`,
    rangeUnderflow: (args) =>
      `Arvon on oltava ${args?.["minValue"]} tai sit\xe4 my\xf6h\xe4isempi.`,
    unavailableDate: `Valittu p\xe4iv\xe4m\xe4\xe4r\xe4 ei ole k\xe4ytett\xe4viss\xe4.`,
  },
  "fr-FR": {
    rangeOverflow: (args) => `La valeur doit \xeatre ${args?.["maxValue"]} ou ant\xe9rieure.`,
    rangeReversed: `La date de d\xe9but doit \xeatre ant\xe9rieure \xe0 la date de fin.`,
    rangeUnderflow: (args) => `La valeur doit \xeatre ${args?.["minValue"]} ou ult\xe9rieure.`,
    unavailableDate: `La date s\xe9lectionn\xe9e n’est pas disponible.`,
  },
  "he-IL": {
    rangeOverflow: (args) => `הערך חייב להיות ${args?.["maxValue"]} או מוקדם יותר.`,
    rangeReversed: `תאריך ההתחלה חייב להיות לפני תאריך הסיום.`,
    rangeUnderflow: (args) => `הערך חייב להיות ${args?.["minValue"]} או מאוחר יותר.`,
    unavailableDate: `התאריך הנבחר אינו זמין.`,
  },
  "hr-HR": {
    rangeOverflow: (args) => `Vrijednost mora biti ${args?.["maxValue"]} ili ranije.`,
    rangeReversed: `Datum početka mora biti prije datuma završetka.`,
    rangeUnderflow: (args) => `Vrijednost mora biti ${args?.["minValue"]} ili kasnije.`,
    unavailableDate: `Odabrani datum nije dostupan.`,
  },
  "hu-HU": {
    rangeOverflow: (args) =>
      `Az \xe9rt\xe9knek ${args?.["maxValue"]} vagy kor\xe1bbinak kell lennie.`,
    rangeReversed: `A kezdő d\xe1tumnak a befejező d\xe1tumn\xe1l kor\xe1bbinak kell lennie.`,
    rangeUnderflow: (args) =>
      `Az \xe9rt\xe9knek ${args?.["minValue"]} vagy k\xe9sőbbinek kell lennie.`,
    unavailableDate: `A kiv\xe1lasztott d\xe1tum nem \xe9rhető el.`,
  },
  "it-IT": {
    rangeOverflow: (args) => `Il valore deve essere ${args?.["maxValue"]} o precedente.`,
    rangeReversed: `La data di inizio deve essere antecedente alla data di fine.`,
    rangeUnderflow: (args) => `Il valore deve essere ${args?.["minValue"]} o successivo.`,
    unavailableDate: `Data selezionata non disponibile.`,
  },
  "ja-JP": {
    rangeOverflow: (args) => `値は ${args?.["maxValue"]} 以下にする必要があります。`,
    rangeReversed: `開始日は終了日より前にする必要があります。`,
    rangeUnderflow: (args) => `値は ${args?.["minValue"]} 以上にする必要があります。`,
    unavailableDate: `選択した日付は使用できません。`,
  },
  "ko-KR": {
    rangeOverflow: (args) => `값은 ${args?.["maxValue"]} 이전이어야 합니다.`,
    rangeReversed: `시작일은 종료일 이전이어야 합니다.`,
    rangeUnderflow: (args) => `값은 ${args?.["minValue"]} 이후여야 합니다.`,
    unavailableDate: `선택한 날짜를 사용할 수 없습니다.`,
  },
  "lt-LT": {
    rangeOverflow: (args) => `Reikšmė turi būti ${args?.["maxValue"]} arba ankstesnė.`,
    rangeReversed: `Pradžios data turi būti ankstesnė nei pabaigos data.`,
    rangeUnderflow: (args) => `Reikšmė turi būti ${args?.["minValue"]} arba naujesnė.`,
    unavailableDate: `Pasirinkta data nepasiekiama.`,
  },
  "lv-LV": {
    rangeOverflow: (args) => `Vērtībai ir jābūt ${args?.["maxValue"]} vai agrākai.`,
    rangeReversed: `Sākuma datumam ir jābūt pirms beigu datuma.`,
    rangeUnderflow: (args) => `Vērtībai ir jābūt ${args?.["minValue"]} vai vēlākai.`,
    unavailableDate: `Atlasītais datums nav pieejams.`,
  },
  "nb-NO": {
    rangeOverflow: (args) => `Verdien m\xe5 v\xe6re ${args?.["maxValue"]} eller tidligere.`,
    rangeReversed: `Startdatoen m\xe5 v\xe6re f\xf8r sluttdatoen.`,
    rangeUnderflow: (args) => `Verdien m\xe5 v\xe6re ${args?.["minValue"]} eller senere.`,
    unavailableDate: `Valgt dato utilgjengelig.`,
  },
  "nl-NL": {
    rangeOverflow: (args) => `Waarde moet ${args?.["maxValue"]} of eerder zijn.`,
    rangeReversed: `De startdatum moet voor de einddatum liggen.`,
    rangeUnderflow: (args) => `Waarde moet ${args?.["minValue"]} of later zijn.`,
    unavailableDate: `Geselecteerde datum niet beschikbaar.`,
  },
  "pl-PL": {
    rangeOverflow: (args) => `Wartość musi mieć wartość ${args?.["maxValue"]} lub wcześniejszą.`,
    rangeReversed: `Data rozpoczęcia musi być wcześniejsza niż data zakończenia.`,
    rangeUnderflow: (args) => `Wartość musi mieć wartość ${args?.["minValue"]} lub p\xf3źniejszą.`,
    unavailableDate: `Wybrana data jest niedostępna.`,
  },
  "pt-BR": {
    rangeOverflow: (args) => `O valor deve ser ${args?.["maxValue"]} ou anterior.`,
    rangeReversed: `A data inicial deve ser anterior \xe0 data final.`,
    rangeUnderflow: (args) => `O valor deve ser ${args?.["minValue"]} ou posterior.`,
    unavailableDate: `Data selecionada indispon\xedvel.`,
  },
  "pt-PT": {
    rangeOverflow: (args) => `O valor tem de ser ${args?.["maxValue"]} ou anterior.`,
    rangeReversed: `A data de in\xedcio deve ser anterior \xe0 data de fim.`,
    rangeUnderflow: (args) => `O valor tem de ser ${args?.["minValue"]} ou posterior.`,
    unavailableDate: `Data selecionada indispon\xedvel.`,
  },
  "ro-RO": {
    rangeOverflow: (args) => `Valoarea trebuie să fie ${args?.["maxValue"]} sau anterioară.`,
    rangeReversed: `Data de \xeenceput trebuie să fie anterioară datei de sf\xe2rșit.`,
    rangeUnderflow: (args) => `Valoarea trebuie să fie ${args?.["minValue"]} sau ulterioară.`,
    unavailableDate: `Data selectată nu este disponibilă.`,
  },
  "ru-RU": {
    rangeOverflow: (args) => `Значение должно быть не позже ${args?.["maxValue"]}.`,
    rangeReversed: `Дата начала должна предшествовать дате окончания.`,
    rangeUnderflow: (args) => `Значение должно быть не раньше ${args?.["minValue"]}.`,
    unavailableDate: `Выбранная дата недоступна.`,
  },
  "sk-SK": {
    rangeOverflow: (args) => `Hodnota mus\xed byť ${args?.["maxValue"]} alebo skoršia.`,
    rangeReversed: `D\xe1tum začiatku mus\xed byť skorš\xed ako d\xe1tum konca.`,
    rangeUnderflow: (args) => `Hodnota mus\xed byť ${args?.["minValue"]} alebo neskoršia.`,
    unavailableDate: `Vybrat\xfd d\xe1tum je nedostupn\xfd.`,
  },
  "sl-SI": {
    rangeOverflow: (args) => `Vrednost mora biti ${args?.["maxValue"]} ali starejša.`,
    rangeReversed: `Začetni datum mora biti pred končnim datumom.`,
    rangeUnderflow: (args) => `Vrednost mora biti ${args?.["minValue"]} ali novejša.`,
    unavailableDate: `Izbrani datum ni na voljo.`,
  },
  "sr-SP": {
    rangeOverflow: (args) => `Vrednost mora da bude ${args?.["maxValue"]} ili starija.`,
    rangeReversed: `Datum početka mora biti pre datuma završetka.`,
    rangeUnderflow: (args) => `Vrednost mora da bude ${args?.["minValue"]} ili novija.`,
    unavailableDate: `Izabrani datum nije dostupan.`,
  },
  "sv-SE": {
    rangeOverflow: (args) => `V\xe4rdet m\xe5ste vara ${args?.["maxValue"]} eller tidigare.`,
    rangeReversed: `Startdatumet m\xe5ste vara f\xf6re slutdatumet.`,
    rangeUnderflow: (args) => `V\xe4rdet m\xe5ste vara ${args?.["minValue"]} eller senare.`,
    unavailableDate: `Det valda datumet \xe4r inte tillg\xe4ngligt.`,
  },
  "tr-TR": {
    rangeOverflow: (args) => `Değer, ${args?.["maxValue"]} veya \xf6ncesi olmalıdır.`,
    rangeReversed: `Başlangı\xe7 tarihi bitiş tarihinden \xf6nce olmalıdır.`,
    rangeUnderflow: (args) => `Değer, ${args?.["minValue"]} veya sonrası olmalıdır.`,
    unavailableDate: `Se\xe7ilen tarih kullanılamıyor.`,
  },
  "uk-UA": {
    rangeOverflow: (args) => `Значення має бути не пізніше ${args?.["maxValue"]}.`,
    rangeReversed: `Дата початку має передувати даті завершення.`,
    rangeUnderflow: (args) => `Значення має бути не раніше ${args?.["minValue"]}.`,
    unavailableDate: `Вибрана дата недоступна.`,
  },
  "zh-CN": {
    rangeOverflow: (args) => `值必须是 ${args?.["maxValue"]} 或更早日期。`,
    rangeReversed: `开始日期必须早于结束日期。`,
    rangeUnderflow: (args) => `值必须是 ${args?.["minValue"]} 或更晚日期。`,
    unavailableDate: `所选日期不可用。`,
  },
  "zh-TW": {
    rangeOverflow: (args) => `值必須是 ${args?.["maxValue"]} 或更早。`,
    rangeReversed: `開始日期必須在結束日期之前。`,
    rangeUnderflow: (args) => `值必須是 ${args?.["minValue"]} 或更晚。`,
    unavailableDate: `所選日期無法使用。`,
  },
};
