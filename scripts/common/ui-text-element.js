import { UiElement } from "./ui-element.js";

export class UiTextElement extends UiElement
{
    constructor(panel, params = {})
    {
        super(panel, params);
    }

    set text(value)
    {
        this.html.textContent = value;
    }

    get text()
    {
        return this.html.textContent;
    }
}
