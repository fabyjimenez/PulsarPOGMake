import type { CSSProperties, ReactNode } from "react";

interface Props {
  bg: string;
  surface: string;
  shadow: string;
  children: ReactNode;
  /** Extra inline styles for the outer shell (e.g. transition). */
  shellStyle?: CSSProperties;
}

/**
 * Desktop: centered 412×860 phone frame.
 * Narrow viewports: full-bleed with safe-area support via CSS.
 */
export default function PhoneFrame({ bg, surface, shadow, children, shellStyle }: Props) {
  return (
    <div className="pulsar-shell" style={{ background: bg, ...shellStyle }}>
      <div
        className="pulsar-frame"
        role="main"
        style={{ background: surface, boxShadow: shadow }}
      >
        {children}
      </div>
    </div>
  );
}
