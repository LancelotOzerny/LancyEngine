export const Easing = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t =>
    {
        const p = t - 1;
        return p * p * p + 1;
    },
    easeInOutCubic: t => t < 0.5
        ? 4 * t * t * t
        : 1 + 4 * (t - 1) * (t - 1) * (t - 1),
    easeOutBack: t =>
    {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
};

export function getEasing(easing)
{
    if (typeof easing === "function")
    {
        return easing;
    }

    return Easing[easing] ?? Easing.linear;
}
