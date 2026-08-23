import {expectNoA11yViolations} from "@ropav/testing/helpers/a11y";
import {renderVapor} from "@ropav/testing/helpers/vue";
import {afterEach, describe, expect, it} from "vitest";
import {userEvent} from "vitest/browser";
import {nextTick} from "vue";

import {pressRealReset} from "../../harness/real-reset";

import Fixture from "./fixtures.vue";
import VirtualizedFixture from "./virtualized-fixtures.vue";

/**
 * What only a real browser can answer for an autocomplete.
 *
 * Virtual focus is the first half, and it is the one thing this component cannot be trusted about
 * anywhere else: a jsdom suite can watch the focused key move and still be watching real focus move
 * with it, so both halves have to be asserted against a document that actually has an active
 * element. The second half is geometry — `--trigger-width` measured off the group rather than off
 * the chevron, and a windowed collection whose visible rect only exists where layout does.
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
  element.dispatchEvent(new MouseEvent("click", {bubbles: true, button: 0, detail: 1}));
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

  // The overlay writes these outside its own container, so a leftover would surface in an
  // unrelated test rather than this one.
  document.querySelectorAll("[inert]").forEach((element) => element.removeAttribute("inert"));
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("padding-right");
});

const mount = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, {props});

  cleanups.push(result.unmount);

  return result;
};

const popoverOf = () =>
  document.body.querySelector<HTMLElement>('[data-slot="autocomplete-popover"]');

const groupOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="autocomplete-trigger"]')!;

const buttonOf = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>('button[aria-haspopup="listbox"]')!;

const optionsOf = () => [...document.body.querySelectorAll<HTMLElement>('[role="option"]')];

const inputOf = () => document.body.querySelector<HTMLInputElement>('input[type="search"]')!;

const open = async (container: HTMLElement) => {
  press(buttonOf(container));
  await nextTick();
  await nextTick();

  const popover = popoverOf()!;

  await settled(popover);

  return popover;
};

describe("Autocomplete (browser)", () => {
  describe("virtual focus", () => {
    it("puts the caret in the search field, not in the options", async () => {
      const result = mount();

      await nextTick();
      await open(result.container);

      expect(document.activeElement).toBe(inputOf());
    });

    it("names the option the arrows reached without focusing it", async () => {
      const result = mount();

      await nextTick();

      const popover = await open(result.container);
      const listbox = popover.querySelector('[role="listbox"]')!;

      await userEvent.keyboard("{ArrowDown}");
      await nextTick();

      const [first] = optionsOf();

      expect(inputOf().getAttribute("aria-activedescendant")).toBe(`${listbox.id}-option-cat`);
      expect(first!.id).toBe(`${listbox.id}-option-cat`);
      expect(first).toHaveAttribute("data-focused", "true");
      /*
       * The caret is asserted alongside because the popover has focus management of its own, and
       * it is the half that would take the field's focus away: measured by asking the listbox to
       * focus an end when it appears, which turns this and four more red. What keeps the *option*
       * itself from taking focus is that it is not focusable at all, which the tab-order test
       * below is the assertion for.
       */
      expect(document.activeElement).toBe(inputOf());
    });

    it("leaves every option out of the tab order", async () => {
      const result = mount();

      await nextTick();

      const popover = await open(result.container);

      await userEvent.keyboard("{ArrowDown}");
      await nextTick();

      expect(popover.querySelector('[role="listbox"]')).not.toHaveAttribute("tabindex");
      optionsOf().forEach((option) => expect(option).not.toHaveAttribute("tabindex"));
    });

    it("steps down the options and back up", async () => {
      const result = mount();

      await nextTick();

      const popover = await open(result.container);
      const listbox = popover.querySelector('[role="listbox"]')!;

      await userEvent.keyboard("{ArrowDown}{ArrowDown}");
      await nextTick();

      expect(inputOf().getAttribute("aria-activedescendant")).toBe(`${listbox.id}-option-dog`);

      await userEvent.keyboard("{ArrowUp}");
      await nextTick();

      expect(inputOf().getAttribute("aria-activedescendant")).toBe(`${listbox.id}-option-cat`);
      expect(document.activeElement).toBe(inputOf());
    });

    it("chooses the named option on Enter", async () => {
      const result = mount();

      await nextTick();
      await open(result.container);

      await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
      await nextTick();
      await nextTick();

      expect(result.container.querySelector('[data-slot="autocomplete-value"]')).toHaveTextContent(
        "Dog",
      );
    });

    it("moves the ring onto the first match as text is typed", async () => {
      const result = mount();

      await nextTick();

      const popover = await open(result.container);
      const listbox = popover.querySelector('[role="listbox"]')!;

      await userEvent.keyboard("ph");
      await nextTick();
      await nextTick();

      expect(optionsOf().map((option) => option.textContent!.trim())).toEqual(["Elephant"]);
      expect(inputOf().getAttribute("aria-activedescendant")).toBe(`${listbox.id}-option-elephant`);
      expect(document.activeElement).toBe(inputOf());
    });

    it("stops naming an option once the text is edited backwards", async () => {
      const result = mount();

      await nextTick();
      await open(result.container);

      await userEvent.keyboard("ca");
      await nextTick();

      expect(inputOf().getAttribute("aria-activedescendant")).toBeTruthy();

      await userEvent.keyboard("{Backspace}");
      await nextTick();
      await nextTick();

      expect(inputOf().getAttribute("aria-activedescendant")).toBeNull();
    });

    it("closes on Escape once the text is empty", async () => {
      const result = mount();

      await nextTick();

      const popover = await open(result.container);

      // The first Escape belongs to the search field, which clears the text — the same order the
      // React build has, because both build the field out of the same behaviour.
      await userEvent.keyboard("ca");
      await nextTick();
      await userEvent.keyboard("{Escape}");
      await nextTick();

      expect(inputOf().value).toBe("");

      await userEvent.keyboard("{Escape}");
      await nextTick();
      await Promise.allSettled(popover.getAnimations().map((animation) => animation.finished));
      await nextTick();
      await nextTick();

      expect(popoverOf()).toBeNull();
    });
  });

  describe("geometry", () => {
    it("measures the popover against the whole field, not the chevron", async () => {
      const result = mount();

      await nextTick();

      const group = groupOf(result.container);
      const button = buttonOf(result.container);
      const popover = await open(result.container);

      // The chevron is the accessible trigger, so anchoring to it is the mistake that looks
      // right — and it is a fraction of the field's width, which is what makes it measurable.
      expect(button.offsetWidth).toBeLessThan(group.offsetWidth);
      expect(popover.style.getPropertyValue("--trigger-width")).toBe(`${group.offsetWidth}px`);
      expect(Math.round(popover.getBoundingClientRect().width)).toBe(group.offsetWidth);
    });

    it("puts the popover below the field", async () => {
      const result = mount();

      await nextTick();

      const group = groupOf(result.container).getBoundingClientRect();
      const popover = await open(result.container);

      expect(popover).toHaveAttribute("data-placement", "bottom");
      expect(popover.getBoundingClientRect().top).toBeGreaterThanOrEqual(group.bottom - 1);
    });

    it("makes room in the field for the chevron", async () => {
      const result = mount();

      await nextTick();

      // `.autocomplete__trigger:has(.autocomplete__indicator)` — a `:has()` rule jsdom never
      // applies, so the padding it adds can only be shown here.
      expect(getComputedStyle(groupOf(result.container)).paddingInlineEnd).toBe("28px");
    });

    it("turns the chevron over while the popover is open", async () => {
      const result = mount();

      await nextTick();
      await open(result.container);

      const indicator = result.container.querySelector<HTMLElement>(
        '[data-slot="autocomplete-default-indicator"]',
      )!;

      expect(indicator).toHaveAttribute("data-open", "true");
      expect(getComputedStyle(indicator).rotate).toBe("180deg");
    });

    it("fades the clear button out with nothing to clear, and in with something", async () => {
      const result = mount({selectionMode: "multiple", withClearButton: true});

      await nextTick();

      const clear = result.container.querySelector<HTMLElement>(
        '[data-slot="autocomplete-clear-button"]',
      )!;

      expect(getComputedStyle(clear).opacity).toBe("0");
      expect(getComputedStyle(clear).pointerEvents).toBe("none");
      // No transition while it is out, so clearing makes it vanish rather than dissolve.
      expect(getComputedStyle(clear).transitionDuration).toBe("0s");

      await open(result.container);
      optionsOf()[0]!.click();
      await nextTick();
      await nextTick();
      await Promise.allSettled(clear.getAnimations().map((animation) => animation.finished));

      expect(getComputedStyle(clear).opacity).toBe("1");
      expect(getComputedStyle(clear).pointerEvents).toBe("auto");
    });
  });

  describe("a windowed collection", () => {
    const mountVirtualized = async (props: Record<string, unknown> = {}) => {
      const result = renderVapor(VirtualizedFixture, {props});

      cleanups.push(result.unmount);
      await nextTick();

      const popover = await open(result.container);

      return {...result, listbox: popover.querySelector<HTMLElement>('[role="listbox"]')!, popover};
    };

    it("keeps only a screenful of a thousand options in the DOM", async () => {
      const {listbox} = await mountVirtualized();
      const options = optionsOf();

      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(40);
      // The set the options belong to is stated, because most of it is absent.
      expect(options[0]).toHaveAttribute("aria-setsize", "1000");
      expect(options[0]).toHaveAttribute("aria-posinset", "1");
      expect(listbox.scrollHeight).toBeGreaterThan(40000);
    });

    it("brings further options in as it scrolls", async () => {
      const {listbox} = await mountVirtualized();
      const before = optionsOf().map((option) => option.textContent!.trim());

      listbox.scrollTop = 5000;
      listbox.dispatchEvent(new Event("scroll", {bubbles: true}));
      await nextTick();
      await nextTick();

      const after = optionsOf().map((option) => option.textContent!.trim());

      expect(after[0]).not.toBe(before[0]);
      expect(after.some((text) => before.includes(text))).toBe(false);
    });

    it("gives a windowed option the full width of the list", async () => {
      const {listbox} = await mountVirtualized();
      const wrapped = [
        ...listbox.querySelectorAll<HTMLElement>(
          '[role="presentation"] > [data-slot="list-box-item"]',
        ),
      ];

      // Each option sits in an absolutely positioned wrapper, which is the branch that needs a
      // width rule of its own — without it every option collapses to its text.
      expect(wrapped.length).toBeGreaterThan(0);
      expect(wrapped[0]!.offsetWidth).toBeGreaterThan(listbox.clientWidth / 2);
    });

    it("pages through the window by the layout's own geometry", async () => {
      const {listbox} = await mountVirtualized();

      await userEvent.keyboard("{ArrowDown}");
      await nextTick();

      expect(inputOf().getAttribute("aria-activedescendant")).toBe(`${listbox.id}-option-1`);

      await userEvent.keyboard("{PageDown}");
      await nextTick();
      await nextTick();

      const named = inputOf().getAttribute("aria-activedescendant")!;
      const paged = Number(named.slice(`${listbox.id}-option-`.length));

      // Not the end of the list, which is what paging falls back to when the geometry is not
      // there to ask — a thousand options make the difference impossible to miss.
      expect(paged).toBeGreaterThan(1);
      expect(paged).toBeLessThan(1000);
      expect(document.activeElement).toBe(inputOf());
    });

    it("narrows a windowed collection from the search field", async () => {
      await mountVirtualized();

      await userEvent.keyboard("User 42");
      await nextTick();
      await nextTick();

      const texts = optionsOf().map((option) => option.textContent!.trim());

      expect(texts.length).toBeGreaterThan(0);
      expect(texts.every((text) => text.startsWith("User 42"))).toBe(true);
    });
  });

  describe("a form", () => {
    it("restores the chosen option when a real reset button is pressed", async () => {
      const result = mount({defaultValue: "dog", name: "animal", withForm: true});

      await nextTick();
      await open(result.container);
      optionsOf()[2]!.click();
      await nextTick();
      await nextTick();

      const control = result.container.querySelector<HTMLSelectElement>("select")!;

      expect(control.value).toBe("elephant");

      await pressRealReset(result.container);
      await nextTick();
      await nextTick();

      // Only a real browser drains microtasks between dispatching `reset` and restoring the
      // controls, which is the ordering a mirrored write would otherwise cover up.
      expect(control.value).toBe("dog");
      expect(result.container.querySelector('[data-slot="autocomplete-value"]')).toHaveTextContent(
        "Dog",
      );
    });
  });

  describe("accessibility", () => {
    it("has no violations while closed", async () => {
      const result = mount({withClearButton: true, withLabel: true});

      await nextTick();

      await expectNoA11yViolations(result.container);
    });

    it("has no violations while open", async () => {
      const result = mount({withClearButton: true, withLabel: true});

      await nextTick();
      await open(result.container);

      await expectNoA11yViolations(document.body);
    });

    it("has no violations with an option named from the search field", async () => {
      const result = mount({withLabel: true});

      await nextTick();
      await open(result.container);

      await userEvent.keyboard("{ArrowDown}");
      await nextTick();

      await expectNoA11yViolations(document.body);
    });
  });
});
