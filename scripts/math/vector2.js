export class Vector2
{
    x = 0;
    y = 0;

    constructor(x = 0, y = 0)
    {
        this.set(x, y);
    }

    set(x, y)
    {
        this.x = x;
        this.y = y;
        return this;
    }

    clone()
    {
        return new Vector2(this.x, this.y);
    }

    add(vector2)
    {
        this.x += vector2.x;
        this.y += vector2.y;
        return this;
    }

    sub(vector2)
    {
        this.x -= vector2.x;
        this.y -= vector2.y;
        return this;
    }

    mul(value)
    {
        if (typeof value === "number")
        {
            this.x *= value;
            this.y *= value;
            return this;
        }

        this.x *= value.x;
        this.y *= value.y;
        return this;
    }

    length()
    {
        return Math.hypot(this.x, this.y);
    }

    normalize()
    {
        const len = this.length();

        if (len === 0)
        {
            return this;
        }

        this.x /= len;
        this.y /= len;
        return this;
    }

    distance(vector2)
    {
        return Math.hypot(this.x - vector2.x, this.y - vector2.y);
    }

    lerp(vector2, t)
    {
        const factor = Math.max(0, Math.min(1, t));
        this.x += (vector2.x - this.x) * factor;
        this.y += (vector2.y - this.y) * factor;
        return this;
    }
}
