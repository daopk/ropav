import type { SplitterPanelMeta, SplitterSize } from "@/components/splitter/splitter.state";

import { afterEach, describe, expect, it, vi } from "vitest";

import { useSplitterState } from "@/components/splitter/splitter.state";

import { withScope } from "../../harness/scope";

interface PanelSpec {
  key: string;
  collapsedSize?: SplitterSize;
  defaultSize?: SplitterSize;
  isCollapsible?: boolean;
  maxSize?: SplitterSize;
  minSize?: SplitterSize;
  size?: SplitterSize;
}

const HANDLE_SIZE = 0;
const CONTAINER = 1000;

const disposers: (() => void)[] = [];

afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
  document.body.replaceChildren();
});

/**
 * A splitter over real elements: the registry sorts panels by document position, so the panels and
 * the handles between them have to exist and be interleaved in the DOM the way the parts render.
 */
const setUp = (
  specs: PanelSpec[],
  options: Partial<Parameters<typeof useSplitterState>[0]> = {},
) => {
  const root = document.createElement("div");

  document.body.append(root);

  const [state, dispose] = withScope(() =>
    useSplitterState({
      defaultSizes: undefined,
      isDisabled: undefined,
      orientation: undefined,
      sizes: undefined,
      ...options,
    }),
  );

  disposers.push(dispose);

  const handleKeys: string[] = [];

  specs.forEach((spec, index) => {
    if (index > 0) {
      const handleElement = document.createElement("div");
      const handleKey = `handle-${index - 1}`;

      root.append(handleElement);
      handleKeys.push(handleKey);
      state.registerHandle(handleKey, {
        element: () => handleElement,
        size: () => HANDLE_SIZE,
      });
    }

    const element = document.createElement("div");

    root.append(element);

    const meta: SplitterPanelMeta = {
      collapsedSize: () => spec.collapsedSize,
      defaultSize: () => spec.defaultSize,
      element: () => element,
      id: () => `panel-${spec.key}`,
      isCollapsible: () => spec.isCollapsible ?? false,
      maxSize: () => spec.maxSize,
      minSize: () => spec.minSize,
      size: () => spec.size,
    };

    state.registerPanel(spec.key, meta);
  });

  state.setAvailableSize(CONTAINER);

  return { handleKeys, state };
};

/** Drag one handle by `delta`, the way the component does: open, move, close. */
const drag = (state: ReturnType<typeof setUp>["state"], handleKey: string, delta: number) => {
  state.startResize(handleKey);
  state.resize(handleKey, delta);
  state.endResize();
};

