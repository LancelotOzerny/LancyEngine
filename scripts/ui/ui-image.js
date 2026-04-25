import { UiElement } from "../common/ui-element.js";

export class UiImage extends UiElement
{
    constructor(panel, params = {})
    {
        super(panel, {
            selector: 'img',
            baseClass: 'ui-image',
            ...params
        });

        this.width = this.params.width ?? '150';
        this.height = this.params.height ?? '150';
        this.html.setAttribute('src', this.params.src ?? 'none');
    }

    set width(value)
    {
        this.params.width = value;
        this.html.style.width = value + 'px';
    }

    set height(value)
    {
        this.params.height = value;
        this.html.style.height = value + 'px';
    }
}
