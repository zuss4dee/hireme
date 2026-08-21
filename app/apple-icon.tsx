import { ImageResponse } from "next/og";

// iOS home-screen icons must be raster — it ignores SVG here — so this is
// generated as a PNG at build time from the same mark as the favicon.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const INK = "#0a0a0f";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#c8f331",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 11,
          paddingBottom: 37,
          position: "relative",
        }}
      >
        <div style={{ width: 28, height: 42, borderRadius: 14, background: INK }} />
        <div style={{ width: 28, height: 65, borderRadius: 14, background: INK }} />
        <div style={{ width: 28, height: 90, borderRadius: 14, background: INK }} />
        <div
          style={{
            position: "absolute",
            top: 22,
            left: 116,
            width: 25,
            height: 25,
            borderRadius: 13,
            background: INK,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
