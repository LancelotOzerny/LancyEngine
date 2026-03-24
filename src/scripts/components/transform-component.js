class TransformComponent extends BaseComponent
{
    position = new Vector2();

    setPosition(x, y)
    {
        this.position.set(x, y);
    }

    translate(dx, dy)
    {
        this.position.x += dx;
        this.position.y += dy;
    }
}