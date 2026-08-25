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
