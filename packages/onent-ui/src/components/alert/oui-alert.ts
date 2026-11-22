import { css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { X, type IconNode } from "lucide";
import { OuiElement } from "../../oui-element.js";
import { tones, type OuiLive, type OuiTone } from "../../tone.js";
import "../icon/oui-icon.js";

export type OuiAlertTone = OuiTone;
export type OuiAlertVariant = "default" | "secondary" | "outline" | "ghost";
export type OuiAlertLive = OuiLive;

const variants: Record<OuiAlertVariant, string> = {
    default: "bg-(--tone)/10 border-(--tone)/25 text-foreground",
    secondary: "bg-secondary border-transparent text-secondary-foreground",
    outline: "bg-background border-(--tone)/40 text-foreground",
    ghost: "border-transparent",
};

const roles: Record<OuiAlertLive, string | null> = {
    off: null,
    polite: "status",
    assertive: "alert",
};

const focusable =
    "a[href], area[href], button, input, select, textarea, summary, iframe, [contenteditable], [tabindex]";

function* following(element: Element) {
    for (let node: Element | null = element; node; node = node.parentElement) {
        for (let sibling = node.nextElementSibling; sibling; sibling = sibling.nextElementSibling) {
            yield sibling;
            yield* sibling.querySelectorAll("*");
        }
    }
}

function holdsFocus(element: Element) {
    const active = document.activeElement;
    return !!active && (element === active || element.contains(active) || !!element.shadowRoot?.activeElement);
}

function canFocus(element: Element): element is HTMLElement {
    if (!(element instanceof HTMLElement) || !element.checkVisibility()) return false;
    if (element.matches(focusable)) return element.tabIndex >= 0 && !element.matches(":disabled");
    return !!element.shadowRoot?.delegatesFocus && (!element.hasAttribute("tabindex") || element.tabIndex >= 0);
}

/**
 * @element oui-alert
 * @property tone - Meaning of the message: sets the color, the default icon and how it is announced. `default` uses
 * the text color.
 * @property variant - Visual style.
 * @property icon - Lucide icon, set as a JS property. Defaults to an icon matching the tone.
 * @property withoutIcon - Hides the icon.
 * @property dismissible - Renders a close button.
 * @property open - Whether the alert is shown. Setting it directly skips `oui-hide`.
 * @property closeLabel - Accessible name of the close button.
 * @property live - How screen readers announce the alert when it appears: `assertive` (`role="alert"`), `polite`
 * (`role="status"`) or `off`. Defaults to `assertive` for `warning` and `danger`, `polite` otherwise.
 * @slot - The alert content: `oui-alert-title`, `oui-alert-description` and `oui-alert-action`. Elements with
 * `data-close` close the alert on click.
 * @slot icon - A custom icon, replacing the `icon` property.
 * @fires oui-hide - The alert is about to close (close button, `data-close`, `hide()`). Cancelable.
 * @fires oui-after-hide - The alert is hidden and its exit animation finished.
 * @cssprop [--oui-spacing-alert=1rem] - Padding.
 * @cssprop [--oui-radius-alert=var(--oui-radius-panel)] - Border radius.
 * @cssprop [--oui-radius-alert-close=var(--oui-radius-pill)] - Border radius of the close button.
 * @csspart base - The alert container.
 * @csspart icon - The `oui-icon` rendered from the tone or the `icon` property.
 * @csspart close-button - The close button (rendered with `dismissible`).
 */
@customElement("oui-alert")
export class OuiAlert extends OuiElement {
    static override styles = [
        OuiElement.styles,
        css`
            :host {
                display: block;
            }
            :host(:state(hidden)) {
                display: none;
            }
            @media (prefers-reduced-motion: reduce) {
                [part="base"] {
                    animation: none !important;
                }
            }
        `,
    ];

    @property({ reflect: true }) tone: OuiAlertTone = "default";
    @property({ reflect: true }) variant: OuiAlertVariant = "default";
    @property({ attribute: false }) icon?: IconNode;
    @property({ type: Boolean, reflect: true, attribute: "without-icon" }) withoutIcon = false;
    @property({ type: Boolean, reflect: true }) dismissible = false;
    @property({ type: Boolean, reflect: true }) open = true;
    @property({ attribute: "close-label" }) closeLabel = "Close";
    @property({ reflect: true }) live?: OuiAlertLive;

    @state() private reopened = false;

    @query("[part=base]") private base!: HTMLElement;

    private internals = this.attachInternals();
    private transition = 0;

    constructor() {
        super();
        this.addEventListener("click", (event) => this.onClick(event));
    }

    /** Closes the alert (fires `oui-hide`). */
    hide() {
        if (this.open && this.emit("oui-hide")) this.open = false;
    }

    /** Shows the alert again. */
    show() {
        this.open = true;
    }

    protected override updated(changed: PropertyValues<this>) {
        if (changed.has("tone") || changed.has("live")) this.internals.role = roles[this.live ?? tones[this.tone].live];
        if (!changed.has("open")) return;
        if (changed.get("open") !== undefined) this.transitionTo(this.open);
        else if (!this.open) this.internals.states.add("hidden");
    }

    private emit(type: string, cancelable = true) {
        return this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, cancelable }));
    }

    private onClick(event: Event) {
        const closer = (event.target as Element).closest?.("[data-close]");
        if (closer && closer.closest(this.localName) === this) this.hide();
    }

    private async transitionTo(open: boolean) {
        const transition = ++this.transition;
        if (open) {
            this.reopened = true;
            this.internals.states.delete("hidden");
        } else if (holdsFocus(this)) {
            this.focusNext();
        }
        await this.updateComplete;
        await Promise.allSettled(this.base.getAnimations({ subtree: true }).map((animation) => animation.finished));
        if (transition !== this.transition || open) return;
        this.internals.states.add("hidden");
        this.emit("oui-after-hide", false);
    }

    private focusNext() {
        for (const element of following(this)) {
            if (!canFocus(element)) continue;
            element.focus();
            if (holdsFocus(element)) return;
        }
        ((this.shadowRoot?.activeElement ?? document.activeElement) as HTMLElement | null)?.blur();
    }

    override render() {
        const tone = tones[this.tone];
        return html`<div
            part="base"
            data-state=${this.open ? "open" : "closed"}
            class="${tone.color} ${variants[this.variant]} ${
                this.reopened ? "animate-in fade-in-0" : ""
            } data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:fill-mode-forwards p-alert rounded-alert relative flex items-start gap-3 border"
        >
            ${
                this.withoutIcon
                    ? nothing
                    : html`<span class="flex h-lh shrink-0 items-center text-(--tone)">
                          <slot name="icon"><oui-icon part="icon" .icon=${this.icon ?? tone.icon}></oui-icon></slot>
                      </span>`
            }
            <div class="flex min-w-0 flex-1 flex-col gap-1 wrap-break-word"><slot></slot></div>
            ${this.dismissible ? this.renderCloseButton() : nothing}
        </div>`;
    }

    private renderCloseButton() {
        if (this.variant === "ghost") {
            return html`<span class="-me-1 flex h-lh shrink-0 items-center">
                <button
                    part="close-button"
                    type="button"
                    aria-label=${this.closeLabel}
                    class="focus-visible:ring-ring/50 inline-flex cursor-pointer rounded-[calc(var(--oui-radius-control)-0.125rem)] p-1 opacity-70 transition-opacity outline-none hover:bg-(--tone)/10 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px]"
                    @click=${this.hide}
                >
                    <oui-icon .icon=${X}></oui-icon>
                </button>
            </span>`;
        }
        return html`<button
            part="close-button"
            type="button"
            aria-label=${this.closeLabel}
            class="focus-visible:ring-ring/50 rounded-alert-close absolute end-(--alert-corner) top-(--alert-corner) inline-flex translate-x-1/2 -translate-y-1/2 cursor-pointer border border-(--tone)/25 bg-[color-mix(in_oklab,var(--tone)_10%,var(--color-background))] p-1 text-(--tone) shadow-xs transition-colors outline-none [--alert-corner:calc(var(--oui-radius-alert,var(--oui-radius-panel))*0.2929)] hover:bg-[color-mix(in_oklab,var(--tone)_20%,var(--color-background))] focus-visible:ring-[3px] rtl:-translate-x-1/2"
            @click=${this.hide}
        >
            <oui-icon .icon=${X} size="14"></oui-icon>
        </button>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "oui-alert": OuiAlert;
    }
}
