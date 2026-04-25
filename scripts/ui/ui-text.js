import { UiTextElement } from "../common/ui-text-element.js";

export class UiText extends UiTextElement
{
    constructor(panel, params = {})
    {
        super(panel, {
            selector: 'p',
            baseClass: 'ui-text',
            ...params
        });

        this.html.textContent = this.params.text ?? 'Simple Text';
    }
}
