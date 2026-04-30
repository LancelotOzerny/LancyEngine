import { BaseComponent, Engine, GameObject, Scene } from "../scripts/core/index.js";

class InputDemoController extends BaseComponent
{
    start()
    {
        const input = Engine.instance.input;

        input.mapAction("jump", ["Space", "KeyW"]);
        input.addVirtualButton("jump", {
            x: Engine.instance.screenWidth - 140,
            y: Engine.instance.screenHeight - 140,
            width: 96,
            height: 96,
        });
        input.addVirtualJoystick("move", {
            x: 120,
            y: Engine.instance.screenHeight - 120,
            radius: 72,
            rect: {
                x: 0,
                y: Engine.instance.screenHeight - 260,
                width: 260,
                height: 260,
            },
            followPointer: true,
        });
    }

    update()
    {
        const engine = Engine.instance;
        const input = engine.input;

        // Keyboard action mapping.
        if (input.isActionPressed("jump") || input.isVirtualButtonPressed("jump"))
        {
            console.log("jump");
        }

        // Mouse or pen click in world space.
        if (input.isPointerPressed(0))
        {
            const screen = input.getPointerScreenPosition();
            const world = input.getPointerWorldPosition();
            console.log("pointer", { screen, world });
        }

        // Touch tap and swipe helpers.
        if (input.wasTapped())
        {
            console.log("tap", input.getPointerScreenPosition());
        }

        const swipe = input.getSwipe();
        if (swipe.active)
        {
            console.log("swipe", swipe.direction, swipe.distance);
        }

        // Virtual joystick, useful together with keyboard movement.
        const joystick = input.getVirtualJoystick("move");
        const keyboardX = Number(input.isKeyDown("KeyD") || input.isKeyDown("ArrowRight"))
            - Number(input.isKeyDown("KeyA") || input.isKeyDown("ArrowLeft"));
        const moveX = joystick.active ? joystick.x : keyboardX;

        if (moveX !== 0)
        {
            console.log("move x", moveX);
        }
    }
}

export class InputDemoScene extends Scene
{
    start()
    {
        const gameObject = new GameObject();
        gameObject.name = "InputDemo";
        gameObject.addComponent(new InputDemoController());
        this.gameObjects.add(gameObject);
    }
}

// Usage:
// Engine.instance.init("#game", { width: 1280, height: 720 });
// Engine.instance.scenes.add("input-demo", new InputDemoScene());
// Engine.instance.switchScene("input-demo");
// Engine.instance.run();
