class CollisionSystem
{
    static instance = new CollisionSystem();

    colliders = [];

    append(collider)
    {
        if (!this.contain(collider))
        {
            this.colliders.push(collider);
        }
    }

    remove(collider)
    {
        const index = this.colliders.indexOf(collider);
        if (index !== -1)
        {
            this.colliders.splice(index, 1);
        }
    }

    contain(collider)
    {
        return this.colliders.indexOf(collider) !== -1;
    }

    shouldCheck(a, b)
    {
        if (a === b) return false;
        if (!(a instanceof ColliderComponent) || !(b instanceof ColliderComponent)) return false;
        return a.canCollideWith(b) && b.canCollideWith(a);
    }

    getOverlaps(
        collider,
        posX = collider.parent.transform.position.x,
        posY = collider.parent.transform.position.y
    )
    {
        const result = [];

        for (const other of this.colliders)
        {
            if (!this.shouldCheck(collider, other))
            {
                continue;
            }

            const info = collider.getOverlap(other, posX, posY);

            if (info.intersects)
            {
                result.push({
                    collider: other,
                    info,
                });
            }
        }

        return result;
    }

    updateCollisions()
    {
        for (const collider of this.colliders)
        {
            collider.collisions.length = 0;
        }

        for (let i = 0; i < this.colliders.length; ++i)
        {
            for (let j = i + 1; j < this.colliders.length; ++j)
            {
                const a = this.colliders[i];
                const b = this.colliders[j];

                if (!this.shouldCheck(a, b))
                {
                    continue;
                }

                if (a.checkCollision(b))
                {
                    if (!a.collisions.includes(b)) a.collisions.push(b);
                    if (!b.collisions.includes(a)) b.collisions.push(a);
                }
            }
        }
    }
}