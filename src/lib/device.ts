/**
 * The mobile game room layout lives in globals.css under a
 * `@media (max-width: 820px)` block; this module only covers what CSS cannot
 * answer, namely which physical camera to open.
 */

export const MOBILE_BREAKPOINT = 820;

/**
 * Phone or tablet, regardless of orientation. A handheld gets the rear camera
 * by default so it frames the table. Orientation is deliberately ignored: a
 * phone held sideways is wider than the layout breakpoint but still has a
 * camera pointed at the cards.
 */
export function isHandheldDevice(): boolean {
    if (typeof window === 'undefined') return false;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const smallScreen = window.matchMedia('(max-height: 900px)').matches;
    return coarsePointer && smallScreen;
}
