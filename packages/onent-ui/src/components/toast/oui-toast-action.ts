import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { OuiElement } from "../../oui-element.js";

/**
 * @element oui-toast-action
 * @slot - Buttons or links under the message. Elements with `data-close` close the toast on click.
 */
@customElement("oui-toast-action")
export class OuiToastAction extends OuiElement {
    static override styles = [
        OuiElement.styles,
        css`
            :host {
                display: block;
            }
        `,
    ];

    override render() {
        return html`<div class="flex flex-wrap gap-2 pt-2"><slot></slot></div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "oui-toast-action": OuiToastAction;
    }
}
