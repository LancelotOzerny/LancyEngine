import { Vector2 } from "../math/vector2.js";
import { TileSet } from "./tile-set.js";

export class TileMap
{
    constructor(options = {})
    {
        this.width = options.width ?? 0;
        this.height = options.height ?? 0;
        this.tileWidth = options.tileWidth ?? 32;
        this.tileHeight = options.tileHeight ?? 32;
        this.layers = [];
        this.tilesets = [];

        (options.tilesets ?? []).forEach(tileset => this.addTileSet(tileset));
        (options.layers ?? []).forEach(layer => this.addLayer(layer));
    }

    static fromJSON(data = {}, options = {})
    {
        const images = options.images ?? options.assets ?? null;
        let nextFirstGid = 1;
        const tilesets = (data.tilesets ?? []).map(tileset =>
        {
            const imageKey = tileset.imageKey ?? tileset.name ?? null;
            const image = tileset.image ?? images?.get?.(imageKey) ?? null;
            const firstgid = tileset.firstgid ?? nextFirstGid;
            const normalized = new TileSet({
                ...tileset,
                firstgid,
                imageKey,
                image,
                tileWidth: tileset.tileWidth ?? data.tileWidth,
                tileHeight: tileset.tileHeight ?? data.tileHeight,
            });

            nextFirstGid = firstgid + (tileset.tilecount ?? normalized.columns * normalized.rows);
            return normalized;
        });

        return new TileMap({
            width: data.width ?? 0,
            height: data.height ?? 0,
            tileWidth: data.tileWidth ?? 32,
            tileHeight: data.tileHeight ?? 32,
            tilesets,
            layers: data.layers ?? [],
        });
    }

    addTileSet(tileset)
    {
        const normalized = tileset instanceof TileSet
            ? tileset
            : new TileSet({
                tileWidth: this.tileWidth,
                tileHeight: this.tileHeight,
                ...tileset,
            });

        this.tilesets.push(normalized);
        this.tilesets.sort((a, b) => a.firstgid - b.firstgid);
        return normalized;
    }

    addLayer(layer = {})
    {
        const data = Array.isArray(layer.data) ? [...layer.data] : [];
        const expectedLength = this.width * this.height;

        while (data.length < expectedLength)
        {
            data.push(0);
        }

        const normalized = {
            name: layer.name ?? `layer${this.layers.length}`,
            data,
            visible: layer.visible ?? true,
            opacity: layer.opacity ?? 1,
            zIndex: layer.zIndex ?? 0,
            collision: layer.collision ?? false,
        };

        this.layers.push(normalized);
        this.layers.sort((a, b) => a.zIndex - b.zIndex);
        return normalized;
    }

    getTile(layerName, x, y)
    {
        if (!this.isInside(x, y)) return 0;

        const layer = this.getLayer(layerName);
        if (!layer) return 0;

        return layer.data[this.getIndex(x, y)] ?? 0;
    }

    setTile(layerName, x, y, tileId)
    {
        if (!this.isInside(x, y)) return false;

        const layer = this.getLayer(layerName);
        if (!layer) return false;

        layer.data[this.getIndex(x, y)] = tileId;
        return true;
    }

    worldToTile(x, y)
    {
        return new Vector2(
            Math.floor(x / this.tileWidth),
            Math.floor(y / this.tileHeight)
        );
    }

    tileToWorld(tileX, tileY)
    {
        return new Vector2(
            tileX * this.tileWidth,
            tileY * this.tileHeight
        );
    }

    isSolidAtTile(tileX, tileY)
    {
        if (!this.isInside(tileX, tileY)) return false;

        return this.layers.some(layer =>
            layer.collision === true && (layer.data[this.getIndex(tileX, tileY)] ?? 0) !== 0
        );
    }

    isSolidAtWorld(x, y)
    {
        const tile = this.worldToTile(x, y);
        return this.isSolidAtTile(tile.x, tile.y);
    }

    getBounds()
    {
        return {
            left: 0,
            top: 0,
            right: this.width * this.tileWidth,
            bottom: this.height * this.tileHeight,
            width: this.width * this.tileWidth,
            height: this.height * this.tileHeight,
        };
    }

    getLayer(name)
    {
        return this.layers.find(layer => layer.name === name) ?? null;
    }

    getTileSetForTile(tileId)
    {
        if (tileId === 0 || this.tilesets.length === 0) return null;

        for (let index = this.tilesets.length - 1; index >= 0; index--)
        {
            const tileset = this.tilesets[index];
            if (tileId >= tileset.firstgid)
            {
                return tileset;
            }
        }

        return this.tilesets[0] ?? null;
    }

    isInside(x, y)
    {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    getIndex(x, y)
    {
        return y * this.width + x;
    }
}
