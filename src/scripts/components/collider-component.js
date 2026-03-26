class ColliderComponent extends BaseComponent
{
    get isCollision() { return this.collisions.length }
    collisions = [];

    init()
    {
        this.params.width ??= 50;
        this.params.height ??= 50;

        CollisionSystem.instance.colliders.push(this);
    }

    render(ctx)
    {
        ctx.fillStyle = this.isCollision ? 'green' : 'blue';
        ctx.fillRect(this.parent.transform.position.x, this.parent.transform.position.y, this.params.width, this.params.height);
    }

    static count = 0;

    checkCollision(collider2)
    {
        let info1 = this.getInfoForCheck();
        let info2 = collider2.getInfoForCheck();

        let leftCollision = info1.posX + info1.width >= info2.posX;
        let rightCollision = info1.posX <= info2.posX + info2.width;
        let topCollision = info1.posY + info1.height >= info2.posY;
        let bottomCollision = info1.posY <= info2.posY + info2.height;
/*

        if (++ColliderComponent.count % 1_000_0 === 0)
        {
            console.log({
                info1: info1,
                info2: info2,
                collisions: {
                    left: leftCollision,
                    right: rightCollision,
                }
            })
        }*/


        if (leftCollision && rightCollision && topCollision && bottomCollision)
        {
            return true;
        }

        return false;
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
}