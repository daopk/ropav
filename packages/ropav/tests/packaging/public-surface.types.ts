import type { MenuTriggerType } from "@/index";

/*
 * Types that a public prop names and the composables barrel does not carry, pinned by naming them.
 *
 * `composables.test.ts` finds these by reading source, which catches the barrel line going missing.
 * It cannot catch the symbol failing to resolve for a consumer, and structural typing hides that:
 * `DropdownRootProps["trigger"]` compiles whether or not `MenuTriggerType` is exported. The pain a
 * consumer actually feels is `const trigger: MenuTriggerType`, so the only proof is a file that
 * names the type and asks the compiler to resolve it from the package entry.
 *
 * Covered by `pnpm typecheck`, which includes `tests`, and never shipped — `tsconfig.build.json`
 * takes `src` alone. One entry per type, keyed by the component whose barrel carries it.
 */
export interface HostExportedTypes {
  "dropdown: MenuTriggerType": MenuTriggerType;
}
