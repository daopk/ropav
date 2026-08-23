import { renderInterop } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { h, nextTick } from "vue";

import { Autocomplete } from "@/components/autocomplete";
import { ChipRoot } from "@/components/chip";
import { EmptyStateRoot } from "@/components/empty-state";
import { LabelRoot } from "@/components/label";
import { ListBoxRoot } from "@/components/list-box";
import { ListBoxItemIndicator, ListBoxItemRoot } from "@/components/list-box-item";
import { SearchField } from "@/components/search-field";

/**
 * The autocomplete mounted the way a consumer mounts it: from a VDOM host, with every part written
 * in the host and forwarded through a slot.
 *
 * Everything here is also covered by the vapor suite, and that is exactly why the file exists.
 * Content written in vapor resolves `inject` against the component that renders it, so a `provide`
 * made anywhere inside is found; content written in a VDOM host resolves against the host, so only
 * what an ancestor provided is found. An autocomplete hands down five separate things — its slot
 * classes, the press that opens it, the field ids, the narrowed collection the listbox runs on, and
 * the text the search field owns — and each of them would pass the vapor suite while being broken
 * in every real host.
 */
const ITEMS = [
  { id: "cat", name: "Cat" },
  { id: "dog", name: "Dog" },
  { id: "elephant", name: "Elephant" },
];

const contains = (textValue: string, inputValue: string) =>
  textValue.toLowerCase().includes(inputValue.toLowerCase());

const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

/** The search field, written in the host, which is the one that has to find the input context. */
const searchField = () =>
  h(
    SearchField,
    { ariaLabel: "Search animals", autoFocus: true },
    {
      default: () =>
        h(SearchField.Group, null, {
          default: () => [
            h(SearchField.SearchIcon),
            h(SearchField.Input, { placeholder: "Search animals..." }),
            h(SearchField.ClearButton),
          ],
        }),
    },
  );

const render = (props: Record<string, unknown> = {}) =>
  renderInterop(Autocomplete, {
    props: {
      itemTextValue: (item: { name: string }) => item.name,
      items: ITEMS,
      placeholder: "Select an animal",
      ...props,
    },
    slots: {
      default: () => [
        h(LabelRoot, null, { default: () => "Favorite Animal" }),
        h(Autocomplete.Trigger, null, {
          default: () => [
            h(Autocomplete.Value),
            h(Autocomplete.ClearButton),
            h(Autocomplete.Indicator),
          ],
        }),
        h(Autocomplete.Popover, null, {
          default: () =>
            h(
              Autocomplete.Filter,
              { filter: contains },
              {
                default: ({ items }: { items: Array<{ id: string; name: string }> }) => [
                  searchField(),
                  h(ListBoxRoot, null, {
                    default: () =>
                      items.map((item) =>
                        h(
                          ListBoxItemRoot,
                          { id: item.id, key: item.id, textValue: item.name },
                          { default: () => [item.name, h(ListBoxItemIndicator)] },
                        ),
                      ),
                    empty: () => h(EmptyStateRoot, null, { default: () => "No results found" }),
                  }),
                ],
              },
            ),
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
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, detail: 1 }));
};

const type = async (input: HTMLInputElement, value: string) => {
  input.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, inputType: "insertText" }));
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
  await settle();
};

const cleanups: Array<() => void> = [];

