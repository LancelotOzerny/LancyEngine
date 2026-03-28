class SpriteComponent extends BaseComponent
{
    sprite = null;
    color = null;
    alpha = 1;
    blendMode = "overlay";
    _width = 150;
    _height = 150;
    constructor(params = {})
    {
        super(params);
        this._width = this.params.width ?? 150;
        this._height = this.params.height ?? 150;
    }
    get
    width()
    {
        return this._width;
    }
    set
    width(value)
    {
        this._width = value;
    }
    get
    height()
    {
        return this._height;
    }
    set
    height(value)
    {
        this._height = value;
    }
    init()
    {
        if (this.params.sprite)
        {
            const asset = Engine.instance.assets?.get(this.params.sprite);
            if (!asset)
            {
                throw new Error(`Sprite asset "${this.params.sprite}" not found in Engine.instance.assets`);
            }
            this.sprite = asset;
            this._width = this.params.width ?? asset.naturalWidth ?? asset.width ?? 150;
            this._height = this.params.height ?? asset.naturalHeight ?? asset.height ?? 150;
        }
        else
        {
            this._width = this.params.width ?? this._width;
            this._height = this.params.height ?? this._height;
        }
    }
    render(ctx)
    {
        const pos = this.parent.transform.position;
        ctx.save();
        ctx.translate(pos.x + this.width / 2, pos.y + this.height / 2);
        ctx.rotate(this.parent.transform.rotation * Math.PI / 180);
        ctx.globalAlpha = this.alpha;
        if (this.sprite)
        {
            ctx.drawImage(this.sprite, -this.width / 2, -this.height / 2, this.width, this.height);
            if (this.color)
            {
                ctx.save();
                ctx.fillStyle = this.color;
                ctx.globalCompositeOperation = this.blendMode;
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
                ctx.restore();
            }
        }
        else
        {
            ctx.fillStyle = this.color ?? "#ff00ff";
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }
        ctx.restore();
    }
}