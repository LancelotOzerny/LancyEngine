class ColliderComponent extends BaseComponent
{
    collisions = [];
    contacts = [];
    touching = {
        left: false,
        right: false,
        top: false,
        bottom: false,
    };

    offset = new Vector2();
    isTrigger = false;
    isStatic = false;
    isEnabled = true;
    layer = 0;
    mask = null;

    constructor(params = {})
    {
        super(params);

        this.isTrigger = params.isTrigger ?? false;
        this.isStatic = params.isStatic ?? false;
        this.isEnabled = params.isEnabled ?? true;
        this.layer = params.layer ?? 0;
        this.mask = Array.isArray(params.mask) ? [...params.mask] : null;

        this.offset.set(params.offsetX ?? 0, params.offsetY ?? 0);
    }

    get isCollision()
    {
        return this.collisions.length;
    }

    get collision()
    {
        return this.collisions.length === 0 ? null : this.collisions[0];
    }

    init()
    {
        const sprite = this.parent.findComponent(SpriteComponent);

        if (sprite)
        {
            if (this.params.width === undefined) this.params.width = sprite.width;
            if (this.params.height === undefined) this.params.height = sprite.height;
        }

        this.params.width ??= 150;
        this.params.height ??= 150;

        CollisionSystem.instance.append(this);
    }

    resetFrameState()
    {
        this.contacts.length = 0;
        this.collisions.length = 0;

        this.touching.left = false;
        this.touching.right = false;
        this.touching.top = false;
        this.touching.bottom = false;
    }

    canCollideWith(other)
    {
        if (!(other instanceof ColliderComponent)) return false;
        if (!this.isEnabled || !other.isEnabled) return false;
        if (this.parent === other.parent) return false;

        const selfAllows = this.mask === null || this.mask.includes(other.layer);
        const otherAllows = other.mask === null || other.mask.includes(this.layer);

        return selfAllows && otherAllows;
    }

    getBounds(
        posX = this.parent.transform.position.x,
        posY = this.parent.transform.position.y
    )
    {
        const left = posX + this.offset.x;
        const top = posY + this.offset.y;
        const width = this.params.width;
        const height = this.params.height;

        return {
            left,
            top,
            right: left + width,
            bottom: top + height,
            width,
            height,
            centerX: left + width / 2,
            centerY: top + height / 2,
        };
    }

    getInfoForCheck(
        posX = this.parent.transform.position.x,
        posY = this.parent.transform.position.y
    )
    {
        return {
            posX: posX + this.offset.x,
            posY: posY + this.offset.y,
            width: this.params.width,
            height: this.params.height,
        };
    }

    getOverlap(
        other,
        selfPosX = this.parent.transform.position.x,
        selfPosY = this.parent.transform.position.y,
        otherPosX = other.parent.transform.position.x,
        otherPosY = other.parent.transform.position.y
    )
    {
        const a = this.getBounds(selfPosX, selfPosY);
        const b = other.getBounds(otherPosX, otherPosY);

        const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

        return {
            intersects: overlapX > 0 && overlapY > 0,
            overlapX: Math.max(0, overlapX),
            overlapY: Math.max(0, overlapY),
            self: a,
            other: b,
        };
    }

    checkCollision(
        other,
        selfPosX = this.parent.transform.position.x,
        selfPosY = this.parent.transform.position.y,
        otherPosX = other.parent.transform.position.x,
        otherPosY = other.parent.transform.position.y
    )
    {
        return this.getOverlap(other, selfPosX, selfPosY, otherPosX, otherPosY).intersects;
    }

    addContact(other, side, normalX, normalY, overlapX = 0, overlapY = 0, isTrigger = false)
    {
        this.contacts.push({
            other,
            side,
            normalX,
            normalY,
            overlapX,
            overlapY,
            isTrigger,
        });

        if (!isTrigger && side && this.touching[side] !== undefined)
        {
            this.touching[side] = true;
        }

        if (!this.collisions.includes(other))
        {
            this.collisions.push(other);
        }
    }

    destroy()
    {
        CollisionSystem.instance.remove(this);
        super.destroy();
    }
}