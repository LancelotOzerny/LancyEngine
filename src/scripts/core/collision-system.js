class CollisionSystem
{
    static instance = new CollisionSystem();
    colliders = [];

    updateCollisions()
    {
        for (let i = 0; i < this.colliders.length; ++i)
        {
            for (let j = i + 1; j < this.colliders.length; ++j)
            {
                let collisions1 = this.colliders[i].collisions;
                let collisions2 = this.colliders[j].collisions;

                if (this.colliders[i].checkCollision(this.colliders[j]))
                {
                    collisions1.push(this.colliders[j]);
                    collisions2.push(this.colliders[i]);
                }
                else
                {
                    if (collisions1.indexOf(this.colliders[j]) !== -1)
                    {
                        collisions1.pop(this.colliders[j]);
                    }
                    if (collisions2.indexOf(this.colliders[i]) !== -1)
                    {
                        collisions2.pop(this.colliders[i]);
                    }
                }
            }
        }
    }

    append(collider)
    {
        if (this.contain(collider))
        {
            return;
        }

        this.colliders.push(collider);
    }

    remove(collider)
    {
        const index = this.colliders.indexOf(collider);
        if (index !== -1) this.colliders.splice(index, 1);
    }

    contain(collider)
    {
        return this.colliders.indexOf(collider) !== -1;
    }
}