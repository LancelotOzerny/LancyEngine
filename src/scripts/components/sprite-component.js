class SpriteComponent extends BaseComponent
{
    sprite = null;
    color = null;
    alpha = 1;
    blendMode = 'overlay';

    width = 150;
    height = 150;

    get width() { return this.width; }
    set width(value)
    {
        this.width = value;
        if (this.sprite)
        {
            this.sprite.width = value;
        }
    }
    get height() { return this.height; }
    set height(value)
    {
        this.height = value;
        if (this.sprite)
        {
            this.sprite.height = value;
        }
    }

    init()
    {
        if (this.params.sprite)
        {
            this.sprite = Engine.instance.assets.get(this.params.sprite);
            this.width = this.sprite.width;
            this.height = this.sprite.height;
        }

        this.width = this.params.width ?? this.width;
        this.height = this.params.height ?? this.height;
    }

    render(ctx)
    {
        let pos = this.parent.transform.position;

        ctx.save();
        ctx.translate(pos.x + this.width / 2, pos.y + this.height / 2);
        ctx.rotate(this.parent.transform.rotation * Math.PI / 180);

        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;

        if (this.sprite)
        {
            ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);

            if (this.color)
            {
                ctx.save();
                ctx.globalCompositeOperation = this.blendMode;
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
                ctx.restore();
            }
        }
        else
        {
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }
        ctx.restore();
    }
}