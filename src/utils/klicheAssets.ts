/**
 * Official Ministry of Education Kliche & Letterhead Assets
 * Al-Madinah Al-Munawwarah Education Directorate - Educational Affairs - Admissions Unit (وحدة القبول)
 */

export const MOE_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" width="120" height="85">
  <!-- Official Ministry of Education Logo Dots Structure -->
  <g fill="#4DB0AD">
    <circle cx="100" cy="25" r="3.2"/>
    <circle cx="88" cy="32" r="3.2"/>
    <circle cx="112" cy="32" r="3.2"/>
    <circle cx="78" cy="42" r="3"/>
    <circle cx="100" cy="42" r="3.5"/>
    <circle cx="122" cy="42" r="3"/>
    <circle cx="68" cy="55" r="2.8"/>
    <circle cx="86" cy="55" r="3.2"/>
    <circle cx="114" cy="55" r="3.2"/>
    <circle cx="132" cy="55" r="2.8"/>
    <circle cx="60" cy="70" r="2.5"/>
    <circle cx="80" cy="70" r="3"/>
    <circle cx="100" cy="70" r="3.2"/>
    <circle cx="120" cy="70" r="3"/>
    <circle cx="140" cy="70" r="2.5"/>
    <circle cx="75" cy="85" r="2.8"/>
    <circle cx="92" cy="85" r="3"/>
    <circle cx="108" cy="85" r="3"/>
    <circle cx="125" cy="85" r="2.8"/>
    <circle cx="85" cy="98" r="2.8"/>
    <circle cx="115" cy="98" r="2.8"/>
    <circle cx="100" cy="110" r="2.8"/>
  </g>
  <text x="100" y="128" font-family="'Cairo', sans-serif" font-size="16" font-weight="900" text-anchor="middle" fill="#4DB0AD">وزارة التعليم</text>
  <text x="100" y="139" font-family="'Arial', sans-serif" font-size="7.5" font-weight="600" text-anchor="middle" fill="#4DB0AD" style="letter-spacing: 0.2px;">Ministry of Education</text>
</svg>
`;

/**
 * Generate full SVG for Portrait A4 (approx 794x160)
 */
export function getPortraitKlicheSvg(): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 794 160" width="100%" height="160" style="background:#ffffff;">
  <!-- Right side: Official Hierarchy -->
  <g text-anchor="end" font-family="'Cairo', 'IBM Plex Sans Arabic', sans-serif" fill="#555555" font-size="12">
    <text x="760" y="35" font-weight="bold">المملكة العربية السعودية</text>
    <text x="760" y="55" font-weight="bold">وزارة التعليم</text>
    <text x="760" y="75">الإدارة العامة للتعليم بالمدينة المنورة</text>
    <text x="760" y="95">الشؤون التعليمية</text>
    <text x="760" y="115" font-weight="bold">وحدة القبول</text>
  </g>

  <!-- Center: Logo -->
  <g transform="translate(337, 10)">
    <g fill="#4cb0ad">
      <circle cx="60" cy="15" r="3"/>
      <circle cx="50" cy="21" r="3"/>
      <circle cx="70" cy="21" r="3"/>
      <circle cx="40" cy="29" r="2.8"/>
      <circle cx="60" cy="29" r="3.2"/>
      <circle cx="80" cy="29" r="2.8"/>
      <circle cx="30" cy="39" r="2.5"/>
      <circle cx="50" cy="39" r="3"/>
      <circle cx="70" cy="39" r="3"/>
      <circle cx="90" cy="39" r="2.5"/>
      <circle cx="22" cy="51" r="2.2"/>
      <circle cx="40" cy="51" r="2.8"/>
      <circle cx="60" cy="51" r="3"/>
      <circle cx="80" cy="51" r="2.8"/>
      <circle cx="98" cy="51" r="2.2"/>
      <circle cx="35" cy="63" r="2.5"/>
      <circle cx="50" cy="63" r="2.8"/>
      <circle cx="70" cy="63" r="2.8"/>
      <circle cx="85" cy="63" r="2.5"/>
      <circle cx="45" cy="73" r="2.5"/>
      <circle cx="75" cy="73" r="2.5"/>
      <circle cx="60" cy="83" r="2.5"/>
    </g>
    <text x="60" y="105" font-family="'Cairo', sans-serif" font-size="15" font-weight="900" text-anchor="middle" fill="#4cb0ad">وزارة التعليم</text>
    <text x="60" y="118" font-family="'Arial', sans-serif" font-size="7.5" font-weight="600" text-anchor="middle" fill="#4cb0ad">Ministry of Education</text>
  </g>

  <!-- Left side: Ref / Date -->
  <g text-anchor="start" font-family="'Cairo', 'IBM Plex Sans Arabic', sans-serif" fill="#555555" font-size="12">
    <text x="35" y="55" font-weight="bold">الرقـم:</text>
    <text x="35" y="95" font-weight="bold">التاريخ:</text>
  </g>

  <!-- Divider Line -->
  <line x1="35" y1="145" x2="759" y2="145" stroke="#006C70" stroke-width="2"/>
</svg>
`;
}

