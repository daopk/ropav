import type { UsePasswordManagerBadgeReturn } from "@/composables/use-password-manager-badge";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import Host from "../fixtures/password-manager-badge-host.vue";

// The props object is handed over as it arrives rather than spread into a new one, so a reactive
// object passed in stays reactive and a test can move a prop after mounting.
const mount = (props: Record<string, unknown> = {}) => {
  let badge!: UsePasswordManagerBadgeReturn;

  props["onReady"] = (next: UsePasswordManagerBadgeReturn) => (badge = next);

  const result = renderVapor(Host, { props });

  return {
    ...result,
    badge: () => badge,
    host: () => result.container.querySelector<HTMLElement>("[data-testid='container']")!,
  };
};

/**
 * Makes the hit test answer honestly: the container is what the point belongs to, so nothing is
 * stacked on top of it and there is no badge.
 *
 * Needed because jsdom lays nothing out — its `elementFromPoint` always answers `null`, which the
 * engine reads as "something is covering the field". Left alone, every test here would find a
 * badge that is not there.
 */
const pretendNoBadge = (container: HTMLElement) =>
  vi.spyOn(document, "elementFromPoint").mockReturnValue(container);

/**
 * Stands in for a password manager that has injected its badge.
 *
 * The marker is the real one LastPass leaves behind, and it is the cheap half of the detection:
 * finding it means the hit test never runs.
 */
const plantBadgeMarker = () => {
  const marker = document.createElement("div");

  marker.setAttribute("data-lastpass-icon-root", "");
  document.body.appendChild(marker);

  return () => marker.remove();
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePasswordManagerBadge", () => {
  // The marker is what proves the badge here, not the hit test: that one is stubbed to answer
  // "nothing on top of the field", so a pass can only come from the marker being found.
  it("finds a badge by the marker its password manager left behind", () => {
    const removeMarker = plantBadgeMarker();
    const { badge, host, unmount } = mount({ isFocused: true });
    const spy = pretendNoBadge(host());

    expect(badge().hasPWMBadge.value).toBe(false);

    vi.advanceTimersByTime(1);

    expect(badge().hasPWMBadge.value).toBe(true);
    expect(badge().willPushPWMBadge.value).toBe(true);

    unmount();
    spy.mockRestore();
    removeMarker();
  });

  it("looks for nothing while the field is untouched", () => {
    const removeMarker = plantBadgeMarker();
    const { badge, unmount } = mount();

    vi.advanceTimersByTime(6000);

    expect(badge().hasPWMBadge.value).toBe(false);

    unmount();
    removeMarker();
  });

  it("keeps the control at its own width until a badge is actually found", () => {
    const { badge, host, unmount } = mount({ isFocused: true });
    const spy = pretendNoBadge(host());

    vi.advanceTimersByTime(1);

    expect(badge().willPushPWMBadge.value).toBe(false);

    unmount();
    spy.mockRestore();
  });

  it("stays out of the way entirely when told to", () => {
    const removeMarker = plantBadgeMarker();
    const { badge, unmount } = mount({ isFocused: true, pushPasswordManagerStrategy: "none" });

    vi.advanceTimersByTime(6000);

    expect(badge().hasPWMBadge.value).toBe(false);
    expect(badge().willPushPWMBadge.value).toBe(false);

    unmount();
    removeMarker();
  });

  // Latched on purpose: a badge that comes and goes would otherwise resize the control under
  // someone who is already typing into it.
  it("keeps its answer once it has one", () => {
    const removeMarker = plantBadgeMarker();
    const { badge, host, unmount } = mount({ isFocused: true });
    const spy = pretendNoBadge(host());

    vi.advanceTimersByTime(1);
    expect(badge().hasPWMBadge.value).toBe(true);

    removeMarker();
    vi.advanceTimersByTime(6000);

    expect(badge().hasPWMBadge.value).toBe(true);

    unmount();
    spy.mockRestore();
  });

  it("reads the container answering the hit test as no badge at all", () => {
    const { badge, host, unmount } = mount({ isFocused: true });
    const spy = pretendNoBadge(host());

    vi.advanceTimersByTime(5000);

    expect(badge().hasPWMBadge.value).toBe(false);
    expect(badge().willPushPWMBadge.value).toBe(false);

    unmount();
    spy.mockRestore();
  });

  /**
   * Giving up is about the searching, not about the answer: once the field has been looked at for
   * six seconds it is never looked at again, however often focus comes and goes. Counted through
   * the hit test, because that is the expensive half — it forces layout on every call.
   */
  it("stops searching once it has given up", async () => {
    const props = reactive<Record<string, unknown>>({ isFocused: true });
    const { host, unmount } = mount(props);
    const spy = pretendNoBadge(host());

    vi.advanceTimersByTime(6000);

    const searches = spy.mock.calls.length;

    expect(searches).toBeGreaterThan(0);

    props["isFocused"] = false;
    await nextTick();
    props["isFocused"] = true;
    await nextTick();
    vi.advanceTimersByTime(6000);

    expect(spy.mock.calls).toHaveLength(searches);

    unmount();
    spy.mockRestore();
  });

  it("hands out the room a badge needs as a CSS length", () => {
    const { badge, unmount } = mount();

    expect(badge().PWM_BADGE_SPACE_WIDTH).toBe("40px");

    unmount();
  });
});
