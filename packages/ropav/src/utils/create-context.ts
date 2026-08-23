import type {InjectionKey} from "vue";

import {inject, provide} from "vue";

interface CreateContextBaseOptions {
  /** Human readable name, used for the injection key and in the error message. */
  name: string;
  /** Overrides the message thrown when a consumer has no provider above it. */
  errorMessage?: string;
}

export interface CreateStrictContextOptions extends CreateContextBaseOptions {
  /**
   * Whether consuming the context without a provider throws.
   * @default true
   */
  strict?: true;
}

export interface CreateLooseContextOptions<T> extends CreateContextBaseOptions {
  strict: false;
  /** Returned when no provider is found. Required, so the return type stays honest. */
  defaultValue: T;
}

export type CreateContextOptions<T> = CreateStrictContextOptions | CreateLooseContextOptions<T>;

export type CreateContextReturn<T> = [useContext: () => T, provideContext: (value: T) => T];

/**
 * Create a typed `provide`/`inject` pair, the Vue counterpart of React's
 * `createContext` + `use()`. Used to share slot functions and state between the
 * parts of a compound component.
 *
 * Both returned functions must be called during `setup()`.
 *
 * @example
 * ```ts
 * // accordion.context.ts
 * export const [useAccordionContext, provideAccordionContext] =
 *   createContext<AccordionContext>({name: "AccordionContext"});
 *
 * // accordion-root.vue — provideAccordionContext({slots, hideSeparator})
 * // accordion-item.vue — const {slots} = useAccordionContext()
 * ```
 */
export const createContext = <T>(options: CreateContextOptions<T>): CreateContextReturn<T> => {
  const {errorMessage, name} = options;
  const key: InjectionKey<T> = Symbol(name);

  const provideContext = (value: T): T => {
    provide(key, value);

    return value;
  };

  const useContext = (): T => {
    // Always pass a fallback so Vue does not log its own "injection not found" warning.
    const fallback = options.strict === false ? options.defaultValue : undefined;
    const context = inject<T | undefined>(key, fallback);

    if (context === undefined) {
      throw new Error(
        errorMessage ?? `\`${name}\` was consumed outside of its provider component.`,
      );
    }

    return context;
  };

  return [useContext, provideContext];
};