/**
 * Generate full SVG for Landscape A4 (approx 1123x160)
 */
export function getLandscapeKlicheSvg(): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1123 160" width="100%" height="160" style="background:#ffffff;">
  <!-- Right side -->
  <g text-anchor="end" font-family="'Cairo', 'IBM Plex Sans Arabic', sans-serif" fill="#555555" font-size="13">
    <text x="1088" y="35" font-weight="bold">المملكة العربية السعودية</text>
    <text x="1088" y="55" font-weight="bold">وزارة التعليم</text>
    <text x="1088" y="75">الإدارة العامة للتعليم بالمدينة المنورة</text>
    <text x="1088" y="95">الشؤون التعليمية</text>
    <text x="1088" y="115" font-weight="bold">وحدة القبول</text>
  </g>

  <!-- Center: Logo -->
  <g transform="translate(501, 10)">
    <g fill="#4cb0ad">
      <circle cx="60" cy="15" r="3"/>
      <circle cx="50" cy="21" r="3"/>
      <circle cx="70" cy="21" r="3"/>
      <circle cx="40" cy="29" r="2.8"/>
      <circle cx="60" cy="29" r="3.2"/>
      <circle cx="80" cy="29" r="2.8"/>
      <circle cx="30" cy="39" r="2.5"/>
      <circle cx="50" cy="39" r="3"/>
      <circle cx="70" cy="39" r="3"/>
      <circle cx="90" cy="39" r="2.5"/>
      <circle cx="22" cy="51" r="2.2"/>
      <circle cx="40" cy="51" r="2.8"/>
      <circle cx="60" cy="51" r="3"/>
      <circle cx="80" cy="51" r="2.8"/>
      <circle cx="98" cy="51" r="2.2"/>
      <circle cx="35" cy="63" r="2.5"/>
      <circle cx="50" cy="63" r="2.8"/>
      <circle cx="70" cy="63" r="2.8"/>
      <circle cx="85" cy="63" r="2.5"/>
      <circle cx="45" cy="73" r="2.5"/>
      <circle cx="75" cy="73" r="2.5"/>
      <circle cx="60" cy="83" r="2.5"/>
    </g>
    <text x="60" y="105" font-family="'Cairo', sans-serif" font-size="16" font-weight="900" text-anchor="middle" fill="#4cb0ad">وزارة التعليم</text>
    <text x="60" y="119" font-family="'Arial', sans-serif" font-size="8" font-weight="600" text-anchor="middle" fill="#4cb0ad">Ministry of Education</text>
  </g>

  <!-- Left side -->
  <g text-anchor="start" font-family="'Cairo', 'IBM Plex Sans Arabic', sans-serif" fill="#555555" font-size="13">
    <text x="35" y="55" font-weight="bold">الرقـم:</text>
    <text x="35" y="95" font-weight="bold">التاريخ:</text>
  </g>

  <!-- Divider Line -->
  <line x1="35" y1="145" x2="1088" y2="145" stroke="#006C70" stroke-width="2"/>
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

/**
 * Returns Base64 Data URL of the official MOE logo SVG
 */
export function getMoeLogoDataUrl(): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(MOE_LOGO_SVG)}`;
}
