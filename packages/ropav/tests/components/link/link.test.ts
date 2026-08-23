import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import Fixture from "./fixtures.vue";

const renderLink = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props: { href: "#target", ...props } });
  const link = result.container.querySelector('[data-slot="link"]');

  if (!link) throw new Error("link not rendered");

  return { ...result, link };
};

const press = (element: Element, key: string) => {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });

  element.dispatchEvent(event);

  return event;
};

describe("Link", () => {
  describe("structure", () => {
    it("renders an anchor when it has somewhere to go", () => {
      const { link, unmount } = renderLink();

      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "#target");
      expect(link).not.toHaveAttribute("role");
      // Written even on an anchor, which is already tabbable: Safari does not focus a native
      // link without one, which is why react-aria always sets it.
      expect(link).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("renders the BEM class", () => {
      const { link, unmount } = renderLink();

      expect(link).toHaveClass("link");

      unmount();
    });

    it("supports a class", () => {
      const { link, unmount } = renderLink({ class: "underline-offset-2" });

      expect(link).toHaveClass("link", "underline-offset-2");

      unmount();
    });

    it("passes through the anchor attributes", () => {
      const { link, unmount } = renderLink({ rel: "noopener noreferrer", target: "_blank" });

      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");

      unmount();
    });

    it("renders a span carrying the role when there is nowhere to go", () => {
      // An anchor with no destination is not a link to the browser, so the role and the tab
      // stop have to be put back by hand.
      const { link, unmount } = renderLink({ href: undefined });

      expect(link.tagName).toBe("SPAN");
      expect(link).toHaveAttribute("role", "link");
      expect(link).toHaveAttribute("tabindex", "0");

      unmount();
    });
  });

  describe("disabled", () => {
    it("renders a span with no destination", () => {
      // The point is that there is no href left for a stray click or a middle-click to follow.
      const { link, unmount } = renderLink({ isDisabled: true });

      expect(link.tagName).toBe("SPAN");
      expect(link).not.toHaveAttribute("href");

      unmount();
    });

    it("reports itself as disabled", () => {
      // `aria-disabled`, which is what the stylesheet keys the dimming on — a span cannot take
      // the `disabled` attribute.
      const { link, unmount } = renderLink({ isDisabled: true });

      expect(link).toHaveAttribute("aria-disabled", "true");
      expect(link).toHaveAttribute("data-disabled", "true");

      unmount();
    });

    it("leaves itself out of the tab order", () => {
      const { link, unmount } = renderLink({ isDisabled: true });

      expect(link).not.toHaveAttribute("tabindex");

      unmount();
    });

    it("takes the disabled state from a fieldset around it", () => {
      const { link, unmount } = renderLink({ inDisabledFieldset: true });

      expect(link.tagName).toBe("SPAN");
      expect(link).toHaveAttribute("aria-disabled", "true");

      unmount();
    });

    it("lets its own prop win over a disabled fieldset", () => {
      const { link, unmount } = renderLink({ inDisabledFieldset: true, isDisabled: false });

      expect(link.tagName).toBe("A");
      expect(link).not.toHaveAttribute("aria-disabled");

      unmount();
    });
  });

  describe("current page", () => {
    it("marks itself as the current page", () => {
      const { link, unmount } = renderLink({ ariaCurrent: "page" });

      expect(link).toHaveAttribute("aria-current", "page");
      expect(link).toHaveAttribute("data-current", "true");

      unmount();
    });

    it("carries no current marker otherwise", () => {
      const { link, unmount } = renderLink();

      expect(link).not.toHaveAttribute("data-current");

      unmount();
    });

    /**
     * `aria-current` is typed as a union that *includes* `boolean`, which is enough for Vue to cast
     * an absent prop to `false` — and `false` reaches the DOM as a real attribute, so every link
     * would state outright that it is not the current page. Written as a bare component, because a
     * caller passing `:aria-current="undefined"` never triggers it.
     */
    it("says nothing at all about the current page when it was not asked", () => {
      const { link, unmount } = renderLink({ bare: true });

      expect(link).not.toHaveAttribute("aria-current");

      unmount();
    });

    it("offers no download when it was not asked", () => {
      const { link, unmount } = renderLink({ bare: true });

      expect(link).not.toHaveAttribute("download");

      unmount();
    });

    it("offers a download when it is asked", () => {
      const { link, unmount } = renderLink({ download: "report.pdf", href: "/report" });

      expect(link).toHaveAttribute("download", "report.pdf");

      unmount();
    });
  });

  describe("interaction", () => {
    it("reports hover", async () => {
      // The underline on hover is drawn from this attribute as well as from `:hover`.
      const { link, unmount } = renderLink();

      link.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }));
      await nextTick();
      expect(link).toHaveAttribute("data-hovered", "true");

      link.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true, pointerType: "mouse" }));
      await nextTick();
      expect(link).not.toHaveAttribute("data-hovered");

      unmount();
    });

    it("stops reporting hover once disabled", async () => {
      const { link, unmount } = renderLink({ isDisabled: true });

      link.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true, pointerType: "mouse" }));
      await nextTick();
      expect(link).not.toHaveAttribute("data-hovered");

      unmount();
    });

    it("reports being pressed with the pointer", async () => {
      const { link, unmount } = renderLink();

      link.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "mouse" }),
      );
      await nextTick();

      expect(link).toHaveAttribute("data-pressed", "true");

      unmount();
    });

    it("reports being pressed with Enter", async () => {
      // A link activates on Enter, so the pressed styling has to follow the key being held —
      // which is why press comes from the press machine rather than from the pointer states.
      const { link, unmount } = renderLink();

      press(link, "Enter");
      await nextTick();

      expect(link).toHaveAttribute("data-pressed", "true");

      unmount();
    });

    it("never treats Space as activating a link", () => {
      // Space scrolls the page on a link; only a button takes it.
      const { link, unmount } = renderLink();

      const event = press(link, " ");

      expect(event.defaultPrevented).toBe(false);
      expect(link).not.toHaveAttribute("data-pressed");

      unmount();
    });

    it("reports focus", async () => {
      const { link, unmount } = renderLink();

      link.dispatchEvent(new FocusEvent("focus"));
      await nextTick();

      expect(link).toHaveAttribute("data-focused", "true");

      unmount();
    });

    it("calls a click listener", () => {
      const onClick = vi.fn();
      const { link, unmount } = renderLink({ onClick });

      (link as HTMLElement).click();

      expect(onClick).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe("icon", () => {
    it("renders the built-in glyph and marks it as the default", () => {
      // `.link__icon[data-default-icon="true"]` is what makes room for the built-in glyph, so a
      // caller's own icon must not get that spacing.
      const { container, unmount } = renderLink({ withIcon: true });
      const icon = container.querySelector('[data-slot="link-icon"]')!;

      expect(icon).toHaveClass("link__icon");
      expect(icon).toHaveAttribute("data-default-icon", "true");
      expect(icon.querySelector('[data-slot="link-default-icon"]')).not.toBeNull();

      unmount();
    });

    it("drops the default marker once a glyph is handed over", () => {
      const { container, unmount } = renderLink({ customIcon: true, withIcon: true });
      const icon = container.querySelector('[data-slot="link-icon"]')!;

      expect(icon).not.toHaveAttribute("data-default-icon");
      expect(container.querySelector("[data-testid='custom-icon']")).not.toBeNull();
      expect(icon.querySelector('[data-slot="link-default-icon"]')).toBeNull();

      unmount();
    });

    it("supports a class on the icon", () => {
      const { container, unmount } = renderLink({ iconClass: "size-2", withIcon: true });

      expect(container.querySelector('[data-slot="link-icon"]')).toHaveClass(
        "link__icon",
        "size-2",
      );

      unmount();
    });

    it("supports the icon ahead of the text", () => {
      const { link, unmount } = renderLink({ iconFirst: true, withIcon: true });
      const icon = link.querySelector('[data-slot="link-icon"]')!;

      expect(link.firstElementChild).toBe(icon);

      unmount();
    });
  });
});
