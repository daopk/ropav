/**
 * Maps variant props onto class names.
 *
 * Every class a recipe emits is a BEM name, so there is nothing to deduplicate and no conflict
 * to resolve: a caller's utility already wins on cascade order, since component rules sit in the
 * `components` layer and utilities in the later `utilities` one. Concatenation is the whole job.
 */

type ClassValue = ClassValue[] | string | false | null | undefined;

type Props = Record<string, unknown>;

type VariantClasses = string | Record<string, string>;

interface Config {
  base?: string;
  defaultVariants?: Record<string, unknown>;
  slots?: Record<string, string>;
  variants?: Record<string, Record<string, VariantClasses>>;
}

type ClassProp = { class?: ClassValue };

type StringToBoolean<T> = T extends "false" | "true" ? boolean : T;

type Selection<C> = C extends { variants: infer V }
  ? { [K in keyof V]?: StringToBoolean<keyof V[K] & string> }
  : object;

type Recipe<C> = C extends { slots: infer S }
  ? (props?: ClassProp & Selection<C>) => {
      [K in keyof S]: (props?: ClassProp & Selection<C>) => string;
    }
  : (props?: ClassProp & Selection<C>) => string;

/** The variant props a recipe accepts, for deriving a component's own prop types. */
export type VariantProps<T> = T extends (props?: infer P) => unknown
  ? Omit<NonNullable<P>, "class">
  : never;

const flatten = (value: ClassValue): string =>
  Array.isArray(value) ? value.map(flatten).filter(Boolean).join(" ") : value || "";

export const tv = <C extends Config>(config: C): Recipe<C> => {
  const { base, defaultVariants, slots, variants } = config;
  const slotClasses = slots ?? { base: base ?? "" };

  /** `inherited` carries what the root call resolved, for a slot resolving itself afterwards. */
  const build = (slot: string, props: Props, inherited: Props = {}): string => {
    const parts: (string | undefined)[] = [slotClasses[slot]];

    for (const [name, group] of Object.entries(variants ?? {})) {
      // Key by key rather than by spread: a slot naming a variant it has no value for must fall
      // through to the root call instead of erasing it.
      const selected = props[name] ?? inherited[name] ?? defaultVariants?.[name];

      if (typeof selected !== "boolean" && typeof selected !== "string") continue;

      const classes = group[String(selected)];

      // A bare string under `slots` belongs to `base`, the same slot a slotless recipe names.
      parts.push(
        typeof classes === "string" ? (slot === "base" ? classes : undefined) : classes?.[slot],
      );
    }

    parts.push(flatten(props["class"] as ClassValue));

    return parts.filter(Boolean).join(" ");
  };

  const recipe = slots
    ? (props: Props = {}) =>
        Object.fromEntries(
          // Only variants are inherited. A `class` on the root call is not: spreading it across
          // every slot would stamp the caller's classes on the whole component.
          Object.keys(slots).map((slot) => [slot, (args: Props = {}) => build(slot, args, props)]),
        )
    : (props: Props = {}) => build("base", props);

  return recipe as Recipe<C>;
};
