import type {
  PushPasswordManagerStrategy,
  UsePasswordManagerBadgeReturn,
} from "@/composables/use-password-manager-badge";

export interface PasswordManagerBadgeHostProps {
  pushPasswordManagerStrategy?: PushPasswordManagerStrategy;
  isFocused?: boolean;
  /** Hands the badge state out, since a composable cannot be reached from outside its component. */
  onReady: (badge: UsePasswordManagerBadgeReturn) => void;
}
