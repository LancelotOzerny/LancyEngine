export const CollisionShapeType = {
    AABB: "aabb",
    CIRCLE: "circle",
};

export class AABBShape
{
    type = CollisionShapeType.AABB;

    constructor(width = 150, height = 150)
    {
        this.width = width;
        this.height = height;
    }

    getBounds(x, y)
    {
        return makeBounds(x, y, this.width, this.height);
    }
}

export class CircleShape
{
    type = CollisionShapeType.CIRCLE;

    constructor(radius = 75)
    {
        this.radius = radius;
    }

    getBounds(x, y)
    {
        const diameter = this.radius * 2;
        return makeBounds(x, y, diameter, diameter);
    }
}

export function makeBounds(left, top, width, height)
{
    return {
        left,
        top,
        right: left + width,
        bottom: top + height,
        width,
        height,
        centerX: left + width / 2,
        centerY: top + height / 2,
    };
}

export function boundsOverlap(a, b)
{
    const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

    return {
        intersects: overlapX > 0 && overlapY > 0,
        overlapX: Math.max(0, overlapX),
        overlapY: Math.max(0, overlapY),
        self: a,
        other: b,
    };
}

export function overlapShapes(shapeA, xA, yA, shapeB, xB, yB)
{
    if (shapeA.type === CollisionShapeType.CIRCLE && shapeB.type === CollisionShapeType.CIRCLE)
    {
        return overlapCircleCircle(shapeA, xA, yA, shapeB, xB, yB);
    }

    if (shapeA.type === CollisionShapeType.CIRCLE && shapeB.type === CollisionShapeType.AABB)
    {
        return overlapCircleAABB(shapeA, xA, yA, shapeB, xB, yB);
    }

    if (shapeA.type === CollisionShapeType.AABB && shapeB.type === CollisionShapeType.CIRCLE)
    {
        const info = overlapCircleAABB(shapeB, xB, yB, shapeA, xA, yA);
        return {
            ...info,
            self: info.other,
            other: info.self,
        };
    }

    return boundsOverlap(
        shapeA.getBounds(xA, yA),
        shapeB.getBounds(xB, yB)
    );
}

export function pointInShape(x, y, shape, shapeX, shapeY)
{
    if (shape.type === CollisionShapeType.CIRCLE)
    {
        const center = getCircleCenter(shape, shapeX, shapeY);
        const dx = x - center.x;
        const dy = y - center.y;
        return dx * dx + dy * dy <= shape.radius * shape.radius;
    }

    return pointInBounds(x, y, shape.getBounds(shapeX, shapeY));
}

export function circleOverlapsShape(circleX, circleY, radius, shape, shapeX, shapeY)
{
    if (shape.type === CollisionShapeType.CIRCLE)
    {
        const center = getCircleCenter(shape, shapeX, shapeY);
        const combinedRadius = radius + shape.radius;
        const dx = circleX - center.x;
        const dy = circleY - center.y;
        return dx * dx + dy * dy <= combinedRadius * combinedRadius;
    }

    return circleOverlapsBounds(circleX, circleY, radius, shape.getBounds(shapeX, shapeY));
}

export function raycastShape(originX, originY, directionX, directionY, maxDistance, shape, shapeX, shapeY)
{
    if (shape.type === CollisionShapeType.CIRCLE)
    {
        return raycastCircle(originX, originY, directionX, directionY, maxDistance, shape, shapeX, shapeY);
    }

    return raycastBounds(originX, originY, directionX, directionY, maxDistance, shape.getBounds(shapeX, shapeY));
}

export function pointInBounds(x, y, bounds)
{
    return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
}

export function circleOverlapsBounds(circleX, circleY, radius, bounds)
{
    const closestX = clamp(circleX, bounds.left, bounds.right);
    const closestY = clamp(circleY, bounds.top, bounds.bottom);
    const dx = circleX - closestX;
    const dy = circleY - closestY;

    return dx * dx + dy * dy <= radius * radius;
}

