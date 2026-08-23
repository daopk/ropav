import { expectNoA11yViolations } from "@ropav/testing/helpers/a11y";
import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { nextTick } from "vue";

import { settled } from "../../harness/settle";

import Fixture from "./fixtures.vue";

const renderGroup = (props: Record<string, unknown> = {}) => renderVapor(Fixture, { props });

const slot = (container: HTMLElement, name: string) =>
  container.querySelector<HTMLElement>(`[data-slot='${name}']`)!;

/**
 * The parts of an input group only a real browser can show: the `:has()` rules that shape the
 * control around a prefix and a suffix, the hover fill the stylesheet suppresses while focus is
 * inside, and click-to-focus driven by a real pointer.
 */
describe("InputGroup (browser)", () => {
  it("strips the leading radius and padding off the control beside a prefix", async () => {
    // `.input-group:has([data-slot="input-group-prefix"]) &` is the rule, so it only fires
    // when the prefix really is in the DOM as a descendant of the group.
    const bare = renderGroup();
    const bareControl = slot(bare.container, "input-group-input");
    const bareStyle = getComputedStyle(bareControl);
    const bareRadius = bareStyle.borderStartStartRadius;
    const barePadding = bareStyle.paddingInlineStart;

    bare.unmount();

    const prefixed = renderGroup({ withPrefix: true });
    const prefixedStyle = getComputedStyle(slot(prefixed.container, "input-group-input"));

    expect(prefixedStyle.paddingInlineStart).toBe("0px");
    expect(prefixedStyle.paddingInlineStart).not.toBe(barePadding);
    expect(prefixedStyle.borderStartStartRadius).toBe("0px");
    void bareRadius;

    prefixed.unmount();
  });

  it("strips the trailing radius and padding off the control beside a suffix", async () => {
    const { container, unmount } = renderGroup({ withSuffix: true });
    const style = getComputedStyle(slot(container, "input-group-input"));

    expect(style.paddingInlineEnd).toBe("0px");
    expect(style.borderStartEndRadius).toBe("0px");

    unmount();
  });

  it("keeps the control's own padding when it stands alone in the group", async () => {
    const { container, unmount } = renderGroup();
    const style = getComputedStyle(slot(container, "input-group-input"));

    expect(style.paddingInlineStart).not.toBe("0px");
    expect(style.paddingInlineEnd).not.toBe("0px");

    unmount();
  });

  it("lets the shell grow and aligns to the top around a textarea", async () => {
    // `:has([data-slot="input-group-textarea"])` swaps the group off `items-center`, which is
    // the only thing keeping a multi-line control from being vertically centred.
    const { container, unmount } = renderGroup({ withPrefix: true, withTextArea: true });
    const group = slot(container, "input-group");

    expect(getComputedStyle(group).alignItems).toBe("flex-start");
    expect(getComputedStyle(group).height).not.toBe("36px");
    expect(getComputedStyle(slot(container, "input-group-prefix")).alignItems).toBe("flex-start");

    unmount();
  });

  it("paints the focus state on the shell rather than on the control", async () => {
    // The stylesheet reaches this through `:has([data-slot="input-group-input"]:focus)` on the
    // group, so the ring is on the shell and the control keeps `outline: none`.
    const { container, unmount } = renderGroup();
    const group = slot(container, "input-group");
    const control = slot(container, "input-group-input");

    const idle = getComputedStyle(group).boxShadow;

    await userEvent.click(control);
    await nextTick();

    await settled(group);

    expect(getComputedStyle(group).boxShadow).not.toBe(idle);
    expect(getComputedStyle(control).outlineStyle).toBe("none");

    unmount();
  });

  it("fills the shell on hover and drops the fill once focus is inside", async () => {
    // `&[data-hovered="true"]:not([data-focus-within="true"])` is why both attributes have to be
    // reported: with only the first, a group that is hovered and focused keeps the hover fill.
    const { container, unmount } = renderGroup();
    const group = slot(container, "input-group");
    const control = slot(container, "input-group-input");

    const idle = getComputedStyle(group).backgroundColor;

    await userEvent.hover(group);
    await nextTick();

    expect(group).toHaveAttribute("data-hovered", "true");

    await settled(group);

    const hovered = getComputedStyle(group).backgroundColor;

    expect(hovered).not.toBe(idle);

    await userEvent.click(control);
    await nextTick();

    expect(group).toHaveAttribute("data-focus-within", "true");

    await settled(group);

    expect(getComputedStyle(group).backgroundColor).not.toBe(hovered);

    unmount();
  });

  it("moves focus into the control when a real pointer clicks the prefix", async () => {
    const { container, unmount } = renderGroup({ withPrefix: true });
    const control = slot(container, "input-group-input");

    await userEvent.click(slot(container, "input-group-prefix"));
    await nextTick();

    expect(document.activeElement).toBe(control);

    unmount();
  });

  it("moves focus into the control when a real pointer clicks the suffix", async () => {
    const { container, unmount } = renderGroup({ withSuffix: true });
    const control = slot(container, "input-group-input");

    await userEvent.click(slot(container, "input-group-suffix"));
    await nextTick();

    expect(document.activeElement).toBe(control);

    unmount();
  });

  it("leaves the caret alone when it pulls focus into a control that already has it", async () => {
    // The click handler focuses the control on every click inside the group. On a control that
    // already holds focus that has to be a no-op, or clicking a prefix beside a caret placed
    // mid-word would drag the caret away with it.
    const { container, unmount } = renderGroup({
      fieldDefaultValue: "ropav.com",
      withField: true,
      withPrefix: true,
    });
    const control = container.querySelector<HTMLInputElement>("input")!;

    await userEvent.click(control);
    control.setSelectionRange(3, 3);

    await userEvent.click(slot(container, "input-group-prefix"));
    await nextTick();

    expect(document.activeElement).toBe(control);
    expect(control.selectionStart).toBe(3);
    expect(control.selectionEnd).toBe(3);

    unmount();
  });

  it("keeps a control at the value its owner allows", async () => {
    // Vapor skips writing `value` when the bound value has not changed, and the keystroke has
    // already landed in the DOM by then, so nothing would put the rejected text back.
    const { container, unmount } = renderGroup({ controlValue: "pinned" });
    const control = container.querySelector<HTMLInputElement>("input")!;

    await userEvent.click(control);
    await userEvent.keyboard("abc");
    await nextTick();

    expect(control.value).toBe("pinned");

    unmount();
  });

  it("takes the field's disabled state down to the control", async () => {
    // `.input-group[data-disabled="true"]` applies `status-disabled`, which puts
    // `pointer-events: none` on the group itself — so a real pointer never reaches it and
    // click-to-focus stops there, rather than at any check in the handler. Asserted as the
    // property rather than by clicking, because a click here is not one the browser delivers:
    // it falls through to the field behind and the driver reports it as intercepted.
    const { container, unmount } = renderGroup({ fieldIsDisabled: true, withField: true });
    const group = slot(container, "input-group");
    const control = container.querySelector<HTMLInputElement>("input")!;

    expect(group).toHaveAttribute("data-disabled", "true");
    expect(getComputedStyle(group).opacity).not.toBe("1");
    expect(getComputedStyle(group).pointerEvents).toBe("none");
    expect(control).toBeDisabled();

    unmount();
  });

  it("has no accessibility violations", async () => {
    const { container, unmount } = renderGroup({
      withField: true,
      withPrefix: true,
      withSuffix: true,
    });

    await expectNoA11yViolations(container);

    unmount();
  });

  it("has no accessibility violations standing on its own", async () => {
    const { container, unmount } = renderGroup({ withPrefix: true, withSuffix: true });

    await expectNoA11yViolations(container);

    unmount();
  });
});
