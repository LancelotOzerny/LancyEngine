class Vector2
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
    }

    add(vector2)
    {
        this.x += vector2.x;
        this.y += vector2.y;
        return this;
    }
}