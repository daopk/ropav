import type {CollectionKey} from "../../composables/use-collection";
import type {
  DisabledBehavior,
  SelectionBehavior,
  SelectionMode,
} from "../../composables/use-selection-manager";
import type {TagVariants} from "@heroui/styles";

export interface TagGroupRootProps {
  class?: string;
  /** Size shared by every tag in the group. */
  size?: TagVariants["size"];
  /** Visual variant shared by every tag in the group. */
  variant?: TagVariants["variant"];
  /** Whether one, many or no tags can be selected. @default "none" */
  selectionMode?: SelectionMode;
  /** What a press means when several tags can be selected. @default "toggle" */
  selectionBehavior?: SelectionBehavior;
  selectedKeys?: "all" | Iterable<CollectionKey>;
  defaultSelectedKeys?: "all" | Iterable<CollectionKey>;
  disabledKeys?: Iterable<CollectionKey>;
  /** @default "all" */
  disabledBehavior?: DisabledBehavior;
  disallowEmptySelection?: boolean;
  /**
   * Called with the keys to remove. Supplying it is what offers a remove button on each tag —
   * the same signal React reads.
   */
  onRemove?: (keys: Set<CollectionKey>) => void;
}

export interface TagGroupListProps {
  class?: string;
  /** Accessible name for the list, for when the group has no visible label. */
  ariaLabel?: string;
}
