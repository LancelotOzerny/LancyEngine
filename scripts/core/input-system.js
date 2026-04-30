import { Vector2 } from "../math/vector2.js";

const DEFAULT_SWIPE = {
    active: false,
    direction: null,
    distance: 0,
    start: new Vector2(),
    end: new Vector2(),
};

export class InputSystem
{
    constructor()
    {
        this.engine = null;
        this.canvas = null;

        this.keys = new Set();
        this.pressedKeys = new Set();
        this.releasedKeys = new Set();
        this.actions = new Map();

        this.pointerPosition = new Vector2();
        this.pointerDelta = new Vector2();
        this.pointerWheelDelta = new Vector2();
        this.pointerButtons = new Set();
        this.pressedPointerButtons = new Set();
        this.releasedPointerButtons = new Set();
        this.pointerButtonCounts = new Map();
        this.activePointers = new Map();
        this.primaryPointerId = null;

        this.tap = false;
        this.tapMaxDistance = 12;
        this.tapMaxTime = 300;
        this.swipeThreshold = 30;
        this.activeSwipe = null;
        this.completedSwipe = null;

        this.gamepadButtons = new Set();
        this.pressedGamepadButtons = new Set();
        this.releasedGamepadButtons = new Set();
        this.gamepadAxes = new Map();
        this.connectedGamepads = [];

        this.virtualButtons = new Map();
        this.virtualJoysticks = new Map();

        this.blockedKeys = new Set([
            "Space",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
        ]);

        this._isKeyboardBound = false;
        this._isPointerBound = false;
        this._previousTouchAction = null;

        this._onKeyDown = this._handleKeyDown.bind(this);
        this._onKeyUp = this._handleKeyUp.bind(this);
        this._onPointerDown = this._handlePointerDown.bind(this);
        this._onPointerMove = this._handlePointerMove.bind(this);
        this._onPointerUp = this._handlePointerUp.bind(this);
        this._onPointerCancel = this._handlePointerCancel.bind(this);
        this._onWheel = this._handleWheel.bind(this);

        this.init();
    }

    init()
    {
        if (this._isKeyboardBound || typeof window === "undefined") return;

        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
        this._isKeyboardBound = true;
    }

    bind(engine, canvas)
    {
        this.engine = engine ?? null;

        if (this.canvas === canvas && this._isPointerBound) return;

        this._unbindPointer();
        this.canvas = canvas ?? null;

        if (!this.canvas || typeof this.canvas.addEventListener !== "function") return;

        this._previousTouchAction = this.canvas.style.touchAction;
        this.canvas.style.touchAction = "none";

        this.canvas.addEventListener("pointerdown", this._onPointerDown);
        this.canvas.addEventListener("pointermove", this._onPointerMove);
        this.canvas.addEventListener("pointerup", this._onPointerUp);
        this.canvas.addEventListener("pointercancel", this._onPointerCancel);
        this.canvas.addEventListener("lostpointercapture", this._onPointerCancel);
        this.canvas.addEventListener("wheel", this._onWheel, { passive: false });
        this._isPointerBound = true;
    }

    mapAction(name, codes)
    {
        const keyCodes = Array.isArray(codes) ? codes : [codes];
        this.actions.set(name, new Set(keyCodes.filter(Boolean)));
    }

    unmapAction(name)
    {
        this.actions.delete(name);
    }

    isKeyDown(code)
    {
        return this.keys.has(code);
    }

    isKeyPressed(code)
    {
        return this.pressedKeys.has(code);
    }

    isKeyReleased(code)
    {
        return this.releasedKeys.has(code);
    }

    isActionDown(name)
    {
        return this._anyMappedKey(name, this.keys);
    }

    isActionPressed(name)
    {
        return this._anyMappedKey(name, this.pressedKeys);
    }

    isActionReleased(name)
    {
        return this._anyMappedKey(name, this.releasedKeys);
    }

    isPointerDown(button = 0)
    {
        return this.pointerButtons.has(button);
    }

    isPointerPressed(button = 0)
    {
        return this.pressedPointerButtons.has(button);
    }

    isPointerReleased(button = 0)
    {
        return this.releasedPointerButtons.has(button);
    }

    getPointerScreenPosition()
    {
        return this.pointerPosition.clone();
    }

