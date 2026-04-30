import { BaseComponent } from "../core/base-component.js";
import { Engine } from "../core/engine.js";
import { TileMap } from "../core/tile-map.js";
import { TileSet } from "../core/tile-set.js";

export class TileMapComponent extends BaseComponent
{
    constructor(params = {})
    {
        super(params);

        this.tileMap = params.tileMap ?? null;
        this.tilesets = params.tilesets ?? null;
        this.layerNames = Array.isArray(params.layerNames) ? [...params.layerNames] : null;
        this.debugGrid = params.debugGrid ?? false;
    }

    init()
    {
        if (!(this.tileMap instanceof TileMap))
        {
            this.tileMap = TileMap.fromJSON(this.params.tileMap ?? {}, {
                images: Engine.instance.assets,
            });
        }

        this.applyTilesets(this.tilesets);
        this.resolveTilesetImages();
    }

    render(ctx)
    {
        if (!this.tileMap) return;

        const origin = this.parent.transform.position;
        const view = this.getVisibleWorldRect();
        const startTile = this.tileMap.worldToTile(view.left - origin.x, view.top - origin.y);
        const endTile = this.tileMap.worldToTile(view.right - origin.x, view.bottom - origin.y);
        const startX = Math.max(0, startTile.x - 1);
        const startY = Math.max(0, startTile.y - 1);
        const endX = Math.min(this.tileMap.width - 1, endTile.x + 1);
        const endY = Math.min(this.tileMap.height - 1, endTile.y + 1);
        const layers = this.getRenderableLayers();

        layers.forEach(layer =>
        {
            if (layer.visible === false || layer.opacity <= 0) return;

            ctx.save();
            ctx.globalAlpha *= layer.opacity ?? 1;

            for (let tileY = startY; tileY <= endY; tileY++)
            {
                for (let tileX = startX; tileX <= endX; tileX++)
                {
                    const tileId = layer.data[this.tileMap.getIndex(tileX, tileY)] ?? 0;
                    if (tileId === 0) continue;

                    const tileset = this.tileMap.getTileSetForTile(tileId);
                    if (!tileset) continue;

                    tileset.drawTile(
                        ctx,
                        tileId,
                        origin.x + tileX * this.tileMap.tileWidth,
                        origin.y + tileY * this.tileMap.tileHeight,
                        this.tileMap.tileWidth,
                        this.tileMap.tileHeight
                    );
                }
            }

            ctx.restore();
        });

        if (this.debugGrid)
        {
            this.drawDebugGrid(ctx, origin, startX, startY, endX, endY);
        }
    }

    applyTilesets(tilesets)
    {
        if (!tilesets) return;

        const list = Array.isArray(tilesets)
            ? tilesets
            : typeof tilesets.values === "function"
                ? [...tilesets.values()]
                : Object.values(tilesets);

        this.tileMap.tilesets = [];
        list.forEach(tileset =>
        {
            this.tileMap.addTileSet(tileset instanceof TileSet ? tileset : new TileSet(tileset));
        });
    }

    resolveTilesetImages()
    {
        this.tileMap.tilesets.forEach(tileset =>
        {
            if (!tileset.image && tileset.imageKey)
            {
                tileset.setImage(Engine.instance.assets?.get(tileset.imageKey) ?? null);
            }

            if (!tileset.columns || tileset.columns <= 0)
            {
                tileset.columns = Math.max(1, Math.floor((tileset.image?.width ?? tileset.tileWidth) / tileset.tileWidth));
            }
        });
    }

    getRenderableLayers()
    {
        return this.tileMap.layers
            .filter(layer => !this.layerNames || this.layerNames.includes(layer.name))
            .sort((a, b) => a.zIndex - b.zIndex);
    }

    getVisibleWorldRect()
    {
        const engine = Engine.instance;

        if (this.parent.renderMode === "screen")
        {
            return {
                left: 0,
                top: 0,
                right: engine.screenWidth,
                bottom: engine.screenHeight,
                width: engine.screenWidth,
                height: engine.screenHeight,
            };
        }

        return engine.getViewRect();
    }

    drawDebugGrid(ctx, origin, startX, startY, endX, endY)
    {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 1;

        for (let tileY = startY; tileY <= endY; tileY++)
        {
            for (let tileX = startX; tileX <= endX; tileX++)
            {
                ctx.strokeRect(
                    origin.x + tileX * this.tileMap.tileWidth,
                    origin.y + tileY * this.tileMap.tileHeight,
                    this.tileMap.tileWidth,
                    this.tileMap.tileHeight
                );
            }
        }

        ctx.restore();
    }
}
