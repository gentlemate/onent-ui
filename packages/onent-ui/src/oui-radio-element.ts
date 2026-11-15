import { css, html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { OuiElement } from "./oui-element.js";

/**
 * @property value - Value of the radio, submitted by the `oui-radio-group` when checked.
 * @property description - Text under the label.
 * @property disabled - Prevents selecting the radio.
 * @property checked - Whether the radio is checked (set by the `oui-radio-group`).
 * @property invalid - Whether the group is invalid (set by the `oui-radio-group`).
 */
export abstract class OuiRadioElement extends OuiElement {
    static override styles = [
        OuiElement.styles,
        css`
            :host {
                cursor: pointer;
                user-select: none;
                outline: none;
            }
            :host([disabled]) {
                cursor: not-allowed;
                opacity: 0.5;
            }
            :host([invalid]) [part="control"] {
                border-color: var(--oui-destructive);
            }
        `,
    ];

    @property({ reflect: true }) value = "";
    @property() description = "";
    @property({ type: Boolean, reflect: true }) disabled = false;
    @property({ type: Boolean }) checked = false;
    @property({ type: Boolean, reflect: true }) invalid = false;

    protected internals = this.attachInternals();

    constructor() {
        super();
        this.internals.role = "radio";
    }

    protected override updated() {
        this.internals.ariaChecked = String(this.checked);
        this.internals.ariaDisabled = String(this.disabled);
        (this.internals as ElementInternals & { ariaDescription: string | null }).ariaDescription =
            this.description || null;
        if (this.checked) this.internals.states.add("checked");
        else this.internals.states.delete("checked");
    }

    protected renderControl() {
        return html`<span
            part="control"
            class="${
                this.checked ? "border-primary bg-primary" : "border-border"
            } size-radio flex shrink-0 items-center justify-center rounded-full border shadow-xs transition-shadow"
        >
            ${
                this.checked
                    ? html`<span part="indicator" class="bg-primary-foreground size-full scale-50 rounded-full"></span>`
                    : nothing
            }
        </span>`;
    }

    protected renderDescription(classes = "") {
        return this.description
            ? html`<span part="description" class="${classes} text-muted-foreground text-sm" aria-hidden="true"
                  >${this.description}</span
              >`
            : nothing;
    }
}
