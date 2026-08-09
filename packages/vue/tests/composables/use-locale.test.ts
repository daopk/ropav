import type {Locale} from "@/utils/locale";
import type {ComputedRef} from "vue";

import {renderVapor} from "@heroui/testing/helpers/vue";
import {afterEach, describe, expect, it, vi} from "vitest";
import {effectScope, nextTick, reactive} from "vue";

import {useDefaultLocale} from "@/composables/use-locale";

import Harness from "../fixtures/locale-harness.vue";

/** Run a composable in a disposable scope, mirroring a component lifetime. */
const scoped = <T>(run: () => T) => {
  const scope = effectScope();

  return {dispose: () => scope.stop(), value: scope.run(run)!};
};

/**
 * Point the browser's locale somewhere for the rest of the test.
 *
 * `navigator.language` is read-only, and the shared browser locale is module state read once at
 * import, so the event that refreshes it has to be dispatched too.
 */
const stubLanguage = (language: string) => {
  vi.spyOn(navigator, "language", "get").mockReturnValue(language);
  window.dispatchEvent(new Event("languagechange"));
};

/**
 * Put the shared browser locale back to the real one.
 *
 * It outlives every component, so a case that left it pointing elsewhere would make the next one
 * read as a bug in whatever it happens to be testing.
 */
const restoreLanguage = () => {
  vi.restoreAllMocks();

  // Dispatched while a consumer is attached, because with none there is no listener and the reset
  // would silently do nothing — leaving the next case to pass or fail on what this one left.
  const consumer = scoped(() => useDefaultLocale());

  window.dispatchEvent(new Event("languagechange"));
  consumer.dispose();
};

/**
 * Mount the harness and hand back the locale the host consumed.
 *
 * `props` is passed by reference rather than spread: `renderVapor` reads each key through a
 * getter, so a `reactive` object handed in here keeps driving the component.
 */
const setup = (props: Record<string, unknown> = {}) => {
  let locale!: ComputedRef<Locale>;

  Object.assign(props, {onReady: (value: ComputedRef<Locale>) => (locale = value)});

  return {...renderVapor(Harness, {props}), locale: () => locale};
};

describe("useDefaultLocale", () => {
  afterEach(() => {
    restoreLanguage();
  });

  it("reports the browser's locale", () => {
    const {dispose, value} = scoped(() => useDefaultLocale());

    expect(value.value).toEqual({direction: "ltr", locale: navigator.language});
    dispose();
  });

  it("follows the browser's locale changing", async () => {
    const {dispose, value} = scoped(() => useDefaultLocale());

    stubLanguage("ar-AE");
    await nextTick();

    expect(value.value).toEqual({direction: "rtl", locale: "ar-AE"});
    dispose();
  });

  it("catches up on a language changed while nothing was listening", () => {
    // Establish a known starting point while a consumer is attached, so what this asserts cannot
    // be satisfied by shared state an earlier case happened to leave behind.
    const first = scoped(() => useDefaultLocale());

    stubLanguage("en-US");
    expect(first.value.value.locale).toBe("en-US");
    first.dispose();

    // No consumer means no listener, so this event reaches nobody.
    stubLanguage("he-IL");

    const second = scoped(() => useDefaultLocale());

    // React Aria reads its module-level value here and would still say `en-US`.
    expect(second.value.value).toEqual({direction: "rtl", locale: "he-IL"});
    second.dispose();
  });

  it("stops listening once every consumer is gone", async () => {
    const first = scoped(() => useDefaultLocale());
    const second = scoped(() => useDefaultLocale());

    // One listener serves every consumer, so releasing the first must not take it away.
    first.dispose();
    stubLanguage("he-IL");
    await nextTick();
    expect(second.value.value.locale).toBe("he-IL");

    second.dispose();
    stubLanguage("fa-IR");
    await nextTick();
    expect(second.value.value.locale).toBe("he-IL");
  });
});

describe("useLocale", () => {
  afterEach(() => {
    restoreLanguage();
  });

  it("reads the locale an ancestor chose", () => {
    const {locale, unmount} = setup({locale: "he-IL"});

    expect(locale().value).toEqual({direction: "rtl", locale: "he-IL"});
    unmount();
  });

  it("falls back to the browser when nothing above has chosen", () => {
    stubLanguage("ar-AE");
    const {locale, unmount} = setup({withProvider: false});

    expect(locale().value).toEqual({direction: "rtl", locale: "ar-AE"});
    unmount();
  });

  it("keeps a unicode extension on the resolved tag", () => {
    // The calendar system rides on the tag, so dropping the extension would silently put an
    // Indian-calendar consumer back on the Gregorian one.
    const {locale, unmount} = setup({locale: "hi-IN-u-ca-indian"});

    expect(locale().value).toEqual({direction: "ltr", locale: "hi-IN-u-ca-indian"});
    unmount();
  });

  it("follows the chosen tag changing", async () => {
    const props = reactive({locale: "en-US"});
    const {locale, unmount} = setup(props);

    expect(locale().value.direction).toBe("ltr");

    props.locale = "ar-AE";
    await nextTick();

    expect(locale().value).toEqual({direction: "rtl", locale: "ar-AE"});
    unmount();
  });

  it("hands the decision back to the browser for no tag", () => {
    // A provider binding a value that is not chosen yet must not pin the tree to a wrong language.
    stubLanguage("he-IL");
    const {locale, unmount} = setup({locale: null});

    expect(locale().value).toEqual({direction: "rtl", locale: "he-IL"});
    unmount();
  });
});
