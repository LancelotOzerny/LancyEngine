class SpriteComponent extends BaseComponent
{
    sprite = null;
    color = null;
    alpha = 1;
    blendMode = 'overlay';

    _width = 150;
    _height = 150;

    constructor(params = {})
    {
        super(params);

        this.width = this.params.width ?? 150;
        this.height = this.params.height ?? 150;
    }

    get width() { return this._width; }
    set width(value)
    {
        this._width = value;
        if (this.sprite)
        {
            this.sprite.width = value;
        }
    }
    get height() { return this._height; }
    set height(value)
    {
        this._height = value;
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
            this.width = this.params.width ?? this.sprite.width;
            this.height = this.params.height ?? this.sprite.height;
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