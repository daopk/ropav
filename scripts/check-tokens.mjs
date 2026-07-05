import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import StyleDictionary from 'style-dictionary'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(projectRoot)

const { default: config } = await import('./tokens.config.mjs')
const dictionary = new StyleDictionary(config, { verbosity: 'silent' })
await dictionary.hasInitialized

const defaultTokenFiles = [
  'tokens/default/core.tokens.json',
  'tokens/default/semantic.tokens.json',
]
const darkOverrideTokenFiles = ['tokens/dark/overrides.tokens.json']

const staleFiles = []
const platformOutputs = await dictionary.formatAllPlatforms()

for (const outputs of Object.values(platformOutputs)) {
  for (const { destination, output } of outputs) {
    if (!destination || typeof output !== 'string') continue

    const outputPath = join(projectRoot, destination)
    if (!existsSync(outputPath) || readFileSync(outputPath, 'utf8') !== output) {
      staleFiles.push(relative(projectRoot, outputPath))
    }
  }
}

if (staleFiles.length > 0) {
  console.error('Generated token files are out of date:')
  for (const file of staleFiles) {
    console.error(`- ${file}`)
  }
  console.error('Run `pnpm tokens:build` to update them.')
  process.exitCode = 1
}

const tokenStructureFailures = [
  ...checkUnknownThemeOverrides(defaultTokenFiles, darkOverrideTokenFiles),
  ...checkDuplicateOutputNames(dictionary),
]
if (tokenStructureFailures.length > 0) {
  console.error('Token structure checks failed:')
  for (const failure of tokenStructureFailures) {
    console.error(`- ${failure}`)
  }
  process.exitCode = 1
}

const contrastFailures = [
  ...checkThemeContrast('default', defaultTokenFiles),
  ...checkThemeContrast('dark', [
    ...defaultTokenFiles,
    ...darkOverrideTokenFiles,
  ]),
]
if (contrastFailures.length > 0) {
  console.error('Token color contrast checks failed:')
  for (const failure of contrastFailures) {
    console.error(`- ${failure}`)
  }
  process.exitCode = 1
}

function checkThemeContrast(themeName, files) {
  const tokenValues = new Map()
  for (const file of files) {
    collectTokenValues(JSON.parse(readFileSync(join(projectRoot, file), 'utf8')), [], tokenValues)
  }

  const failures = []
  const semanticColors = ['primary', 'secondary', 'success', 'warning', 'danger', 'info']
  for (const color of semanticColors) {
    assertContrast(themeName, tokenValues, failures, `color.${color}`, `color.on-${color}`, 4.5)
    assertContrastValue(
      themeName,
      tokenValues,
      failures,
      `color.${color} solid hover`,
      `color-mix(in srgb, {color.${color}} 90%, {color.black})`,
      `color.on-${color}`,
      4.5,
    )
    assertContrastValue(
      themeName,
      tokenValues,
      failures,
      `color.${color} solid active`,
      `color-mix(in srgb, {color.${color}} 80%, {color.black})`,
      `color.on-${color}`,
      4.5,
    )
    assertContrast(themeName, tokenValues, failures, `color.${color}-fg`, 'color.background', 4.5)
  }

  assertContrast(themeName, tokenValues, failures, 'color.text', 'color.background', 4.5)
  assertContrast(themeName, tokenValues, failures, 'color.text-secondary', 'color.background', 4.5)
  assertContrast(themeName, tokenValues, failures, 'color.text-inverted', 'color.surface-inverted', 4.5)

  return failures
}

function checkUnknownThemeOverrides(defaultFiles, overrideFiles) {
  const defaultTokenValues = collectTokenValuesFromFiles(defaultFiles)
  const overrideTokenValues = collectTokenValuesFromFiles(overrideFiles)
  const failures = []

  for (const path of overrideTokenValues.keys()) {
    if (!defaultTokenValues.has(path)) {
      failures.push(`dark override ${path} does not exist in default tokens`)
    }
  }

  return failures
}

function checkDuplicateOutputNames(dictionary) {
  const failures = []
  assertUniqueTokenNames('CSS custom property', dictionary.allTokens, cssCustomProperty, failures)
  assertUniqueTokenNames('Sass variable', dictionary.allTokens.filter(hasScssVariable), token => `$${scssName(token)}`, failures)

  return failures
}

function assertUniqueTokenNames(nameKind, tokens, getName, failures) {
  const seen = new Map()
  for (const token of tokens) {
    const name = getName(token)
    const path = tokenPathString(token)
    const previousPath = seen.get(name)
    if (previousPath) {
      failures.push(`${nameKind} ${name} is emitted by both ${previousPath} and ${path}`)
      continue
    }

    seen.set(name, path)
  }
}

function collectTokenValuesFromFiles(files) {
  const tokenValues = new Map()
  for (const file of files) {
    collectTokenValues(JSON.parse(readFileSync(join(projectRoot, file), 'utf8')), [], tokenValues)
  }

  return tokenValues
}

function collectTokenValues(node, path, values) {
  if (node && typeof node === 'object' && '$value' in node) {
    values.set(path.join('.'), node.$value)
    return
  }

  for (const [key, value] of Object.entries(node ?? {})) {
    collectTokenValues(value, [...path, key], values)
  }
}