    getPointerWorldPosition()
    {
        if (!this.engine || typeof this.engine.screenToWorld !== "function")
        {
            return this.pointerPosition.clone();
        }

        return this.engine.screenToWorld(this.pointerPosition.x, this.pointerPosition.y);
    }

    getPointerDelta()
    {
        return this.pointerDelta.clone();
    }

    getPointerWheelDelta()
    {
        return this.pointerWheelDelta.clone();
    }

    getTouches()
    {
        const touches = [];

        for (const pointer of this.activePointers.values())
        {
            if (pointer.pointerType !== "touch") continue;

            touches.push({
                id: pointer.id,
                pointerId: pointer.id,
                screenPosition: pointer.position.clone(),
                worldPosition: this._screenToWorld(pointer.position),
                start: pointer.start.clone(),
                delta: pointer.delta.clone(),
            });
        }

        return touches;
    }

    getTouchCount()
    {
        return this.getTouches().length;
    }

    isTouching()
    {
        return this.getTouchCount() > 0;
    }

    wasTapped()
    {
        return this.tap;
    }

    getSwipe()
    {
        const swipe = this.completedSwipe ?? this.activeSwipe ?? DEFAULT_SWIPE;

        return {
            active: swipe.active,
            direction: swipe.direction,
            distance: swipe.distance,
            start: swipe.start.clone(),
            end: swipe.end.clone(),
        };
    }

    updateGamepads()
    {
        const nextButtons = new Set();
        const nextAxes = new Map();
        const gamepads = this._readGamepads();

        this.connectedGamepads = gamepads;

        for (const gamepad of gamepads)
        {
            for (let buttonIndex = 0; buttonIndex < gamepad.buttons.length; buttonIndex++)
            {
                const button = gamepad.buttons[buttonIndex];
                const key = this._gamepadButtonKey(gamepad.index, buttonIndex);

                if (button?.pressed)
                {
                    nextButtons.add(key);

                    if (!this.gamepadButtons.has(key))
                    {
                        this.pressedGamepadButtons.add(key);
                    }
                }
                else if (this.gamepadButtons.has(key))
                {
                    this.releasedGamepadButtons.add(key);
                }
            }

            for (let axisIndex = 0; axisIndex < gamepad.axes.length; axisIndex++)
            {
                nextAxes.set(this._gamepadAxisKey(gamepad.index, axisIndex), gamepad.axes[axisIndex] ?? 0);
            }
        }

        for (const key of this.gamepadButtons)
        {
            if (!nextButtons.has(key))
            {
                this.releasedGamepadButtons.add(key);
            }
        }

        this.gamepadButtons = nextButtons;
        this.gamepadAxes = nextAxes;
    }

    isGamepadButtonDown(index, button)
    {
        return this.gamepadButtons.has(this._gamepadButtonKey(index, button));
    }

    isGamepadButtonPressed(index, button)
    {
        return this.pressedGamepadButtons.has(this._gamepadButtonKey(index, button));
    }

    isGamepadButtonReleased(index, button)
    {
        return this.releasedGamepadButtons.has(this._gamepadButtonKey(index, button));
    }

    getGamepadAxis(index, axis)
    {
        return this.gamepadAxes.get(this._gamepadAxisKey(index, axis)) ?? 0;
    }

    getConnectedGamepads()
    {
        return [...this.connectedGamepads];
    }

    addVirtualButton(name, rect)
    {
        this.virtualButtons.set(name, {
            rect: { ...rect },
            down: false,
            pressed: false,
            released: false,
        });

        this._refreshVirtualControls();
    }

    removeVirtualButton(name)
    {
        this.virtualButtons.delete(name);
    }

    isVirtualButtonDown(name)
    {
        return this.virtualButtons.get(name)?.down ?? false;
    }

    isVirtualButtonPressed(name)
    {
        return this.virtualButtons.get(name)?.pressed ?? false;
    }

    isVirtualButtonReleased(name)
    {
        return this.virtualButtons.get(name)?.released ?? false;
    }

    addVirtualJoystick(name, options = {})
    {
        this.virtualJoysticks.set(name, {
            options: {
                x: options.x ?? 0,
                y: options.y ?? 0,
                radius: options.radius ?? options.maxDistance ?? 64,
                deadZone: options.deadZone ?? 0.05,
                rect: options.rect ? { ...options.rect } : null,
                followPointer: options.followPointer ?? false,
            },
            pointerId: null,
            center: new Vector2(options.x ?? 0, options.y ?? 0),
            value: this._createJoystickValue(),
        });
    }

