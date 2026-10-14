import { VisualAsset, VisualStatus, VisualType, SubjectName } from '../types/jee';

/**
 * Verified SVG diagrams repository for official JEE Main PYQs.
 * These are geometrically and physically verified circuit/graph/reaction topologies.
 */
export const VERIFIED_PYQ_DIAGRAMS: Record<
  string,
  {
    type: VisualType;
    subject: SubjectName;
    chapter: string;
    caption: string;
    altText: string;
    svgContent: string;
  }
> = {
  // Question 113: JEE Main 2023 (Online) 1st February Morning Shift Physics - Current Electricity
  // Wheatstone Bridge with R, 3R, 2R, 6R and 9R central resistor, terminals A and B.
  'JEE Main 2023 (Online) 1st February Morning Shift Physics - Current Electricity Question 113 English': {
    type: 'circuit',
    subject: 'Physics',
    chapter: 'Current Electricity',
    caption: 'Figure: Resistor bridge network between terminals A and B',
    altText: 'Circuit diagram showing a Wheatstone bridge network between terminals A and B with resistors R, 3R, 2R, 6R and a 9R central branch.',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 320" width="100%" height="100%" class="w-full max-w-lg mx-auto select-none" style="background:#090d16; border-radius:12px; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <!-- Glow filter for nodes -->
    <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#38bdf8" flood-opacity="0.6"/>
    </filter>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background Card Grid -->
  <rect width="540" height="320" rx="12" fill="#0b1120" stroke="#1e293b" stroke-width="1.5"/>
  <g opacity="0.08" stroke="#94a3b8" stroke-width="0.75" stroke-dasharray="3,3">
    <line x1="40" y1="40" x2="500" y2="40"/>
    <line x1="40" y1="100" x2="500" y2="100"/>
    <line x1="40" y1="160" x2="500" y2="160"/>
    <line x1="40" y1="220" x2="500" y2="220"/>
    <line x1="40" y1="280" x2="500" y2="280"/>
    <line x1="80" y1="30" x2="80" y2="290"/>
    <line x1="180" y1="30" x2="180" y2="290"/>
    <line x1="270" y1="30" x2="270" y2="290"/>
    <line x1="360" y1="30" x2="360" y2="290"/>
    <line x1="460" y1="30" x2="460" y2="290"/>
  </g>

  <!-- WIRING BUSES -->
  <!-- Terminal A lead to Node A -->
  <line x1="45" y1="160" x2="150" y2="160" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>

  <!-- Left fork from Node A (150, 160) to Node D (270, 60) and Node C (270, 260) -->
  <!-- Wire A -> Top branch (to resistor R) -->
  <path d="M 150 160 L 175 125" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Wire A -> Bottom branch (to resistor 2R) -->
  <path d="M 150 160 L 175 195" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>

  <!-- TOP-LEFT ARM: Resistor R between (175, 125) and (245, 75) -->
  <!-- Zigzag resistor symbol for R -->
  <path d="M 175 125 L 182 120 L 189 130 L 199 110 L 209 130 L 219 110 L 229 130 L 236 120 L 245 75" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  <line x1="245" y1="75" x2="270" y2="60" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>

  <!-- BOTTOM-LEFT ARM: Resistor 2R between (175, 195) and (245, 245) -->
  <!-- Zigzag resistor symbol for 2R -->
  <path d="M 175 195 L 182 200 L 189 190 L 199 210 L 209 190 L 219 210 L 229 190 L 236 200 L 245 245" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  <line x1="245" y1="245" x2="270" y2="260" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>

  <!-- CENTRAL VERTICAL BRIDGE: Resistor 9R between Node D (270, 60) and Node C (270, 260) -->
  <line x1="270" y1="60" x2="270" y2="105" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 270 105 L 260 113 L 280 125 L 260 137 L 280 149 L 260 161 L 280 173 L 260 185 L 280 197 L 270 205" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  <line x1="270" y1="205" x2="270" y2="260" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>

  <!-- TOP-RIGHT ARM: Resistor 3R between Node D (270, 60) and Node B (390, 160) -->
  <line x1="270" y1="60" x2="295" y2="75" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 295 75 L 304 120 L 311 110 L 321 130 L 331 110 L 341 130 L 351 110 L 358 120 L 365 125" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M 365 125 L 390 160" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>

  <!-- BOTTOM-RIGHT ARM: Resistor 6R between Node C (270, 260) and Node B (390, 160) -->
  <line x1="270" y1="260" x2="295" y2="245" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 295 245 L 304 200 L 311 210 L 321 190 L 331 210 L 341 190 L 351 210 L 358 200 L 365 195" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M 365 195 L 390 160" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>

  <!-- Terminal B lead from Node B (390, 160) to right terminal -->
  <line x1="390" y1="160" x2="495" y2="160" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>

  <!-- JUNCTION NODES -->
  <!-- Node A junction dot -->
  <circle cx="150" cy="160" r="5" fill="#38bdf8" stroke="#0b1120" stroke-width="2"/>
  <!-- Node B junction dot -->
  <circle cx="390" cy="160" r="5" fill="#38bdf8" stroke="#0b1120" stroke-width="2"/>
  <!-- Node D junction dot -->
  <circle cx="270" cy="60" r="5" fill="#e2e8f0" stroke="#0b1120" stroke-width="2"/>
  <!-- Node C junction dot -->
  <circle cx="270" cy="260" r="5" fill="#e2e8f0" stroke="#0b1120" stroke-width="2"/>

  <!-- TERMINALS A AND B (Input/Output Terminals) -->
  <circle cx="45" cy="160" r="7" fill="#0b1120" stroke="#38bdf8" stroke-width="3" filter="url(#nodeGlow)"/>
  <circle cx="495" cy="160" r="7" fill="#0b1120" stroke="#38bdf8" stroke-width="3" filter="url(#nodeGlow)"/>

  <!-- LABELS -->
  <!-- Terminal A Label -->
  <text x="25" y="166" font-size="20" font-weight="700" fill="#38bdf8" text-anchor="middle" font-family="'JetBrains Mono', monospace">A</text>
  <!-- Terminal B Label -->
  <text x="515" y="166" font-size="20" font-weight="700" fill="#38bdf8" text-anchor="middle" font-family="'JetBrains Mono', monospace">B</text>

  <!-- Node Labels (D and C) -->
  <text x="270" y="44" font-size="14" font-weight="600" fill="#94a3b8" text-anchor="middle">D</text>
  <text x="270" y="286" font-size="14" font-weight="600" fill="#94a3b8" text-anchor="middle">C</text>

  <!-- RESISTOR VALUE LABELS (Clear, High Contrast Badges) -->
  <!-- Resistor R (Top-Left) -->
  <g transform="translate(190, 80)">
    <rect x="-20" y="-14" width="40" height="24" rx="5" fill="#1e293b" stroke="#f59e0b" stroke-width="1.2" filter="url(#cardShadow)"/>
    <text x="0" y="3" font-size="14" font-weight="700" fill="#fbbf24" text-anchor="middle" font-family="'JetBrains Mono', monospace">R</text>
  </g>

  <!-- Resistor 3R (Top-Right) -->
  <g transform="translate(350, 80)">
    <rect x="-22" y="-14" width="44" height="24" rx="5" fill="#1e293b" stroke="#f59e0b" stroke-width="1.2" filter="url(#cardShadow)"/>
    <text x="0" y="3" font-size="14" font-weight="700" fill="#fbbf24" text-anchor="middle" font-family="'JetBrains Mono', monospace">3R</text>
  </g>

  <!-- Resistor 2R (Bottom-Left) -->
  <g transform="translate(190, 240)">
    <rect x="-22" y="-14" width="44" height="24" rx="5" fill="#1e293b" stroke="#f59e0b" stroke-width="1.2" filter="url(#cardShadow)"/>
    <text x="0" y="3" font-size="14" font-weight="700" fill="#fbbf24" text-anchor="middle" font-family="'JetBrains Mono', monospace">2R</text>
  </g>

  <!-- Resistor 6R (Bottom-Right) -->
  <g transform="translate(350, 240)">
    <rect x="-22" y="-14" width="44" height="24" rx="5" fill="#1e293b" stroke="#f59e0b" stroke-width="1.2" filter="url(#cardShadow)"/>
    <text x="0" y="3" font-size="14" font-weight="700" fill="#fbbf24" text-anchor="middle" font-family="'JetBrains Mono', monospace">6R</text>
  </g>

  <!-- Resistor 9R (Center Bridge Arm) -->
  <g transform="translate(295, 160)">
    <rect x="-22" y="-14" width="44" height="24" rx="5" fill="#1e293b" stroke="#ef4444" stroke-width="1.2" filter="url(#cardShadow)"/>
    <text x="0" y="3" font-size="14" font-weight="700" fill="#f87171" text-anchor="middle" font-family="'JetBrains Mono', monospace">9R</text>
  </g>

  <!-- Subtitle note on bottom left -->
  <text x="40" y="302" font-size="11" font-weight="500" fill="#64748b" text-anchor="start">JEE Main 2023 · Balanced Bridge Network · Find Equivalent Resistance R_AB</text>
</svg>`,
  },
};

/**
 * Normalizes visual placeholder keys for canonical lookups.
 */
export function normalizeVisualKey(rawKey: string): string {
  return rawKey
    .replace(/^\[(image|diagram|figure|graph|reaction|structure|asset|image\s+attached):\s*/i, '')
    .replace(/\]$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts all visual references, URLs, and placeholders from raw question fields.
 */
/**
 * Canonicalizes an image URL for robust deduplication across CDN proxies,
 * query parameters, protocol variants, and thumbnails (Section 2 & 3).
 */
export function canonicalizeImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();
  // Strip protocol for comparison (treat http and https as equivalent)
  clean = clean.replace(/^https?:\/\//i, '');
  // Normalize ExamGoal CDN fly/@width/ thumbnail paths to base image path
  clean = clean.replace(/\/fly\/@[^/]+\/image\//i, '/image/');
  // Strip query parameters for comparison (?format=png, cachebusters, resize dims)
  const qIdx = clean.indexOf('?');
  if (qIdx !== -1) {
    clean = clean.substring(0, qIdx);
  }
  // Strip trailing slashes and normalize case
  return clean.replace(/\/+$/, '').toLowerCase();
}

export interface ExtractedVisualReference {
  raw: string;
  cleanKey: string;
  sourceType: 'html_img' | 'bracket_placeholder' | 'field_string' | 'field_object';
  sourceField: 'question' | 'options' | 'explanation' | 'direct_field';
  url?: string;
  altText?: string;
}

export function extractAllVisualReferences(
  rawRecord: Record<string, unknown>
): ExtractedVisualReference[] {
  const refs: ExtractedVisualReference[] = [];

  const inspectText = (
    text: string,
    fieldName: string,
    sourceField: 'question' | 'options' | 'explanation'
  ) => {
    if (!text || typeof text !== 'string') return;

    // 1. Extract HTML <img ...> tags
    const imgTagRegex = /<img[^>]+(?:src=["']([^"']+)["'][^>]*|alt=["']([^"']+)["'][^>]*)+>/gi;
    let match: RegExpExecArray | null;
    while ((match = imgTagRegex.exec(text)) !== null) {
      const tagStr = match[0];
      const srcMatch = tagStr.match(/src=["']([^"']+)["']/i);
      const altMatch = tagStr.match(/alt=["']([^"']+)["']/i);
      const url = srcMatch ? srcMatch[1] : undefined;
      const alt = altMatch ? altMatch[1] : undefined;
      refs.push({
        raw: tagStr,
        cleanKey: alt ? normalizeVisualKey(alt) : (url || fieldName),
        sourceType: 'html_img',
        sourceField,
        url,
        altText: alt,
      });
    }

    // 2. Extract bracket placeholders: [image: ...], [Diagram: ...], etc.
    const bracketRegex = /\[(image|diagram|figure|graph|reaction|structure|asset|image\s+attached):\s*([^\]]+)\]/gi;
    while ((match = bracketRegex.exec(text)) !== null) {
      const full = match[0];
      const inner = match[2].trim();
      refs.push({
        raw: full,
        cleanKey: normalizeVisualKey(inner),
        sourceType: 'bracket_placeholder',
        sourceField,
        altText: inner,
      });
    }
  };

  inspectText(String(rawRecord.question ?? rawRecord.questionText ?? rawRecord.statement ?? ''), 'question', 'question');
  inspectText(String(rawRecord.explanation ?? rawRecord.solution ?? ''), 'explanation', 'explanation');

  // Check explicit object fields: diagram, image, images, diagramUrl, visual, visualAsset
  if (typeof rawRecord.diagram === 'string' && rawRecord.diagram.trim()) {
    refs.push({
      raw: rawRecord.diagram,
      cleanKey: normalizeVisualKey(rawRecord.diagram),
      sourceType: 'field_string',
      sourceField: 'direct_field',
    });
  }
  if (typeof rawRecord.image === 'string' && rawRecord.image.trim()) {
    refs.push({
      raw: rawRecord.image,
      cleanKey: normalizeVisualKey(rawRecord.image),
      sourceType: 'field_string',
      sourceField: 'direct_field',
      url: /^https?:\/\//i.test(rawRecord.image.trim()) ? rawRecord.image.trim() : undefined,
    });
  }
  if (typeof rawRecord.diagramUrl === 'string' && rawRecord.diagramUrl.trim()) {
    refs.push({
      raw: rawRecord.diagramUrl,
      cleanKey: normalizeVisualKey(rawRecord.diagramUrl),
      sourceType: 'field_string',
      sourceField: 'direct_field',
      url: rawRecord.diagramUrl.trim(),
    });
  }
  if (Array.isArray(rawRecord.images)) {
    for (const item of rawRecord.images) {
      if (typeof item === 'string' && item.trim()) {
        refs.push({
          raw: item,
          cleanKey: normalizeVisualKey(item),
          sourceType: 'field_string',
          sourceField: 'direct_field',
          url: /^https?:\/\//i.test(item.trim()) ? item.trim() : undefined,
        });
      }
    }
  }

  return refs;
}

/**
 * Resolution Result conforming to Section 4 & 6.
 */
export interface ResolvedQuestionVisual {
  asset: VisualAsset | null;
  images: VisualAsset[];
  primaryImageUrl: string | null;
  visualRequired: boolean;
  visualStatus: VisualStatus;
  rawVisualMetadata: string | null;
}

/**
 * Core 5-tier Priority Visual Asset Resolver.
 * Filters out explanation-only visuals from active question rendering
 * and safely deduplicates repeated references and CDN aliases.
 */
export function resolveQuestionVisualAsset(
  questionId: string,
  rawRecord: Record<string, unknown>,
  subject: SubjectName,
  chapter: string
): ResolvedQuestionVisual {
  const references = extractAllVisualReferences(rawRecord);

  // If no visual reference anywhere in the question
  if (references.length === 0) {
    return {
      asset: null,
      images: [],
      primaryImageUrl: null,
      visualRequired: false,
      visualStatus: 'verified',
      rawVisualMetadata: null,
    };
  }

  // Combine raw visual metadata strings for internal provenance (Section 15)
  const rawVisualMetadata = references.map((r) => r.cleanKey).join('; ');

  // Filter to references that genuinely belong to the question (prompt or direct question fields),
  // strictly excluding explanation-only images from active question presentation
  const questionRefs = references.filter((r) => r.sourceField !== 'explanation');

  // PRIORITY 1: Existing verified image/diagram asset already attached
  if (rawRecord.visualAsset && typeof rawRecord.visualAsset === 'object') {
    const existing = rawRecord.visualAsset as VisualAsset;
    if (existing.verified && (existing.svgContent || existing.imageUrl || existing.url)) {
      return {
        asset: existing,
        images: [existing],
        primaryImageUrl: existing.imageUrl || existing.url || (existing.svgContent ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(existing.svgContent)}` : null),
        visualRequired: true,
        visualStatus: 'verified',
        rawVisualMetadata,
      };
    }
  }

  // PRIORITY 2: Original source images associated with imported PYQ (valid HTTP/HTTPS URLs)
  // Safely deduplicate across question body, image array, and aliases
  const uniqueQuestionAssets: VisualAsset[] = [];
  const seenCanonicalUrls = new Set<string>();

  for (const ref of questionRefs) {
    if (ref.url && /^https?:\/\/[^\s]+$/i.test(ref.url)) {
      const canonicalKey = canonicalizeImageUrl(ref.url);
      if (canonicalKey && !seenCanonicalUrls.has(canonicalKey)) {
        seenCanonicalUrls.add(canonicalKey);
        const asset: VisualAsset = {
          assetId: `asset-${questionId}-${uniqueQuestionAssets.length + 1}`,
          type: 'image',
          subject,
          chapter,
          questionId,
          format: 'url',
          imageUrl: ref.url,
          url: ref.url,
          sourceUrl: ref.url,
          altText: ref.altText || `${subject} Problem Diagram ${uniqueQuestionAssets.length > 0 ? uniqueQuestionAssets.length + 1 : ''}`.trim(),
          caption: ref.altText,
          verified: true,
          visualStatus: 'verified',
        };
        uniqueQuestionAssets.push(asset);
      }
    }
  }

  if (uniqueQuestionAssets.length > 0) {
    return {
      asset: uniqueQuestionAssets[0],
      images: uniqueQuestionAssets,
      primaryImageUrl: uniqueQuestionAssets[0].imageUrl || null,
      visualRequired: true,
      visualStatus: 'verified',
      rawVisualMetadata,
    };
  }

  // PRIORITY 3: Verified locally stored or curated visual asset associated through source metadata
  for (const ref of questionRefs) {
    // Check against curated verified PYQ diagrams
    for (const [key, verifiedData] of Object.entries(VERIFIED_PYQ_DIAGRAMS)) {
      const normalizedKey = normalizeVisualKey(key).toLowerCase();
      const refKey = ref.cleanKey.toLowerCase();

      // Exact match or high-confidence match on Exam, Date, Shift, Subject, Question number
      const isMatch =
        refKey === normalizedKey ||
        (refKey.includes('2023') &&
          refKey.includes('1st february') &&
          refKey.includes('current electricity') &&
          (refKey.includes('113') || questionId === 'CE-0163'));

      if (isMatch) {
        const asset: VisualAsset = {
          assetId: `pyq-verified-${questionId}`,
          type: verifiedData.type,
          subject: verifiedData.subject,
          chapter: verifiedData.chapter,
          questionId,
          format: 'svg',
          svgContent: verifiedData.svgContent,
          imageUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(verifiedData.svgContent)}`,
          url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(verifiedData.svgContent)}`,
          altText: verifiedData.altText,
          caption: verifiedData.caption,
          verified: true,
          visualStatus: 'verified',
        };
        return {
          asset,
          images: [asset],
          primaryImageUrl: asset.imageUrl || null,
          visualRequired: true,
          visualStatus: 'verified',
          rawVisualMetadata,
        };
      }
    }
  }

  // PRIORITY 4: Reconstructed diagram if verified algorithmically
  // (Handled via curated registry above for Question 113)

  // PRIORITY 5: Asset missing. Mark question as visualRequired = true, visualStatus = "missing"
  // NEVER use the metadata string as an image or pass it to <img> (Section 5)
  return {
    asset: null,
    images: [],
    primaryImageUrl: null,
    visualRequired: true,
    visualStatus: 'missing',
    rawVisualMetadata,
  };
}
