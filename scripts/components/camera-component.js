import { Vector2 } from "../math/vector2.js";
import { BaseComponent } from "../core/base-component.js";
import { Engine } from "../core/engine.js";
import { SpriteComponent } from "./sprite-component.js";

export class CameraComponent extends BaseComponent
{
    isMain = true;
    isEnabled = true;

    target = null;
    offset = new Vector2(0, 0);

    smoothness = 8;

    deadZoneWidth = 0;
    deadZoneHeight = 0;

    useBounds = false;
    bounds = {
        left: 0,
        top: 0,
        right: 1920,
        bottom: 1080,
    };

    shakeTime = 0;
    shakeDuration = 0;
    shakeStrength = 0;
    shakeOffset = new Vector2(0, 0);

    constructor(params = {})
    {
        super(params);

        this.isMain = params.isMain ?? true;
        this.isEnabled = params.isEnabled ?? true;

        this.target = params.target ?? null;

        this.offset.set(
            params.offsetX ?? 0,
            params.offsetY ?? 0
        );

        this.smoothness = params.smoothness ?? 8;

        this.deadZoneWidth = params.deadZoneWidth ?? 0;
        this.deadZoneHeight = params.deadZoneHeight ?? 0;

        if (params.bounds)
        {
            this.useBounds = true;
            this.bounds = {
                left: params.bounds.left ?? 0,
                top: params.bounds.top ?? 0,
                right: params.bounds.right ?? 1920,
                bottom: params.bounds.bottom ?? 1080,
            };
        }
    }

    start()
    {
        if (this.isMain)
        {
            Engine.instance.activeCameraComponent = this;
        }

        this.snap();
    }

    setTarget(target)
    {
        this.target = target;
        return this;
    }

    setOffset(x, y)
    {
        this.offset.set(x, y);
        return this;
    }

    setBounds(left, top, right, bottom)
    {
        this.useBounds = true;
        this.bounds.left = left;
        this.bounds.top = top;
        this.bounds.right = right;
        this.bounds.bottom = bottom;
        return this;
    }

    clearBounds()
    {
        this.useBounds = false;
        return this;
    }

    setDeadZone(width, height)
    {
        this.deadZoneWidth = width;
        this.deadZoneHeight = height;
        return this;
    }

    shake(duration = 0.25, strength = 12)
    {
        this.shakeDuration = duration;
        this.shakeTime = duration;
        this.shakeStrength = strength;
        return this;
    }

    getFollowTarget()
    {
        if (this.target)
        {
            return this.target;
        }

        return this.parent;
    }

    getTargetCenter()
    {
        const target = this.getFollowTarget();

        if (!target || !target.transform)
        {
            return {
                x: Engine.instance.designWidth / 2,
                y: Engine.instance.designHeight / 2,
            };
        }

        const sprite = target.findComponent?.(SpriteComponent);

        const width = sprite ? sprite.width : 0;
        const height = sprite ? sprite.height : 0;

        return {
            x: target.transform.position.x + width / 2 + this.offset.x,
            y: target.transform.position.y + height / 2 + this.offset.y,
        };
    }

    clampViewLeft(viewLeft, viewWidth)
    {
        if (!this.useBounds) return viewLeft;

        const minLeft = this.bounds.left;
        const maxLeft = Math.max(this.bounds.left, this.bounds.right - viewWidth);

        return Math.max(minLeft, Math.min(maxLeft, viewLeft));
    }

    clampViewTop(viewTop, viewHeight)
    {
        if (!this.useBounds) return viewTop;

        const minTop = this.bounds.top;
        const maxTop = Math.max(this.bounds.top, this.bounds.bottom - viewHeight);

        return Math.max(minTop, Math.min(maxTop, viewTop));
    }

    snap()
    {
        if (!this.isEnabled) return;

        const engine = Engine.instance;
        const target = this.getTargetCenter();

        let viewLeft = target.x - engine.viewWidth / 2;
        let viewTop = target.y - engine.viewHeight / 2;

        viewLeft = this.clampViewLeft(viewLeft, engine.viewWidth);
        viewTop = this.clampViewTop(viewTop, engine.viewHeight);

        engine.camera.x = viewLeft + engine.worldOffset.x;
        engine.camera.y = viewTop + engine.worldOffset.y;
    }

    update(dt)
    {
        if (!this.isEnabled) return;

        if (this.isMain && Engine.instance.activeCameraComponent !== this)
        {
            Engine.instance.activeCameraComponent = this;
        }

        if (Engine.instance.activeCameraComponent !== this)
        {
            return;
        }

        const engine = Engine.instance;
        const target = this.getTargetCenter();
        const view = engine.getViewRect();

        let desiredLeft = view.left;
        let desiredTop = view.top;

        const hasDeadZoneX =
            this.deadZoneWidth > 0 && this.deadZoneWidth < view.width;
        const hasDeadZoneY =
            this.deadZoneHeight > 0 && this.deadZoneHeight < view.height;

        if (hasDeadZoneX)
        {
            const zoneLeft = view.left + (view.width - this.deadZoneWidth) / 2;
            const zoneRight = zoneLeft + this.deadZoneWidth;

            if (target.x < zoneLeft)
            {
                desiredLeft -= zoneLeft - target.x;
            }
            else if (target.x > zoneRight)
            {
                desiredLeft += target.x - zoneRight;
            }
        }
        else
        {
            desiredLeft = target.x - view.width / 2;
        }

        if (hasDeadZoneY)
        {
            const zoneTop = view.top + (view.height - this.deadZoneHeight) / 2;
            const zoneBottom = zoneTop + this.deadZoneHeight;

            if (target.y < zoneTop)
            {
                desiredTop -= zoneTop - target.y;
            }
            else if (target.y > zoneBottom)
            {
                desiredTop += target.y - zoneBottom;
            }
        }
        else
        {
            desiredTop = target.y - view.height / 2;
        }

        desiredLeft = this.clampViewLeft(desiredLeft, view.width);
        desiredTop = this.clampViewTop(desiredTop, view.height);

        const currentLeft = view.left;
        const currentTop = view.top;

        const t = this.smoothness <= 0 ? 1 : Math.min(1, this.smoothness * dt);

        let nextLeft = currentLeft + (desiredLeft - currentLeft) * t;
        let nextTop = currentTop + (desiredTop - currentTop) * t;

        nextLeft = this.clampViewLeft(nextLeft, view.width);
        nextTop = this.clampViewTop(nextTop, view.height);

        this.shakeOffset.set(0, 0);

        if (this.shakeTime > 0)
        {
            this.shakeTime -= dt;

            const power = this.shakeDuration <= 0
                ? 0
                : Math.max(0, this.shakeTime / this.shakeDuration);

            this.shakeOffset.x = (Math.random() * 2 - 1) * this.shakeStrength * power;
            this.shakeOffset.y = (Math.random() * 2 - 1) * this.shakeStrength * power;

            if (this.shakeTime <= 0)
            {
                this.shakeOffset.set(0, 0);
            }
        }

        engine.camera.x = nextLeft + engine.worldOffset.x + this.shakeOffset.x;
        engine.camera.y = nextTop + engine.worldOffset.y + this.shakeOffset.y;
    }
}
