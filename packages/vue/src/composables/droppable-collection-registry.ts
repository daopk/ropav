import type {UseDroppableCollectionStateReturn} from "./use-droppable-collection-state";
import type {ShallowRef} from "vue";

/**
 * Which element and id each droppable collection state belongs to.
 *
 * An item needs both — its id to be labelled by, its element to tell an internal drag from a
 * foreign one — but it is handed only the state, because that is the one thing a collection and
 * its items already share. `useDroppableCollection` records the rest here on the way past.
 *
 * Deliberately outside `utils/`, unlike the rest of the drag and drop machinery: the key is a
 * composable's return type, and `utils/` never imports from `composables/`.
 *
 * Weak, so a collection that unmounts takes its entry with it.
 */
interface DroppableCollectionEntry {
  id: string;
  element: ShallowRef<HTMLElement | null>;
}

const registry = new WeakMap<object, DroppableCollectionEntry>();

export const registerDroppableCollection = (
  state: UseDroppableCollectionStateReturn<unknown>,
  entry: DroppableCollectionEntry,
): void => {
  registry.set(state, entry);
};

const entryFor = (state: object): DroppableCollectionEntry => {
  const entry = registry.get(state);

  if (!entry) throw new Error("Droppable item outside a droppable collection");

  return entry;
};

/** The id of the collection this state belongs to, for an item to be labelled by. */
export const getDroppableCollectionId = (state: object): string => entryFor(state).id;

/** The element of the collection this state belongs to. */
export const getDroppableCollectionElement = (state: object): ShallowRef<HTMLElement | null> =>
  entryFor(state).element;
