import {renderInterop} from "@ropav/testing/helpers/vue";
import {describe, expect, it} from "vitest";
import {defineComponent, h} from "vue";

import {I18nProvider} from "@/components/i18n-provider";
import {useLocale} from "@/composables/use-locale";

/**
 * The provider mounted the way a consumer mounts it: from a VDOM host, with the content written in
 * the host and forwarded through the provider's slot.
 *
 * The Vapor suite cannot fail on this. Content written in Vapor resolves `inject` against the
 * component that renders it, so a `provide` made anywhere above is found; content written in a
 * VDOM host resolves against the host. A provider whose whole job is `provide` has to be checked
 * through the path every real application uses.
 */
const Reader = defineComponent({
  name: "LocaleReader",
  setup: () => {
    const locale = useLocale();

    return () =>
      h("span", {"data-direction": locale.value.direction, "data-slot": "reader"}, [
        locale.value.locale,
      ]);
  },
});

const render = (locale?: string) =>
  renderInterop(I18nProvider, {
    props: {locale},
    slots: {default: () => h(Reader)},
  });

const reader = () => document.body.querySelector("[data-slot='reader']");

describe("I18nProvider (interop)", () => {
  it("reaches content written in a VDOM host", () => {
    const {unmount} = render("de-DE");

    expect(reader()?.textContent).toBe("de-DE");
    unmount();
  });

  it("reaches that content with the resolved direction too", () => {
    const {unmount} = render("ar-AE");

    expect(reader()?.getAttribute("data-direction")).toBe("rtl");
    unmount();
  });

  it("leaves the browser's locale in force for host content when given none", () => {
    const {unmount} = render();

    expect(reader()?.textContent).toBe(navigator.language);
    unmount();
  });
});
