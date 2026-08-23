import type { UseLabelsReturn } from "@/composables/use-labels";
import type { ComputedRef } from "vue";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it } from "vitest";
import { nextTick, reactive } from "vue";

import Host from "../fixtures/labels-host.vue";

const setup = (props: Record<string, unknown> = {}) => {
  let labels!: ComputedRef<UseLabelsReturn>;

  Object.assign(props, { onReady: (value: ComputedRef<UseLabelsReturn>) => (labels = value) });

  return { ...renderVapor(Host, { props }), labels: () => labels };
};

describe("useLabels", () => {
  describe("id", () => {
    it("keeps the caller's id", () => {
      const { labels, unmount } = setup({ id: "given" });

      expect(labels().value.id).toBe("given");
      unmount();
    });

    it("mints one when the caller has none", () => {
      const { labels, unmount } = setup({});

      expect(labels().value.id).toBeTruthy();
      unmount();
    });
  });

  describe("a single way of naming", () => {
    it("passes a label through", () => {
      const { labels, unmount } = setup({ ariaLabel: "Event date" });

      expect(labels().value["aria-label"]).toBe("Event date");
      expect(labels().value["aria-labelledby"]).toBeUndefined();
      unmount();
    });

    it("passes labelling ids through", () => {
      const { labels, unmount } = setup({ ariaLabelledby: "heading" });

      expect(labels().value["aria-labelledby"]).toBe("heading");
      expect(labels().value["aria-label"]).toBeUndefined();
      unmount();
    });

    it("collapses whitespace in a list of ids", () => {
      const { labels, unmount } = setup({ ariaLabelledby: "  one   two \n three " });

      expect(labels().value["aria-labelledby"]).toBe("one two three");
      unmount();
    });
  });

  describe("both ways of naming at once", () => {
    it("puts the element's own id first so its label still counts", () => {
      // `aria-labelledby` wins outright in assistive technology, so without the element's own id
      // in the list the `aria-label` would simply be dropped.
      const { labels, unmount } = setup({
        ariaLabel: "Event date",
        ariaLabelledby: "heading",
        id: "field",
      });

      expect(labels().value["aria-labelledby"]).toBe("field heading");
      expect(labels().value["aria-label"]).toBe("Event date");
      unmount();
    });

    it("does not repeat the element's own id when it is already listed", () => {
      const { labels, unmount } = setup({
        ariaLabel: "Event date",
        ariaLabelledby: "field heading",
        id: "field",
      });

      expect(labels().value["aria-labelledby"]).toBe("field heading");
      unmount();
    });
  });

  describe("default label", () => {
    it("names the element when the caller supplies no name", () => {
      const { labels, unmount } = setup({ defaultLabel: "Calendar" });

      expect(labels().value["aria-label"]).toBe("Calendar");
      unmount();
    });

    it("gives way to a label the caller supplied", () => {
      const { labels, unmount } = setup({ ariaLabel: "Event date", defaultLabel: "Calendar" });

      expect(labels().value["aria-label"]).toBe("Event date");
      unmount();
    });

    it("gives way to labelling ids the caller supplied", () => {
      const { labels, unmount } = setup({ ariaLabelledby: "heading", defaultLabel: "Calendar" });

      expect(labels().value["aria-label"]).toBeUndefined();
      expect(labels().value["aria-labelledby"]).toBe("heading");
      unmount();
    });
  });

  describe("reactivity", () => {
    it("follows the label changing", async () => {
      const props = reactive({ ariaLabel: "Start date" });
      const { labels, unmount } = setup(props);

      expect(labels().value["aria-label"]).toBe("Start date");

      props.ariaLabel = "End date";
      await nextTick();

      expect(labels().value["aria-label"]).toBe("End date");
      unmount();
    });
  });
});
