import type { PlacementAxis } from "../../utils/position";
import type { OverlayArrowContext, OverlayScopeContext } from "./overlay.context";
import type { ComputedRef, ShallowRef } from "vue";

import { computed, shallowRef } from "vue";

import { provideFocusResponder } from "../../composables/focus-responder";
import { providePressResponder } from "../../composables/press-responder";

import { provideOverlayArrowContext, provideOverlayScopeContext } from "./overlay.context";

/**
 * What an overlay offers the content inside it, owned separately from the overlay itself.
 *
 * The split exists because of where the content comes from. An overlay renders its content into a
 * teleport, and a `provide` made by the component that owns that teleport does not reach content
 * handed to it from outside and forwarded through another component's slot — which is exactly the
 * shape of `Popover.Content` wrapping the shared overlay. The wrapper therefore owns these two
 * contexts and provides them to its own slot content, where the ancestry is direct, and hands them
 * to the overlay to fill in.
 *
 * An overlay used without a wrapper makes its own, so nothing has to be threaded for the simple
 * case.
 */
export interface OverlaySlotContexts {
  arrow: OverlayArrowContext;
  scope: OverlayScopeContext;
  /** The arrow element, for the overlay to measure and reserve room for. */
  arrowElement: ShallowRef<Element | null>;
  /** How many dialogs are rendered inside, so the overlay knows to stop being one. */
  registeredDialogs: ShallowRef<number>;
  /** How many elements inside have asked the overlay to hold focus. */
  focusContainRequests: ShallowRef<number>;
  /** Called by the overlay once it knows where the arrow goes and what it is named. */
  publish: (values: {
    style: ComputedRef<Record<string, string>>;
    placement: ComputedRef<PlacementAxis | null>;
    dialogId: ComputedRef<string | undefined>;
    close: () => void;
  }) => void;
}

const EMPTY_STYLE: Record<string, string> = {};

export const createOverlaySlotContexts = (): OverlaySlotContexts => {
  const arrowElement = shallowRef<Element | null>(null);
  const registeredDialogs = shallowRef(0);
  const focusContainRequests = shallowRef(0);

  let dialogCount = 0;
  let containRequests = 0;

  const style = shallowRef<ComputedRef<Record<string, string>> | null>(null);
  const placement = shallowRef<ComputedRef<PlacementAxis | null> | null>(null);
  const dialogId = shallowRef<ComputedRef<string | undefined> | null>(null);
  let close = () => {};

  return {
    arrow: {
      placement: computed(() => placement.value?.value ?? null),
      registerElement: (next) => {
        arrowElement.value = next;
      },
      style: computed(() => style.value?.value ?? EMPTY_STYLE),
    },
    arrowElement,
    focusContainRequests,
    publish: (values) => {
      style.value = values.style;
      placement.value = values.placement;
      dialogId.value = values.dialogId;
      close = values.close;
    },
    registeredDialogs,
    scope: {
      close: () => close(),
      dialogId: computed(() => dialogId.value?.value),
      registerDialog: () => {
        registeredDialogs.value = ++dialogCount;

        return () => {
          registeredDialogs.value = --dialogCount;
        };
      },
      requestFocusContain: () => {
        focusContainRequests.value = ++containRequests;

        return () => {
          focusContainRequests.value = --containRequests;
        };
      },
    },
  };
};

/**
 * Establish the boundary the overlay's content resolves its contexts against.
 *
 * Every wrapper around the shared overlay calls this and passes the same contexts down, because
 * content forwarded through a wrapper's slot resolves against the wrapper — not against the overlay
 * that renders it into a teleport. Provided anywhere further in, none of it is found.
 *
 * Both responder channels are cleared here for the same reason the rest is offered here. Nothing
 * inside an overlay is the trigger, so a button in a popover's content must not inherit the
 * trigger's press or the hover and focus of whatever is watching it — otherwise it toggles the
 * overlay, and worse, registers itself as the element the overlay is positioned against and claims
 * the trigger's id. React Aria clears the same two contexts at the same boundary.
 */
export const provideOverlaySlotContexts = (contexts: OverlaySlotContexts): void => {
  provideOverlayArrowContext(contexts.arrow);
  provideOverlayScopeContext(contexts.scope);
  providePressResponder(null);
  provideFocusResponder(null);
};
