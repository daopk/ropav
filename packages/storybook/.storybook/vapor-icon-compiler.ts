import {compile} from "@vue/compiler-vapor";

/** Shape `unplugin-icons` expects from a custom compiler. */
export interface VaporIconCompiler {
  compiler: (svg: string, collection: string, icon: string) => string;
}

interface SvgTransform {
  svg: string;
  renderLocals: string;
}

const ID_MAP_LOCAL = "__ropavIconIdMap";
const UID_LOCAL = "__ropavIconUid";
const RENDER_FUNCTION_START = "function render(_ctx) {";

const PAINT_SERVER_REFERENCE = /\b([\w-]+)="url\(#(.+?)\)"/g;
const SVG_ID_ATTRIBUTE = /\bid="(.+?)"/g;

/**
 * Bind every id an SVG references through `url(#…)` to a per-instance value.
 *
 * Two copies of the same icon on one page would otherwise declare the same gradient id
 * twice, and both would paint from whichever the document resolves first.
 */
const transformSvgIds = (svg: string): SvgTransform => {
  if (!svg.includes('="url(#')) return {renderLocals: "", svg};

  const referencedIds = new Set<string>();

  const svgWithBoundReferences = svg.replace(
    PAINT_SERVER_REFERENCE,
    (_match, attribute: string, id: string) => {
      referencedIds.add(id);

      return `:${attribute}="'url(#'+${ID_MAP_LOCAL}['${id}']+')'"`;
    },
  );

  if (referencedIds.size === 0) return {renderLocals: "", svg};

  const svgWithBoundIds = svgWithBoundReferences.replace(
    SVG_ID_ATTRIBUTE,
    (attribute, id: string) =>
      referencedIds.has(id) ? `:id="${ID_MAP_LOCAL}['${id}']"` : attribute,
  );

  const idMapEntries = Array.from(
    referencedIds,
    (id) => `'${id}':'ropav-icon-'+(++${UID_LOCAL})`,
  ).join(",");

  return {
    renderLocals: `const ${ID_MAP_LOCAL} = {${idMapEntries}};`,
    svg: svgWithBoundIds,
  };
};

const injectRenderLocals = (code: string, renderLocals: string): string => {
  if (!renderLocals) return code;

  if (!code.includes(RENDER_FUNCTION_START)) {
    throw new Error("Unable to inject SVG id bindings into the Vapor render function");
  }

  return code
    .replaceAll(`_ctx.${ID_MAP_LOCAL}`, ID_MAP_LOCAL)
    .replace(RENDER_FUNCTION_START, `${RENDER_FUNCTION_START}\n  ${renderLocals}`);
};

const createVaporIconModule = (
  renderCode: string,
  componentName: string,
  needsUid: boolean,
): string =>
  `${needsUid ? `let ${UID_LOCAL} = 0;\n` : ""}${renderCode}
import {defineVaporComponent, markRaw} from "vue";

export default markRaw(defineVaporComponent({name: ${JSON.stringify(componentName)}, render}));
`;

/**
 * An `unplugin-icons` compiler that emits Vue Vapor components.
 *
 * The bundled `vue3` compiler emits virtual-DOM components, which would put a
 * virtual-DOM node inside the slot of a Vapor component. Compiling the SVG with the
 * Vapor compiler instead keeps icons on the same rendering path as the components they
 * sit in, so no interop layer is involved.
 */
export const vaporIconCompiler = (): VaporIconCompiler => ({
  compiler: (svg, collection, icon) => {
    const componentName = `${collection}-${icon}`;
    const transformed = transformSvgIds(svg);
    const compiled = compile(transformed.svg, {
      filename: `${componentName}.vue`,
      prefixIdentifiers: true,
    });

    const renderCode = injectRenderLocals(
      compiled.code.replace(/^export /gm, ""),
      transformed.renderLocals,
    );

    return createVaporIconModule(renderCode, componentName, Boolean(transformed.renderLocals));
  },
});
