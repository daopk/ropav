import type { CollectionKey } from "../../composables/use-collection";
import type { FlexSize, FlexSizeDefinition } from "../../utils/flex-sizing";
import type { ComputedRef, MaybeRefOrGetter } from "vue";

import { computed, shallowRef, toValue } from "vue";

import { sortByDocumentOrder } from "../../utils/document-order";
import { calculateFlexSizes, getMaxSize, getMinSize, isStaticSize } from "../../utils/flex-sizing";

/** A panel size: pixels as a number or a `px` string, a percentage, or a fraction of what is left. */
export type SplitterSize = FlexSize;

export type SplitterOrientation = "horizontal" | "vertical";

/**
 * What a panel tells the splitter about itself.
 *
 * Held as getters rather than values, so a panel registers once and the splitter always reads its
 * current props. Nothing has to re-register when a `minSize` changes.
 */
export interface SplitterPanelMeta {
  element: () => HTMLElement | null;
  /** The panel's DOM id, which the handle beside it points `aria-controls` at. */
  id: () => string;
  size: () => SplitterSize | null | undefined;
  defaultSize: () => SplitterSize | null | undefined;
  minSize: () => SplitterSize | null | undefined;
  maxSize: () => SplitterSize | null | undefined;
  isCollapsible: () => boolean;
  collapsedSize: () => SplitterSize | null | undefined;
}

export interface SplitterHandleMeta {
  element: () => HTMLElement | null;
  size: () => number;
}

export interface UseSplitterStateOptions {
  orientation: MaybeRefOrGetter<SplitterOrientation | undefined>;
  isDisabled: MaybeRefOrGetter<boolean | undefined>;
  /** Declared sizes in panel order. Set, the splitter never writes its own state. */
  sizes: MaybeRefOrGetter<SplitterSize[] | undefined>;
  defaultSizes: MaybeRefOrGetter<SplitterSize[] | undefined>;
  onSizesChange?: (sizes: SplitterSize[]) => void;
  onCollapse?: (key: CollectionKey) => void;
  onExpand?: (key: CollectionKey) => void;
}

const PERCENT_UNIT = /%$/;
const FRACTION_UNIT = /fr$/;

type SizeUnit = "pixels" | "percent" | "fraction";

/** Which family a declared size belongs to, so a drag can write its result back in the same one. */
const unitOf = (size: SplitterSize | null | undefined): SizeUnit => {
  if (size == null) return "fraction";
  if (typeof size === "number") return "pixels";
  if (PERCENT_UNIT.test(size)) return "percent";
  if (FRACTION_UNIT.test(size)) return "fraction";

  return isStaticSize(size) ? "pixels" : "fraction";
};

/** Trim the float a division leaves behind, without pinning the value to whole pixels. */
const round = (value: number) => Number(value.toFixed(4));

const registry = <Meta extends { element: () => HTMLElement | null }>() => {
  // A plain Map rather than `reactive`: the values are getter bundles, and wrapping them in a
  // proxy would only add identity surprises. Reactivity comes from `version` instead.
  const items = new Map<CollectionKey, Meta>();
  const version = shallowRef(0);

  /*
   * A computed, unlike `useCollection`'s deliberate plain function. There, order is only ever read
   * on an interaction. Here a panel's `flex-basis` and a handle's `aria-valuenow` are both derived
   * from position and read during render, so the order has to be reactive — and re-sorting on a
   * registration is cheap for the handful of panels a splitter holds.
   */
  const keys = computed(() => {
    void version.value;

    return sortByDocumentOrder([...items.entries()], ([, meta]) => meta.element()).map(
      ([key]) => key,
    );
  });

  return {
    get: (key: CollectionKey) => {
      void version.value;

      return items.get(key);
    },
    keys,
    register: (key: CollectionKey, meta: Meta) => {
      items.set(key, meta);
      version.value += 1;

      return () => {
        // Only drop the entry if it still points at this registration, so an item that
        // re-registers under the same key during a move is not removed by the old cleanup.
        if (items.get(key) === meta) {
          items.delete(key);
          version.value += 1;
        }
      };
    },
  };
};

export interface SplitterState {
  orientation: ComputedRef<SplitterOrientation>;
  isDisabled: ComputedRef<boolean>;

  panelKeys: ComputedRef<CollectionKey[]>;
  registerPanel: (key: CollectionKey, meta: SplitterPanelMeta) => () => void;
  registerHandle: (key: CollectionKey, meta: SplitterHandleMeta) => () => void;
  getPanel: (key: CollectionKey) => SplitterPanelMeta | undefined;
  /** The panels a handle divides, as indexes into `panelKeys`. */
  neighbours: (handleKey: CollectionKey) => { before: number; after: number } | null;

