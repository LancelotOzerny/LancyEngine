class PhysicComponent extends BaseComponent
{
    gravityScale = 1;
    mass = 1;
    drag = 0;

    velocity = new Vector2();
    force = new Vector2();

    start()
    {
        this.velocity.set(0, 0);
        this.force.set(0, 0);
    }

    applyForce(forceX, forceY)
    {
        this.force.x += forceX;
        this.force.y += forceY;
    }

    update(deltaTime)
    {
        const transform = this.parent.transform;

        let accelerationX = (this.force.x - this.velocity.x * this.drag) / this.mass;
        let accelerationY = (this.force.y - this.velocity.y * this.drag) / this.mass;

        const gravityForce = 9.81 * this.gravityScale;
        accelerationY += gravityForce;

        this.velocity.x += accelerationX * deltaTime;
        this.velocity.y += accelerationY * deltaTime;

        transform.position.x += this.velocity.x * deltaTime;
        transform.position.y += this.velocity.y * deltaTime;

        this.force.set(0, 0);
    }
}