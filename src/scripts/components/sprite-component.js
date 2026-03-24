class SpriteComponent extends BaseComponent
{
    imageName = '';
    sprite

    start()
    {
        this.sprite = Engine.instance.assets.get(this.imageName);
    }

    render(ctx)
    {
        if (this.sprite) ctx.drawImage(this.sprite, this.parent.transform.position.x, this.parent.transform.position.y);
    }
}