  /** What the panels divide: the container less every handle. Zero until the root measures. */
  availableSize: ComputedRef<number>;
  setAvailableSize: (size: number) => void;

  /** Every panel's resolved size in pixels, in panel order. Empty while unmeasured. */
  layout: ComputedRef<number[]>;
  getPanelSize: (key: CollectionKey) => number;
  isCollapsed: (key: CollectionKey) => boolean;

  /**
   * Where the edge sits and how far it could travel, in pixels, measured on the panel before it.
   * The ends come from running the cascade rather than from that panel's own bounds, so they
   * report what the handle can actually reach given every neighbour's constraints.
   */
  handleRange: (handleKey: CollectionKey) => { now: number; min: number; max: number } | null;

  resizingHandle: ComputedRef<CollectionKey | null>;
  startResize: (handleKey: CollectionKey) => void;
  /** Apply a pixel delta measured from the snapshot `startResize` took. */
  resize: (handleKey: CollectionKey, totalDelta: number) => void;
  endResize: () => void;
  cancelResize: () => void;

  collapse: (key: CollectionKey) => void;
  expand: (key: CollectionKey) => void;
  toggleCollapse: (key: CollectionKey) => void;
  /** Drop the stored sizes for these panels, so their declared defaults take over again. */
  reset: (keys: CollectionKey[]) => void;

  /** Declared sizes in panel order — what `v-model:sizes` carries and what is persisted. */
  sizes: ComputedRef<SplitterSize[]>;
  setSizes: (sizes: SplitterSize[]) => void;
}