describe("splitter state", () => {
  describe("laying out", () => {
    it("registers the panels in document order", () => {
      const { state } = setUp([{ key: "a" }, { key: "b" }, { key: "c" }]);

      expect(state.panelKeys.value).toEqual(["a", "b", "c"]);
    });

    it("splits the container evenly between equal fractions", () => {
      const { state } = setUp([{ key: "a" }, { key: "b" }]);

      expect(state.layout.value).toEqual([500, 500]);
    });

    it("weights the split by each fraction", () => {
      const { state } = setUp([{ defaultSize: "3fr", key: "a" }, { key: "b" }]);

      expect(state.layout.value).toEqual([750, 250]);
    });

    it("gives a pixel panel its pixels and the rest to the fractions", () => {
      const { state } = setUp([{ defaultSize: "240px", key: "a" }, { key: "b" }]);

      expect(state.layout.value).toEqual([240, 760]);
    });

    it("resolves a percentage against the container", () => {
      const { state } = setUp([{ defaultSize: "25%", key: "a" }, { key: "b" }]);

      expect(state.layout.value).toEqual([250, 750]);
    });

    it("takes the handles out of what the panels divide", () => {
      const root = document.createElement("div");

      document.body.append(root);

      const [state, dispose] = withScope(() =>
        useSplitterState({
          defaultSizes: undefined,
          isDisabled: undefined,
          orientation: undefined,
          sizes: undefined,
        }),
      );

      disposers.push(dispose);

      const handle = document.createElement("div");
      const one = document.createElement("div");
      const two = document.createElement("div");

      root.append(one, handle, two);
      state.registerPanel("a", panelMeta("a", one));
      state.registerHandle("h", { element: () => handle, size: () => 8 });
      state.registerPanel("b", panelMeta("b", two));
      state.setAvailableSize(1000);

      expect(state.availableSize.value).toBe(992);
      expect(state.layout.value).toEqual([496, 496]);
    });

    it("reports no layout at all before the container is measured", () => {
      const { state } = setUp([{ key: "a" }, { key: "b" }]);

      state.setAvailableSize(0);

      expect(state.layout.value).toEqual([]);
    });
  });

  describe("resizing", () => {
    it("takes from one neighbour and gives to the other", () => {
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }]);

      drag(state, handleKeys[0]!, 100);

      expect(state.layout.value).toEqual([600, 400]);
    });

    it("moves the edge back the other way", () => {
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }]);

      drag(state, handleKeys[0]!, -150);

      expect(state.layout.value).toEqual([350, 650]);
    });

    it("stops at the shrinking neighbour's minimum", () => {
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b", minSize: 400 }]);

      drag(state, handleKeys[0]!, 300);

      expect(state.layout.value).toEqual([600, 400]);
    });

    it("stops at the growing panel's maximum", () => {
      const { handleKeys, state } = setUp([{ key: "a", maxSize: 550 }, { key: "b" }]);

      drag(state, handleKeys[0]!, 300);

      expect(state.layout.value).toEqual([550, 450]);
    });

    /*
     * The case a non-cascading model gets wrong: the middle panel is spent at 100px, but the last
     * one still has room, so the edge must keep moving instead of stopping dead.
     */
    it("cascades past a neighbour already at its minimum", () => {
      const { handleKeys, state } = setUp([
        { key: "a" },
        { key: "b", minSize: 250 },
        { key: "c", minSize: 100 },
      ]);

      drag(state, handleKeys[0]!, 200);

      expect(state.layout.value).toEqual([533, 250, 217]);
    });

    it("keeps the total constant however far the edge is dragged", () => {
      const { handleKeys, state } = setUp([
        { key: "a", minSize: 100 },
        { key: "b", minSize: 100 },
        { key: "c", minSize: 100 },
      ]);

      for (const delta of [50, -400, 900, -50, 10_000]) {
        drag(state, handleKeys[0]!, delta);

        const total = state.layout.value.reduce((sum, size) => sum + size, 0);

        expect(total).toBe(1000);
      }
    });

    it("ignores a resize for a handle that is not the one being dragged", () => {
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }]);

      state.resize(handleKeys[0]!, 100);

      expect(state.layout.value).toEqual([500, 500]);
    });

    it("measures every move from where the drag opened, not from the last one", () => {
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }]);

      state.startResize(handleKeys[0]!);
      state.resize(handleKeys[0]!, 100);
      state.resize(handleKeys[0]!, 100);
      state.endResize();

      expect(state.layout.value).toEqual([600, 400]);
    });

    /*
     * With a running accumulator the pixels a clamp swallowed would be lost, and coming back would
     * land somewhere short of where the drag started. Recomputing from the snapshot makes it
     * reversible.
     */
    /*
     * The reachable ends look like they would hold still for a whole gesture — a cascade over
     * bounds that never move — so it is tempting to resolve them once instead of twice a frame for
     * every handle. They do not hold still: how far the edge can retreat is capped by the room left
     * in the panel after it, which is the very thing the drag is spending. A held reading would
     * publish a stale `aria-valuemin` for as long as the pointer was down.
     */
    it("reads the reachable range afresh, because a drag moves it", () => {
      const { handleKeys, state } = setUp([
        { key: "a", minSize: 100 },
        { key: "b", maxSize: 550, minSize: 100 },
        { key: "c", minSize: 100 },
      ]);
      const handleKey = handleKeys[0]!;

      state.startResize(handleKey);

      const opening = state.handleRange(handleKey)!;

      state.resize(handleKey, 400);

      const during = state.handleRange(handleKey)!;

      expect(opening.min).toBe(117);
      expect(during.min).toBe(283);

      state.endResize();

      // What the drag published has to be what a reading taken from scratch gives.
      expect(during).toEqual(state.handleRange(handleKey));
    });

    /*
     * A percentage minimum of an odd track resolves to a fraction of a pixel, while the layout is
     * solved in whole ones — so the two sides of the cascade's conservation check come out a last
     * bit apart. Read exactly, that hair looks like the growing panel taking more than was let go
     * of, the whole move is abandoned, and both handles end up reporting where they already sit as
     * the far end they could reach.
     */
    it("reaches the real ends when a percentage minimum lands off a whole pixel", () => {
      const { handleKeys, state } = setUp([
        { key: "a", minSize: "15%" },
        { key: "b", minSize: "20%" },
        { key: "c", minSize: "15%" },
      ]);

      // Not the harness's round thousand: there every one of these minimums is a whole number of
      // pixels and the arithmetic lines up by luck.
      state.setAvailableSize(668);

      expect(state.layout.value).toEqual([223, 222, 223]);

      const first = state.handleRange(handleKeys[0]!)!;
      const second = state.handleRange(handleKeys[1]!)!;

      // 15% of 668, which is how far the first panel can actually be squeezed — not the 223 it is
      // sitting at.
      expect(first.min).toBeCloseTo(100.2, 4);
      expect(first.now).toBe(223);

      // And the other handle's far end, which the same bail used to pin to its current size.
      expect(second.max).toBeCloseTo(344.8, 4);
      expect(second.now).toBe(222);
    });

    it("re-resolves the neighbours when a panel joins and leaves", () => {
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }]);
      const root = document.body.firstElementChild!;

      expect(state.neighbours(handleKeys[0]!)).toEqual({ after: 1, before: 0 });

      const handleElement = document.createElement("div");
      const panelElement = document.createElement("div");

      root.append(handleElement, panelElement);
      state.registerHandle("late", { element: () => handleElement, size: () => HANDLE_SIZE });

      const unregister = state.registerPanel("c", panelMeta("c", panelElement));

      expect(state.neighbours("late")).toEqual({ after: 2, before: 1 });

      unregister();

      expect(state.neighbours("late")).toBeNull();
      expect(state.neighbours(handleKeys[0]!)).toEqual({ after: 1, before: 0 });
    });

    it("returns to where it started after being dragged past a minimum and back", () => {
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b", minSize: 400 }]);

      state.startResize(handleKeys[0]!);
      state.resize(handleKeys[0]!, 500);
      state.resize(handleKeys[0]!, 0);
      state.endResize();

      expect(state.layout.value).toEqual([500, 500]);
    });

    it("opens and closes a gesture once, whatever happens in between", () => {
      const onResizeEnd = vi.fn();
      const onResizeStart = vi.fn();
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }], {
        onResizeEnd,
        onResizeStart,
      });

      state.startResize(handleKeys[0]!);
      state.resize(handleKeys[0]!, 100);
      state.resize(handleKeys[0]!, 200);
      state.endResize();

      expect(onResizeStart).toHaveBeenCalledTimes(1);
      expect(onResizeStart).toHaveBeenCalledWith(["1fr", "1fr"]);
      expect(onResizeEnd).toHaveBeenCalledTimes(1);
      expect(onResizeEnd).toHaveBeenCalledWith(["1.4fr", "0.6fr"]);
    });

    // So a caller tracking the gesture can never be left holding one that never closed.
    it("closes the gesture with the sizes a cancel put back", () => {
      const onResizeEnd = vi.fn();
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }], { onResizeEnd });

      state.startResize(handleKeys[0]!);
      state.resize(handleKeys[0]!, 200);
      state.cancelResize();

      expect(onResizeEnd).toHaveBeenCalledTimes(1);
      expect(onResizeEnd).toHaveBeenCalledWith(["1fr", "1fr"]);
      expect(state.layout.value).toEqual([500, 500]);
    });

    it("reports no gesture for a start that never opened one", () => {
      const onResizeEnd = vi.fn();
      const { state } = setUp([{ key: "a" }, { key: "b" }], { onResizeEnd });

      state.endResize();
      state.cancelResize();

      expect(onResizeEnd).not.toHaveBeenCalled();
    });

    it("puts the snapshot back when a drag is cancelled", () => {
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }]);

      state.startResize(handleKeys[0]!);
      state.resize(handleKeys[0]!, 200);
      state.cancelResize();

      expect(state.layout.value).toEqual([500, 500]);
    });

    /*
     * Reverting behind the caller's back would leave a `v-model:sizes` holding the value the drag
     * last reached while the panels sat back where it opened.
     */
    it("reports the revert when a drag is cancelled", () => {
      const onSizesChange = vi.fn();
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }], { onSizesChange });

      state.startResize(handleKeys[0]!);
      state.resize(handleKeys[0]!, 200);
      state.cancelResize();

      expect(onSizesChange).toHaveBeenLastCalledWith(["1fr", "1fr"]);
    });

    /* Controlled, the caller owns the sizes, so being told to go back is the only way back. */
    it("tells a controlled caller to go back when a drag is cancelled", () => {
      const onSizesChange = vi.fn();
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }], {
        onSizesChange,
        sizes: () => ["300px", "1fr"],
      });

      state.startResize(handleKeys[0]!);
      state.resize(handleKeys[0]!, 100);
      state.cancelResize();

      expect(onSizesChange).toHaveBeenLastCalledWith([300, "1fr"]);
    });

    it("reopens a panel the cancelled drag shut", () => {
      const onExpand = vi.fn();
      const { handleKeys, state } = setUp(
        [{ collapsedSize: 0, isCollapsible: true, key: "a", minSize: 200 }, { key: "b" }],
        { onExpand },
      );

      state.startResize(handleKeys[0]!);
      state.resize(handleKeys[0]!, -410);
      expect(state.isCollapsed("a")).toBe(true);

      state.cancelResize();

      expect(state.isCollapsed("a")).toBe(false);
      expect(state.layout.value).toEqual([500, 500]);
      expect(onExpand).toHaveBeenCalledWith("a");
    });

    it("reports nothing for a cancel with nothing to put back", () => {
      const onSizesChange = vi.fn();
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }], { onSizesChange });

      state.startResize(handleKeys[0]!);
      state.cancelResize();

      expect(onSizesChange).not.toHaveBeenCalled();
    });

    it("stays put when there is no drag to cancel", () => {
      const onSizesChange = vi.fn();
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }], { onSizesChange });

      drag(state, handleKeys[0]!, 200);
      onSizesChange.mockClear();

      state.cancelResize();

      expect(state.layout.value).toEqual([700, 300]);
      expect(onSizesChange).not.toHaveBeenCalled();
    });
  });

  describe("writing the sizes back", () => {
    it("keeps a pixel panel in pixels", () => {
      const { handleKeys, state } = setUp([{ defaultSize: "240px", key: "a" }, { key: "b" }]);

      drag(state, handleKeys[0]!, 60);

      expect(state.sizes.value[0]).toBe(300);
    });

    it("keeps a percentage panel in percent", () => {
      const { handleKeys, state } = setUp([{ defaultSize: "25%", key: "a" }, { key: "b" }]);

      drag(state, handleKeys[0]!, 100);

      expect(state.sizes.value[0]).toBe("35%");
    });

    /* Two equal fractions come back out as `1fr` each, so an untouched split reads unchanged. */
    it("renormalises fractions so an even split stays 1fr", () => {
      const { state } = setUp([{ key: "a" }, { key: "b" }]);

      state.setSizes(state.sizes.value);

      expect(state.sizes.value).toEqual(["1fr", "1fr"]);
    });

    it("keeps fractional panels fractional, at the new ratio", () => {
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }]);

      drag(state, handleKeys[0]!, 100);

      expect(state.sizes.value).toEqual(["1.2fr", "0.8fr"]);
      expect(state.layout.value).toEqual([600, 400]);
    });

    /* The whole point of preserving the unit: a pixel sidebar holds while fractions re-divide. */
    it("holds a pixel panel across a container resize while fractions re-divide", () => {
      const { handleKeys, state } = setUp([{ defaultSize: "240px", key: "a" }, { key: "b" }]);

      drag(state, handleKeys[0]!, 60);
      state.setAvailableSize(600);

      expect(state.layout.value).toEqual([300, 300]);
    });

    it("reports the sizes to the caller as the edge moves", () => {
      const onSizesChange = vi.fn();
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }], { onSizesChange });

      drag(state, handleKeys[0]!, 100);

      expect(onSizesChange).toHaveBeenCalledWith(["1.2fr", "0.8fr"]);
    });

    /*
     * Past the limit every further move resolves to the layout already on screen, and reporting
     * that again would have every listener re-render for an edge that did not move.
     */
    it("reports nothing further once the edge is against a limit", () => {
      const onSizesChange = vi.fn();
      const { handleKeys, state } = setUp([{ key: "a", maxSize: 550 }, { key: "b" }], {
        onSizesChange,
      });

      state.startResize(handleKeys[0]!);
      state.resize(handleKeys[0]!, 100);
      state.resize(handleKeys[0]!, 200);
      state.resize(handleKeys[0]!, 300);
      state.endResize();

      expect(onSizesChange).toHaveBeenCalledTimes(1);
      expect(state.layout.value).toEqual([550, 450]);
    });
  });

  describe("controlled sizes", () => {
    it("lays out from the sizes it is given", () => {
      const { state } = setUp([{ key: "a" }, { key: "b" }], { sizes: () => ["300px", "1fr"] });

      expect(state.layout.value).toEqual([300, 700]);
    });

    it("reports what a drag would do without moving itself", () => {
      const onSizesChange = vi.fn();
      const { handleKeys, state } = setUp([{ key: "a" }, { key: "b" }], {
        onSizesChange,
        sizes: () => ["300px", "1fr"],
      });

      drag(state, handleKeys[0]!, 100);

      expect(onSizesChange).toHaveBeenCalledWith([400, "1fr"]);
      expect(state.layout.value).toEqual([300, 700]);
    });
  });

  describe("collapsing", () => {
    it("snaps shut once the drag passes the midpoint between collapsed and minimum", () => {
      const onCollapse = vi.fn();
      const { handleKeys, state } = setUp(
        [{ collapsedSize: 0, isCollapsible: true, key: "a", minSize: 200 }, { key: "b" }],
        { onCollapse },
      );

      // 500 - 410 = 90, which is under the 100px midpoint.
      drag(state, handleKeys[0]!, -410);

      expect(state.layout.value).toEqual([0, 1000]);
      expect(state.isCollapsed("a")).toBe(true);
      expect(onCollapse).toHaveBeenCalledWith("a");
    });

    it("holds at the minimum while the drag is short of the midpoint", () => {
      const { handleKeys, state } = setUp(
        [{ collapsedSize: 0, isCollapsible: true, key: "a", minSize: 200 }, { key: "b" }],
        {},
      );

      // 500 - 380 = 120, which is over the midpoint, so it stops at the minimum instead.
      drag(state, handleKeys[0]!, -380);

      expect(state.layout.value).toEqual([200, 800]);
      expect(state.isCollapsed("a")).toBe(false);
    });

    it("leaves a rail behind when the collapsed size is not zero", () => {
      const { handleKeys, state } = setUp(
        [{ collapsedSize: 48, isCollapsible: true, key: "a", minSize: 200 }, { key: "b" }],
        {},
      );

      drag(state, handleKeys[0]!, -450);

      expect(state.layout.value).toEqual([48, 952]);
      expect(state.isCollapsed("a")).toBe(true);
    });

    it("never snaps a panel that is not collapsible", () => {
      const { handleKeys, state } = setUp([{ key: "a", minSize: 200 }, { key: "b" }]);

      drag(state, handleKeys[0]!, -450);

      expect(state.layout.value).toEqual([200, 800]);
    });

    it("reopens a collapsed panel where it was before it shut", () => {
      const onExpand = vi.fn();
      const { handleKeys, state } = setUp(
        [{ collapsedSize: 0, isCollapsible: true, key: "a", minSize: 200 }, { key: "b" }],
        { onExpand },
      );

      drag(state, handleKeys[0]!, -100);
      const before = state.sizes.value[0];

      state.collapse("a");
      expect(state.layout.value).toEqual([0, 1000]);

      state.expand("a");

      expect(state.sizes.value[0]).toBe(before);
      expect(onExpand).toHaveBeenCalledWith("a");
    });

    it("toggles from either side", () => {
      const { state } = setUp([{ isCollapsible: true, key: "a", minSize: 200 }, { key: "b" }]);

      state.toggleCollapse("a");
      expect(state.isCollapsed("a")).toBe(true);

      state.toggleCollapse("a");
      expect(state.isCollapsed("a")).toBe(false);
    });
  });

  describe("resetting", () => {
    it("puts the panels back to what they declare", () => {
      const { handleKeys, state } = setUp([{ defaultSize: "300px", key: "a" }, { key: "b" }]);

      drag(state, handleKeys[0]!, 200);
      expect(state.layout.value).toEqual([500, 500]);

      state.reset(["a", "b"]);

      expect(state.layout.value).toEqual([300, 700]);
    });

    it("reopens a collapsed panel it resets", () => {
      const { state } = setUp([
        { defaultSize: "300px", isCollapsible: true, key: "a", minSize: 100 },
        { key: "b" },
      ]);

      state.collapse("a");
      state.reset(["a", "b"]);

      expect(state.isCollapsed("a")).toBe(false);
      expect(state.layout.value).toEqual([300, 700]);
    });
  });
});

function panelMeta(key: string, element: HTMLElement): SplitterPanelMeta {
  return {
    collapsedSize: () => undefined,
    defaultSize: () => undefined,
    element: () => element,
    id: () => `panel-${key}`,
    isCollapsible: () => false,
    maxSize: () => undefined,
    minSize: () => undefined,
    size: () => undefined,
  };
}
