import { UiTextElement } from "../common/ui-text-element.js";

export class UiButton extends UiTextElement
{
    constructor(panel, params)
    {
        super(panel, {
            selector: 'button',
            baseClass: 'ui-btn',
            ...params
        });

        this.setClickAction(this.params.click ?? (()  => { console.log('Click!') }))
        this.html.textContent = this.params.text ?? 'Button';
    }

    setClickAction(callback)
    {
        this.html.onclick = callback;
    }
}
