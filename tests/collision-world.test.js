const assert = require("assert");
const fs = require("fs/promises");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const moduleCache = new Map();
const context = vm.createContext({
    console,
    performance: { now: () => 0 },
});

async function loadModule(relativePath)
{
    const absolutePath = path.resolve(root, relativePath);
    return loadModuleByPath(absolutePath);
}

async function loadModuleByPath(absolutePath)
{
    if (moduleCache.has(absolutePath))
    {
        return moduleCache.get(absolutePath);
    }

    const modulePromise = (async () =>
    {
        const source = await fs.readFile(absolutePath, "utf8");
        const module = new vm.SourceTextModule(source, {
            context,
            identifier: absolutePath,
        });

        await module.link(async specifier =>
        {
            const dependencyPath = path.resolve(path.dirname(absolutePath), specifier);
            return loadModuleByPath(dependencyPath);
        });

        await module.evaluate();
        return module;
    })();

    moduleCache.set(absolutePath, modulePromise);
    return modulePromise;
}

function createParent(x, y)
{
    return {
        transform: {
            position: { x, y, set(nextX, nextY) { this.x = nextX; this.y = nextY; } },
        },
        components: { items: [] },
        findComponent() { return null; },
    };
}

function createCollider(ColliderComponent, world, x, y, params = {})
{
    const collider = new ColliderComponent({
        width: 20,
        height: 20,
        ...params,
    });
    const parent = createParent(x, y);
    collider.parent = parent;
    parent.components.items.push(collider);
    world.addCollider(collider);
    return collider;
}

async function main()
{
    const core = await loadModule("scripts/core/index.js");
    const components = await loadModule("scripts/components/index.js");
    const { BodyType, CollisionSystem, CollisionWorld } = core.namespace;
    const { ColliderComponent } = components.namespace;

    testPhysicsContactsSurviveWorldUpdate(ColliderComponent, CollisionWorld);
    testAABBvsAABB(ColliderComponent, CollisionWorld);
    testCircleVsCircle(ColliderComponent, CollisionWorld);
    testCircleVsAABB(ColliderComponent, CollisionWorld);
    testCollisionEnterStayExit(ColliderComponent, CollisionWorld);
    testTriggerEnterStayExit(ColliderComponent, CollisionWorld);
    testLayerMaskFiltering(ColliderComponent, CollisionWorld);
    testRaycast(ColliderComponent, CollisionWorld);
    testOverlapBox(ColliderComponent, CollisionWorld);
    testOverlapPointAndCircle(ColliderComponent, CollisionWorld);
    testRemovalDuringWorldUpdate(ColliderComponent, CollisionWorld);
    testBroadphaseMovement(ColliderComponent, CollisionWorld);
    testCompatibilityPath(ColliderComponent, CollisionSystem, CollisionWorld);
    testBodyType(ColliderComponent, CollisionWorld, BodyType);

    console.log("collision-world tests passed");
}

function testPhysicsContactsSurviveWorldUpdate(ColliderComponent, CollisionWorld)
{
    const world = new CollisionWorld({ cellSize: 64 });
    const a = createCollider(ColliderComponent, world, 0, 0);
    const b = createCollider(ColliderComponent, world, 10, 0);

    a.addContact(b, "bottom", 0, -1, 10, 4, false);
    world.update();

    assert.strictEqual(a.contacts.length, 1);
    assert.strictEqual(a.touching.bottom, true);
    assert.strictEqual(a.collisionEnters.length, 1);
}

function testAABBvsAABB(ColliderComponent, CollisionWorld)
{
    const world = new CollisionWorld({ cellSize: 64 });
    const a = createCollider(ColliderComponent, world, 0, 0);
    const b = createCollider(ColliderComponent, world, 19, 0);
    const c = createCollider(ColliderComponent, world, 40, 0);

    assert.strictEqual(a.checkCollision(b), true);
    assert.strictEqual(a.checkCollision(c), false);
}

function testCircleVsCircle(ColliderComponent, CollisionWorld)
{
    const world = new CollisionWorld({ cellSize: 64 });
    const a = createCollider(ColliderComponent, world, 0, 0, { shape: "circle", radius: 10 });
    const b = createCollider(ColliderComponent, world, 15, 0, { shape: "circle", radius: 10 });
    const c = createCollider(ColliderComponent, world, 25, 0, { shape: "circle", radius: 10 });

    assert.strictEqual(a.checkCollision(b), true);
    assert.strictEqual(a.checkCollision(c), false);
}

function testCircleVsAABB(ColliderComponent, CollisionWorld)
{
    const world = new CollisionWorld({ cellSize: 64 });
    const circle = createCollider(ColliderComponent, world, 0, 0, { shape: "circle", radius: 10 });
    const hit = createCollider(ColliderComponent, world, 19, 10, { width: 10, height: 10 });
    const miss = createCollider(ColliderComponent, world, 21, 10, { width: 10, height: 10 });

    assert.strictEqual(circle.checkCollision(hit), true);
    assert.strictEqual(circle.checkCollision(miss), false);
}

function testCollisionEnterStayExit(ColliderComponent, CollisionWorld)
{
    const world = new CollisionWorld({ cellSize: 64 });
    const a = createCollider(ColliderComponent, world, 0, 0);
    const b = createCollider(ColliderComponent, world, 10, 0);

    world.update();
    assert.strictEqual(a.collisionEnters.length, 1);
    assert.strictEqual(a.collisionStays.length, 0);

    world.update();
    assert.strictEqual(a.collisionEnters.length, 0);
    assert.strictEqual(a.collisionStays.length, 1);

    b.parent.transform.position.x = 100;
    world.update();
    assert.strictEqual(a.collisionExits.length, 1);
}

