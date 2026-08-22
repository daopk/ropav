import {renderInterop} from "@heroui/testing/helpers/vue";
import {afterEach, describe, expect, it} from "vitest";
import {h, nextTick} from "vue";

import {ComboBox} from "@/components/combo-box";
import {DescriptionRoot} from "@/components/description";
import {InputRoot} from "@/components/input";
import {LabelRoot} from "@/components/label";
import {ListBoxRoot} from "@/components/list-box";
import {ListBoxItemIndicator, ListBoxItemRoot} from "@/components/list-box-item";

/**
 * The combo box mounted the way a consumer mounts it: from a VDOM host, with every part written in
 * the host and forwarded through the root's slot.
 *
 * Everything here is also covered by the vapor suite, and that is exactly why the file exists.
 * Content written in vapor resolves `inject` against the component that renders it, so a `provide`
 * made anywhere inside is found; content written in a VDOM host resolves against the host, so only
 * what an ancestor provided is found. A combo box hands down more than most — its slot classes, the
 * whole text-field behaviour the plain `Input` becomes the field through, the variant that styles
 * that input, the field ids, the validation, the press that opens the chevron, and the collection
 * with virtual focus the listbox runs on — and every one of them would pass the vapor suite while
 * being broken in every real host.
 */
const ITEMS = [
  {id: "cat", name: "Cat"},
  {id: "dog", name: "Dog"},
  {id: "panda", name: "Panda"},
];

const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const options = (matches: Array<{id: string; name: string}>) =>
  matches.map((item) =>
    h(
      ListBoxItemRoot,
      {id: item.id, key: item.id, textValue: item.name},
      {default: () => [item.name, h(ListBoxItemIndicator)]},
    ),
  );

/** The matches the root handed its slot, which the host renders its options from. */
const matchesOf = (slotProps?: Record<string, unknown>) =>
  (slotProps?.["items"] ?? []) as Array<{id: string; name: string}>;

const render = (props: Record<string, unknown> = {}, extra: Array<unknown> = []) =>
  renderInterop(ComboBox, {
    props: {
      itemTextValue: (item: {name: string}) => item.name,
      items: ITEMS,
      ...props,
    },
    slots: {
      // The root hands the matches back through its own slot, which is how the host knows what to
      // render — so the slot props are part of the contract this file checks.
      default: (slotProps?: Record<string, unknown>) => [
        h(LabelRoot, null, {default: () => "Favorite Animal"}),
        h(ComboBox.InputGroup, null, {
          default: () => [h(InputRoot, {placeholder: "Search animals..."}), h(ComboBox.Trigger)],
        }),
        ...(extra as never[]),
        h(ComboBox.Popover, null, {
          default: () => h(ListBoxRoot, null, {default: () => options(matchesOf(slotProps))}),
        }),
      ],
    },
  });

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

const press = (element: Element) => {
  element.dispatchEvent(new PointerEvent("pointerdown", POINTER));
  element.dispatchEvent(new PointerEvent("pointerup", POINTER));
  element.dispatchEvent(new MouseEvent("click", {bubbles: true, button: 0, detail: 1}));
};

const cleanups: Array<() => void> = [];