function assertContrast(themeName, tokenValues, failures, foregroundPath, backgroundPath, minRatio) {
  const foreground = resolveColor(tokenValues, foregroundPath)
  const background = resolveColor(tokenValues, backgroundPath)
  if (!isOpaqueColor(foreground) || !isOpaqueColor(background)) {
    failures.push(`${themeName}: ${foregroundPath} on ${backgroundPath} could not be resolved to opaque colors`)
    return
  }

  const ratio = contrastRatio(foreground, background)
  if (ratio < minRatio) {
    failures.push(`${themeName}: ${foregroundPath} on ${backgroundPath} is ${ratio.toFixed(2)}:1, expected at least ${minRatio}:1`)
  }
}

function assertContrastValue(themeName, tokenValues, failures, foregroundLabel, foregroundValue, backgroundPath, minRatio) {
  const foreground = resolveColorValue(tokenValues, foregroundValue, new Set())
  const background = resolveColor(tokenValues, backgroundPath)
  if (!isOpaqueColor(foreground) || !isOpaqueColor(background)) {
    failures.push(`${themeName}: ${foregroundLabel} on ${backgroundPath} could not be resolved to opaque colors`)
    return
  }

  const ratio = contrastRatio(foreground, background)
  if (ratio < minRatio) {
    failures.push(`${themeName}: ${foregroundLabel} on ${backgroundPath} is ${ratio.toFixed(2)}:1, expected at least ${minRatio}:1`)
  }
}

function resolveColor(tokenValues, path, seen = new Set()) {
  if (seen.has(path)) return undefined
  seen.add(path)

  const value = tokenValues.get(path)
  if (typeof value !== 'string') return undefined

  return resolveColorValue(tokenValues, value, seen)
}

function resolveColorValue(tokenValues, value, seen) {
  const trimmedValue = value.trim()

  const reference = trimmedValue.match(/^\{([^}]+)\}$/)
  if (reference) return resolveColor(tokenValues, normalizeReferencePath(reference[1]), seen)

  const hex = trimmedValue.match(/^#([\da-f]{6})$/i)
  if (hex) return colorFromHex(trimmedValue)

  if (trimmedValue.toLowerCase() === 'transparent') {
    return { red: 0, green: 0, blue: 0, alpha: 0 }
  }

  const colorMix = trimmedValue.match(/^color-mix\(in\s+srgb,\s*(.+?)\s+(\d+(?:\.\d+)?)%,\s*(.+?)\)$/i)
  if (colorMix) {
    const [, firstValue, firstWeight, secondValue] = colorMix
    const firstColor = resolveColorValue(tokenValues, firstValue, seen)
    const secondColor = resolveColorValue(tokenValues, secondValue, seen)
    if (!firstColor || !secondColor) return undefined

    return mixColors(firstColor, Number.parseFloat(firstWeight) / 100, secondColor)
  }

  return undefined
}

function normalizeReferencePath(path) {
  return path.replace(/\.\$?value$/, '')
}

function colorFromHex(hex) {
  return {
    red: Number.parseInt(hex.slice(1, 3), 16),
    green: Number.parseInt(hex.slice(3, 5), 16),
    blue: Number.parseInt(hex.slice(5, 7), 16),
    alpha: 1,
  }
}

function mixColors(firstColor, firstWeight, secondColor) {
  const secondWeight = 1 - firstWeight
  const alpha = firstColor.alpha * firstWeight + secondColor.alpha * secondWeight
  if (alpha === 0) return { red: 0, green: 0, blue: 0, alpha }

  return {
    red: (firstColor.red * firstColor.alpha * firstWeight + secondColor.red * secondColor.alpha * secondWeight) / alpha,
    green: (firstColor.green * firstColor.alpha * firstWeight + secondColor.green * secondColor.alpha * secondWeight) / alpha,
    blue: (firstColor.blue * firstColor.alpha * firstWeight + secondColor.blue * secondColor.alpha * secondWeight) / alpha,
    alpha,
  }
}

function isOpaqueColor(color) {
  return color && color.alpha === 1
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground)
  const backgroundLuminance = relativeLuminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

function relativeLuminance(hex) {
  const [red, green, blue] = [hex.red, hex.green, hex.blue]
    .map(channel => channel / 255)
    .map(channel => channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4)

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function tokenPathString(token) {
  return tokenPath(token).join('.')
}

function cssCustomProperty(token) {
  return `--rp-${ropavExtension(token).cssName ?? tokenPath(token).join('-')}`
}

function scssName(token) {
  return ropavExtension(token).scssName ?? tokenPath(token).join('-')
}

function hasScssVariable(token) {
  return ropavExtension(token).scssVariable !== false
}

function ropavExtension(token) {
  return token.extensions?.ropav ?? token.$extensions?.ropav ?? {}
}

function tokenPath(token) {
  if (token.path) return token.path
  if (token.ref) return token.ref
  if (token.key) return token.key.slice(1, -1).split('.')

  return [JSON.stringify(token)]
}
