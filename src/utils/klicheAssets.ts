/**
 * Official Ministry of Education Kliche & Letterhead Assets
 * Al-Madinah Al-Munawwarah Education Directorate - Educational Affairs - Admissions Unit (وحدة القبول)
 */

export const MOE_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130" width="140" height="90">
  <!-- Ministry of Education Dots Motif -->
  <g fill="#006C70">
    <circle cx="100" cy="18" r="4.5" fill="#006C70"/>
    <circle cx="88" cy="24" r="4" fill="#006C70"/>
    <circle cx="112" cy="24" r="4" fill="#006C70"/>
    <circle cx="76" cy="32" r="3.5" fill="#1b738e"/>
    <circle cx="100" cy="32" r="4.2" fill="#006C70"/>
    <circle cx="124" cy="32" r="3.5" fill="#1b738e"/>
    <circle cx="65" cy="42" r="3" fill="#218caa"/>
    <circle cx="88" cy="42" r="3.8" fill="#006C70"/>
    <circle cx="112" cy="42" r="3.8" fill="#006C70"/>
    <circle cx="135" cy="42" r="3" fill="#218caa"/>
    <circle cx="56" cy="54" r="2.8" fill="#3895c4"/>
    <circle cx="76" cy="54" r="3.4" fill="#1b738e"/>
    <circle cx="100" cy="54" r="4" fill="#006C70"/>
    <circle cx="124" cy="54" r="3.4" fill="#1b738e"/>
    <circle cx="144" cy="54" r="2.8" fill="#3895c4"/>
    <circle cx="70" cy="65" r="3" fill="#218caa"/>
    <circle cx="88" cy="65" r="3.5" fill="#006C70"/>
    <circle cx="100" cy="65" r="3.8" fill="#006C70"/>
    <circle cx="112" cy="65" r="3.5" fill="#006C70"/>
    <circle cx="130" cy="65" r="3" fill="#218caa"/>
    <circle cx="82" cy="75" r="3" fill="#1b738e"/>
    <circle cx="100" cy="75" r="3.5" fill="#006C70"/>
    <circle cx="118" cy="75" r="3" fill="#1b738e"/>
    <circle cx="100" cy="85" r="3.2" fill="#006C70"/>
  </g>
  <!-- Text: وزارة التعليم / Ministry of Education -->
  <text x="100" y="104" font-family="'Cairo', 'IBM Plex Sans Arabic', 'Traditional Arabic', serif" font-size="16" font-weight="900" text-anchor="middle" fill="#004d4f">وزارة التعليم</text>
  <text x="100" y="119" font-family="'Arial', sans-serif" font-size="9.5" font-weight="600" text-anchor="middle" fill="#557c83" letter-spacing="0.5">Ministry of Education</text>
</svg>
`;

/**
 * Generate full SVG for Portrait A4 (approx 794x1123 or 210x297mm)
 */
export function getPortraitKlicheSvg(): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 794 130" width="100%" height="130" style="background:#ffffff;">
  <!-- Header Area -->
  <g>
    <!-- Simple Centered Header -->
    <text x="397" y="70" text-anchor="middle" font-family="'Cairo', 'IBM Plex Sans Arabic', sans-serif" font-size="32" font-weight="900" fill="#006C70">وحدة القبول</text>
    
    <!-- Horizontal Separator Line below Header -->
    <line x1="35" y1="110" x2="759" y2="110" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>
`;
}

/**
 * Generate full SVG for Landscape A4 (approx 1123x794 or 297x210mm)
 */
export function getLandscapeKlicheSvg(): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1123 130" width="100%" height="130" style="background:#ffffff;">
  <!-- Header Area -->
  <g>
    <!-- Simple Centered Header -->
    <text x="561" y="70" text-anchor="middle" font-family="'Cairo', 'IBM Plex Sans Arabic', sans-serif" font-size="36" font-weight="900" fill="#006C70">وحدة القبول</text>

    <!-- Horizontal Separator Line below Header -->
    <line x1="35" y1="110" x2="1088" y2="110" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>
`;
}

/**
 * Returns Base64 Data URL of the official kliche SVG for use in HTML/CSS/PDF
 */
export function getPortraitKlicheDataUrl(): string {
  const svg = getPortraitKlicheSvg();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getLandscapeKlicheDataUrl(): string {
  const svg = getLandscapeKlicheSvg();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
