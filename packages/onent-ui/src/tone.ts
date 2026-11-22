import { CircleAlert, CircleCheck, Info, TriangleAlert, type IconNode } from "lucide";

export type OuiTone = "default" | "info" | "success" | "warning" | "danger";
export type OuiLive = "off" | "polite" | "assertive";

export const tones: Record<OuiTone, { icon: IconNode; live: OuiLive; color: string }> = {
    default: { icon: Info, live: "polite", color: "[--tone:var(--color-foreground)]" },
    info: { icon: Info, live: "polite", color: "[--tone:var(--color-info)]" },
    success: { icon: CircleCheck, live: "polite", color: "[--tone:var(--color-success)]" },
    warning: { icon: TriangleAlert, live: "assertive", color: "[--tone:var(--color-warning)]" },
    danger: { icon: CircleAlert, live: "assertive", color: "[--tone:var(--color-danger)]" },
};
