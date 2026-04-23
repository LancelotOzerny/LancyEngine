const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadScript(relativePath)
{
    const absolutePath = path.resolve(__dirname, "..", relativePath);
    const source = fs.readFileSync(absolutePath, "utf8");
    vm.runInThisContext(source, { filename: relativePath });
}

global.Engine = {
    instance: {
        isInitialized: false,
    },
};

[
    "src/scripts/math/vector2.js",
    "src/scripts/common/game-entity.js",
    "src/scripts/core/game-collection.js",
    "src/scripts/core/base-component.js",
    "src/scripts/components/transform-component.js",
    "src/scripts/core/gameobject.js",
    "src/scripts/core/scene.js",
].forEach(loadScript);

function runTest(name, testFn)
{
    try
    {
        testFn();
        console.log(`[PASS] ${name}`);
    }
    catch (error)
    {
        console.error(`[FAIL] ${name}`);
        console.error(error);
        process.exitCode = 1;
    }
}

class ProbeComponent extends BaseComponent
{
    constructor(stats)
    {
        super();
        this.stats = stats;
    }

    init()
    {
        this.stats.init += 1;
    }

    start()
    {
        this.stats.start += 1;
    }

    update()
    {
        this.stats.update += 1;
    }

    destroy()
    {
        this.stats.destroy += 1;
        super.destroy();
    }
}

class ProbeGameObject extends GameObject
{
    constructor(stats)
    {
        super();
        this.stats = stats;
    }

    init()
    {
        this.stats.init += 1;
        super.init();
    }

    start()
    {
        this.stats.start += 1;
        super.start();
    }

    update(deltaTime)
    {
        this.stats.update += 1;
        super.update(deltaTime);
    }

    destroy()
    {
        this.stats.destroy += 1;
        super.destroy();
    }
}

runTest("1) Object added before scene start", () =>
{
    const scene = new Scene();
    const objectStats = { init: 0, start: 0, update: 0, destroy: 0 };
    const componentStats = { init: 0, start: 0, update: 0, destroy: 0 };

    const gameObject = new ProbeGameObject(objectStats);
    const component = new ProbeComponent(componentStats);

    gameObject.bindComponent(component);
    scene.gameObjects.add(gameObject);

    assert.strictEqual(objectStats.init, 0);
    assert.strictEqual(objectStats.start, 0);
    assert.strictEqual(componentStats.init, 0);
    assert.strictEqual(componentStats.start, 0);

    scene.init();
    scene.start();
    scene.start();

    assert.strictEqual(objectStats.init, 1);
    assert.strictEqual(objectStats.start, 1);
    assert.strictEqual(componentStats.init, 1);
    assert.strictEqual(componentStats.start, 1);
});

runTest("2) Object added after scene start", () =>
{
    const scene = new Scene();
    scene.init();
    scene.start();

    const objectStats = { init: 0, start: 0, update: 0, destroy: 0 };
    const componentStats = { init: 0, start: 0, update: 0, destroy: 0 };

    const gameObject = new ProbeGameObject(objectStats);
    const component = new ProbeComponent(componentStats);
    gameObject.bindComponent(component);

    scene.gameObjects.add(gameObject);
    scene.update(0.016);

    assert.strictEqual(objectStats.init, 1);
    assert.strictEqual(objectStats.start, 1);
    assert.strictEqual(objectStats.update, 1);
    assert.strictEqual(componentStats.init, 1);
    assert.strictEqual(componentStats.start, 1);
    assert.strictEqual(componentStats.update, 1);
});

runTest("3) Component added after object start", () =>
{
    const scene = new Scene();
    scene.init();
    scene.start();

    const objectStats = { init: 0, start: 0, update: 0, destroy: 0 };
    const gameObject = new ProbeGameObject(objectStats);
    scene.gameObjects.add(gameObject);

    const lateComponentStats = { init: 0, start: 0, update: 0, destroy: 0 };
    const lateComponent = new ProbeComponent(lateComponentStats);

    gameObject.addComponent(lateComponent);

    assert.strictEqual(lateComponentStats.init, 1);
    assert.strictEqual(lateComponentStats.start, 1);
});

runTest("4) Destroy is idempotent", () =>
{
    const scene = new Scene();
    const objectStats = { init: 0, start: 0, update: 0, destroy: 0 };
    const componentStats = { init: 0, start: 0, update: 0, destroy: 0 };

    const gameObject = new ProbeGameObject(objectStats);
    const component = new ProbeComponent(componentStats);
    gameObject.addComponent(component);

    scene.gameObjects.add(gameObject);
    scene.init();
    scene.start();

    gameObject.destroy();
    gameObject.destroy();

    assert.strictEqual(objectStats.destroy, 1);
    assert.strictEqual(componentStats.destroy, 1);
    assert.strictEqual(gameObject._isDestroyed, true);
    assert.strictEqual(component._isDestroyed, true);
    assert.strictEqual(scene.gameObjects.contains(gameObject), false);
});

runTest("5) Remove object during update", () =>
{
    const scene = new Scene();

    const stats = {
        killerUpdates: 0,
        victimUpdates: 0,
    };

    class VictimObject extends GameObject
    {
        update(deltaTime)
        {
            stats.victimUpdates += 1;
            super.update(deltaTime);
        }
    }

    class KillerObject extends GameObject
    {
        constructor(target)
        {
            super();
            this.target = target;
        }

        update(deltaTime)
        {
            stats.killerUpdates += 1;
            this.parent.gameObjects.remove(this.target);
            super.update(deltaTime);
        }
    }

    const victim = new VictimObject();
    const killer = new KillerObject(victim);

    scene.gameObjects.add(killer);
    scene.gameObjects.add(victim);

    scene.init();
    scene.start();
    scene.update(0.016);

    assert.strictEqual(stats.killerUpdates, 1);
    assert.strictEqual(stats.victimUpdates, 0);
    assert.strictEqual(scene.gameObjects.contains(victim), false);
});

if (process.exitCode)
{
    process.exit(process.exitCode);
}
