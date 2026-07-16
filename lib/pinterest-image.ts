/**
 * pinterest-image.ts — renders an actual Pinterest pin PNG, not just a text brief.
 *
 * Why this approach (Option B from the Pinterest scoping discussion):
 * AI image models are unreliable at rendering legible overlay text — and overlay
 * text is the single most important element of a Pinterest pin. Instead, this
 * composites a real image programmatically: satori turns a JSX-like layout tree
 * into SVG (the same technique Vercel's OG image generation uses), and resvg
 * rasterizes that SVG to a PNG. Text is drawn with real font glyphs, so it's
 * pixel-perfect and spelled correctly every time.
 *
 * Fonts are bundled via @fontsource (not fetched at request time) so rendering
 * is fast and doesn't depend on an external font CDN being reachable from the
 * serverless function.
 */
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "fs";
import { join } from "path";

const PIN_WIDTH = 1000;
const PIN_HEIGHT = 1500; // 2:3, Pinterest's recommended aspect ratio

let fontCache: { headline: Buffer; headlineBold: Buffer; body: Buffer; bodyBold: Buffer } | null = null;

function loadFonts() {
  if (fontCache) return fontCache;
  const base = join(process.cwd(), "node_modules");
  fontCache = {
    headline: readFileSync(join(base, "@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff")),
    headlineBold: readFileSync(join(base, "@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff")),
    body: readFileSync(join(base, "@fontsource/montserrat/files/montserrat-latin-400-normal.woff")),
    bodyBold: readFileSync(join(base, "@fontsource/montserrat/files/montserrat-latin-700-normal.woff")),
  };
  return fontCache;
}

export interface PinImageSpec {
  productTitle: string;
  overlayText: string;
  /** Hex colors, e.g. "#F5F5DC". Falls back to a safe default palette if omitted/invalid. */
  backgroundColor?: string;
  accentColor?: string;
  overlayBgColor?: string;
  overlayTextColor?: string;
}

const DEFAULTS = {
  backgroundColor: "#F5F5DC",
  accentColor: "#C9A227",
  overlayBgColor: "#1B2A4A",
  overlayTextColor: "#FFFFFF",
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
function safeHex(value: string | undefined, fallback: string): string {
  return value && HEX_RE.test(value) ? value : fallback;
}

export async function renderPinterestPinPng(spec: PinImageSpec): Promise<Buffer> {
  const fonts = loadFonts();
  const bg = safeHex(spec.backgroundColor, DEFAULTS.backgroundColor);
  const accent = safeHex(spec.accentColor, DEFAULTS.accentColor);
  const overlayBg = safeHex(spec.overlayBgColor, DEFAULTS.overlayBgColor);
  const overlayText = safeHex(spec.overlayTextColor, DEFAULTS.overlayTextColor);

  // Layout: top 2/3 is a soft gradient "mockup placeholder" panel (this tool doesn't
  // have the seller's actual product photo/mockup to composite in — that's a real
  // limitation, noted below), bottom third is the bold overlay text banner + product
  // title, matching the layout the text-brief version already recommends.
  const tree = {
    type: "div",
    props: {
      style: {
        width: `${PIN_WIDTH}px`,
        height: `${PIN_HEIGHT}px`,
        display: "flex",
        flexDirection: "column",
        backgroundColor: bg,
        fontFamily: "Montserrat",
      },
      children: [
        // Mockup placeholder panel
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "62%",
              background: `linear-gradient(135deg, ${accent}33 0%, ${bg} 100%)`,
              borderBottom: `6px solid ${accent}`,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    width: "80%",
                    height: "70%",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "12px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Playfair Display",
                    fontSize: "28px",
                    color: "#9A9A9A",
                    textAlign: "center",
                    padding: "40px",
                  },
                  children: "Product mockup goes here",
                },
              },
            ],
          },
        },
        // Overlay text banner
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "36px 48px",
              backgroundColor: overlayBg,
            },
            children: {
              type: "div",
              props: {
                style: {
                  fontFamily: "Playfair Display",
                  fontWeight: 700,
                  fontSize: "44px",
                  lineHeight: 1.15,
                  color: overlayText,
                  textAlign: "center",
                },
                children: spec.overlayText,
              },
            },
          },
        },
        // Product title footer
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              flex: 1,
              padding: "24px 48px",
              backgroundColor: bg,
            },
            children: {
              type: "div",
              props: {
                style: {
                  fontFamily: "Montserrat",
                  fontWeight: 700,
                  fontSize: "26px",
                  color: "#22262E",
                  textAlign: "center",
                },
                children: spec.productTitle,
              },
            },
          },
        },
      ],
    },
  };

  const svg = await satori(tree as never, {
    width: PIN_WIDTH,
    height: PIN_HEIGHT,
    fonts: [
      { name: "Playfair Display", data: fonts.headline, weight: 400, style: "normal" },
      { name: "Playfair Display", data: fonts.headlineBold, weight: 700, style: "normal" },
      { name: "Montserrat", data: fonts.body, weight: 400, style: "normal" },
      { name: "Montserrat", data: fonts.bodyBold, weight: 700, style: "normal" },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: PIN_WIDTH } });
  const png = resvg.render().asPng();
  return Buffer.from(png);
}
