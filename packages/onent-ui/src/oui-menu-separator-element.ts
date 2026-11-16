import { css, html } from "lit";
import { OuiElement } from "./oui-element.js";

export abstract class OuiMenuSeparatorElement extends OuiElement {
    static override styles = [
        OuiElement.styles,
        css`
            :host {
                display: block;
            }
            [part="line"] {
                margin: var(--oui-spacing-popup) calc(var(--oui-spacing-popup) * -1);
                border-top: var(--oui-border-width) solid var(--oui-border);
            }
        `,
    ];

    private internals = this.attachInternals();

    constructor() {
        super();
        this.internals.role = "separator";
    }

    override render() {
        return html`<div part="line"></div>`;
    }
}
