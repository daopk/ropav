import RouterProviderRoot from "./router-provider.vue";

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export { RouterProviderRoot as RouterProvider };

export type { RouterProviderRootProps as RouterProviderProps } from "./router-provider.types";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export { useRouterContext } from "./router-provider.context";

export type { RouterContext } from "./router-provider.context";
