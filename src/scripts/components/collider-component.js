class ColliderComponent extends BaseComponent
{
    get isCollision() { return this.collisions.length }
    collisions = [];

    get collision()
    {
        return this.collisions.length === 0 ? null : this.collisions[0];
    }

    init()
    {
        let sprite = this.parent.findComponent(SpriteComponent);

        if (sprite)
        {
            if (typeof(this.params.width) === 'undefined') this.params.width = sprite.width;
            if (typeof(this.params.height) === 'undefined') this.params.height = sprite.height;
        }

        this.params.width ??= 150;
        this.params.height ??= 150;

        CollisionSystem.instance.append(this);
    }

    checkCollision(collider2)
    {
        let info1 = this.getInfoForCheck();
        let info2 = collider2.getInfoForCheck();

        let leftCollision = info1.posX + info1.width >= info2.posX;
        let rightCollision = info1.posX <= info2.posX + info2.width;
        let topCollision = info1.posY + info1.height >= info2.posY;
        let bottomCollision = info1.posY <= info2.posY + info2.height;

        return leftCollision && rightCollision && topCollision && bottomCollision;
    }

    getInfoForCheck()
    {
        return {
            posX: this.parent.transform.position.x,
            posY: this.parent.transform.position.y,
            width: this.params.width,
            height: this.params.height,
        }
    }

    destroy()
    {
        CollisionSystem.instance.remove(this);
        super.destroy();
    }
}