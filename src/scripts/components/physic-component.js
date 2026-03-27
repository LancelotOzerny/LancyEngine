class PhysicComponent extends BaseComponent
{
    gravityScale = 1;
    mass = 1;
    drag = 0;
    useGravity = true;
    isGrounded = false;

    velocity = new Vector2();
    force = new Vector2();
    prevPosition = new Vector2();

    start()
    {
        this.velocity.set(0, 0);
        this.force.set(0, 0);
        this.prevPosition.set(
            this.parent.transform.position.x,
            this.parent.transform.position.y
        );
    }

    applyForce(x, y)
    {
        this.force.x += x;
        this.force.y += y;
    }

    update(dt)
    {
        const transform = this.parent.transform;
        const collider = this.parent.findComponent(ColliderComponent);

        this.prevPosition.set(transform.position.x, transform.position.y);

        if (collider)
        {
            collider.resetFrameState();
        }

        const safeMass = this.mass <= 0 ? 0.0001 : this.mass;

        const ax = (this.force.x - this.velocity.x * this.drag) / safeMass;
        let ay = (this.force.y - this.velocity.y * this.drag) / safeMass;

        if (this.useGravity)
        {
            ay += 9.81 * this.gravityScale;
        }

        this.velocity.x += ax * dt;
        this.velocity.y += ay * dt;

        if (!collider || collider.isTrigger)
        {
            transform.position.x += this.velocity.x * dt;
            transform.position.y += this.velocity.y * dt;
            this.force.set(0, 0);
            return;
        }

        this.moveAxisX(dt, collider);

        this.isGrounded = false;
        this.moveAxisY(dt, collider);

        this.collectTriggerContacts(collider);
        this.force.set(0, 0);
    }

    moveAxisX(dt, collider)
    {
        const transform = this.parent.transform;
        transform.position.x += this.velocity.x * dt;

        const overlaps = CollisionSystem.instance.getOverlaps(collider);

        for (const entry of overlaps)
        {
            const other = entry.collider;
            const info = entry.info;

            if (other.isTrigger || info.overlapX <= 0 || info.overlapY <= 0)
            {
                continue;
            }

            const selfBounds = collider.getBounds();
            const otherBounds = info.other;

            if (this.velocity.x > 0)
            {
                transform.position.x = otherBounds.left - collider.offset.x - selfBounds.width;
                collider.addContact(other, "right", -1, 0, info.overlapX, info.overlapY, false);
            }
            else if (this.velocity.x < 0)
            {
                transform.position.x = otherBounds.right - collider.offset.x;
                collider.addContact(other, "left", 1, 0, info.overlapX, info.overlapY, false);
            }
            else if (selfBounds.centerX < otherBounds.centerX)
            {
                transform.position.x = otherBounds.left - collider.offset.x - selfBounds.width;
                collider.addContact(other, "right", -1, 0, info.overlapX, info.overlapY, false);
            }
            else
            {
                transform.position.x = otherBounds.right - collider.offset.x;
                collider.addContact(other, "left", 1, 0, info.overlapX, info.overlapY, false);
            }

            this.velocity.x = 0;
        }
    }

    moveAxisY(dt, collider)
    {
        const transform = this.parent.transform;
        transform.position.y += this.velocity.y * dt;

        const overlaps = CollisionSystem.instance.getOverlaps(collider);

        for (const entry of overlaps)
        {
            const other = entry.collider;
            const info = entry.info;

            if (other.isTrigger || info.overlapX <= 0 || info.overlapY <= 0)
            {
                continue;
            }

            const selfBounds = collider.getBounds();
            const otherBounds = info.other;

            if (this.velocity.y > 0)
            {
                transform.position.y = otherBounds.top - collider.offset.y - selfBounds.height;
                this.isGrounded = true;
                collider.addContact(other, "bottom", 0, -1, info.overlapX, info.overlapY, false);
            }
            else if (this.velocity.y < 0)
            {
                transform.position.y = otherBounds.bottom - collider.offset.y;
                collider.addContact(other, "top", 0, 1, info.overlapX, info.overlapY, false);
            }
            else if (selfBounds.centerY < otherBounds.centerY)
            {
                transform.position.y = otherBounds.top - collider.offset.y - selfBounds.height;
                this.isGrounded = true;
                collider.addContact(other, "bottom", 0, -1, info.overlapX, info.overlapY, false);
            }
            else
            {
                transform.position.y = otherBounds.bottom - collider.offset.y;
                collider.addContact(other, "top", 0, 1, info.overlapX, info.overlapY, false);
            }

            this.velocity.y = 0;
        }
    }

    collectTriggerContacts(collider)
    {
        const overlaps = CollisionSystem.instance.getOverlaps(collider);

        for (const entry of overlaps)
        {
            const other = entry.collider;
            const info = entry.info;

            if (!other.isTrigger)
            {
                continue;
            }

            collider.addContact(other, null, 0, 0, info.overlapX, info.overlapY, true);
        }
    }
}