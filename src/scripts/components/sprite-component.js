class SpriteComponent extends BaseComponent
{
    imageName = '';
    sprite = null;

    get height() { return this.sprite.height; }
    set height(value) { this.sprite.height = value; }
    set width(value) { this.sprite.width = value; }
    get width() { return this.sprite.width; }

    init()
    {
        this.sprite = Engine.instance.assets.get(this.imageName);

        if (this.params.width !== 'undefined') this.width = this.params.width;
        if (this.params.height !== 'undefined') this.height = this.params.height;
    }

    render(ctx) {
        if (!this.sprite) return;

        const x = this.parent.transform.position.x;
        const y = this.parent.transform.position.y;

        ctx.save();
        ctx.translate(x + this.width / 2, y + this.height / 2);
        ctx.rotate(this.parent.transform.rotation * Math.PI / 180);
        ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }
}