export function raycastBounds(originX, originY, directionX, directionY, maxDistance, bounds)
{
    const safeDistance = maxDistance ?? Number.POSITIVE_INFINITY;
    let tMin = 0;
    let tMax = safeDistance;

    const axes = [
        [originX, directionX, bounds.left, bounds.right],
        [originY, directionY, bounds.top, bounds.bottom],
    ];

    for (const [origin, direction, min, max] of axes)
    {
        if (Math.abs(direction) < 1e-8)
        {
            if (origin < min || origin > max) return null;
            continue;
        }

        const inv = 1 / direction;
        let t1 = (min - origin) * inv;
        let t2 = (max - origin) * inv;

        if (t1 > t2)
        {
            const temp = t1;
            t1 = t2;
            t2 = temp;
        }

        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);

        if (tMin > tMax) return null;
    }

    if (tMin < 0 || tMin > safeDistance) return null;

    const hitX = originX + directionX * tMin;
    const hitY = originY + directionY * tMin;
    let normalX = 0;
    let normalY = 0;
    const epsilon = 0.0001;

    if (Math.abs(hitX - bounds.left) < epsilon) normalX = -1;
    else if (Math.abs(hitX - bounds.right) < epsilon) normalX = 1;
    else if (Math.abs(hitY - bounds.top) < epsilon) normalY = -1;
    else if (Math.abs(hitY - bounds.bottom) < epsilon) normalY = 1;

    return {
        distance: tMin,
        point: { x: hitX, y: hitY },
        normal: { x: normalX, y: normalY },
    };
}

function overlapCircleCircle(shapeA, xA, yA, shapeB, xB, yB)
{
    const a = getCircleCenter(shapeA, xA, yA);
    const b = getCircleCenter(shapeB, xB, yB);
    const combinedRadius = shapeA.radius + shapeB.radius;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distanceSq = dx * dx + dy * dy;
    const intersects = distanceSq <= combinedRadius * combinedRadius;
    const distance = Math.sqrt(distanceSq);
    const overlap = intersects ? Math.max(0, combinedRadius - distance) : 0;

    return {
        intersects,
        overlapX: overlap,
        overlapY: overlap,
        self: shapeA.getBounds(xA, yA),
        other: shapeB.getBounds(xB, yB),
    };
}

function overlapCircleAABB(circleShape, circleX, circleY, aabbShape, aabbX, aabbY)
{
    const center = getCircleCenter(circleShape, circleX, circleY);
    const bounds = aabbShape.getBounds(aabbX, aabbY);
    const closestX = clamp(center.x, bounds.left, bounds.right);
    const closestY = clamp(center.y, bounds.top, bounds.bottom);
    const dx = center.x - closestX;
    const dy = center.y - closestY;
    const distanceSq = dx * dx + dy * dy;
    const intersects = distanceSq <= circleShape.radius * circleShape.radius;
    const distance = Math.sqrt(distanceSq);
    const overlap = intersects ? Math.max(0, circleShape.radius - distance) : 0;

    return {
        intersects,
        overlapX: overlap,
        overlapY: overlap,
        self: circleShape.getBounds(circleX, circleY),
        other: bounds,
    };
}

function raycastCircle(originX, originY, directionX, directionY, maxDistance, shape, shapeX, shapeY)
{
    const center = getCircleCenter(shape, shapeX, shapeY);
    const ox = originX - center.x;
    const oy = originY - center.y;
    const b = ox * directionX + oy * directionY;
    const c = ox * ox + oy * oy - shape.radius * shape.radius;
    const discriminant = b * b - c;

    if (discriminant < 0) return null;

    const sqrt = Math.sqrt(discriminant);
    let distance = -b - sqrt;

    if (distance < 0)
    {
        distance = -b + sqrt;
    }

    const safeDistance = maxDistance ?? Number.POSITIVE_INFINITY;
    if (distance < 0 || distance > safeDistance) return null;

    const hitX = originX + directionX * distance;
    const hitY = originY + directionY * distance;
    const normalX = (hitX - center.x) / shape.radius;
    const normalY = (hitY - center.y) / shape.radius;

    return {
        distance,
        point: { x: hitX, y: hitY },
        normal: { x: normalX, y: normalY },
    };
}

function getCircleCenter(shape, x, y)
{
    return {
        x: x + shape.radius,
        y: y + shape.radius,
    };
}

function clamp(value, min, max)
{
    return Math.max(min, Math.min(max, value));
}
