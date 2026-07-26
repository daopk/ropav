import { chromium } from 'playwright';
import { preview } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const server = await preview({
    configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
    root,
    preview: { port: 0 },
});
const browser = await chromium.launch({ headless: true });

try {
    const url = server.resolvedUrls?.local[0];
    if (!url) throw new Error('Fixture preview URL was not resolved');
    const page = await browser.newPage();
    page.setDefaultTimeout(10_000);
    await page.goto(url);

    const vaporIconTag = await page
        .getByTestId('consumer-vapor-icon')
        .evaluate((element) => element.tagName.toLowerCase());
    if (vaporIconTag !== 'svg') {
        throw new Error(`Vapor icon did not render as SVG: ${vaporIconTag}`);
    }

    const gradientPaintServers = await page
        .getByTestId('consumer-gradient-icon')
        .evaluateAll((icons) =>
            icons.map((icon) => {
                const id = icon.querySelector('[id]')?.id;
                const fill = icon.querySelector('path')?.getAttribute('fill');
                return { id, fill };
            }),
        );
    if (
        gradientPaintServers.length !== 2 ||
        gradientPaintServers.some(({ id, fill }) => !id || fill !== `url(#${id})`) ||
        gradientPaintServers[0].id === gradientPaintServers[1].id
    ) {
        throw new Error(
            `Vapor gradient icon IDs were not isolated per instance: ${JSON.stringify(gradientPaintServers)}`,
        );
    }

    const buttonTypography = await page.getByTestId('theme-toggle').evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            lineHeight: styles.lineHeight,
        };
    });
    if (
        buttonTypography.fontWeight !== '500' ||
        buttonTypography.lineHeight !== buttonTypography.fontSize
    ) {
        throw new Error(
            `Reset layer overrode button typography: ${JSON.stringify(buttonTypography)}`,
        );
    }

    const publicColorContrast = await page
        .getByTestId('public-color-contrast')
        .evaluate((element) => {
            const styles = getComputedStyle(element);
            return { background: styles.backgroundColor, foreground: styles.color };
        });
    if (
        publicColorContrast.background !== 'rgb(0, 0, 0)' ||
        publicColorContrast.foreground !== 'rgb(255, 255, 255)'
    ) {
        throw new Error(
            `Grouped public color override was not applied: ${JSON.stringify(publicColorContrast)}`,
        );
    }

    const sharedButtonStyles = await page
        .getByTestId('consumer-button-link')
        .evaluate((element) => {
            const styles = getComputedStyle(element);
            return { display: styles.display, height: styles.height };
        });
    if (
        !['flex', 'inline-flex'].includes(sharedButtonStyles.display) ||
        sharedButtonStyles.height === 'auto'
    ) {
        throw new Error(
            `ButtonLink did not load the shared button stylesheet: ${JSON.stringify(sharedButtonStyles)}`,
        );
    }

    const iconButtonStyles = await page.getByTestId('consumer-icon-button').evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
            paddingLeft: styles.paddingLeft,
            paddingRight: styles.paddingRight,
            position: styles.position,
        };
    });
    if (
        iconButtonStyles.paddingLeft !== '0px' ||
        iconButtonStyles.paddingRight !== '0px' ||
        iconButtonStyles.position !== 'relative'
    ) {
        throw new Error(
            `IconButton did not combine shared and scoped styles: ${JSON.stringify(iconButtonStyles)}`,
        );
    }

    await page.locator('[title="name-input"]').fill('Dao PK');
    await page.getByRole('combobox', { name: 'Language' }).click();
    await page.getByRole('option', { name: 'Vietnamese' }).click();

    const switchLabel = page.getByText('Product notifications', { exact: true });
    await switchLabel.click();
    const switchRoot = switchLabel.locator('..');
    if ((await switchRoot.getAttribute('data-state')) !== 'checked') {
        throw new Error('Switch state contract was not applied');
    }

    await page.getByText('Pro', { exact: true }).click();
    await page.locator('[title="volume-input"]').fill('75');

    await page.getByTestId('open-modal').click();
    await page.getByRole('dialog').waitFor();
    const panelWidth = await page
        .getByRole('dialog')
        .evaluate((element) => getComputedStyle(element).maxWidth);
    if (panelWidth !== '32rem' && panelWidth !== '512px') {
        throw new Error(`Modal public style was not applied: ${panelWidth}`);
    }

    await page.getByRole('button', { name: 'Close modal' }).click();
    await page.getByTestId('save-toast').click();
    await page.getByText('Settings saved').waitFor();

    const before = await page
        .getByTestId('settings-panel')
        .evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.getByTestId('theme-toggle').click();
    const after = await page
        .getByTestId('settings-panel')
        .evaluate((element) => getComputedStyle(element).backgroundColor);
    if (before === after) throw new Error('Theme token override did not change the fixture');
} finally {
    await browser.close();
    await server.close();
}