export const useSplitterState = (options: UseSplitterStateOptions): SplitterState => {
  const panels = registry<SplitterPanelMeta>();
  const handles = registry<SplitterHandleMeta>();

  const containerSize = shallowRef(0);
  const resizingHandle = shallowRef<CollectionKey | null>(null);

  /*
   * Keyed rather than positional, so a panel behind a `v-if` toggling does not shift everyone
   * else's entry. This is the one place the table's layout must not be copied: it starts its
   * uncontrolled widths over whenever the key list changes, which here would throw away a layout
   * the user built by hand every time a panel appeared.
   */
  const stored = shallowRef(new Map<CollectionKey, SplitterSize>());
  const collapsed = shallowRef(new Set<CollectionKey>());
  /** What a collapsible panel held before it shut, so re-opening returns it there. */
  const remembered = new Map<CollectionKey, SplitterSize>();

  const orientation = computed(() => toValue(options.orientation) ?? "horizontal");
  const isDisabled = computed(() => toValue(options.isDisabled) ?? false);

  const isControlled = computed(() => toValue(options.sizes) !== undefined);

  const handleTotal = computed(() =>
    handles.keys.value.reduce<number>((total, key) => total + (handles.get(key)?.size() ?? 0), 0),
  );

  const availableSize = computed(() => Math.max(0, containerSize.value - handleTotal.value));

  /** The declared size the layout should use for a panel, before the solver resolves it. */
  const declaredOf = (key: CollectionKey, index: number): SplitterSize | null | undefined => {
    const panel = panels.get(key);

    if (!panel) return undefined;
    if (collapsed.value.has(key)) return panel.collapsedSize() ?? 0;

    // A controlled `sizes` array outranks anything a drag stored, which is what controlled means.
    const controlled = toValue(options.sizes)?.[index];

    if (controlled !== undefined) return controlled;

    return (
      stored.value.get(key) ??
      panel.size() ??
      toValue(options.defaultSizes)?.[index] ??
      panel.defaultSize()
    );
  };

  const definitionsOf = (): FlexSizeDefinition[] =>
    panels.keys.value.map((key, index) => {
      const panel = panels.get(key)!;
      const isShut = collapsed.value.has(key);

      return {
        defaultSize: panel.defaultSize(),
        maxSize: isShut ? undefined : panel.maxSize(),
        // A shut panel is pinned to its collapsed size, which is below the minimum by definition.
        minSize: isShut ? 0 : panel.minSize(),
        size: declaredOf(key, index),
      };
    });

  const layout = computed<number[]>(() => {
    const available = availableSize.value;

    // Unmeasured, or laid out inside something hidden. Reporting zeros would persist a layout of
    // nothing, so the component renders no basis at all instead.
    if (available <= 0 || panels.keys.value.length === 0) return [];

    return calculateFlexSizes(
      available,
      definitionsOf(),
      () => "1fr",
      () => 0,
    );
  });

  const indexOf = (key: CollectionKey) => panels.keys.value.indexOf(key);

  const getPanelSize = (key: CollectionKey) => layout.value[indexOf(key)] ?? 0;

  const boundsOf = (index: number) => {
    const key = panels.keys.value[index]!;
    const panel = panels.get(key)!;
    const available = availableSize.value;
    const min = getMinSize(panel.minSize(), available);
    const shut = panel.isCollapsible() ? getMinSize(panel.collapsedSize() ?? 0, available) : min;

    return {
      floor: Math.min(shut, min),
      isCollapsible: panel.isCollapsible(),
      max: getMaxSize(panel.maxSize(), available),
      min,
    };
  };

  /**
   * The nearest size a panel may legally hold.
   *
   * A collapsible panel has a gap in its range — everything between its collapsed size and its
   * minimum is unreachable — so a size that lands in the gap snaps to whichever end is nearer.
   * The midpoint is the threshold, which needs no constant of its own and scales with whatever
   * minimum the caller chose.
   */
  const legalize = (index: number, intended: number) => {
    const { floor, isCollapsible, max, min } = boundsOf(index);

    if (intended > max) return max;
    if (!isCollapsible) return Math.max(intended, min);
    if (intended >= min) return intended;

    return intended < (floor + min) / 2 ? floor : min;
  };

  /**
   * Move the edge at `handleIndex` by `delta`, taking from one side and giving it to the other.
   *
   * The shrinking side cascades: a neighbour already sitting on its floor is walked past, so a
   * three-panel group keeps responding once the middle panel is spent. The growing side
   * deliberately does not, because spreading growth outward would move a handle nobody touched.
   */
  const resolveDelta = (base: number[], handleIndex: number, delta: number): number[] => {
    if (delta === 0) return [...base];

    const growing = delta > 0 ? handleIndex : handleIndex + 1;
    const step = delta > 0 ? 1 : -1;
    const first = delta > 0 ? handleIndex + 1 : handleIndex;

    const release = (demand: number) => {
      const next = [...base];
      let taken = 0;

      for (let i = first; i >= 0 && i < base.length && taken < demand; i += step) {
        const intended = base[i]! - (demand - taken);
        // Where the panel actually ends up, which is not always `intended`: a collapsible one
        // snapping shut releases its whole size, more than was asked for.
        const landing = legalize(i, intended);
        const give = base[i]! - landing;

        if (give > 0) {
          next[i] = landing;
          taken += give;
        }
      }

      return { next, taken };
    };

    let released = release(Math.abs(delta));
    let applied = legalize(growing, base[growing]! + released.taken) - base[growing]!;

    // The grow-side clamp changed how much is actually wanted, so ask the shrinking side again
    // for exactly that. A third pass could only re-derive the second.
    if (applied !== released.taken) {
      released = release(Math.max(applied, 0));
      applied = legalize(growing, base[growing]! + released.taken) - base[growing]!;
    }

    // Conservation beats the snap: a panel cannot take more than the other side let go of.
    if (applied > released.taken) return [...base];

    const next = released.next;

    next[growing] = base[growing]! + applied;

    return next;
  };

  /** Write pixel sizes back in the unit each panel declared, so intent survives a resize. */
  const toDeclared = (pixels: number[]): Map<CollectionKey, SplitterSize> => {
    const keys = panels.keys.value;
    const available = availableSize.value;
    const units = keys.map((key, index) => unitOf(declaredOf(key, index)));

    const fractionIndexes = units.flatMap((unit, index) => (unit === "fraction" ? [index] : []));
    const fractionPixels = fractionIndexes.reduce((total, index) => total + pixels[index]!, 0);

    const next = new Map<CollectionKey, SplitterSize>();

    keys.forEach((key, index) => {
      const size = pixels[index]!;

      if (units[index] === "pixels") {
        next.set(key, round(size));
      } else if (units[index] === "percent") {
        next.set(key, `${round(available > 0 ? (size / available) * 100 : 0)}%`);
      } else {
        /*
         * Renormalised so the weights sum to the number of fractional panels: an even split comes
         * back out as `1fr` each, and the ratio is exact rather than approximate because
         * conservation guarantees these pixels sum to the space the fractions share.
         */
        const weight = fractionPixels > 0 ? (size / fractionPixels) * fractionIndexes.length : 1;

        next.set(key, `${round(weight)}fr`);
      }
    });

    return next;
  };

  const sizes = computed<SplitterSize[]>(() =>
    panels.keys.value.map((key, index) => declaredOf(key, index) ?? "1fr"),
  );

  const commit = (next: Map<CollectionKey, SplitterSize>) => {
    if (!isControlled.value) stored.value = next;

    options.onSizesChange?.(panels.keys.value.map((key) => next.get(key) ?? "1fr"));
  };

  /** The pixel layout a drag measures its deltas against, taken once when the drag opens. */
  let snapshot: number[] = [];
  let snapshotStored: Map<CollectionKey, SplitterSize> | null = null;

  const applyPixels = (pixels: number[]) => {
    const next = toDeclared(pixels);
    const wasCollapsed = new Set(collapsed.value);
    const shut = new Set<CollectionKey>();

    panels.keys.value.forEach((key, index) => {
      const panel = panels.get(key)!;

      if (!panel.isCollapsible()) return;

      const { floor, min } = boundsOf(index);

      if (pixels[index]! <= floor && floor < min) shut.add(key);
    });

    for (const key of shut) {
      if (!wasCollapsed.has(key)) remembered.set(key, stored.value.get(key) ?? "1fr");
    }

    collapsed.value = shut;
    commit(next);

    for (const key of shut) if (!wasCollapsed.has(key)) options.onCollapse?.(key);
    for (const key of wasCollapsed) if (!shut.has(key)) options.onExpand?.(key);
  };

  const neighboursOf = (handleKey: CollectionKey) => {
    const element = handles.get(handleKey)?.element();

    if (!element) return null;

    // The handle sits among the panels in one parent, so the count of panels that precede it in
    // document order is exactly the index of the panel it grows.
    const before =
      panels.keys.value.filter((key) => {
        const panel = panels.get(key)?.element();

        return panel && panel.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING;
      }).length - 1;

    if (before < 0 || before + 1 >= panels.keys.value.length) return null;

    return { after: before + 1, before };
  };

  const collapse = (key: CollectionKey) => {
    const panel = panels.get(key);

    if (!panel?.isCollapsible() || collapsed.value.has(key)) return;

    remembered.set(key, stored.value.get(key) ?? panel.size() ?? panel.defaultSize() ?? "1fr");
    collapsed.value = new Set(collapsed.value).add(key);
    options.onCollapse?.(key);
  };

  const expand = (key: CollectionKey) => {
    if (!collapsed.value.has(key)) return;

    const next = new Set(collapsed.value);

    next.delete(key);
    collapsed.value = next;

    const panel = panels.get(key);
    const restored = new Map(stored.value);

    restored.set(key, remembered.get(key) ?? panel?.defaultSize() ?? panel?.minSize() ?? "1fr");
    if (!isControlled.value) stored.value = restored;

    options.onExpand?.(key);
  };

  const handleRange = (handleKey: CollectionKey) => {
    const pair = neighboursOf(handleKey);
    const base = layout.value;

    if (!pair || base.length === 0) return null;

    return {
      max: resolveDelta(base, pair.before, Number.MAX_SAFE_INTEGER)[pair.before]!,
      min: resolveDelta(base, pair.before, -Number.MAX_SAFE_INTEGER)[pair.before]!,
      now: base[pair.before]!,
    };
  };

  return {
    availableSize,
    cancelResize: () => {
      if (snapshotStored) {
        stored.value = snapshotStored;
        snapshotStored = null;
      }
      resizingHandle.value = null;
    },
    collapse,
    endResize: () => {
      snapshotStored = null;
      resizingHandle.value = null;
    },
    expand,
    getPanel: (key) => panels.get(key),
    getPanelSize,
    handleRange,
    isCollapsed: (key) => collapsed.value.has(key),
    isDisabled,
    layout,
    neighbours: neighboursOf,
    orientation,
    panelKeys: panels.keys,
    registerHandle: handles.register,
    registerPanel: panels.register,
    reset: (keys) => {
      const next = new Map(stored.value);
      const stillShut = new Set(collapsed.value);

      for (const key of keys) {
        next.delete(key);
        stillShut.delete(key);
        remembered.delete(key);
      }

      collapsed.value = stillShut;
      if (!isControlled.value) stored.value = next;

      options.onSizesChange?.(sizes.value);
    },
    resize: (handleKey, totalDelta) => {
      if (resizingHandle.value !== handleKey || snapshot.length === 0) return;

      const pair = neighboursOf(handleKey);

      if (!pair) return;

      applyPixels(resolveDelta(snapshot, pair.before, totalDelta));
    },
    resizingHandle: computed(() => resizingHandle.value),
    setAvailableSize: (size) => {
      containerSize.value = size;
    },
    setSizes: (next) => {
      const keyed = new Map<CollectionKey, SplitterSize>();

      panels.keys.value.forEach((key, index) => {
        const size = next[index];

        if (size !== undefined) keyed.set(key, size);
      });

      commit(keyed);
    },
    sizes,
    startResize: (handleKey) => {
      snapshot = [...layout.value];
      snapshotStored = new Map(stored.value);
      resizingHandle.value = handleKey;
    },
    toggleCollapse: (key) => {
      if (collapsed.value.has(key)) expand(key);
      else collapse(key);
    },
  };
};
