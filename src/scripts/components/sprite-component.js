class SpriteComponent extends BaseComponent
{
    sprite = null;
    color = null;
    alpha = 1;
    blendMode = "overlay";
    _size = new Vector2(150, 150);
    _offset = new Vector2(0, 0);

    constructor(params = {})
    {
        super(params);
        this._size.x = this.params.width ?? 150;
        this._size.y = this.params.height ?? 150;
    }

    get width() { return this._size.x;}
    set width(value) { this._size.x = value; }
    get height() { return this._size.y; }
    set height(value) { this._size.y = value; }

    set offsetX(value) { this._offset.x = value; }
    set offsetY(value) { this._offset.y = value; }
    get offsetX() { return this._offset.x; }
    get offsetY() { return this._offset.y; }

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
            this._size.x = this.params.width ?? asset.naturalWidth ?? asset.width ?? 150;
            this._size.y = this.params.height ?? asset.naturalHeight ?? asset.height ?? 150;

            return;
        }

        this._size.x = this.params.width ?? this._size.x;
        this._size.y = this.params.height ?? this._size.y;
    }
    render(ctx)
    {
        const pos = new Vector2(
            this.parent.transform.position.x + this._offset.x,
            this.parent.transform.position.y + this._offset.y
        );

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