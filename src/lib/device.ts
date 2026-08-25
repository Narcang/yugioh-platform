/**
 * The mobile game room layout lives in globals.css under a
 * `@media (max-width: 820px)` block; this module only covers what CSS cannot
 * answer, namely which physical camera to open.
 */

export const MOBILE_BREAKPOINT = 820;

/** Largest shortest-side of a device we still treat as handheld (covers tablets) */
const HANDHELD_MAX_SHORT_SIDE = 900;

/**
 * Phone or tablet: a handheld gets the rear camera by default so it frames the
 * table. Measured on the screen's shortest side rather than the viewport, so
 * the answer does not change when the player rotates the device — and tall
 * phones (a Pixel is 915px in portrait) are not mistaken for desktops.
 */
export function isHandheldDevice(): boolean {
    if (typeof window === 'undefined') return false;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const shortestSide = Math.min(window.screen.width, window.screen.height);
    return coarsePointer && shortestSide <= HANDHELD_MAX_SHORT_SIDE;
}

/**
 * Device labels are the only signal browsers give us about which physical lens
 * a camera is. Matching on 'ultra' avoids picking the plain wide lens, which is
 * just the main camera under another name.
 */
const ULTRA_WIDE_HINTS = [
    'ultra wide',
    'ultrawide',
    'ultra-wide',
    'ultragrandangolare',
    'ultra grandangolare',
    'ultra gran angular',
    'ultra groß',
    'ultra grand angle',
];

const FRONT_CAMERA_HINTS = ['front', 'anteriore', 'frontal', 'facing front', 'selfie'];

/**
 * The widest rear lens, on platforms that expose each lens as its own device
 * (iOS does; Android usually hides them behind one logical camera instead).
 * Labels are only populated once camera permission has been granted.
 */
export function findUltraWideRearCamera(devices: MediaDeviceInfo[]): MediaDeviceInfo | undefined {
    return devices.find(device => {
        if (device.kind !== 'videoinput' || !device.deviceId) return false;
        const label = device.label.toLowerCase();
        if (FRONT_CAMERA_HINTS.some(hint => label.includes(hint))) return false;
        return ULTRA_WIDE_HINTS.some(hint => label.includes(hint));
    });
}
