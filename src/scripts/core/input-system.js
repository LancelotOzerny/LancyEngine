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
        window.addEventListener('keydown', (e) =>
        {
            if (!this.keys.has(e.code))
            {
                this.pressedKeys.add(e.code);
            }
            this.keys.add(e.code);
        });

        window.addEventListener('keyup', (e) =>
        {
            this.releasedKeys.add(e.code);
            this.keys.delete(e.code);
        });
    }

    isKeyDown(keyCode)
    {
        return this.keys.has(keyCode);
    }

    isKeyPressed(keyCode)
    {
        return this.pressedKeys.has(keyCode);
    }

    isKeyReleased(keyCode)
    {
        return this.releasedKeys.has(keyCode);
    }

    update()
    {
        this.pressedKeys.clear();
        this.releasedKeys.clear();
    }
}