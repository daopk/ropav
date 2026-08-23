import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { isAppleDevice } from "@/utils/platform";

import { pressRealReset } from "../../harness/real-reset";

import Fixture from "./fixtures.vue";

/**
 * What only a real browser can answer for a combo box.
 *
 * All of it comes back to one thing: **a real press moves focus, and a synthetic one does not.** The
 * caret has to stay in the field for the whole of every gesture — the field is the widget, and the
 * popover beside it is non-modal, so nothing pulls focus back if it leaves. A jsdom suite dispatches
 * events that never move focus at all, so it agrees whether the guards are there or not. Three real
 * bugs lived in exactly that gap and are pinned here.
 *
 * The rest is what needs a document with layout and a running clock: `--trigger-width` measured off
 * the group, the exit animation, and the ring that only a keyboard should paint.
 */
const POINTER = {
  bubbles: true,
  button: 0,
  composed: true,
  height: 1,
  isPrimary: true,
  pointerId: 1,
  pointerType: "mouse",
  width: 1,
} as const;

/** A press, which is what opens a picker — a bare click is not one. */
const press = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerdown", POINTER));
  element.dispatchEvent(new PointerEvent("pointerup", POINTER));
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, detail: 1 }));
};

/** Wait for the entry animation to finish, so the popover is measured at its settled size. */
const settled = async (popover: HTMLElement) => {
  await Promise.allSettled(popover.getAnimations().map((animation) => animation.finished));
  await nextTick();
};

const cleanups: Array<() => void> = [];

afterEach(async () => {
  while (cleanups.length > 0) cleanups.pop()?.();
  await nextTick();

  // The overlay writes these outside its own container, so a leftover would surface in an unrelated
  // test rather than this one.
  document.querySelectorAll("[inert]").forEach((element) => element.removeAttribute("inert"));
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("padding-right");
});

const mount = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });

  cleanups.push(result.unmount);

  return result;
};

const popoverOf = () => document.body.querySelector<HTMLElement>('[data-slot="combo-box-popover"]');

const groupOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="combo-box-input-group"]')!;

const triggerOf = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>('[data-slot="combo-box-trigger"]')!;

const inputOf = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('[data-slot="input"]')!;

const listBoxOf = () => document.body.querySelector<HTMLElement>('[role="listbox"]')!;

const optionsOf = () => [...document.body.querySelectorAll<HTMLElement>('[role="option"]')];

const open = async (container: HTMLElement) => {
  press(triggerOf(container));
  await nextTick();
  await nextTick();

  const popover = popoverOf()!;

  await settled(popover);

  return popover;
};

/** A real press, which is the only kind that moves focus. */
const realPress = async (element: Element) => {
  await userEvent.click(element);
  await nextTick();
  await nextTick();
};

/**
 * Whether the press that lands on `target` is stopped from moving focus.
 *
 * The *only* honest signal for these three, and the reason is worth stating: focus leaving is
 * transient. The overlay restores focus to the field as it closes, so by the time any assertion
 * runs the active element is right again whether the guard was there or not — measured, and all
 * three guards could be deleted with every `document.activeElement` assertion still green. What
 * cannot be undone is the press having been claimed, so that is what is watched.
 */
const pressIsClaimed = async (
  element: Element,
  options: { position?: { x: number; y: number } } = {},
) => {
  let claimed: boolean | null = null;
  const onMousedown = (event: Event) => {
    if (claimed === null) claimed = event.defaultPrevented;
  };

  document.addEventListener("mousedown", onMousedown);

  try {
    await userEvent.click(element, options);
    await nextTick();
    await nextTick();
  } finally {
    document.removeEventListener("mousedown", onMousedown);
  }

  return claimed;
};