    getVirtualJoystick(name)
    {
        const joystick = this.virtualJoysticks.get(name);

        if (!joystick)
        {
            return this._createJoystickValue();
        }

        return {
            active: joystick.value.active,
            x: joystick.value.x,
            y: joystick.value.y,
            angle: joystick.value.angle,
            strength: joystick.value.strength,
        };
    }

    update()
    {
        this.pressedKeys.clear();
        this.releasedKeys.clear();

        this.pressedPointerButtons.clear();
        this.releasedPointerButtons.clear();
        this.pointerDelta.set(0, 0);
        this.pointerWheelDelta.set(0, 0);

        this.tap = false;
        this.completedSwipe = null;

        this.pressedGamepadButtons.clear();
        this.releasedGamepadButtons.clear();

        for (const button of this.virtualButtons.values())
        {
            button.pressed = false;
            button.released = false;
        }
    }

    destroy()
    {
        if (this._isKeyboardBound && typeof window !== "undefined")
        {
            window.removeEventListener("keydown", this._onKeyDown);
            window.removeEventListener("keyup", this._onKeyUp);
            this._isKeyboardBound = false;
        }

        this._unbindPointer();

        this.keys.clear();
        this.pressedKeys.clear();
        this.releasedKeys.clear();
        this.pointerButtons.clear();
        this.pressedPointerButtons.clear();
        this.releasedPointerButtons.clear();
        this.pointerButtonCounts.clear();
        this.activePointers.clear();
        this.primaryPointerId = null;
    }

    _handleKeyDown(event)
    {
        if (this.blockedKeys.has(event.code))
        {
            event.preventDefault();
        }

        if (!this.keys.has(event.code))
        {
            this.pressedKeys.add(event.code);
        }

        this.keys.add(event.code);
    }

    _handleKeyUp(event)
    {
        if (this.blockedKeys.has(event.code))
        {
            event.preventDefault();
        }

        this.releasedKeys.add(event.code);
        this.keys.delete(event.code);
    }

    _handlePointerDown(event)
    {
        this._preventPointerDefault(event);

        const position = this._eventToScreenPosition(event);
        const button = this._normalizeButton(event.button);
        const existing = this.activePointers.get(event.pointerId);

        this.pointerPosition = position.clone();

        if (this.primaryPointerId === null || event.isPrimary)
        {
            this.primaryPointerId = event.pointerId;
        }

        this.activePointers.set(event.pointerId, {
            id: event.pointerId,
            pointerType: event.pointerType || "mouse",
            button,
            buttons: event.buttons,
            position: position.clone(),
            previousPosition: position.clone(),
            start: existing?.start?.clone?.() ?? position.clone(),
            delta: new Vector2(),
            startTime: existing?.startTime ?? performance.now(),
            isPrimary: Boolean(event.isPrimary),
        });

        this._incrementPointerButton(button);
        this._capturePointer(event.pointerId);
        this._activateVirtualJoysticks(event.pointerId, position);
        this._refreshVirtualControls();
    }

    _handlePointerMove(event)
    {
        this._preventPointerDefault(event);

        const position = this._eventToScreenPosition(event);
        const pointer = this.activePointers.get(event.pointerId);

        this.pointerDelta.add(position.clone().sub(this.pointerPosition));
        this.pointerPosition = position.clone();

        if (pointer)
        {
            const delta = position.clone().sub(pointer.position);
            pointer.previousPosition = pointer.position.clone();
            pointer.position = position.clone();
            pointer.delta = delta;
            pointer.buttons = event.buttons;

            this._updateSwipe(pointer);
            this._updateVirtualJoysticks(event.pointerId, position);
            this._refreshVirtualControls();
        }
    }

    _handlePointerUp(event)
    {
        this._preventPointerDefault(event);

        const position = this._eventToScreenPosition(event);
        const pointer = this.activePointers.get(event.pointerId);
        const button = this._normalizeButton(event.button);

        this.pointerDelta.add(position.clone().sub(this.pointerPosition));
        this.pointerPosition = position.clone();

        if (pointer)
        {
            pointer.position = position.clone();
            pointer.buttons = event.buttons;

            if ((event.buttons ?? 0) > 0)
            {
                this._decrementPointerButton(button);
                this._updateVirtualJoysticks(event.pointerId, position);
                this._refreshVirtualControls();
                return;
            }

            this._completeTouchGesture(pointer);
        }

        this.activePointers.delete(event.pointerId);
        this._decrementPointerButton(button);
        this._releasePointer(event.pointerId);
        this._releaseVirtualJoysticks(event.pointerId);
        this._choosePrimaryPointer();
        this._refreshVirtualControls();
    }