describe("ComboBox (interop)", () => {
  afterEach(() => {
    while (cleanups.length > 0) cleanups.pop()?.();

    // The overlay writes `inert` and `aria-hidden` outside its own container, so a leftover would
    // surface in an unrelated test rather than this one.
    document.querySelectorAll("[inert]").forEach((element) => element.removeAttribute("inert"));
    document
      .querySelectorAll("[aria-hidden]")
      .forEach((element) => element.removeAttribute("aria-hidden"));
  });

  it("styles the parts the host wrote", async () => {
    const result = render();

    await settle();

    expect(result.container.querySelector('[data-slot="combo-box-input-group"]')).toHaveClass(
      "combo-box__input-group",
    );
    expect(result.container.querySelector('[data-slot="combo-box-trigger"]')).toHaveClass(
      "combo-box__trigger",
    );

    result.unmount();
  });

  it("turns the host's plain Input into the combo box's field", async () => {
    const result = render();

    await settle();

    const input = result.container.querySelector('[data-slot="input"]')!;

    /*
     * This is the whole arrangement, and the one thing this file exists to prove: there is no combo
     * box input part, so an `Input` that could not reach the text-field context would render an
     * ordinary text box — no role, no expanded state, nothing to type into the widget with.
     */
    expect(input).toHaveAttribute("role", "combobox");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveAttribute("autocomplete", "off");

    result.unmount();
  });

  it("styles the host's Input from the combo box's variant", async () => {
    const result = render({variant: "secondary"});

    await settle();

    // The variant reaches the input through a context of its own, which is how the React build
    // routes it too — and the only thing a host-written `Input` can read it from.
    expect(result.container.querySelector('[data-slot="input"]')).toHaveClass("input--secondary");

    result.unmount();
  });

  it("names the host's field with the host's label", async () => {
    const result = render();

    await settle();

    const label = result.container.querySelector('[data-slot="label"]')!;

    expect(label.id).toBeTruthy();
    expect(result.container.querySelector('[data-slot="input"]')).toHaveAttribute(
      "aria-labelledby",
      label.id,
    );

    result.unmount();
  });

  it("describes the host's field with the host's description", async () => {
    const result = render({}, [h(DescriptionRoot, null, {default: () => "Pick an animal"})]);

    await settle();

    const description = result.container.querySelector('[data-slot="description"]')!;

    expect(description.id).toBeTruthy();
    expect(
      result.container.querySelector('[data-slot="input"]')!.getAttribute("aria-describedby"),
    ).toContain(description.id);

    result.unmount();
  });

  it("gives the host's chevron the press that opens the listbox", async () => {
    const result = render();

    await settle();

    expect(result.screen.queryByRole("listbox")).toBeNull();

    press(result.container.querySelector('[data-slot="combo-box-trigger"]')!);
    await settle();

    expect(result.screen.queryByRole("listbox")).not.toBeNull();
    expect(result.screen.queryAllByRole("option")).toHaveLength(3);

    result.unmount();
  });

  it("runs the host's listbox on the combo box's own collection, under virtual focus", async () => {
    const result = render({defaultValue: "panda"});

    await settle();

    const input = result.container.querySelector<HTMLInputElement>('[data-slot="input"]')!;

    press(result.container.querySelector('[data-slot="combo-box-trigger"]')!);
    await settle();

    const listbox = result.screen.getByRole("listbox");
    const items = result.screen.queryAllByRole("option");

    expect(input).toHaveAttribute("aria-controls", listbox.id);
    expect(items[2]).toHaveAttribute("aria-selected", "true");

    input.focus();
    input.dispatchEvent(
      new KeyboardEvent("keydown", {bubbles: true, cancelable: true, key: "ArrowDown"}),
    );
    await settle();

    // The arrows reach the host's listbox and the field names what they landed on. Both halves have
    // to arrive: the keyboard behaviour is reported *up* from the listbox, and only a listbox that
    // found the context reports anything at all.
    expect(input.getAttribute("aria-activedescendant")).toBeTruthy();
    expect(document.activeElement).toBe(input);

    result.unmount();
  });

  it("narrows the host's options as the host's field is typed into", async () => {
    const result = render();

    await settle();

    const input = result.container.querySelector<HTMLInputElement>('[data-slot="input"]')!;

    input.focus();
    input.dispatchEvent(
      new InputEvent("beforeinput", {bubbles: true, cancelable: true, inputType: "insertText"}),
    );
    input.value = "pa";
    input.dispatchEvent(new InputEvent("input", {bubbles: true, inputType: "insertText"}));
    await settle();

    // The matches travel out through the root's slot and back in as the host's markup, so this is
    // the round trip the vapor suite cannot break.
    expect(result.screen.queryAllByRole("option").map((o) => o.textContent?.trim())).toEqual([
      "Panda",
    ]);

    result.unmount();
  });

  it("writes the chosen option's text into the host's field", async () => {
    const result = render();

    await settle();

    press(result.container.querySelector('[data-slot="combo-box-trigger"]')!);
    await settle();
    press(result.screen.queryAllByRole("option")[1]!);
    await settle();

    expect(result.container.querySelector<HTMLInputElement>('[data-slot="input"]')!.value).toBe(
      "Dog",
    );

    result.unmount();
  });

  it("hands every chosen datum to a value slot the host wrote", async () => {
    const result = renderInterop(ComboBox, {
      props: {
        defaultValue: ["cat", "dog"],
        itemTextValue: (item: {name: string}) => item.name,
        items: ITEMS,
        selectionMode: "multiple",
      },
      slots: {
        default: (slotProps?: Record<string, unknown>) => [
          h(ComboBox.InputGroup, null, {
            default: () => [h(InputRoot), h(ComboBox.Trigger)],
          }),
          h(ComboBox.Value, null, {
            // One node per chosen option, which is the shape a chip list takes — and the shape a
            // single node hides: a slot re-run per item is where a stale first entry shows up.
            default: ({
              selectedItems,
            }: {
              selectedItems: Array<{key: string; value: {name: string}}>;
            }) =>
              selectedItems.map((item) =>
                h("span", {"data-testid": "value-item", key: item.key}, item.value.name),
              ),
          }),
          h(ComboBox.Popover, null, {
            default: () => h(ListBoxRoot, null, {default: () => options(matchesOf(slotProps))}),
          }),
        ],
      },
    });

    await settle();

    expect(
      [...result.container.querySelectorAll('[data-testid="value-item"]')].map((n) =>
        n.textContent?.trim(),
      ),
    ).toEqual(["Cat", "Dog"]);

    result.unmount();
  });
});
