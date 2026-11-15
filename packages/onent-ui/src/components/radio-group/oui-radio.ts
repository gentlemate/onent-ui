import { css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { OuiRadioElement } from "../../oui-radio-element.js";

/**
 * @element oui-radio
 * @slot - The radio label.
 * @cssprop [--oui-size-radio=var(--oui-size-checkbox)] - Width and height of the circle.
 * @csspart base - The radio wrapper.
 * @csspart control - The circle.
 * @csspart indicator - The dot of the checked radio.
 * @csspart label - The label wrapper.
 * @csspart description - The description.
 * @cssstate checked - The radio is checked.
 */
@customElement("oui-radio")
export class OuiRadio extends OuiRadioElement {
    static override styles = [
        OuiRadioElement.styles,
        css`
            :host {
                display: inline-block;
            }
            [part="label"],
            [part="description"] {
                cursor: default;
            }
            :host(:not(:empty)) [part="label"],
            [part="description"] {
                margin-left: 0.75rem;
            }
            :host(:focus-visible) [part="control"] {
                border-color: var(--oui-ring);
                box-shadow: 0 0 0 3px color-mix(in oklab, var(--oui-ring) 50%, transparent);
            }
        `,
    ];

    override render() {
        return html`<div part="base" class="grid grid-cols-[auto_1fr] items-center">
            ${this.renderControl()}
            <span part="label" class="text-foreground leading-none"><slot></slot></span>
            ${this.renderDescription("col-start-2")}
        </div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "oui-radio": OuiRadio;
    }
}
