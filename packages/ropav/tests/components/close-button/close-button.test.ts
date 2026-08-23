import {renderVapor} from "@ropav/testing/helpers/vue";
import {describe, expect, it, vi} from "vitest";
import {nextTick, reactive} from "vue";

import {CloseButton} from "@/components/close-button";

import ResponderFixture from "./fixtures.vue";

const renderCloseButton = (props: Record<string, unknown> = {}) =>
  renderVapor(CloseButton, {props});

const buttonIn = (container: HTMLElement) => container.querySelector("button");

describe("CloseButton", () => {
  describe("structure", () => {
    it("renders a native button with its data-slot", () => {
      const {container, unmount} = renderCloseButton();
      const button = buttonIn(container);

      expect(button).not.toBeNull();
      expect(button?.getAttribute("data-slot")).toBe("close-button");
      expect(button?.classList.contains("close-button")).toBe(true);

      unmount();
    });

    // Asserted on the IDL property rather than the content attribute: Vue compiles
    // `:type` on a <button> to a DOM property write, and skips it when the value already
    // equals `el.type` — which reads "submit" by default even with no attribute set.
    it("defaults to type button so it never submits a form by accident", () => {
      const {container, unmount} = renderCloseButton();

      expect((buttonIn(container) as HTMLButtonElement).type).toBe("button");

      unmount();
    });

    it("renders the close icon when no content is passed", () => {
      const {container, unmount} = renderCloseButton();
      const icon = container.querySelector('[data-slot="close-button-icon"]');

      expect(icon).not.toBeNull();
      expect(icon?.getAttribute("aria-hidden")).toBe("true");

      unmount();
    });

    it("renders slot content in place of the default icon", () => {
      const {container, unmount} = renderVapor(CloseButton, {
        slots: {default: () => document.createTextNode("✕")},
      });

      expect(container.querySelector('[data-slot="close-button-icon"]')).toBeNull();
      expect(buttonIn(container)?.textContent).toBe("✕");

      unmount();
    });

    it("exposes the variant BEM modifier", () => {
      const {container, unmount} = renderCloseButton({variant: "default"});

      expect(buttonIn(container)?.classList.contains("close-button--default")).toBe(true);

      unmount();
    });
  });

  describe("accessible name", () => {
    it("names itself Close so the icon alone is never the label", () => {
      const {getByRole, unmount} = renderCloseButton();

      expect(getByRole("button", {name: "Close"})).toBeInTheDocument();

      unmount();
    });

    // The default lives on the template rather than behind a prop, which only works
    // because Vue lets a fallthrough attribute win over the one declared there.
    it("lets the caller name what is being closed", () => {
      const {getByRole, unmount} = renderVapor(CloseButton, {
        props: {"aria-label": "Dismiss notification"},
      });

      expect(getByRole("button", {name: "Dismiss notification"})).toBeInTheDocument();

      unmount();
    });
  });

  describe("interaction states", () => {
    it("calls click when activated", async () => {
      const onClick = vi.fn();
      const {getByRole, unmount} = renderVapor(CloseButton, {props: {onClick}});

      getByRole("button").dispatchEvent(new MouseEvent("click", {bubbles: true}));
      await nextTick();

      expect(onClick).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("exposes hover as a data attribute the stylesheet can key on", async () => {
      const {container, unmount} = renderCloseButton();
      const button = buttonIn(container)!;

      button.dispatchEvent(new PointerEvent("pointerenter", {bubbles: true, pointerType: "mouse"}));
      await nextTick();

      expect(button.getAttribute("data-hovered")).toBe("true");

      button.dispatchEvent(new PointerEvent("pointerleave", {bubbles: true, pointerType: "mouse"}));
      await nextTick();

      expect(button.getAttribute("data-hovered")).toBeNull();

      unmount();
    });

    it("exposes press as a data attribute the stylesheet can key on", async () => {
      const {container, unmount} = renderCloseButton();
      const button = buttonIn(container)!;

      button.dispatchEvent(
        new PointerEvent("pointerdown", {bubbles: true, button: 0, pointerType: "mouse"}),
      );
      await nextTick();

      expect(button.getAttribute("data-pressed")).toBe("true");

      window.dispatchEvent(new PointerEvent("pointerup"));
      await nextTick();

      expect(button.getAttribute("data-pressed")).toBeNull();

      unmount();
    });
  });

  describe("disabled", () => {
    it("disables the underlying button", () => {
      const {container, unmount} = renderCloseButton({isDisabled: true});
      const button = buttonIn(container) as HTMLButtonElement;

      expect(button.disabled).toBe(true);
      expect(button.getAttribute("data-disabled")).toBe("true");

      unmount();
    });

    it("reports no interaction state while disabled", async () => {
      const {container, unmount} = renderCloseButton({isDisabled: true});
      const button = buttonIn(container)!;

      button.dispatchEvent(new PointerEvent("pointerenter", {bubbles: true, pointerType: "mouse"}));
      button.dispatchEvent(
        new PointerEvent("pointerdown", {bubbles: true, button: 0, pointerType: "mouse"}),
      );
      await nextTick();

      expect(button.getAttribute("data-hovered")).toBeNull();
      expect(button.getAttribute("data-pressed")).toBeNull();

      unmount();
    });
  });

  describe("tab order", () => {
    // Written even though a native button is already tabbable: Safari does not focus one
    // unless an explicit tab index says so, which is why react-aria always sets it.
    it("renders an explicit tab index", () => {
      const {container, unmount} = renderCloseButton();

      expect(buttonIn(container)).toHaveAttribute("tabindex", "0");

      unmount();
    });

    it("drops the tab index when disabled, so it is not reachable at all", () => {
      const {container, unmount} = renderCloseButton({isDisabled: true});

      expect(buttonIn(container)?.hasAttribute("tabindex")).toBe(false);

      unmount();
    });
  });

  describe("pending", () => {
    it("stays focusable but stops activating", async () => {
      const onClick = vi.fn();
      const {getByRole, unmount} = renderVapor(CloseButton, {props: {isPending: true, onClick}});
      const button = getByRole("button") as HTMLButtonElement;

      expect(button.disabled).toBe(false);
      expect(button.getAttribute("aria-disabled")).toBe("true");
      expect(button.getAttribute("data-pending")).toBe("true");

      button.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true}));
      await nextTick();

      expect(onClick).not.toHaveBeenCalled();

      unmount();
    });

    // Blocking the click is not enough on its own: implicit submission reaches the form
    // through the button's own type, without a click ever landing on the button.
    it("drops a pending submit button to type button", async () => {
      const props = reactive({isPending: true, type: "submit"});
      const {container, unmount} = renderVapor(CloseButton, {props});

      expect((buttonIn(container) as HTMLButtonElement).type).toBe("button");

      props.isPending = false;
      await nextTick();

      expect((buttonIn(container) as HTMLButtonElement).type).toBe("submit");

      unmount();
    });
  });
});

