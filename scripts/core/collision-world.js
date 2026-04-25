import { SpatialHashGrid } from "./spatial-hash-grid.js";
import {
    AABBShape,
    makeBounds,
    circleOverlapsShape,
    overlapShapes,
    pointInShape,
    raycastShape,
} from "./collision-shapes.js";

export const BodyType = {
    STATIC: "static",
    DYNAMIC: "dynamic",
    KINEMATIC: "kinematic",
};

export class CollisionWorld
{
    constructor(options = {})
    {
        this.grid = new SpatialHashGrid(options.cellSize ?? 256);
        this.colliders = [];
        this.colliderIds = new WeakMap();
        this.nextColliderId = 1;
        this.previousPairs = new Map();
        this.currentPairs = new Map();
    }

    addCollider(collider)
    {
        if (!collider || this.colliders.includes(collider)) return collider;

        this.ensureColliderState(collider);
        this.colliders.push(collider);
        this.grid.add(collider, collider.getBounds());
        return collider;
    }

    removeCollider(collider)
    {
        const index = this.colliders.indexOf(collider);
        if (index !== -1)
        {
            this.colliders.splice(index, 1);
        }

        this.grid.remove(collider);
        this.previousPairs.forEach((pair, key) =>
        {
            if (pair.a === collider || pair.b === collider)
            {
                this.previousPairs.delete(key);
            }
        });
        this.currentPairs.forEach((pair, key) =>
        {
            if (pair.a === collider || pair.b === collider)
            {
                this.currentPairs.delete(key);
            }
        });
    }

    contains(collider)
    {
        return this.colliders.includes(collider);
    }

    updateCollider(collider)
    {
        if (!this.contains(collider) || !collider.isEnabled) return;
        this.grid.update(collider, collider.getBounds());
    }

    getOverlaps(collider, posX = collider.parent.transform.position.x, posY = collider.parent.transform.position.y, options = {})
    {
        const bounds = collider.getBounds(posX, posY);

        return this.grid.query(bounds)
            .filter(other => other !== collider)
            .filter(other => this.shouldCheck(collider, other, options))
            .map(other => ({
                collider: other,
                info: collider.getOverlap(
                    other,
                    posX,
                    posY,
                    other.parent.transform.position.x,
                    other.parent.transform.position.y
                ),
            }))
            .filter(entry => entry.info.intersects);
    }

    overlapBox(x, y, width, height, options = {})
    {
        const bounds = makeBounds(x, y, width, height);
        const shape = new AABBShape(width, height);

        return this.grid.query(bounds)
            .filter(collider => this.matchesQueryFilter(collider, options))
            .map(collider => ({
                collider,
                info: this.getShapeOverlap(shape, x, y, collider),
            }))
            .filter(entry => entry.info.intersects);
    }

    overlapPoint(x, y, options = {})
    {
        return this.grid.query(makeBounds(x, y, 1, 1))
            .filter(collider => this.matchesQueryFilter(collider, options))
            .filter(collider =>
            {
                const pos = collider.getShapePosition();
                return pointInShape(x, y, collider.shape, pos.x, pos.y);
            })
            .map(collider => ({ collider }));
    }

    overlapCircle(x, y, radius, options = {})
    {
        const bounds = makeBounds(x - radius, y - radius, radius * 2, radius * 2);

        return this.grid.query(bounds)
            .filter(collider => this.matchesQueryFilter(collider, options))
            .filter(collider =>
            {
                const pos = collider.getShapePosition();
                return circleOverlapsShape(x, y, radius, collider.shape, pos.x, pos.y);
            })
            .map(collider => ({ collider }));
    }