function testTriggerEnterStayExit(ColliderComponent, CollisionWorld)
{
    const world = new CollisionWorld({ cellSize: 64 });
    const a = createCollider(ColliderComponent, world, 0, 0);
    const b = createCollider(ColliderComponent, world, 10, 0, { isTrigger: true });

    world.update();
    assert.strictEqual(a.triggerEnters.length, 1);
    assert.strictEqual(a.collisionEnters.length, 0);

    world.update();
    assert.strictEqual(a.triggerStays.length, 1);

    b.parent.transform.position.x = 100;
    world.update();
    assert.strictEqual(a.triggerExits.length, 1);
}

function testLayerMaskFiltering(ColliderComponent, CollisionWorld)
{
    const world = new CollisionWorld({ cellSize: 64 });
    const a = createCollider(ColliderComponent, world, 0, 0, { layer: 1, mask: [2] });
    createCollider(ColliderComponent, world, 10, 0, { layer: 3 });

    world.update();
    assert.strictEqual(a.collisions.length, 0);
}

function testRaycast(ColliderComponent, CollisionWorld)
{
    const world = new CollisionWorld({ cellSize: 64 });
    const target = createCollider(ColliderComponent, world, 10, 0, { width: 10, height: 10 });
    const circle = createCollider(ColliderComponent, world, 40, 0, { shape: "circle", radius: 10 });

    const hit = world.raycast(0, 5, 1, 0, { maxDistance: 100 });
    const circleHit = world.raycast(0, 10, 1, 0, {
        maxDistance: 100,
        predicate: collider => collider === circle,
    });

    assert.strictEqual(hit.collider, target);
    assert.strictEqual(hit.distance, 10);
    assert.strictEqual(hit.point.x, 10);
    assert.strictEqual(hit.point.y, 5);
    assert.strictEqual(circleHit.collider, circle);
    assert.strictEqual(circleHit.distance, 40);
}

function testOverlapBox(ColliderComponent, CollisionWorld)
{
    const world = new CollisionWorld({ cellSize: 64 });
    const target = createCollider(ColliderComponent, world, 25, 25);
    const circle = createCollider(ColliderComponent, world, 80, 80, { shape: "circle", radius: 10 });
    createCollider(ColliderComponent, world, 200, 200);

    const hits = world.overlapBox(20, 20, 20, 20);
    const circleMiss = world.overlapBox(75, 75, 2, 2);
    const circleHit = world.overlapBox(88, 88, 4, 4);

    assert.strictEqual(hits.length, 1);
    assert.strictEqual(hits[0].collider, target);
    assert.strictEqual(circleMiss.some(entry => entry.collider === circle), false);
    assert.strictEqual(circleHit.some(entry => entry.collider === circle), true);
}

function testOverlapPointAndCircle(ColliderComponent, CollisionWorld)
{
    const world = new CollisionWorld({ cellSize: 64 });
    const circle = createCollider(ColliderComponent, world, 0, 0, { shape: "circle", radius: 10 });
    const box = createCollider(ColliderComponent, world, 40, 0, { width: 20, height: 20 });

    assert.strictEqual(world.overlapPoint(0, 0).length, 0);
    assert.strictEqual(world.overlapPoint(10, 10)[0].collider, circle);
    assert.strictEqual(world.overlapCircle(50, 10, 8)[0].collider, box);
}

function testRemovalDuringWorldUpdate(ColliderComponent, CollisionWorld)
{
    const world = new CollisionWorld({ cellSize: 64 });
    const a = createCollider(ColliderComponent, world, 0, 0);
    const b = createCollider(ColliderComponent, world, 10, 0);

    a.parent.components.items.push({
        collisionEnter() {
            world.removeCollider(b);
        },
    });

    assert.doesNotThrow(() => world.update());
    assert.strictEqual(world.contains(b), false);
    assert.doesNotThrow(() => world.update());
}

function testBroadphaseMovement(ColliderComponent, CollisionWorld)
{
    const world = new CollisionWorld({ cellSize: 64 });
    const moving = createCollider(ColliderComponent, world, 0, 0);

    moving.parent.transform.position.x = 1000;
    moving.parent.transform.position.y = 1000;
    world.update();

    const hits = world.overlapBox(995, 995, 40, 40);
    assert.strictEqual(hits.length, 1);
    assert.strictEqual(hits[0].collider, moving);
}

function testCompatibilityPath(ColliderComponent, CollisionSystem, CollisionWorld)
{
    CollisionSystem.instance = new CollisionSystem(new CollisionWorld({ cellSize: 64 }));

    const a = new ColliderComponent({ width: 20, height: 20 });
    const b = new ColliderComponent({ width: 20, height: 20 });

    a.parent = createParent(0, 0);
    b.parent = createParent(10, 0);
    a.init();
    b.init();

    const overlaps = CollisionSystem.instance.getOverlaps(a);
    CollisionSystem.instance.updateCollisions();

    assert.strictEqual(overlaps.length, 1);
    assert.strictEqual(a.collision, b);
    assert.strictEqual(a.isCollision, 1);
}

function testBodyType(ColliderComponent, CollisionWorld, BodyType)
{
    const world = new CollisionWorld({ cellSize: 64 });
    const collider = createCollider(ColliderComponent, world, 0, 0, {
        bodyType: BodyType.STATIC,
    });

    assert.strictEqual(collider.isStatic, true);
    assert.strictEqual(world.overlapBox(0, 0, 20, 20, { includeStatic: false }).length, 0);
}

main().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
