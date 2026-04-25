import { Vector2 } from "../math/vector2.js";
import { BaseComponent } from "../core/base-component.js";
import { BodyType } from "../core/collision-world.js";
import { AABBShape, CircleShape, overlapShapes } from "../core/collision-shapes.js";
import { CollisionSystem } from "../core/collision-system.js";
import { SpriteComponent } from "./sprite-component.js";

export class ColliderComponent extends BaseComponent
{
    isColliderComponent = true;

    collisions = [];
    contacts = [];
    collisionEnters = [];
    collisionStays = [];
    collisionExits = [];
    triggerEnters = [];
    triggerStays = [];
    triggerExits = [];
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
    bodyType = BodyType.DYNAMIC;
    shapeType = "aabb";
    shape = null;

    constructor(params = {})
    {
        super(params);

        this.isTrigger = params.isTrigger ?? false;
        this.isStatic = params.isStatic ?? false;
        this.isEnabled = params.isEnabled ?? true;
        this.layer = params.layer ?? 0;
        this.mask = Array.isArray(params.mask) ? [...params.mask] : null;
        this.bodyType = params.bodyType ?? (this.isStatic ? BodyType.STATIC : BodyType.DYNAMIC);
        this.isStatic = this.bodyType === BodyType.STATIC || this.isStatic;
        this.shapeType = params.shape ?? params.shapeType ?? "aabb";
        this.configureShape();

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

        this.params.width ??= this.params.radius ? this.params.radius * 2 : 150;
        this.params.height ??= this.params.radius ? this.params.radius * 2 : 150;
        this.params.radius ??= Math.min(this.params.width, this.params.height) / 2;
        this.configureShape();

        this.isStatic = this.bodyType === BodyType.STATIC;

        CollisionSystem.instance.append(this);
    }

    resetFrameState()
    {
        this.resetPhysicsContactState();
    }

    resetPhysicsContactState()
    {
        this.contacts.length = 0;
        this.touching.left = false;
        this.touching.right = false;
        this.touching.top = false;
        this.touching.bottom = false;
    }

    resetWorldFrameState()
    {
        this.resetWorldEventState();
    }

    resetWorldEventState()
    {
        this.collisions.length = 0;
        this.collisionEnters.length = 0;
        this.collisionStays.length = 0;
        this.collisionExits.length = 0;
        this.triggerEnters.length = 0;
        this.triggerStays.length = 0;
        this.triggerExits.length = 0;
    }

    canCollideWith(other)
    {
        if (!other?.isColliderComponent) return false;
        return CollisionSystem.instance.shouldCheck(this, other);
    }

    getBounds(
        posX = this.parent.transform.position.x,
        posY = this.parent.transform.position.y
    )
    {
        const shapePos = this.getShapePosition(posX, posY);
        return this.shape.getBounds(shapePos.x, shapePos.y);
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
            radius: this.params.radius,
            shapeType: this.shapeType,
        };
    }

    getShapePosition(
        posX = this.parent.transform.position.x,
        posY = this.parent.transform.position.y
    )
    {
        return {
            x: posX + this.offset.x,
            y: posY + this.offset.y,
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
        const selfShapePos = this.getShapePosition(selfPosX, selfPosY);
        const otherShapePos = other.getShapePosition(otherPosX, otherPosY);

        return overlapShapes(
            this.shape,
            selfShapePos.x,
            selfShapePos.y,
            other.shape,
            otherShapePos.x,
            otherShapePos.y
        );
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

    collisionEnter(other, pair)
    {
        this.collisionEnters.push({ other, pair });
    }

    collisionStay(other, pair)
    {
        this.collisionStays.push({ other, pair });
    }

    collisionExit(other, pair)
    {
        this.collisionExits.push({ other, pair });
    }

    triggerEnter(other, pair)
    {
        this.triggerEnters.push({ other, pair });
    }

    triggerStay(other, pair)
    {
        this.triggerStays.push({ other, pair });
    }

    triggerExit(other, pair)
    {
        this.triggerExits.push({ other, pair });
    }

    configureShape()
    {
        if (this.shapeType === "circle" || this.params.radius !== undefined)
        {
            this.shapeType = "circle";
            const radius = this.params.radius ?? Math.min(this.params.width ?? 150, this.params.height ?? 150) / 2;
            this.shape = new CircleShape(radius);
            return;
        }

        this.shapeType = "aabb";
        this.shape = new AABBShape(this.params.width ?? 150, this.params.height ?? 150);
    }

    destroy()
    {
        CollisionSystem.instance.remove(this);
        super.destroy();
    }
}
