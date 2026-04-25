export class SpatialHashGrid
{
    constructor(cellSize = 256)
    {
        this.cellSize = cellSize;
        this.cells = new Map();
        this.objectCells = new Map();
    }

    clear()
    {
        this.cells.clear();
        this.objectCells.clear();
    }

    add(object, bounds)
    {
        this.remove(object);

        const keys = this.getCellKeys(bounds);
        this.objectCells.set(object, keys);

        keys.forEach(key =>
        {
            if (!this.cells.has(key))
            {
                this.cells.set(key, new Set());
            }

            this.cells.get(key).add(object);
        });
    }

    update(object, bounds)
    {
        this.add(object, bounds);
    }

    remove(object)
    {
        const keys = this.objectCells.get(object);
        if (!keys) return;

        keys.forEach(key =>
        {
            const bucket = this.cells.get(key);
            if (!bucket) return;

            bucket.delete(object);

            if (bucket.size === 0)
            {
                this.cells.delete(key);
            }
        });

        this.objectCells.delete(object);
    }

    query(bounds)
    {
        const result = new Set();

        this.getCellKeys(bounds).forEach(key =>
        {
            const bucket = this.cells.get(key);
            if (!bucket) return;

            bucket.forEach(object => result.add(object));
        });

        return [...result];
    }

    getCellKeys(bounds)
    {
        const minX = Math.floor(bounds.left / this.cellSize);
        const minY = Math.floor(bounds.top / this.cellSize);
        const maxX = Math.floor((bounds.right - Number.EPSILON) / this.cellSize);
        const maxY = Math.floor((bounds.bottom - Number.EPSILON) / this.cellSize);
        const keys = [];

        for (let y = minY; y <= maxY; y += 1)
        {
            for (let x = minX; x <= maxX; x += 1)
            {
                keys.push(`${x}:${y}`);
            }
        }

        return keys;
    }
}
