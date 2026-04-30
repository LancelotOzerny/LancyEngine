export class TileSet
{
    constructor(options = {})
    {
        this.name = options.name ?? options.imageKey ?? "tileset";
        this.imageKey = options.imageKey ?? null;
        this.image = options.image ?? null;
        this.tileWidth = options.tileWidth ?? 32;
        this.tileHeight = options.tileHeight ?? 32;
        this.margin = options.margin ?? 0;
        this.spacing = options.spacing ?? 0;
        this._columnsExplicit = options.columns !== undefined;
        this._rowsExplicit = options.rows !== undefined;
        this.columns = options.columns ?? this._calculateColumns();
        this.rows = options.rows ?? this._calculateRows();
        this.firstgid = options.firstgid ?? 1;
    }

    setImage(image)
    {
        this.image = image;

        if (!this._columnsExplicit)
        {
            this.columns = this._calculateColumns();
        }

        if (!this._rowsExplicit)
        {
            this.rows = this._calculateRows();
        }

        return this;
    }

    getTileSourceRect(tileId)
    {
        if (tileId === 0) return null;

        const localTileId = tileId - this.firstgid;
        if (localTileId < 0) return null;

        const column = localTileId % this.columns;
        const row = Math.floor(localTileId / this.columns);

        if (this.rows > 0 && row >= this.rows) return null;

        return {
            x: this.margin + column * (this.tileWidth + this.spacing),
            y: this.margin + row * (this.tileHeight + this.spacing),
            width: this.tileWidth,
            height: this.tileHeight,
        };
    }

    drawTile(ctx, tileId, x, y, width = this.tileWidth, height = this.tileHeight)
    {
        if (tileId === 0 || !this.image) return false;

        const source = this.getTileSourceRect(tileId);
        if (!source) return false;

        ctx.drawImage(
            this.image,
            source.x,
            source.y,
            source.width,
            source.height,
            x,
            y,
            width,
            height
        );

        return true;
    }

    containsTile(tileId)
    {
        return this.getTileSourceRect(tileId) !== null;
    }

    _calculateColumns()
    {
        if (!this.image) return 1;

        const width = this.image.naturalWidth ?? this.image.width ?? this.tileWidth;
        return Math.max(1, Math.floor((width - this.margin * 2 + this.spacing) / (this.tileWidth + this.spacing)));
    }

    _calculateRows()
    {
        if (!this.image) return 1;

        const height = this.image.naturalHeight ?? this.image.height ?? this.tileHeight;
        return Math.max(1, Math.floor((height - this.margin * 2 + this.spacing) / (this.tileHeight + this.spacing)));
    }
}
