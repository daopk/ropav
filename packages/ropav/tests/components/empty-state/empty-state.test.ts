import {renderVapor} from "@heroui/testing/helpers/vue";
import {describe, expect, it} from "vitest";

import {EmptyStateRoot} from "@/components/empty-state";

const renderEmptyState = (options: Parameters<typeof renderVapor>[1] = {}) => {
  const result = renderVapor(EmptyStateRoot, options);
  const emptyState = result.container.querySelector('[data-slot="empty-state"]');

  if (!emptyState) throw new Error("empty state not rendered");

  return {...result, emptyState};
};

describe("EmptyState", () => {
  describe("structure", () => {
    it("renders a div carrying its data-slot", () => {
      const {emptyState} = renderEmptyState();

      expect(emptyState.tagName).toBe("DIV");
    });

    it("applies the base class", () => {
      const {emptyState} = renderEmptyState();

      expect(emptyState).toHaveClass("empty-state");
    });

    it("merges a caller class", () => {
      const {emptyState} = renderEmptyState({props: {class: "p-1"}});

      expect(emptyState).toHaveClass("empty-state", "p-1");
    });
  });

  describe("content", () => {
    it("falls back to a default message", () => {
      const {emptyState} = renderEmptyState();

      expect(emptyState).toHaveTextContent("No results found");
    });

    it("renders caller content instead of the fallback", () => {
      const {emptyState} = renderEmptyState({
        slots: {default: () => document.createTextNode("No categories found")},
      });

      expect(emptyState).toHaveTextContent("No categories found");
      expect(emptyState).not.toHaveTextContent("No results found");
    });
  });
});