describe("ComboBox (browser)", () => {
  describe("the caret never leaves the field", () => {
    it("keeps it there when the chevron is really pressed", async () => {
      const result = mount();

      await nextTick();

      // The chevron never takes focus either, which is what makes it not a tab stop.
      expect(await pressIsClaimed(triggerOf(result.container))).toBe(true);
      expect(popoverOf()).not.toBeNull();
      expect(document.activeElement).toBe(inputOf(result.container));
    });

    it("keeps it there when an option is really pressed", async () => {
      const result = mount();

      await nextTick();
      await open(result.container);

      const input = inputOf(result.container);

      input.focus();
      await nextTick();

      /*
       * The bug this pins: without the guard the browser focuses what was pressed, focus lands on
       * the body, and the field reads that as the user leaving — so its ring drops and it commits
       * mid-press. It looks like the popover flickering on the way out. A synthetic press moves no
       * focus at all, so no jsdom test can tell the two apart.
       */
      expect(await pressIsClaimed(optionsOf()[1]!)).toBe(true);
      expect(input.value).toBe("Dog");
      expect(document.activeElement).toBe(input);
    });

    it("keeps it there when the listbox itself is really pressed", async () => {
      const result = mount();

      await nextTick();

      const popover = await open(result.container);
      const input = inputOf(result.container);

      input.focus();
      await nextTick();

      const listBox = listBoxOf();
      const box = listBox.getBoundingClientRect();

      // The listbox's own padding, which is the gap between two options — a press that chose
      // nothing must leave everything exactly as it was.
      const claimed = await pressIsClaimed(listBox, {
        position: { x: 2, y: Math.round(box.height / 2) },
      });

      expect(claimed).toBe(true);
      expect(document.activeElement).toBe(input);
      // Nothing was chosen, so nothing may have moved — least of all the popover.
      expect(popoverOf()).toBe(popover);
      expect(popover.dataset["exiting"]).toBeUndefined();
      expect(optionsOf()).toHaveLength(3);
    });
  });

  describe("the ring", () => {
    it("paints one on the option the arrows reached", async () => {
      const result = mount();

      await nextTick();
      await open(result.container);

      inputOf(result.container).focus();
      await nextTick();

      const ringed = () =>
        optionsOf().filter((o) => o.getAttribute("data-focus-visible") === "true");

      // The popover already lands on an option as it opens, exactly as the React build does, so
      // this is asserted as a *move* rather than against a fixed index.
      const before = ringed()[0]?.dataset["key"];

      await userEvent.keyboard("{ArrowDown}");
      await nextTick();

      const after = ringed();

      expect(after).toHaveLength(1);
      expect(after[0]!.dataset["key"]).not.toBe(before);
      expect(after[0]).toHaveAttribute("data-focused", "true");
      // Nominal throughout: nothing inside the listbox is ever the active element.
      expect(document.activeElement).toBe(inputOf(result.container));
      expect(inputOf(result.container)).toHaveAttribute("aria-activedescendant", after[0]!.id);
    });

    it("paints none on an option the pointer merely passed over", async () => {
      const result = mount();

      await nextTick();
      await open(result.container);

      const option = optionsOf()[1]!;

      await userEvent.hover(option);
      await nextTick();

      /*
       * Hovering moves the focused key — the pointer and the keyboard drive the same highlight in a
       * picker — but a ring is a keyboard affordance and the pointer never asked for one. Measured
       * against the React build, which carries `data-focused` and a background here and no ring.
       */
      expect(option).toHaveAttribute("data-hovered", "true");
      expect(option).toHaveAttribute("data-focused", "true");
      expect(option).not.toHaveAttribute("data-focus-visible");
    });
  });

  describe("geometry", () => {
    it("measures the popover against the whole field, not the chevron", async () => {
      const result = mount();

      await nextTick();

      const popover = await open(result.container);
      const group = groupOf(result.container);

      expect(popover.style.getPropertyValue("--trigger-width")).toBe(`${group.offsetWidth}px`);
      // The chevron is a fraction of the field, and a popover lined up with it would be too.
      expect(group.offsetWidth).toBeGreaterThan(triggerOf(result.container).offsetWidth);
    });

    it("reserves room for the chevron beside the text", async () => {
      const result = mount();

      await nextTick();

      // Comes from `[data-slot="input"]:has(+ .combo-box__trigger)`, so it only holds while the
      // chevron is the field's immediate next sibling.
      expect(getComputedStyle(inputOf(result.container)).paddingInlineEnd).toBe("28px");
    });

    it("turns the chevron over while the popover is showing", async () => {
      const result = mount();

      await nextTick();

      const popover = await open(result.container);
      const icon = result.container.querySelector<HTMLElement>(
        '[data-slot="combo-box-trigger-default-icon"]',
      )!;

      await Promise.allSettled(icon.getAnimations().map((animation) => animation.finished));

      expect(popover).not.toBeNull();
      expect(getComputedStyle(icon).rotate).toBe("180deg");
    });
  });

  describe("the way out", () => {
    it("keeps the options it was showing while it closes", async () => {
      const result = mount();

      await nextTick();
      await open(result.container);

      const input = inputOf(result.container);

      input.focus();
      await userEvent.type(input, "pa");
      await nextTick();
      await nextTick();

      expect([input.value, ...optionsOf().map((o) => o.textContent?.trim())]).toEqual([
        "pa",
        "Panda",
      ]);

      await userEvent.keyboard("{Escape}");
      await nextTick();
      await nextTick();

      /*
       * Escape empties the field, and an empty filter matches everything — so the list the state
       * holds and the list that was on screen have just parted ways. The frozen copy is what keeps
       * the one option that was there from becoming three as it fades. Asserting the *stale* list on
       * purpose: this is the one place where showing current data would be the bug.
       */
      expect([input.value, ...optionsOf().map((o) => o.textContent?.trim())]).toEqual([
        "",
        "Panda",
      ]);
    });
  });

  describe("what it announces", () => {
    /**
     * Every message written to the live region, in order.
     *
     * A snapshot of the region is not enough: several of these fire off one keystroke and each
     * overwrites the last, so reading it once only ever sees whichever landed most recently — and
     * which that is depends on the platform. Recording them all makes the assertions stable
     * wherever the suite runs.
     */
    const recordAnnouncements = () => {
      const messages: string[] = [];
      const region = document.body.querySelector(
        '[data-slot="live-announcer"][data-politeness="assertive"]',
      );
      const observer = new MutationObserver(() => {
        const text = region?.textContent?.trim();

        if (text && messages.at(-1) !== text) messages.push(text);
      });

      if (region) observer.observe(region, { characterData: true, childList: true, subtree: true });
      cleanups.push(() => observer.disconnect());

      return messages;
    };

    it("says how many options are left as the list narrows", async () => {
      const result = mount();

      await nextTick();
      await open(result.container);

      const input = inputOf(result.container);

      input.focus();
      await nextTick();

      const messages = recordAnnouncements();

      await userEvent.type(input, "a");
      await nextTick();
      await nextTick();
      await userEvent.type(input, "t");
      await nextTick();
      await nextTick();

      /*
       * The one announcement that is **not** gated on the platform, and the gate upstream is
       * narrower than it first looks: `isAppleDevice()` there only widens the "opened with nothing
       * focused" branch, while a change in the *count* is announced everywhere — no screen reader
       * reads that of its own accord. Singular and plural both, which is what the locale's plural
       * rule is here to get right.
       */
      expect(messages).toContain("2 options available.");
      expect(messages).toContain("1 option available.");
    });

    it("reads the focused option out where the platform needs it", async () => {
      const result = mount();

      await nextTick();
      await open(result.container);

      inputOf(result.container).focus();
      await nextTick();

      const messages = recordAnnouncements();

      await userEvent.keyboard("{ArrowDown}");
      await nextTick();
      await nextTick();

      /*
       * Gated on the platform in the source, so the assertion is gated the same way rather than
       * skipped: VoiceOver does not reliably announce a change of `aria-activedescendant`, and every
       * other screen reader does — announcing twice is worse than not at all. This machine runs the
       * suite in Chromium *on macOS*, where it does fire; a Linux runner takes the other branch, and
       * then the claim is that nothing is said.
       */
      const named = messages.filter((message) => /^(Cat|Dog|Panda)$/.test(message));

      if (isAppleDevice()) expect(named.length).toBeGreaterThan(0);
      else expect(named).toEqual([]);
    });

    it("says what was chosen where the platform needs it", async () => {
      const result = mount();

      await nextTick();
      await open(result.container);

      inputOf(result.container).focus();
      await nextTick();

      const messages = recordAnnouncements();

      await userEvent.click(optionsOf()[1]!);
      await nextTick();
      await nextTick();

      // Gated the same way, and for the same reason: other screen readers report a selection change
      // on their own. Recorded rather than snapshotted because choosing moves the count and the
      // focused option too, and each of those overwrites the region in turn.
      if (isAppleDevice()) expect(messages).toContain("Dog, selected");
      else expect(messages).not.toContain("Dog, selected");
    });
  });

  describe("a form", () => {
    it("puts both halves back when a real reset button is pressed", async () => {
      const result = mount({ defaultValue: "cat", name: "animal", withForm: true });

      await nextTick();
      await open(result.container);
      await realPress(optionsOf()[1]!);

      expect(inputOf(result.container).value).toBe("Dog");

      /*
       * A real reset, which is the only ordering that can break: the browser drains microtasks
       * between dispatching `reset` and restoring the controls, so a mirror written afterwards lands
       * too late. A reset called from script leaves the write after the restore and passes either
       * way.
       */
      await pressRealReset(result.container);

      expect(inputOf(result.container).value).toBe("Cat");
      expect(result.container.querySelector<HTMLInputElement>('input[type="hidden"]')!.value).toBe(
        "cat",
      );
    });
  });

  describe("accessibility", () => {
    it("has no violations while shut", async () => {
      const result = mount({ withDescription: true, withLabel: true });

      await nextTick();

      await expectNoA11yViolations(result.container);
    });

    it("has no violations while showing its options", async () => {
      const result = mount({ withLabel: true });

      await nextTick();

      const popover = await open(result.container);

      await expectNoA11yViolations(popover);
    });
  });
});