    _handlePointerCancel(event)
    {
        const pointer = this.activePointers.get(event.pointerId);
        const button = pointer?.button ?? this._normalizeButton(event.button);

        if (pointer)
        {
            this.activePointers.delete(event.pointerId);
            this._decrementPointerButton(button);
        }

        this._releasePointer(event.pointerId);
        this._releaseVirtualJoysticks(event.pointerId);
        this._choosePrimaryPointer();
        this._refreshVirtualControls();
    }

    _handleWheel(event)
    {
        if (event.cancelable)
        {
            event.preventDefault();
        }

        this.pointerWheelDelta.x += event.deltaX ?? 0;
        this.pointerWheelDelta.y += event.deltaY ?? 0;
    }

    _anyMappedKey(name, source)
    {
        const codes = this.actions.get(name);
        if (!codes) return false;

        for (const code of codes)
        {
            if (source.has(code))
            {
                return true;
            }
        }

        return false;
    }

    _eventToScreenPosition(event)
    {
        if (!this.canvas || typeof this.canvas.getBoundingClientRect !== "function")
        {
            return new Vector2(event.clientX ?? 0, event.clientY ?? 0);
        }

        const rect = this.canvas.getBoundingClientRect();

        return new Vector2(
            (event.clientX ?? 0) - rect.left,
            (event.clientY ?? 0) - rect.top
        );
    }

    _screenToWorld(position)
    {
        if (!this.engine || typeof this.engine.screenToWorld !== "function")
        {
            return position.clone();
        }

        return this.engine.screenToWorld(position.x, position.y);
    }

    _normalizeButton(button)
    {
        return button >= 0 ? button : 0;
    }

    _incrementPointerButton(button)
    {
        const count = this.pointerButtonCounts.get(button) ?? 0;

        if (count === 0)
        {
            this.pressedPointerButtons.add(button);
            this.pointerButtons.add(button);
        }

        this.pointerButtonCounts.set(button, count + 1);
    }

    _decrementPointerButton(button)
    {
        const count = this.pointerButtonCounts.get(button) ?? 0;
        if (count <= 0) return;

        if (count === 1)
        {
            this.pointerButtonCounts.delete(button);
            this.pointerButtons.delete(button);
            this.releasedPointerButtons.add(button);
            return;
        }

        this.pointerButtonCounts.set(button, count - 1);
    }

    _capturePointer(pointerId)
    {
        try
        {
            this.canvas?.setPointerCapture?.(pointerId);
        }
        catch {}
    }

    _releasePointer(pointerId)
    {
        try
        {
            if (this.canvas?.hasPointerCapture?.(pointerId))
            {
                this.canvas.releasePointerCapture(pointerId);
            }
        }
        catch {}
    }

    _choosePrimaryPointer()
    {
        if (this.activePointers.has(this.primaryPointerId)) return;

        const first = this.activePointers.keys().next();
        this.primaryPointerId = first.done ? null : first.value;
    }

    _completeTouchGesture(pointer)
    {
        if (pointer.pointerType !== "touch") return;

        const distance = pointer.start.distance(pointer.position);
        const elapsed = performance.now() - pointer.startTime;

        if (distance <= this.tapMaxDistance && elapsed <= this.tapMaxTime)
        {
            this.tap = true;
        }

        const swipe = this._createSwipe(pointer.start, pointer.position);
        if (swipe.active)
        {
            this.completedSwipe = swipe;
        }

        this.activeSwipe = null;
    }

    _updateSwipe(pointer)
    {
        if (pointer.pointerType !== "touch") return;

        const swipe = this._createSwipe(pointer.start, pointer.position);
        this.activeSwipe = swipe.active ? swipe : null;
    }

    _createSwipe(start, end)
    {
        const distance = start.distance(end);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        let direction = null;

        if (distance >= this.swipeThreshold)
        {
            if (Math.abs(dx) >= Math.abs(dy))
            {
                direction = dx >= 0 ? "right" : "left";
            }
            else
            {
                direction = dy >= 0 ? "down" : "up";
            }
        }

        return {
            active: direction !== null,
            direction,
            distance,
            start: start.clone(),
            end: end.clone(),
        };
    }