    raycast(originX, originY, directionX, directionY, options = {})
    {
        const length = Math.hypot(directionX, directionY);
        if (length === 0) return null;

        const maxDistance = options.maxDistance ?? Number.POSITIVE_INFINITY;
        const dirX = directionX / length;
        const dirY = directionY / length;
        const finiteDistance = Number.isFinite(maxDistance) ? maxDistance : 1000000;
        const endX = originX + dirX * finiteDistance;
        const endY = originY + dirY * finiteDistance;
        const bounds = makeBounds(
            Math.min(originX, endX),
            Math.min(originY, endY),
            Math.abs(endX - originX) || 1,
            Math.abs(endY - originY) || 1
        );

        const hits = this.grid.query(bounds)
            .filter(collider => this.matchesQueryFilter(collider, options))
            .map(collider =>
            {
                const pos = collider.getShapePosition();
                const hit = raycastShape(originX, originY, dirX, dirY, maxDistance, collider.shape, pos.x, pos.y);
                if (!hit) return null;

                return {
                    collider,
                    distance: hit.distance,
                    point: hit.point,
                    normal: hit.normal,
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.distance - b.distance);

        return options.all ? hits : hits[0] ?? null;
    }

    update()
    {
        this.currentPairs = new Map();

        this.colliders.forEach(collider =>
        {
            this.ensureColliderState(collider);
            collider.resetWorldEventState?.();

            if (collider.isEnabled)
            {
                this.grid.update(collider, collider.getBounds());
            }
            else
            {
                this.grid.remove(collider);
            }
        });

        const snapshot = [...this.colliders].filter(collider => collider.isEnabled);

        snapshot.forEach(a =>
        {
            const candidates = this.grid.query(a.getBounds());

            candidates.forEach(b =>
            {
                if (a === b || this.getColliderId(a) >= this.getColliderId(b)) return;
                if (!this.shouldCheck(a, b)) return;

                const info = a.getOverlap(b);
                if (!info.intersects) return;

                const key = this.getPairKey(a, b);
                const isTrigger = a.isTrigger || b.isTrigger;
                const pair = { key, a, b, info, isTrigger };
                this.currentPairs.set(key, pair);
                this.addFramePairState(pair);
            });
        });

        this.dispatchPairEvents();
        this.currentPairs.forEach((pair, key) =>
        {
            if (!this.contains(pair.a) || !this.contains(pair.b))
            {
                this.currentPairs.delete(key);
            }
        });
        this.previousPairs = this.currentPairs;
    }

    shouldCheck(a, b, options = {})
    {
        if (!this.isCollider(a) || !this.isCollider(b)) return false;
        if (a.parent === b.parent) return false;
        if (!a.isEnabled || !b.isEnabled) return false;

        if (options.ignoreTriggers && (a.isTrigger || b.isTrigger)) return false;

        const selfAllows = a.mask === null || a.mask.includes(b.layer);
        const otherAllows = b.mask === null || b.mask.includes(a.layer);

        return selfAllows && otherAllows;
    }

    matchesQueryFilter(collider, options = {})
    {
        if (!this.isCollider(collider) || !collider.isEnabled) return false;
        if (options.ignore && options.ignore === collider) return false;
        if (options.ignoreParent && options.ignoreParent === collider.parent) return false;
        if (options.includeTriggers === false && collider.isTrigger) return false;
        if (options.includeStatic === false && collider.bodyType === BodyType.STATIC) return false;
        if (options.includeDynamic === false && collider.bodyType === BodyType.DYNAMIC) return false;
        if (options.includeKinematic === false && collider.bodyType === BodyType.KINEMATIC) return false;

        if (options.layer !== undefined && collider.layer !== options.layer) return false;
        if (Array.isArray(options.layers) && !options.layers.includes(collider.layer)) return false;
        if (Array.isArray(options.mask) && !options.mask.includes(collider.layer)) return false;
        if (typeof options.predicate === "function" && !options.predicate(collider)) return false;

        return true;
    }

    addFramePairState(pair)
    {
        const { a, b, info, isTrigger } = pair;

        if (!a.collisions.includes(b)) a.collisions.push(b);
        if (!b.collisions.includes(a)) b.collisions.push(a);
    }

    dispatchPairEvents()
    {
        this.currentPairs.forEach((pair, key) =>
        {
            const wasActive = this.previousPairs.has(key);
            this.dispatchPair(pair, wasActive ? "stay" : "enter");
        });

        this.previousPairs.forEach((pair, key) =>
        {
            if (!this.currentPairs.has(key))
            {
                this.dispatchPair(pair, "exit");
            }
        });
    }

    dispatchPair(pair, phase)
    {
        const prefix = pair.isTrigger ? "trigger" : "collision";
        const method = `${prefix}${phase[0].toUpperCase()}${phase.slice(1)}`;

        this.dispatchToCollider(pair.a, method, pair.b, pair);
        this.dispatchToCollider(pair.b, method, pair.a, pair);
    }

    dispatchToCollider(collider, method, other, pair)
    {
        collider[method]?.(other, pair);
        collider.parent?.[method]?.(other, pair);

        if (!collider.parent?.components?.items) return;

        collider.parent.components.items.forEach(component =>
        {
            if (component !== collider)
            {
                component[method]?.(other, pair);
            }
        });
    }

    ensureColliderState(collider)
    {
        if (!this.colliderIds.has(collider))
        {
            this.colliderIds.set(collider, this.nextColliderId);
            this.nextColliderId += 1;
        }
    }

    getColliderId(collider)
    {
        this.ensureColliderState(collider);
        return this.colliderIds.get(collider);
    }

    getPairKey(a, b)
    {
        const idA = this.getColliderId(a);
        const idB = this.getColliderId(b);
        return idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
    }

    isCollider(value)
    {
        return Boolean(
            value?.isColliderComponent &&
            typeof value.getBounds === "function" &&
            typeof value.getOverlap === "function"
        );
    }

    getShapeOverlap(shape, x, y, collider)
    {
        const colliderPos = collider.getShapePosition();
        return overlapShapes(
            shape,
            x,
            y,
            collider.shape,
            colliderPos.x,
            colliderPos.y
        );
    }
}
