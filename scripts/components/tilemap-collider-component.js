import { BaseComponent } from "../core/base-component.js";
import { TileMap } from "../core/tile-map.js";

export class TileMapColliderComponent extends BaseComponent
{
    constructor(params = {})
    {
        super(params);

        this.tileMap = params.tileMap ?? null;
        this.layerNames = Array.isArray(params.layerNames) ? [...params.layerNames] : null;
    }

    init()
    {
        if (!(this.tileMap instanceof TileMap))
        {
            this.tileMap = TileMap.fromJSON(this.params.tileMap ?? {});
        }
    }

    isSolidAtWorld(x, y)
    {
        if (!this.tileMap) return false;

        const local = this.worldToLocal(x, y);
        const tile = this.tileMap.worldToTile(local.x, local.y);
        return this.isSolidAtTile(tile.x, tile.y);
    }

    isSolidAtTile(tileX, tileY)
    {
        if (!this.tileMap?.isInside(tileX, tileY)) return false;

        return this.getCollisionLayers().some(layer =>
            (layer.data[this.tileMap.getIndex(tileX, tileY)] ?? 0) !== 0
        );
    }

    querySolidTiles(rect)
    {
        if (!this.tileMap) return [];

        const localRect = this.worldRectToLocal(rect);
        const epsilon = 0.0001;
        const start = this.tileMap.worldToTile(localRect.left, localRect.top);
        const end = this.tileMap.worldToTile(localRect.right - epsilon, localRect.bottom - epsilon);
        const results = [];

        for (let tileY = Math.max(0, start.y); tileY <= Math.min(this.tileMap.height - 1, end.y); tileY++)
        {
            for (let tileX = Math.max(0, start.x); tileX <= Math.min(this.tileMap.width - 1, end.x); tileX++)
            {
                if (!this.isSolidAtTile(tileX, tileY)) continue;

                results.push(this.createTileHit(tileX, tileY));
            }
        }

        return results;
    }

    resolveAABB(rect, velocity)
    {
        const resolved = this.normalizeRect(rect);
        const nextVelocity = {
            x: velocity?.x ?? 0,
            y: velocity?.y ?? 0,
        };
        const collisions = [];
        const touching = {
            left: false,
            right: false,
            top: false,
            bottom: false,
        };

        resolved.x += nextVelocity.x;
        this.querySolidTiles(resolved).forEach(tile =>
        {
            if (nextVelocity.x > 0)
            {
                resolved.x = Math.min(resolved.x, tile.bounds.left - resolved.width);
                nextVelocity.x = 0;
                touching.right = true;
            }
            else if (nextVelocity.x < 0)
            {
                resolved.x = Math.max(resolved.x, tile.bounds.right);
                nextVelocity.x = 0;
                touching.left = true;
            }

            collisions.push(tile);
        });

        resolved.y += nextVelocity.y;
        this.querySolidTiles(resolved).forEach(tile =>
        {
            if (nextVelocity.y > 0)
            {
                resolved.y = Math.min(resolved.y, tile.bounds.top - resolved.height);
                nextVelocity.y = 0;
                touching.bottom = true;
            }
            else if (nextVelocity.y < 0)
            {
                resolved.y = Math.max(resolved.y, tile.bounds.bottom);
                nextVelocity.y = 0;
                touching.top = true;
            }

            collisions.push(tile);
        });

        return {
            rect: this.normalizeRect(resolved),
            velocity: nextVelocity,
            collisions,
            touching,
        };
    }

    getCollisionLayers()
    {
        if (!this.tileMap) return [];

        return this.tileMap.layers.filter(layer =>
            layer.collision === true && (!this.layerNames || this.layerNames.includes(layer.name))
        );
    }

    createTileHit(tileX, tileY)
    {
        const origin = this.getOrigin();
        const left = origin.x + tileX * this.tileMap.tileWidth;
        const top = origin.y + tileY * this.tileMap.tileHeight;

        return {
            tileX,
            tileY,
            x: tileX,
            y: tileY,
            bounds: {
                left,
                top,
                right: left + this.tileMap.tileWidth,
                bottom: top + this.tileMap.tileHeight,
                width: this.tileMap.tileWidth,
                height: this.tileMap.tileHeight,
            },
        };
    }

    worldToLocal(x, y)
    {
        const origin = this.getOrigin();

        return {
            x: x - origin.x,
            y: y - origin.y,
        };
    }

    worldRectToLocal(rect)
    {
        const normalized = this.normalizeRect(rect);
        const local = this.worldToLocal(normalized.x, normalized.y);

        return {
            ...normalized,
            x: local.x,
            y: local.y,
            left: local.x,
            top: local.y,
            right: local.x + normalized.width,
            bottom: local.y + normalized.height,
        };
    }

    normalizeRect(rect)
    {
        const x = rect.x ?? rect.left ?? 0;
        const y = rect.y ?? rect.top ?? 0;
        const width = rect.width ?? Math.max(0, (rect.right ?? x) - x);
        const height = rect.height ?? Math.max(0, (rect.bottom ?? y) - y);

        return {
            x,
            y,
            left: x,
            top: y,
            right: x + width,
            bottom: y + height,
            width,
            height,
        };
    }

    getOrigin()
    {
        return {
            x: this.parent?.transform?.position?.x ?? 0,
            y: this.parent?.transform?.position?.y ?? 0,
        };
    }
}
