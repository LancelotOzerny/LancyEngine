class InputSystem
{
    constructor()
    {
        this.keys = new Set();
        this.pressedKeys = new Set();
        this.releasedKeys = new Set();
        this.init();
    }

    init()
    {
        const blockedKeys = new Set([
            "Space",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown"
        ]);

        window.addEventListener("keydown", (event) =>
        {
            if (blockedKeys.has(event.code))
            {
                event.preventDefault();
            }

            if (!this.keys.has(event.code))
            {
                this.pressedKeys.add(event.code);
            }

            this.keys.add(event.code);
        });

        window.addEventListener("keyup", (event) =>
        {
            if (blockedKeys.has(event.code))
            {
                event.preventDefault();
            }

            this.releasedKeys.add(event.code);
            this.keys.delete(event.code);
        });
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

    update()
    {
        this.pressedKeys.clear();
        this.releasedKeys.clear();
    }
}