    _refreshVirtualControls()
    {
        for (const button of this.virtualButtons.values())
        {
            const wasDown = button.down;
            button.down = this._isAnyPointerInsideRect(button.rect);

            if (!wasDown && button.down)
            {
                button.pressed = true;
            }

            if (wasDown && !button.down)
            {
                button.released = true;
            }
        }
    }

    _isAnyPointerInsideRect(rect)
    {
        for (const pointer of this.activePointers.values())
        {
            if (this._isPointInRect(pointer.position, rect))
            {
                return true;
            }
        }

        return false;
    }

    _activateVirtualJoysticks(pointerId, position)
    {
        for (const joystick of this.virtualJoysticks.values())
        {
            if (joystick.pointerId !== null || !this._isPositionInJoystickStartArea(position, joystick))
            {
                continue;
            }

            joystick.pointerId = pointerId;

            if (joystick.options.followPointer)
            {
                joystick.center = position.clone();
            }
            else
            {
                joystick.center.set(joystick.options.x, joystick.options.y);
            }

            this._setJoystickValue(joystick, position);
        }
    }

    _updateVirtualJoysticks(pointerId, position)
    {
        for (const joystick of this.virtualJoysticks.values())
        {
            if (joystick.pointerId === pointerId)
            {
                this._setJoystickValue(joystick, position);
            }
        }
    }

    _releaseVirtualJoysticks(pointerId)
    {
        for (const joystick of this.virtualJoysticks.values())
        {
            if (joystick.pointerId !== pointerId) continue;

            joystick.pointerId = null;
            joystick.value = this._createJoystickValue();
        }
    }

    _isPositionInJoystickStartArea(position, joystick)
    {
        if (joystick.options.rect)
        {
            return this._isPointInRect(position, joystick.options.rect);
        }

        const center = new Vector2(joystick.options.x, joystick.options.y);
        return center.distance(position) <= joystick.options.radius;
    }

    _setJoystickValue(joystick, position)
    {
        const dx = position.x - joystick.center.x;
        const dy = position.y - joystick.center.y;
        const radius = Math.max(1, joystick.options.radius);
        const distance = Math.min(Math.hypot(dx, dy), radius);
        const rawStrength = distance / radius;
        const strength = rawStrength < joystick.options.deadZone ? 0 : rawStrength;
        const angle = Math.atan2(dy, dx);

        joystick.value = {
            active: true,
            x: strength === 0 ? 0 : Math.cos(angle) * strength,
            y: strength === 0 ? 0 : Math.sin(angle) * strength,
            angle,
            strength,
        };
    }

    _createJoystickValue()
    {
        return {
            active: false,
            x: 0,
            y: 0,
            angle: 0,
            strength: 0,
        };
    }

    _isPointInRect(point, rect)
    {
        return point.x >= rect.x
            && point.x <= rect.x + rect.width
            && point.y >= rect.y
            && point.y <= rect.y + rect.height;
    }

    _readGamepads()
    {
        if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function")
        {
            return [];
        }

        return [...navigator.getGamepads()].filter(Boolean);
    }

    _gamepadButtonKey(index, button)
    {
        return `${index}:${button}`;
    }

    _gamepadAxisKey(index, axis)
    {
        return `${index}:${axis}`;
    }

    _preventPointerDefault(event)
    {
        if (event.cancelable)
        {
            event.preventDefault();
        }
    }

    _unbindPointer()
    {
        if (!this._isPointerBound || !this.canvas) return;

        this.canvas.removeEventListener("pointerdown", this._onPointerDown);
        this.canvas.removeEventListener("pointermove", this._onPointerMove);
        this.canvas.removeEventListener("pointerup", this._onPointerUp);
        this.canvas.removeEventListener("pointercancel", this._onPointerCancel);
        this.canvas.removeEventListener("lostpointercapture", this._onPointerCancel);
        this.canvas.removeEventListener("wheel", this._onWheel);

        if (this._previousTouchAction !== null)
        {
            this.canvas.style.touchAction = this._previousTouchAction;
        }

        this._isPointerBound = false;
        this._previousTouchAction = null;
    }
}
