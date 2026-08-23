import { renderInterop } from "@ropav/testing/helpers/vue";
import { afterEach, describe, expect, it } from "vitest";
import { h, nextTick } from "vue";

import { ChipRoot } from "@/components/chip";
import { LabelRoot } from "@/components/label";
import { ListBoxRoot } from "@/components/list-box";
import { ListBoxItemIndicator, ListBoxItemRoot } from "@/components/list-box-item";
import { Select } from "@/components/select";

/**
 * The select mounted the way a consumer mounts it: from a VDOM host, with every part written in
 * the host and forwarded through the root's slot.
 *
 * Everything here is also covered by the vapor suite, and that is exactly why the file exists.
 * Content written in vapor resolves `inject` against the component that renders it, so a `provide`
 * made anywhere inside is found; content written in a VDOM host resolves against the host, so only
 * what an ancestor provided is found. A select hands down four separate things — its slot classes,
 * the press that opens it, the field ids, and the collection the listbox runs on — and each of
 * them would pass the vapor suite while being broken in every real host.
 */
const ITEMS = [
  { id: "florida", name: "Florida" },
  { id: "california", name: "California" },
  { id: "texas", name: "Texas" },
];

const settle = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

const render = (props: Record<string, unknown> = {}) =>
  renderInterop(Select, {
    props: {
      itemTextValue: (item: { name: string }) => item.name,
      items: ITEMS,
      placeholder: "Select one",
      ...props,
    },
    slots: {
      default: () => [
        h(LabelRoot, null, { default: () => "State" }),
        h(Select.Trigger, null, { default: () => [h(Select.Value), h(Select.Indicator)] }),
        h(Select.Popover, null, {
          default: () =>
            h(ListBoxRoot, null, {
              default: () =>
                ITEMS.map((item) =>
                  h(
                    ListBoxItemRoot,
                    { id: item.id, key: item.id, textValue: item.name },
                    {
                      default: () => [item.name, h(ListBoxItemIndicator)],
                    },
                  ),
                ),
            }),
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

const cleanups: Array<() => void> = [];

describe("Select (interop)", () => {
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

    // The slot classes travel by context. A part that could not reach it would render unstyled
    // while still looking correct in the vapor suite.
    expect(result.container.querySelector('[data-slot="select-trigger"]')).toHaveClass(
      "select__trigger",
    );
    expect(result.container.querySelector('[data-slot="select-value"]')).toHaveClass(
      "select__value",
    );
    expect(result.container.querySelector('[data-slot="select-default-indicator"]')).toHaveClass(
      "select__indicator",
    );

    result.unmount();
  });

  it("gives the host's trigger the press that opens the listbox", async () => {
    const result = render();

    await settle();

    const trigger = result.container.querySelector('[data-slot="select-trigger"]')!;

    expect(result.screen.queryByRole("listbox")).toBeNull();

    press(trigger);
    await settle();

    expect(result.screen.queryByRole("listbox")).not.toBeNull();
    expect(result.screen.queryAllByRole("option")).toHaveLength(3);

    result.unmount();
  });

  it("names the host's trigger with the host's label", async () => {
    const result = render();

    await settle();

    const trigger = result.container.querySelector('[data-slot="select-trigger"]')!;
    const label = result.container.querySelector('[data-slot="label"]')!;
    const value = result.container.querySelector('[data-slot="select-value"]')!;

    // The field ids travel by context too, and a label that could not claim one would leave the
    // trigger named by its value alone.
    expect(label.id).toBeTruthy();
    expect(trigger).toHaveAttribute("aria-labelledby", `${value.id} ${label.id}`);

    result.unmount();
  });

  it("runs the host's listbox on the select's own collection", async () => {
    const result = render({ defaultValue: "texas" });

    await settle();

    const trigger = result.container.querySelector('[data-slot="select-trigger"]')!;

    press(trigger);
    await settle();

    const listbox = result.screen.getByRole("listbox");
    const options = result.screen.queryAllByRole("option");

    // The listbox borrowed the select's state rather than building one of its own: it carries the
    // id the trigger points at, and it already knows which option is chosen.
    expect(trigger).toHaveAttribute("aria-controls", listbox.id);
    expect(options[2]).toHaveAttribute("aria-selected", "true");

    result.unmount();
  });

  it("hands every chosen datum to a value slot the host wrote", async () => {
    const result = renderInterop(Select, {
      props: {
        defaultValue: ["florida", "california"],
        itemTextValue: (item: { name: string }) => item.name,
        items: ITEMS,
        selectionMode: "multiple",
      },
      slots: {
        default: () => [
          h(Select.Trigger, null, {
            default: () => [
              h(Select.Value, null, {
                // One node per chosen option, which is the shape a chip list takes — and the
                // shape a single node hides: a slot re-run per item is where a stale first
                // entry shows up.
                default: ({
                  selectedItems,
                }: {
                  selectedItems: Array<{ key: string; value: { name: string } }>;
                }) =>
                  selectedItems.map((item) =>
                    h("span", { "data-testid": "value-item", key: item.key }, item.value.name),
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
      result.screen.queryAllByTestId("value-item").map((node) => node.textContent!.trim()),
    ).toEqual(["Florida", "California"]);
  });

  it("keeps the slots of components the host nested in the value", async () => {
    const result = renderInterop(Select, {
      props: {
        defaultValue: ["florida", "california"],
        itemTextValue: (item: { name: string }) => item.name,
        items: ITEMS,
        selectionMode: "multiple",
      },
      slots: {
        default: () => [
          h(Select.Trigger, null, {
            default: () => [
              h(Select.Value, null, {
                // A component of its own inside the value, which is what a chip list is. Declare
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
    ).toEqual(["Florida", "California"]);
  });

  it("writes a choice made in the host's listbox back into the trigger", async () => {
    const result = render();

    await settle();

    const trigger = result.container.querySelector('[data-slot="select-trigger"]')!;

    press(trigger);
    await settle();

    result.screen.queryAllByRole("option")[1]!.click();
    await settle();

    expect(result.container.querySelector('[data-slot="select-value"]')).toHaveTextContent(
      "California",
    );
    expect(result.screen.queryByRole("listbox")).toBeNull();

    result.unmount();
  });
});
