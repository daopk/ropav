import { computed, onMounted, ref, shallowRef } from 'vue';
import { formatColorPickerValue, parseColorPickerValue } from '../color-picker/color-picker-utils';
import type { ColorPickerFormat, ColorPickerValue } from '../color-picker/types';

interface EyeDropperResult {
    sRGBHex: string;
}

interface EyeDropperInstance {
    open(options?: { signal?: AbortSignal }): Promise<EyeDropperResult>;
}

interface EyeDropperConstructor {
    new (): EyeDropperInstance;
}

interface UseColorInputEyeDropperOptions {
    enabled: () => boolean;
    disabled: () => boolean;
    format: () => ColorPickerFormat;
    update: (value: ColorPickerValue) => void;
}

export function useColorInputEyeDropper(options: UseColorInputEyeDropperOptions) {
    const eyeDropperApi = shallowRef<EyeDropperConstructor>();
    const isPickingColor = ref(false);
    const showEyeDropper = computed(() => options.enabled() && Boolean(eyeDropperApi.value));

    onMounted(() => {
        eyeDropperApi.value = (
            window as typeof window & { EyeDropper?: EyeDropperConstructor }
        ).EyeDropper;
    });

    async function pickScreenColor(closePicker: () => void) {
        const EyeDropperApi = eyeDropperApi.value;
        if (options.disabled() || isPickingColor.value || !EyeDropperApi) return;

        closePicker();
        isPickingColor.value = true;

        try {
            const result = await new EyeDropperApi().open();
            const color = parseColorPickerValue(result.sRGBHex);
            if (!color) return;

            options.update(formatColorPickerValue(color, options.format()));
        } catch {
            // The native picker rejects when canceled or unavailable at runtime.
        } finally {
            isPickingColor.value = false;
        }
    }

    return {
        showEyeDropper,
        isPickingColor,
        pickScreenColor,
    };
}
