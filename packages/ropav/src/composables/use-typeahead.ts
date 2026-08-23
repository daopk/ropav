import type { CollectionKey } from "./use-collection";
import type { MaybeRefOrGetter } from "vue";

import { onScopeDispose, toValue } from "vue";

/** How long a partial search stays live before it is forgotten. */
const TYPEAHEAD_DEBOUNCE_MS = 1000;

/**
 * The character a key event contributes to a search, or `""` for a key that is a command
 * rather than a character.
 *
 * A single-character key is an ASCII character. Anything longer is a named key
 * (`ArrowDown`, `Enter`, `Home`), all of which begin with a Latin letter — so a name that
 * does *not* start with one is a Unicode character, not a command.
 */
const getStringForKey = (key: string): string =>
  key.length === 1 || !/^[A-Z]/i.test(key) ? key : "";

export interface UseTypeaheadOptions {
  /**
   * Resolve a search string to a key, preferring keys after `fromKey`. Returning `null` means
   * no match.
   */
  getKeyForSearch: (search: string, fromKey?: CollectionKey | null) => CollectionKey | null;
  /** The key focus currently sits on, used to search forwards from. */
  focusedKey: MaybeRefOrGetter<CollectionKey | null>;
  /** Called with the key a search landed on. */
  onSearchMatch: (key: CollectionKey) => void;
  isDisabled?: MaybeRefOrGetter<boolean | undefined>;
}

export interface UseTypeaheadReturn {
  /** Bubble phase: appends a character and moves focus. */
  onKeydown: (event: KeyboardEvent) => void;
  /**
   * Capture phase: claims Space, but **only** while a search is already running. Bound on
   * capture so the character reaches the search before the item's own Space handler treats it
   * as an activation.
   */
  onKeydownCapture: (event: KeyboardEvent) => void;
  /** Forget the current search. */
  reset: () => void;
}

/**
 * Move focus by typing, ported from React Aria's `useTypeSelect`.
 *
 * The subtle part is Space. A leading Space must not start a search — it is how a user
 * activates the focused item — but a Space *within* a search has to extend it, or typing
 * "New file" would toggle selection halfway through. That is the whole reason there are two
 * handlers: the capture-phase one consumes Space before the item can act on it, and only ever
 * while a search is in flight.
 */
export const useTypeahead = (options: UseTypeaheadOptions): UseTypeaheadReturn => {
  let search = "";
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const restartTimer = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      search = "";
    }, TYPEAHEAD_DEBOUNCE_MS);
  };

  const reset = () => {
    search = "";
    clearTimeout(timeout);
    timeout = undefined;
  };

  /** Search forwards from the focused key, then from the top. Returns whether it landed. */
  const runSearch = (): boolean => {
    const key =
      options.getKeyForSearch(search, toValue(options.focusedKey)) ??
      options.getKeyForSearch(search);

    if (key == null) return false;

    options.onSearchMatch(key);

    return true;
  };

  const onKeydownCapture = (event: KeyboardEvent) => {
    if (toValue(options.isDisabled)) return;
    // Only mid-search. A leading Space belongs to whatever the focused item does with it.
    if (search.length === 0 || event.key !== " ") return;

    event.preventDefault();
    event.stopPropagation();

    search += " ";
    runSearch();
    restartTimer();
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (toValue(options.isDisabled)) return;

    const character = getStringForKey(event.key);

    if (!character || event.ctrlKey || event.metaKey || event.altKey) return;

    const target = event.target;
    const currentTarget = event.currentTarget;

    // A portalled control renders elsewhere in the DOM, so its keys are not ours.
    if (
      currentTarget instanceof Node &&
      target instanceof Node &&
      !currentTarget.contains(target)
    ) {
      return;
    }

    // Handled on capture instead, so the item's activation still works.
    if (search.length === 0 && character === " ") return;

    search += character;

    if (!runSearch()) {
      // Nothing matched, so the search is over. Deliberately no `preventDefault` — the key
      // was not consumed, and swallowing it would break whatever else was listening.
      reset();

      return;
    }

    event.preventDefault();
    event.stopPropagation();
    restartTimer();
  };

  onScopeDispose(() => clearTimeout(timeout));

  return { onKeydown, onKeydownCapture, reset };
};
