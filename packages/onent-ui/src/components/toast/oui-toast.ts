import { css, html, nothing, type PropertyValues } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { X, type IconNode } from "lucide";
import { OuiElement } from "../../oui-element.js";
import { OuiOverlayElement } from "../../oui-overlay-element.js";
import { tones, type OuiLive, type OuiTone } from "../../tone.js";
import "../icon/oui-icon.js";
import "./oui-toaster.js";

export type OuiToastTone = OuiTone;
export type OuiToastVariant = "default" | "secondary" | "outline";
export type OuiToastLive = OuiLive;

const variants: Record<OuiToastVariant, string> = {
    default:
        "bg-[color-mix(in_oklab,var(--tone)_10%,var(--color-background))] border-[color-mix(in_oklab,var(--tone)_25%,var(--color-background))] text-foreground",
    secondary: "bg-secondary border-transparent text-secondary-foreground",
    outline: "bg-background border-[color-mix(in_oklab,var(--tone)_40%,var(--color-background))] text-foreground",
};

/**
 * @element oui-toast
 * @property tone - Meaning of the message: sets the color, the default icon and how it is announced. `default` uses
 * the text color.
 * @property variant - Visual style.
 * @property icon - Lucide icon, set as a JS property. Defaults to an icon matching the tone.
 * @property withoutIcon - Hides the icon.
 * @property withoutClose - Hides the close button.
 * @property duration - Time in milliseconds before the toast closes by itself. `0` keeps it open until it is closed.
 * @property closeLabel - Accessible name of the close button.
 * @property live - How screen readers announce the toast when it opens: `assertive`, `polite` or `off`. Defaults to
 * `assertive` for `warning` and `danger`, `polite` otherwise.
 * @slot - The toast content: `oui-toast-title`, `oui-toast-description` and `oui-toast-action`. Elements with
 * `data-close` close the toast on click.
 * @slot icon - A custom icon, replacing the `icon` property.
 * @fires oui-show - The toast is about to open. Cancelable.
 * @fires oui-after-show - The toast is open and its enter animation finished.
 * @fires oui-hide - The toast is about to close (close button, `data-close`, Escape, timer, `hide()`). Cancelable.
 * @fires oui-after-hide - The toast is hidden and its exit animation finished.
 * @cssprop [--oui-spacing-toast=1rem] - Padding.
 * @cssprop [--oui-radius-toast=var(--oui-radius-panel)] - Border radius.
 * @cssprop [--oui-radius-toast-close=var(--oui-radius-pill)] - Border radius of the close button.
 * @csspart base - The toast container.
 * @csspart icon - The `oui-icon` rendered from the tone or the `icon` property.
 * @csspart close-button - The close button (not rendered with `without-close`).
 */
@customElement("oui-toast")
export class OuiToast extends OuiOverlayElement {
    static override styles = [
        OuiElement.styles,
        css`
            :host {
                display: block;
            }
            :host(:state(hidden)) {
                display: none;
            }
            @keyframes collapse {
                to {
                    grid-template-rows: 0fr;
                }
            }
            #frame[data-state="closed"] {
                animation: collapse 200ms 100ms ease-out forwards;
            }
            @media (prefers-reduced-motion: reduce) {
                #frame,
                [part="base"] {
                    animation: none !important;
                }
            }
        `,
    ];

    @property({ reflect: true }) tone: OuiToastTone = "default";
    @property({ reflect: true }) variant: OuiToastVariant = "default";
    @property({ attribute: false }) icon?: IconNode;
    @property({ type: Boolean, reflect: true, attribute: "without-icon" }) withoutIcon = false;
    @property({ type: Boolean, reflect: true, attribute: "without-close" }) withoutClose = false;
    @property({ type: Number }) duration = 5000;
    @property({ attribute: "close-label" }) closeLabel = "Close";
    @property({ reflect: true }) live?: OuiToastLive;

    @query("#frame") protected overlay!: HTMLElement;

    private internals = this.attachInternals();

    constructor() {
        super();
        this.internals.states.add("hidden");
        this.addEventListener("click", (event) => this.onClick(event));
        this.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && this.open) this.hide();
        });
    }

    private get toaster() {
        return this.parentElement?.localName === "oui-toaster"
            ? (this.parentElement as HTMLElementTagNameMap["oui-toaster"])
            : undefined;
    }

    private onClick(event: Event) {
        const closer = (event.target as Element).closest?.("[data-close]");
        if (closer && closer.closest(this.localName) === this) this.hide();
    }

    protected override present() {
        this.internals.states.delete("hidden");
        this.toaster?.register(this);
    }

    protected override dismiss() {
        this.internals.states.add("hidden");
    }

    protected override updated(changed: PropertyValues<this>) {
        super.updated(changed);
        if (changed.has("open") && !this.open) this.toaster?.unregister(this);
    }

    override render() {
        const tone = tones[this.tone] ?? tones.default;
        const state = this.open ? "open" : "closed";
        return html`<div id="frame" data-state=${state} class="grid grid-rows-[1fr]">
            <div class="${this.open ? "" : "overflow-hidden"} min-h-0 py-1.5">
                <div
                    part="base"
                    data-state=${state}
                    class="${tone.color} ${
                        variants[this.variant] ?? variants.default
                    } animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:fill-mode-forwards p-toast rounded-toast pointer-events-auto relative flex items-start gap-3 border shadow-lg [--tw-enter-translate-y:var(--toast-enter-y,1rem)]"
                >
                    ${
                        this.withoutIcon
                            ? nothing
                            : html`<span class="flex h-lh shrink-0 items-center text-(--tone)">
                                  <slot name="icon"
                                      ><oui-icon part="icon" .icon=${this.icon ?? tone.icon}></oui-icon
                                  ></slot>
                              </span>`
                    }
                    <div class="flex min-w-0 flex-1 flex-col gap-1 wrap-break-word"><slot></slot></div>
                    ${this.withoutClose ? nothing : this.renderCloseButton()}
                </div>
            </div>
        </div>`;
    }

    private renderCloseButton() {
        return html`<button
            part="close-button"
            type="button"
            aria-label=${this.closeLabel}
            class="focus-visible:ring-ring/50 rounded-toast-close absolute end-(--toast-corner) top-(--toast-corner) inline-flex translate-x-1/2 -translate-y-1/2 cursor-pointer border border-(--tone)/25 bg-[color-mix(in_oklab,var(--tone)_10%,var(--color-background))] p-1 text-(--tone) shadow-xs transition-colors outline-none [--toast-corner:calc(var(--oui-radius-toast,var(--oui-radius-panel))*0.2929)] hover:bg-[color-mix(in_oklab,var(--tone)_20%,var(--color-background))] focus-visible:ring-[3px] rtl:-translate-x-1/2"
            @click=${this.hide}
        >
            <oui-icon .icon=${X} size="14"></oui-icon>
        </button>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "oui-toast": OuiToast;
    }
}
