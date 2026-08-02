import {createContext} from "@/utils/create-context";

export interface GreetingContext {
  greeting: string;
}

export const [useGreetingContext, provideGreetingContext] = createContext<GreetingContext>({
  name: "GreetingContext",
});

export const [useOptionalContext, provideOptionalContext] = createContext<GreetingContext>({
  defaultValue: {greeting: "fallback"},
  name: "OptionalContext",
  strict: false,
});
