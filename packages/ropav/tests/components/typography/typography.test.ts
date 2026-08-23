import type { ProseProps, Typography, TypographyRootProps } from "@/components/typography";

import { renderVapor } from "@ropav/testing/helpers/vue";
import { describe, expect, it, vi } from "vitest";
import { nextTick, reactive } from "vue";

import Fixture from "./fixtures.vue";

const renderTypography = (props: Record<string, unknown> = {}) => {
  const result = renderVapor(Fixture, { props });
  const element = result.container.firstElementChild as HTMLElement;

  return { ...result, element };
};

describe("Typography", () => {
  it("exports native HTML props through both direct and compound prop types", () => {
    const props = {
      "aria-label": "Typed label",
      id: "typed-id",
      onClick: (_event: MouseEvent) => undefined,
      style: { maxWidth: "42px" },
    } satisfies TypographyRootProps;
    const compoundProps: Typography["Props"] = props;
    const proseProps: ProseProps = props;

    expect(compoundProps.id).toBe("typed-id");
    expect(proseProps["aria-label"]).toBe("Typed label");
  });

  it("renders body text as a paragraph by default", () => {
    const { element, unmount } = renderTypography();

    expect(element.tagName).toBe("P");
    expect(element).toHaveTextContent("Ropav Typography");
    expect(element).toHaveAttribute("data-slot", "typography");
    expect(element).toHaveAttribute("data-type", "body");
    expect(element).toHaveClass(
      "typography",
      "typography--body",
      "typography--align-start",
      "typography--color-default",
    );

    unmount();
  });

  it.each([
    ["h1", "H1"],
    ["h6", "H6"],
    ["body-sm", "P"],
    ["body-xs", "P"],
    ["code", "CODE"],
  ] as const)("maps %s to the semantic %s element", (type, tagName) => {
    const { element, unmount } = renderTypography({ type });

    expect(element.tagName).toBe(tagName);
    expect(element).toHaveClass(`typography--${type}`);

    unmount();
  });

  it("applies alignment, colour, weight, and truncation variants", () => {
    const { element, unmount } = renderTypography({
      align: "center",
      color: "muted",
      truncate: true,
      weight: "bold",
    });

    expect(element).toHaveClass(
      "typography--align-center",
      "typography--color-muted",
      "typography--weight-bold",
      "typography--truncate",
    );

    unmount();
  });

  it("merges a caller class and forwards attributes", () => {
    const { element, unmount } = renderTypography({ class: "max-w-prose" });

    expect(element).toHaveClass("typography", "max-w-prose");
    expect(element).toHaveAttribute("data-foo", "bar");

    unmount();
  });

  it.each([
    [undefined, "P"],
    ["heading", "H1"],
    ["paragraph", "P"],
    ["code", "CODE"],
    ["prose", "DIV"],
  ] as const)("forwards native attributes and events through %s", (mode, tagName) => {
    const onNativeClick = vi.fn();
    const { element, unmount } = renderTypography({ mode, onNativeClick });

    expect(element.tagName).toBe(tagName);
    expect(element).toHaveAttribute("aria-label", "Typography target");
    expect(element).toHaveAttribute("id", "typography-target");
    expect(element).toHaveAttribute("slot", "description");
    expect(element).toHaveAttribute("title", "Native title");
    expect(element.style.maxWidth).toBe("42px");

    element.click();
    expect(onNativeClick).toHaveBeenCalledOnce();

    unmount();
  });

  it("updates its semantic element and variants reactively", async () => {
    const props = reactive({ align: "start" as const, type: "body" as const });
    const { container, unmount } = renderTypography(props);

    props.type = "h2" as typeof props.type;
    props.align = "end" as typeof props.align;
    await nextTick();

    const element = container.firstElementChild as HTMLElement;

    expect(element.tagName).toBe("H2");
    expect(element).toHaveClass("typography--h2", "typography--align-end");

    unmount();
  });

  describe("Heading", () => {
    it("renders the requested semantic level and forwards root variants", () => {
      const { element, unmount } = renderTypography({
        align: "center",
        color: "muted",
        level: 3,
        mode: "heading",
        weight: "bold",
      });

      expect(element.tagName).toBe("H3");
      expect(element).toHaveClass(
        "typography--h3",
        "typography--align-center",
        "typography--color-muted",
        "typography--weight-bold",
      );
      expect(element).toHaveAttribute("data-foo", "bar");

      unmount();
    });
  });

  describe("Paragraph", () => {
    it.each([
      [undefined, "typography--body"],
      ["sm", "typography--body-sm"],
      ["xs", "typography--body-xs"],
    ] as const)("maps size %s to %s", (size, expected) => {
      const { element, unmount } = renderTypography({ mode: "paragraph", size });

      expect(element.tagName).toBe("P");
      expect(element).toHaveClass(expected);

      unmount();
    });
  });

  describe("Code", () => {
    it("renders a code element with the code variant", () => {
      const { element, unmount } = renderTypography({ mode: "code" });

      expect(element.tagName).toBe("CODE");
      expect(element).toHaveClass("typography--code");
      expect(element).toHaveTextContent("const x = 1;");

      unmount();
    });
  });

  describe("Prose", () => {
    it("renders an unopinionated div that scopes prose styles", () => {
      const { element, unmount } = renderTypography({ class: "max-w-2xl", mode: "prose" });

      expect(element.tagName).toBe("DIV");
      expect(element).toHaveAttribute("data-slot", "prose");
      expect(element).toHaveClass("typography-prose", "max-w-2xl");
      expect(element.querySelector("h2")).toHaveTextContent("Prose heading");
      expect(element).toHaveAttribute("data-foo", "bar");

      unmount();
    });
  });
});