describe("Autocomplete under a vdom host", () => {
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

    cleanups.push(result.unmount);
    await settle();

    // The slot classes travel by context. A part that could not reach it would render unstyled
    // while still looking correct in the vapor suite.
    expect(result.container.querySelector('[data-slot="autocomplete-trigger"]')).toHaveClass(
      "autocomplete__trigger",
    );
    expect(result.container.querySelector('[data-slot="autocomplete-value"]')).toHaveClass(
      "autocomplete__value",
    );
    expect(result.container.querySelector('[data-slot="autocomplete-clear-button"]')).toHaveClass(
      "autocomplete__clear-button",
    );
    expect(
      result.container.querySelector('[data-slot="autocomplete-default-indicator"]'),
    ).toHaveClass("autocomplete__indicator");
  });

  it("gives the host's indicator the press that opens the listbox", async () => {
    const result = render();

    cleanups.push(result.unmount);
    await settle();

    expect(result.screen.queryByRole("listbox")).toBeNull();

    press(result.container.querySelector('button[aria-haspopup="listbox"]')!);
    await settle();

    expect(result.screen.queryByRole("listbox")).not.toBeNull();
    expect(result.screen.queryAllByRole("option")).toHaveLength(3);
  });

  it("opens on a press on the host's trigger group", async () => {
    const result = render();

    cleanups.push(result.unmount);
    await settle();

    press(result.container.querySelector('[data-slot="autocomplete-trigger"]')!);
    await settle();

    expect(result.screen.queryByRole("listbox")).not.toBeNull();
  });

  it("names the host's indicator with the host's label", async () => {
    const result = render();

    cleanups.push(result.unmount);
    await settle();

    const button = result.container.querySelector('button[aria-haspopup="listbox"]')!;
    const label = result.container.querySelector('[data-slot="label"]')!;
    const value = result.container.querySelector('[data-slot="autocomplete-value"]')!;

    // The field ids travel by context too, and a label that could not claim one would leave the
    // trigger named by its value alone.
    expect(label.id).toBeTruthy();
    expect(button).toHaveAttribute("aria-labelledby", `${value.id} ${label.id}`);
  });

  it("wires the host's search field to the host's listbox", async () => {
    const result = render();

    cleanups.push(result.unmount);
    await settle();

    press(result.container.querySelector('button[aria-haspopup="listbox"]')!);
    await settle();

    const listbox = result.screen.getByRole("listbox");
    const input = result.screen.getByRole<HTMLInputElement>("searchbox");

    // The input context is what makes the field part of the autocomplete rather than a search box
    // that happens to sit above a listbox.
    expect(input).toHaveAttribute("aria-controls", listbox.id);
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveFocus();
  });

  it("narrows the host's listbox from the host's search field", async () => {
    const result = render();

    cleanups.push(result.unmount);
    await settle();

    press(result.container.querySelector('button[aria-haspopup="listbox"]')!);
    await settle();

    await type(result.screen.getByRole<HTMLInputElement>("searchbox"), "ph");

    expect(
      result.screen.queryAllByRole("option").map((option) => option.textContent!.trim()),
    ).toEqual(["Elephant"]);
  });

  it("drives the host's listbox by virtual focus from the host's search field", async () => {
    const result = render();

    cleanups.push(result.unmount);
    await settle();

    press(result.container.querySelector('button[aria-haspopup="listbox"]')!);
    await settle();

    const input = result.screen.getByRole<HTMLInputElement>("searchbox");

    input.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );
    await settle();

    const [first] = result.screen.queryAllByRole("option");

    // The keyboard behaviour is reported *up* from the listbox to the filter, so this is the one
    // direction the vapor suite could pass with nothing wired at all.
    expect(input).toHaveAttribute("aria-activedescendant", first!.id);
    expect(first).toHaveAttribute("data-focused", "true");
    expect(input).toHaveFocus();
  });

  it("shows the empty slot the host wrote when nothing matches", async () => {
    const result = render({ allowsEmptyCollection: true });

    cleanups.push(result.unmount);
    await settle();

    press(result.container.querySelector('button[aria-haspopup="listbox"]')!);
    await settle();

    await type(result.screen.getByRole<HTMLInputElement>("searchbox"), "zzz");

    expect(
      result.screen.getByRole("listbox").querySelector('[data-slot="empty-state"]'),
    ).toHaveTextContent("No results found");
  });

  it("writes a choice made in the host's listbox back into the trigger", async () => {
    const result = render();

    cleanups.push(result.unmount);
    await settle();

    press(result.container.querySelector('button[aria-haspopup="listbox"]')!);
    await settle();

    result.screen.queryAllByRole("option")[1]!.click();
    await settle();

    expect(result.container.querySelector('[data-slot="autocomplete-value"]')).toHaveTextContent(
      "Dog",
    );
    expect(result.screen.queryByRole("listbox")).toBeNull();
  });

  it("clears the selection from a clear button the host wrote", async () => {
    const result = render({ defaultValue: ["cat"], selectionMode: "multiple" });

    cleanups.push(result.unmount);
    await settle();

    const clear = result.container.querySelector<HTMLElement>(
      '[data-slot="autocomplete-clear-button"]',
    )!;

    expect(clear).not.toHaveAttribute("data-empty");

    clear.click();
    await settle();

    expect(clear).toHaveAttribute("data-empty", "true");
    expect(result.container.querySelector('[data-slot="autocomplete-value"]')).toHaveTextContent(
      "Select an animal",
    );
  });

  it("keeps the slots of components the host nested in the value", async () => {
    const result = renderInterop(Autocomplete, {
      props: {
        defaultValue: ["cat", "dog"],
        itemTextValue: (item: { name: string }) => item.name,
        items: ITEMS,
        selectionMode: "multiple",
      },
      slots: {
        default: () => [
          h(Autocomplete.Trigger, null, {
            default: () => [
              h(Autocomplete.Value, null, {
                // A component of its own inside the value, which is what a tag list is. Declare
                // the default as `<slot>` fallback content beside this and the nested component
                // renders with an empty slot on the first pass — an empty chip.
                default: ({
                  selectedItems,
                }: {
                  selectedItems: Array<{ key: string; value: { name: string } }>;
                }) =>
                  selectedItems.map((item) =>
                    h(ChipRoot, { key: item.key }, { default: () => item.value.name }),
                  ),
              }),
            ],
          }),
        ],
      },
    });

    cleanups.push(result.unmount);
    await settle();

    expect(
      [...result.container.querySelectorAll('[data-slot="chip"]')].map((node) =>
        node.textContent!.trim(),
      ),
    ).toEqual(["Cat", "Dog"]);
  });
});
