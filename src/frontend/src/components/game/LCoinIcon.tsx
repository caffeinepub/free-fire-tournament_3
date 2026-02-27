/**
 * LCoinIcon — "Legend Coin" badge
 * A circular authentic gold coin with bold "L" and white sweep shine animation
 * that travels from top-right corner diagonally down to bottom-left, then repeats.
 */

interface LCoinIconProps {
  /** Size in pixels; defaults to 16 */
  size?: number;
  /** Extra className for the wrapper span */
  className?: string;
}

// Inject keyframes once into the document
const STYLE_ID = "lcoin-shine-style-v2";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes lcoin-sweep {
      0%   { transform: translateX(120%) translateY(-120%) rotate(-45deg); opacity: 0; }
      10%  { opacity: 1; }
      60%  { transform: translateX(-120%) translateY(120%) rotate(-45deg); opacity: 0.9; }
      80%  { transform: translateX(-160%) translateY(160%) rotate(-45deg); opacity: 0; }
      100% { transform: translateX(-160%) translateY(160%) rotate(-45deg); opacity: 0; }
    }
    @keyframes lcoin-glow {
      0%, 100% { box-shadow: 0 0 4px 1px rgba(255,215,0,0.55), 0 0 10px 2px rgba(255,165,0,0.3), inset 0 1px 1px rgba(255,255,255,0.35); }
      50%       { box-shadow: 0 0 10px 3px rgba(255,215,0,0.85), 0 0 22px 6px rgba(255,165,0,0.5), inset 0 1px 2px rgba(255,255,255,0.5); }
    }
    .lcoin-badge {
      position: relative;
      overflow: hidden;
      animation: lcoin-glow 1.8s ease-in-out infinite;
    }
    .lcoin-badge::before {
      content: "";
      position: absolute;
      /* Thin bright white streak */
      width: 28%;
      height: 200%;
      top: -50%;
      left: 50%;
      background: linear-gradient(
        to bottom,
        transparent 0%,
        rgba(255,255,255,0.15) 20%,
        rgba(255,255,255,0.9) 50%,
        rgba(255,255,255,0.15) 80%,
        transparent 100%
      );
      border-radius: 50%;
      transform: translateX(120%) translateY(-120%) rotate(-45deg);
      animation: lcoin-sweep 2s ease-in-out infinite;
      pointer-events: none;
      z-index: 2;
    }
  `;
  document.head.appendChild(style);
}

export function LCoinIcon({ size = 16, className = "" }: LCoinIconProps) {
  const fontSize = Math.round(size * 0.62);
  const rimSize = size <= 20 ? "1.5px" : "2px";

  return (
    <span
      className={`lcoin-badge inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        fontSize,
        lineHeight: 1,
        fontWeight: 900,
        fontFamily: "Arial Black, Arial, sans-serif",
        letterSpacing: "0px",
        // Multi-stop authentic gold coin gradient
        background: `radial-gradient(circle at 38% 32%, #fff7a1 0%, #ffe44d 18%, #ffd700 35%, #ffa500 60%, #c27700 80%, #7a4f00 100%)`,
        color: "#3a1e00",
        textShadow: `0 ${Math.round(size * 0.04)}px 0 rgba(255,245,150,0.7), 0 -1px 0 rgba(0,0,0,0.3)`,
        // Clear coin rim/edge
        border: `${rimSize} solid #b8760a`,
        outline: `${rimSize} solid rgba(255,220,80,0.4)`,
        outlineOffset: "1px",
        zIndex: 0,
        position: "relative",
      }}
      aria-hidden="true"
    >
      <span style={{ position: "relative", zIndex: 3 }}>L</span>
    </span>
  );
}
