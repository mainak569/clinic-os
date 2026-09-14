import { ImageResponse } from "next/og";

/**
 * Link-preview card for Slack, WhatsApp, LinkedIn and X. Uses the site's
 * purple palette and the favicon's heart. The image renderer has no backdrop
 * blur, so the glass panel is translucent white over a soft gradient.
 */

export const alt = "ClinicOS — clinic appointment and practice management";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Same heart as public/favicon.svg (32×32 viewBox).
const HEART_PATH =
  "M16 25L9.5 18.5C8 17 7 15 7 13C7 10 9 8 12 8C13.5 8 15 8.5 16 10C17 8.5 18.5 8 20 8C23 8 25 10 25 13C25 15 24 17 22.5 18.5L16 25Z";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ede9fe",
        backgroundImage:
          "radial-gradient(circle at 12% 18%, #c084fc 0%, rgba(192,132,252,0) 42%), radial-gradient(circle at 88% 88%, #7c3aed 0%, rgba(124,58,237,0) 48%), linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 1040,
          padding: "64px 64px",
          borderRadius: 48,
          background: "rgba(255,255,255,0.72)",
          border: "2px solid rgba(255,255,255,0.9)",
          boxShadow: "0 30px 80px rgba(88,28,135,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 112,
              height: 112,
              borderRadius: 28,
              background: "#A855F7",
              boxShadow: "0 12px 30px rgba(168,85,247,0.45)",
            }}
          >
            <svg width="76" height="76" viewBox="6 6.5 20 20">
              <path d={HEART_PATH} fill="white" />
            </svg>
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: 32,
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: -2,
              color: "#7E22CE",
            }}
          >
            ClinicOS
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 44,
            // Sized so the tagline fits on one line inside the panel.
            fontSize: 40,
            lineHeight: 1.2,
            color: "#1f2937",
          }}
        >
          Clinic appointment & practice management
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 30,
            color: "#4b5563",
          }}
        >
          Scheduling · Patient records · Visit notes · Analytics
        </div>
      </div>
    </div>,
    size
  );
}
