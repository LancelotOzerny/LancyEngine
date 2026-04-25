import { CollisionWorld } from "./collision-world.js";

export class CollisionSystem
{
    static instance = new CollisionSystem();

    constructor(world = new CollisionWorld())
    {
        this.world = world;
        this.colliders = this.world.colliders;
    }

    append(collider)
    {
        return this.world.addCollider(collider);
    }

    remove(collider)
    {
        this.world.removeCollider(collider);
    }

    contain(collider)
    {
        return this.world.contains(collider);
    }

    updateCollider(collider)
    {
        this.world.updateCollider(collider);
    }

    shouldCheck(a, b)
    {
        return this.world.shouldCheck(a, b);
    }

    isCollider(value)
    {
        return this.world.isCollider(value);
    }

    getOverlaps(collider, posX = collider.parent.transform.position.x, posY = collider.parent.transform.position.y, options = {})
    {
        return this.world.getOverlaps(collider, posX, posY, options);
    }

    overlapBox(x, y, width, height, options = {})
    {
        return this.world.overlapBox(x, y, width, height, options);
    }

    overlapPoint(x, y, options = {})
    {
        return this.world.overlapPoint(x, y, options);
    }

    overlapCircle(x, y, radius, options = {})
    {
        return this.world.overlapCircle(x, y, radius, options);
    }

    raycast(originX, originY, directionX, directionY, options = {})
    {
        return this.world.raycast(originX, originY, directionX, directionY, options);
    }

    updateCollisions()
    {
        this.world.update();
    }
}
