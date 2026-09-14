import { ImageResponse } from "next/og";

/**
 * iOS home-screen icon. Safari ignores SVG apple-touch-icons, so this renders
 * the favicon's heart as a PNG. iOS rounds the corners itself, so the purple
 * background fills the whole square.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Same heart as public/favicon.svg (32×32 viewBox).
const HEART_PATH =
  "M16 25L9.5 18.5C8 17 7 15 7 13C7 10 9 8 12 8C13.5 8 15 8.5 16 10C17 8.5 18.5 8 20 8C23 8 25 10 25 13C25 15 24 17 22.5 18.5L16 25Z";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#A855F7",
      }}
    >
      {/* A 28-unit window centred on the heart: the heart fills ~64% */}
      <svg width="180" height="180" viewBox="2 2.5 28 28">
        <path d={HEART_PATH} fill="white" />
      </svg>
    </div>,
    size
  );
}
