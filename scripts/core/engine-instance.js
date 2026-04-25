let EngineClass = null;

export function setEngineClass(value)
{
    EngineClass = value;
}

export function getEngineInstance()
{
    return EngineClass?.instance ?? null;
}
