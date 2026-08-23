import type {DefaultDateProps} from "@/composables/use-default-date-props";
import type {Granularity} from "@/utils/date-format";
import type {DateValue} from "@internationalized/date";

export interface DefaultDatePropsHostProps {
  value?: DateValue | null;
  granularity?: Granularity;
  /** Hands the live answers back to the test. */
  onReady?: (props: DefaultDateProps) => void;
}
