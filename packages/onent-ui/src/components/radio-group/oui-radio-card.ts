import { css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import type { IconNode } from "lucide";
import { OuiRadioElement } from "../../oui-radio-element.js";
import "../icon/oui-icon.js";

export type OuiRadioCardIndicatorPlacement = "left" | "right";

/**
 * @element oui-radio-card
 * @property icon - Lucide icon, set as a JS property. Placed on the side opposite to the circle.
 * @property indicatorPlacement - Side of the circle: `left` puts the icon on the right, `right` puts it on the left.
 * @slot - The radio label.
 * @slot content - Custom content at the bottom of the card.
 * @cssprop [--oui-size-radio=var(--oui-size-checkbox)] - Width and height of the circle.
 * @cssprop [--oui-radius-radio-card=var(--oui-radius-panel)] - Border radius of the card.
 * @cssprop [--oui-spacing-radio-card=1rem] - Padding of the card.
 * @csspart base - The card.
 * @csspart control - The circle.
 * @csspart indicator - The dot of the checked radio.
 * @csspart icon - The `oui-icon` rendered from the `icon` property.
 * @csspart label - The label wrapper.
 * @csspart description - The description.
 * @csspart content - The wrapper of the `content` slot.
 * @cssstate checked - The radio is checked.
 */
@customElement("oui-radio-card")
export class OuiRadioCard extends OuiRadioElement {
    static override styles = [
        OuiRadioElement.styles,
        css`
            :host {
                display: block;
            }
            :host([invalid]) [part="base"] {
                border-color: var(--oui-destructive);
            }
            :host(:focus-visible) [part="base"] {
                border-color: var(--oui-ring);
                box-shadow: 0 0 0 3px color-mix(in oklab, var(--oui-ring) 50%, transparent);
            }
        `,
    ];

    @property({ attribute: false }) icon?: IconNode;
    @property({ attribute: "indicator-placement", reflect: true })
    indicatorPlacement: OuiRadioCardIndicatorPlacement = "left";

    @state() private hasContent = false;

    private onContentChange(event: Event) {
        this.hasContent = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
    }

    override render() {
        const icon = this.icon ? html`<oui-icon part="icon" .icon=${this.icon}></oui-icon>` : nothing;
        const control = this.renderControl();
        const [start, end] = this.indicatorPlacement === "left" ? [control, icon] : [icon, control];
        const column = start === nothing ? "col-start-1" : "col-start-2";
        const columns = [start !== nothing && "auto", "1fr", end !== nothing && "auto"].filter(Boolean).join(" ");
        return html`<div
            part="base"
            class="${
                this.checked ? "border-primary" : "border-border"
            } bg-surface rounded-radio-card p-radio-card grid h-full content-start items-center gap-x-3 border transition-[border-color,box-shadow]"
            style=${styleMap({ gridTemplateColumns: columns })}
        >
            ${start}
            <span part="label" class="text-foreground leading-none"><slot></slot></span>
            ${end} ${this.renderDescription(column)}
            <div part="content" class="${this.hasContent ? column : "hidden"} mt-2">
                <slot name="content" @slotchange=${this.onContentChange}></slot>
            </div>
        </div>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "oui-radio-card": OuiRadioCard;
    }
}