describe("CloseButton driven from above", () => {
  const renderWithResponder = (props: Record<string, unknown> = {}) =>
    renderVapor(ResponderFixture, {props});

  it("reports its element to whatever supplied the press", () => {
    // The responder acts on the element and positions against it, so it has to be handed one.
    const onRegister = vi.fn();
    const {container, unmount} = renderWithResponder({onRegister});

    expect(onRegister).toHaveBeenCalledWith(buttonIn(container));

    unmount();
  });

  it("renders the attributes the supplied press asks for", () => {
    const {container, unmount} = renderWithResponder({
      attrs: {"aria-controls": "menu-1", "aria-expanded": "true", "aria-haspopup": "true"},
    });
    const button = buttonIn(container);

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveAttribute("aria-haspopup", "true");
    expect(button).toHaveAttribute("aria-controls", "menu-1");

    unmount();
  });

  it("passes a click to the supplied press", async () => {
    const onResponderClick = vi.fn();
    const {container, unmount} = renderWithResponder({onResponderClick});

    buttonIn(container)?.click();
    await nextTick();

    expect(onResponderClick).toHaveBeenCalledOnce();

    unmount();
  });

  it("runs the supplied press ahead of the button's own click", async () => {
    // Order is the whole reason the listeners are chained rather than spread: what comes
    // from above decides first, and the element's own handler follows.
    const calls: string[] = [];
    const {container, unmount} = renderWithResponder({
      onOwnClick: () => calls.push("own"),
      onResponderClick: () => calls.push("responder"),
      withOwnClick: true,
    });

    buttonIn(container)?.click();
    await nextTick();

    expect(calls).toEqual(["responder", "own"]);

    unmount();
  });

  it("passes keyboard and pointer activation to the supplied press", async () => {
    // A trigger opens on the way down for a mouse but on release for touch, so it needs
    // more than the click.
    const onResponderKeydown = vi.fn();
    const onResponderPointerdown = vi.fn();
    const {container, unmount} = renderWithResponder({
      onResponderKeydown,
      onResponderPointerdown,
    });
    const button = buttonIn(container);

    button?.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "Enter"}));
    button?.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, button: 0}));
    await nextTick();

    expect(onResponderKeydown).toHaveBeenCalledOnce();
    expect(onResponderPointerdown).toHaveBeenCalledOnce();

    unmount();
  });

  it("looks pressed while the supplied press says it is", async () => {
    const props = reactive({isPressed: false});
    const {container, unmount} = renderWithResponder(props);

    expect(buttonIn(container)).not.toHaveAttribute("data-pressed");

    props.isPressed = true;
    await nextTick();

    expect(buttonIn(container)).toHaveAttribute("data-pressed", "true");

    unmount();
  });

  it("stays an ordinary button when nothing supplies a press", async () => {
    // Most close buttons have nobody above them, and the optional context must not change
    // how those behave.
    const onClick = vi.fn();
    const {container, unmount} = renderCloseButton({onClick});

    buttonIn(container)?.click();
    await nextTick();

    expect(onClick).toHaveBeenCalledOnce();

    unmount();
  });
});
