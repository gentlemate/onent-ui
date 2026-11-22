import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { OuiElement } from "../../oui-element.js";

/**
 * @element oui-alert-title
 * @slot - The alert title.
 */
@customElement("oui-alert-title")
export class OuiAlertTitle extends OuiElement {
    static override styles = [
        OuiElement.styles,
        css`
            :host {
                display: block;
            }
        `,
    ];

    override render() {
        return html`<div><slot></slot></div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "oui-alert-title": OuiAlertTitle;
    }
}
