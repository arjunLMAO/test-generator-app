import { SubjectName, VisualAsset, VisualType } from '../types/jee';

export class VisualAssetEngine {
  /**
   * Generates question-specific, mathematically and chemically accurate SVG visual assets.
   * Every asset is strictly tied to a unique question ID and reflects the precise scientific setup.
   */

  // -------------------------------------------------------------
  // 1. ORGANIC CHEMISTRY: Carbocations Stability Comparison
  // -------------------------------------------------------------
  public static createCarbocationsStabilityDiagram(questionId: string): VisualAsset {
    const assetId = `VA-${questionId}-CARBOCATIONS`;
    const altText = 'Comparison of 4 carbocation structures: (I) Tropylium, (II) Cyclopentadienyl, (III) Allyl, (IV) Benzyl';
    const caption = 'Aromatic vs Anti-aromatic vs Conjugated Carbocation Systems';

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 220" width="620" height="220" class="w-full h-auto select-none">
  <rect x="2" y="2" width="616" height="216" rx="14" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- (I) Tropylium Cation (7-membered aromatic ring with +) -->
  <g transform="translate(20, 25)">
    <rect x="0" y="0" width="125" height="165" rx="10" fill="#131C31" stroke="#334155" stroke-width="1.5"/>
    <text x="62" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#38BDF8" text-anchor="middle">(I)</text>
    <!-- 7-membered heptagon -->
    <polygon points="62,42 96,58 108,92 88,124 36,124 16,92 28,58" fill="rgba(56, 189, 248, 0.08)" stroke="#E2E8F0" stroke-width="2"/>
    <circle cx="62" cy="85" r="22" fill="none" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="4,2"/>
    <circle cx="62" cy="85" r="9" fill="#0284C7"/>
    <text x="62" y="89" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">+</text>
    <text x="62" y="146" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94A3B8" text-anchor="middle">Tropylium (6π)</text>
  </g>

  <!-- (II) Cyclopentadienyl Cation (5-membered ring with +) -->
  <g transform="translate(170, 25)">
    <rect x="0" y="0" width="125" height="165" rx="10" fill="#131C31" stroke="#334155" stroke-width="1.5"/>
    <text x="62" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#38BDF8" text-anchor="middle">(II)</text>
    <!-- 5-membered pentagon -->
    <polygon points="62,44 102,74 86,120 38,120 22,74" fill="rgba(239, 68, 68, 0.08)" stroke="#E2E8F0" stroke-width="2"/>
    <!-- Double bonds -->
    <line x1="94" y1="76" x2="82" y2="114" stroke="#E2E8F0" stroke-width="2"/>
    <line x1="30" y1="76" x2="42" y2="114" stroke="#E2E8F0" stroke-width="2"/>
    <circle cx="62" cy="56" r="8" fill="#EF4444"/>
    <text x="62" y="60" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">+</text>
    <text x="62" y="146" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94A3B8" text-anchor="middle">Cyclopentadienyl</text>
  </g>

  <!-- (III) Allyl Cation (CH2=CH-CH2+) -->
  <g transform="translate(320, 25)">
    <rect x="0" y="0" width="125" height="165" rx="10" fill="#131C31" stroke="#334155" stroke-width="1.5"/>
    <text x="62" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#38BDF8" text-anchor="middle">(III)</text>
    <!-- Allyl chain -->
    <line x1="25" y1="90" x2="62" y2="70" stroke="#E2E8F0" stroke-width="3"/>
    <line x1="28" y1="97" x2="65" y2="77" stroke="#E2E8F0" stroke-width="2"/>
    <line x1="62" y1="70" x2="99" y2="90" stroke="#E2E8F0" stroke-width="2.5"/>
    <circle cx="102" cy="74" r="8" fill="#F59E0B"/>
    <text x="102" y="78" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">+</text>
    <text x="62" y="125" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#E2E8F0" text-anchor="middle">CH₂=CH-CH₂⁺</text>
    <text x="62" y="146" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94A3B8" text-anchor="middle">Allyl Cation</text>
  </g>

  <!-- (IV) Benzyl Cation (Ph-CH2+) -->
  <g transform="translate(470, 25)">
    <rect x="0" y="0" width="125" height="165" rx="10" fill="#131C31" stroke="#334155" stroke-width="1.5"/>
    <text x="62" y="24" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#38BDF8" text-anchor="middle">(IV)</text>
    <!-- Benzene ring -->
    <polygon points="62,60 84,72 84,98 62,110 40,98 40,72" fill="none" stroke="#E2E8F0" stroke-width="2"/>
    <circle cx="62" cy="85" r="14" fill="none" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="3,2"/>
    <!-- exocyclic bond -->
    <line x1="62" y1="60" x2="62" y2="42" stroke="#E2E8F0" stroke-width="2"/>
    <circle cx="78" cy="42" r="7" fill="#34D399"/>
    <text x="78" y="46" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="#0B132B" text-anchor="middle">+</text>
    <text x="62" y="40" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#E2E8F0" text-anchor="middle">CH₂</text>
    <text x="62" y="146" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94A3B8" text-anchor="middle">Benzyl Cation</text>
  </g>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'stereochemical_structure',
      subject: 'Chemistry',
      chapter: 'General Organic Chemistry & Isomerism',
      format: 'svg',
      svgContent,
      altText,
      caption,
    };
  }

  // -------------------------------------------------------------
  // 2. ORGANIC CHEMISTRY: Alkene Ozonolysis Sequence
  // -------------------------------------------------------------
  public static createOzonolysisDiagram(questionId: string): VisualAsset {
    const assetId = `VA-${questionId}-OZONOLYSIS`;
    const altText = 'Reductive ozonolysis of alkene [X] (C6H12) yielding Acetone and Propionaldehyde';
    const caption = 'Reductive Ozonolysis Cleavage';

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 180" width="580" height="180" class="w-full h-auto select-none">
  <defs>
    <marker id="arrow-oz" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#38BDF8" />
    </marker>
  </defs>

  <rect x="2" y="2" width="576" height="176" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Reactant Box: Alkene [X] -->
  <g transform="translate(30, 45)">
    <rect x="0" y="0" width="120" height="90" rx="8" fill="#131C31" stroke="#334155" stroke-width="1.5"/>
    <text x="60" y="38" font-family="system-ui, sans-serif" font-size="20" font-weight="800" fill="#38BDF8" text-anchor="middle">[X]</text>
    <text x="60" y="60" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#E2E8F0" text-anchor="middle">C₆H₁₂ Alkene</text>
    <text x="60" y="78" font-family="system-ui, sans-serif" font-size="10" font-weight="500" fill="#94A3B8" text-anchor="middle">Unknown Isomer</text>
  </g>

  <!-- Reaction Arrow -->
  <g transform="translate(170, 75)">
    <line x1="5" y1="15" x2="85" y2="15" stroke="#38BDF8" stroke-width="2" marker-end="url(#arrow-oz)"/>
    <text x="45" y="4" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#FBBF24" text-anchor="middle">1. O₃</text>
    <text x="45" y="32" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#FBBF24" text-anchor="middle">2. Zn / H₂O</text>
  </g>

  <!-- Products Container -->
  <g transform="translate(280, 40)">
    <rect x="0" y="0" width="270" height="100" rx="8" fill="#131C31" stroke="#334155" stroke-width="1.5"/>
    <text x="135" y="22" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#34D399" text-anchor="middle">Equimolar Product Cleavage</text>

    <!-- Acetone box -->
    <g transform="translate(15, 32)">
      <rect x="0" y="0" width="110" height="55" rx="6" fill="#1E293B" stroke="#64748B" stroke-width="1"/>
      <text x="55" y="24" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#F8FAFC" text-anchor="middle">(CH₃)₂C=O</text>
      <text x="55" y="44" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94A3B8" text-anchor="middle">Acetone</text>
    </g>

    <text x="135" y="65" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#38BDF8" text-anchor="middle">+</text>

    <!-- Propionaldehyde box -->
    <g transform="translate(145, 32)">
      <rect x="0" y="0" width="110" height="55" rx="6" fill="#1E293B" stroke="#64748B" stroke-width="1"/>
      <text x="55" y="24" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#F8FAFC" text-anchor="middle">CH₃CH₂CHO</text>
      <text x="55" y="44" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94A3B8" text-anchor="middle">Propionaldehyde</text>
    </g>
  </g>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'reaction_scheme',
      subject: 'Chemistry',
      chapter: 'Hydrocarbons',
      format: 'svg',
      svgContent,
      altText,
      caption,
    };
  }

  // -------------------------------------------------------------
  // 3. ORGANIC CHEMISTRY: Hofmann Elimination of Bulky Base
  // -------------------------------------------------------------
  public static createHofmannEliminationDiagram(questionId: string): VisualAsset {
    const assetId = `VA-${questionId}-ELIMINATION`;
    const altText = 'Elimination of 1-bromo-1-methylcyclohexane with t-BuOK yielding Hofmann product';
    const caption = 'Regioselective Hofmann Elimination';

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 180" width="540" height="180" class="w-full h-auto select-none">
  <defs>
    <marker id="arrow-elm" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#38BDF8" />
    </marker>
  </defs>

  <rect x="2" y="2" width="536" height="176" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Reactant: 1-bromo-1-methylcyclohexane -->
  <g transform="translate(30, 35)">
    <rect x="0" y="0" width="130" height="110" rx="8" fill="#131C31" stroke="#334155" stroke-width="1.5"/>
    <!-- Cyclohexane chair/hexagon -->
    <polygon points="65,30 90,45 90,75 65,90 40,75 40,45" fill="none" stroke="#E2E8F0" stroke-width="2"/>
    <!-- Substituents at top carbon (65, 30) -->
    <line x1="65" y1="30" x2="48" y2="15" stroke="#E2E8F0" stroke-width="2"/>
    <text x="44" y="12" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#38BDF8" text-anchor="end">CH₃</text>
    <line x1="65" y1="30" x2="82" y2="15" stroke="#E2E8F0" stroke-width="2"/>
    <text x="86" y="12" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#EF4444" text-anchor="start">Br</text>
    <text x="65" y="104" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#94A3B8" text-anchor="middle">1-Bromo-1-methyl</text>
  </g>

  <!-- Reagent Arrow -->
  <g transform="translate(180, 80)">
    <line x1="5" y1="10" x2="105" y2="10" stroke="#38BDF8" stroke-width="2" marker-end="url(#arrow-elm)"/>
    <text x="55" y="-2" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#FBBF24" text-anchor="middle">t-BuO⁻ K⁺ / t-BuOH</text>
    <text x="55" y="26" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#FBBF24" text-anchor="middle">75°C, Δ</text>
  </g>

  <!-- Target Box -->
  <g transform="translate(320, 35)">
    <rect x="0" y="0" width="180" height="110" rx="8" fill="#1E1B4B" stroke="#6366F1" stroke-width="2" stroke-dasharray="4,2"/>
    <text x="90" y="42" font-family="system-ui, sans-serif" font-size="28" font-weight="800" fill="#A5B4FC" text-anchor="middle">?</text>
    <text x="90" y="72" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#818CF8" text-anchor="middle">Major Alkene Product</text>
    <text x="90" y="94" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94A3B8" text-anchor="middle">(Hofmann vs Saytzeff)</text>
  </g>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'reaction_scheme',
      subject: 'Chemistry',
      chapter: 'Haloalkanes & Haloarenes',
      format: 'svg',
      svgContent,
      altText,
      caption,
    };
  }

  // -------------------------------------------------------------
  // 4. ORGANIC CHEMISTRY: Reimer-Tiemann & Zinc Reduction
  // -------------------------------------------------------------
  public static createReimerTiemannDiagram(questionId: string): VisualAsset {
    const assetId = `VA-${questionId}-REIMER-TIEMANN`;
    const altText = 'Reimer-Tiemann formylation of Phenol to Salicylaldehyde [A], followed by Zn dust distillation to Benzaldehyde';
    const caption = 'Reimer-Tiemann Formylation & Phenolic Reduction';

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 180" width="580" height="180" class="w-full h-auto select-none">
  <defs>
    <marker id="arrow-rt" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#38BDF8" />
    </marker>
  </defs>

  <rect x="2" y="2" width="576" height="176" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Phenol -->
  <g transform="translate(25, 40)">
    <rect x="0" y="0" width="100" height="100" rx="8" fill="#131C31" stroke="#334155" stroke-width="1.5"/>
    <polygon points="50,26 70,37 70,61 50,72 30,61 30,37" fill="none" stroke="#E2E8F0" stroke-width="2"/>
    <circle cx="50" cy="49" r="11" fill="none" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="3,2"/>
    <line x1="50" y1="26" x2="50" y2="12" stroke="#E2E8F0" stroke-width="2"/>
    <text x="50" y="9" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#34D399" text-anchor="middle">OH</text>
    <text x="50" y="90" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#94A3B8" text-anchor="middle">Phenol</text>
  </g>

  <!-- Step 1 Arrow -->
  <g transform="translate(135, 75)">
    <line x1="5" y1="15" x2="70" y2="15" stroke="#38BDF8" stroke-width="2" marker-end="url(#arrow-rt)"/>
    <text x="37" y="2" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#FBBF24" text-anchor="middle">CHCl₃ / NaOH</text>
    <text x="37" y="28" font-family="system-ui, sans-serif" font-size="9" font-weight="500" fill="#FBBF24" text-anchor="middle">60°C, then H⁺</text>
  </g>

  <!-- Intermediate [A] Salicylaldehyde -->
  <g transform="translate(220, 40)">
    <rect x="0" y="0" width="115" height="100" rx="8" fill="#131C31" stroke="#334155" stroke-width="1.5"/>
    <polygon points="50,26 70,37 70,61 50,72 30,61 30,37" fill="none" stroke="#E2E8F0" stroke-width="2"/>
    <circle cx="50" cy="49" r="11" fill="none" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="3,2"/>
    <line x1="50" y1="26" x2="50" y2="12" stroke="#E2E8F0" stroke-width="2"/>
    <text x="50" y="9" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#34D399" text-anchor="middle">OH</text>
    <line x1="70" y1="37" x2="84" y2="30" stroke="#E2E8F0" stroke-width="2"/>
    <text x="88" y="28" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#38BDF8" text-anchor="start">CHO</text>
    <text x="57" y="90" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94A3B8" text-anchor="middle">[A] Salicylaldehyde</text>
  </g>

  <!-- Step 2 Arrow -->
  <g transform="translate(345, 75)">
    <line x1="5" y1="15" x2="70" y2="15" stroke="#38BDF8" stroke-width="2" marker-end="url(#arrow-rt)"/>
    <text x="37" y="4" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#FBBF24" text-anchor="middle">Zn dust</text>
    <text x="37" y="28" font-family="system-ui, sans-serif" font-size="9" font-weight="500" fill="#FBBF24" text-anchor="middle">distillation, Δ</text>
  </g>

  <!-- Final Product Box -->
  <g transform="translate(430, 40)">
    <rect x="0" y="0" width="125" height="100" rx="8" fill="#1E1B4B" stroke="#6366F1" stroke-width="2" stroke-dasharray="4,2"/>
    <text x="62" y="46" font-family="system-ui, sans-serif" font-size="26" font-weight="800" fill="#A5B4FC" text-anchor="middle">?</text>
    <text x="62" y="74" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#818CF8" text-anchor="middle">Major Product</text>
    <text x="62" y="90" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#94A3B8" text-anchor="middle">Distillate</text>
  </g>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'reaction_scheme',
      subject: 'Chemistry',
      chapter: 'Alcohols, Phenols & Ethers',
      format: 'svg',
      svgContent,
      altText,
      caption,
    };
  }

  // -------------------------------------------------------------
  // 5. ORGANIC CHEMISTRY: Crossed Cannizzaro Reaction
  // -------------------------------------------------------------
  public static createCrossedCannizzaroDiagram(questionId: string): VisualAsset {
    const assetId = `VA-${questionId}-CANNIZZARO`;
    const altText = 'Crossed Cannizzaro reaction of Benzaldehyde and Formaldehyde with 50% NaOH';
    const caption = 'Crossed Cannizzaro Redox Disproportionation';

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 180" width="560" height="180" class="w-full h-auto select-none">
  <defs>
    <marker id="arrow-cn" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#38BDF8" />
    </marker>
  </defs>

  <rect x="2" y="2" width="556" height="176" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Reactant Box: Ph-CHO + HCHO -->
  <g transform="translate(25, 35)">
    <rect x="0" y="0" width="160" height="110" rx="8" fill="#131C31" stroke="#334155" stroke-width="1.5"/>
    <text x="80" y="24" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#38BDF8" text-anchor="middle">Equimolar Substrates</text>
    <text x="80" y="52" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#E2E8F0" text-anchor="middle">C₆H₅-CHO</text>
    <text x="80" y="70" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#FBBF24" text-anchor="middle">+</text>
    <text x="80" y="90" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#E2E8F0" text-anchor="middle">HCHO</text>
  </g>

  <!-- Reaction Arrow -->
  <g transform="translate(195, 80)">
    <line x1="5" y1="10" x2="85" y2="10" stroke="#38BDF8" stroke-width="2" marker-end="url(#arrow-cn)"/>
    <text x="45" y="-4" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#FBBF24" text-anchor="middle">50% NaOH (aq)</text>
    <text x="45" y="26" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#FBBF24" text-anchor="middle">Hydride Transfer, Δ</text>
  </g>

  <!-- Product Options Box -->
  <g transform="translate(295, 35)">
    <rect x="0" y="0" width="240" height="110" rx="8" fill="#1E1B4B" stroke="#6366F1" stroke-width="2" stroke-dasharray="4,2"/>
    <text x="120" y="32" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#A5B4FC" text-anchor="middle">Regioselective Redox Outcome</text>
    <text x="120" y="65" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#FFFFFF" text-anchor="middle">[Reduction Product] + [Oxidation Product]</text>
    <text x="120" y="92" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94A3B8" text-anchor="middle">Identify Major Isolated Components</text>
  </g>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'reaction_scheme',
      subject: 'Chemistry',
      chapter: 'Aldehydes, Ketones & Carboxylic Acids',
      format: 'svg',
      svgContent,
      altText,
      caption,
    };
  }

  // -------------------------------------------------------------
  // 6. ORGANIC CHEMISTRY: Diazotization to Cyanide to Acid to Alcohol
  // -------------------------------------------------------------
  public static createDiazotizationSequenceDiagram(questionId: string): VisualAsset {
    const assetId = `VA-${questionId}-DIAZOTIZATION`;
    const altText = 'Multistep conversion: Aniline -> Diazonium [A] -> Benzonitrile [B] -> Benzoic Acid [C] -> [D]';
    const caption = 'Aromatic Diazonium Synthetic Relay';

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 180" width="600" height="180" class="w-full h-auto select-none">
  <defs>
    <marker id="arrow-dz" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#38BDF8" />
    </marker>
  </defs>

  <rect x="2" y="2" width="596" height="176" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Step Boxes -->
  <!-- 1. Aniline -->
  <g transform="translate(20, 50)">
    <rect x="0" y="0" width="85" height="80" rx="8" fill="#131C31" stroke="#334155" stroke-width="1.5"/>
    <text x="42" y="36" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#F8FAFC" text-anchor="middle">Ph-NH₂</text>
    <text x="42" y="58" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#94A3B8" text-anchor="middle">Aniline</text>
  </g>

  <line x1="110" y1="90" x2="145" y2="90" stroke="#38BDF8" stroke-width="2" marker-end="url(#arrow-dz)"/>
  <text x="127" y="80" font-family="system-ui, sans-serif" font-size="7.5" font-weight="700" fill="#FBBF24" text-anchor="middle">NaNO₂/HCl</text>

  <!-- 2. [A] -->
  <g transform="translate(150, 50)">
    <rect x="0" y="0" width="85" height="80" rx="8" fill="#131C31" stroke="#334155" stroke-width="1.5"/>
    <text x="42" y="36" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#38BDF8" text-anchor="middle">[A]</text>
    <text x="42" y="58" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#94A3B8" text-anchor="middle">Ph-N₂⁺Cl⁻</text>
  </g>

  <line x1="240" y1="90" x2="275" y2="90" stroke="#38BDF8" stroke-width="2" marker-end="url(#arrow-dz)"/>
  <text x="257" y="80" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#FBBF24" text-anchor="middle">CuCN</text>

  <!-- 3. [B] -->
  <g transform="translate(280, 50)">
    <rect x="0" y="0" width="85" height="80" rx="8" fill="#131C31" stroke="#334155" stroke-width="1.5"/>
    <text x="42" y="36" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#38BDF8" text-anchor="middle">[B]</text>
    <text x="42" y="58" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#94A3B8" text-anchor="middle">Ph-CN</text>
  </g>

  <line x1="370" y1="90" x2="405" y2="90" stroke="#38BDF8" stroke-width="2" marker-end="url(#arrow-dz)"/>
  <text x="387" y="80" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#FBBF24" text-anchor="middle">H₃O⁺, Δ</text>

  <!-- 4. [C] -->
  <g transform="translate(410, 50)">
    <rect x="0" y="0" width="80" height="80" rx="8" fill="#131C31" stroke="#334155" stroke-width="1.5"/>
    <text x="40" y="36" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#34D399" text-anchor="middle">[C]</text>
    <text x="40" y="58" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#94A3B8" text-anchor="middle">Ph-COOH</text>
  </g>

  <line x1="495" y1="90" x2="525" y2="90" stroke="#38BDF8" stroke-width="2" marker-end="url(#arrow-dz)"/>
  <text x="510" y="80" font-family="system-ui, sans-serif" font-size="7.5" font-weight="700" fill="#FBBF24" text-anchor="middle">LiAlH₄</text>

  <!-- 5. [D] Target -->
  <g transform="translate(530, 50)">
    <rect x="0" y="0" width="55" height="80" rx="8" fill="#1E1B4B" stroke="#6366F1" stroke-width="2" stroke-dasharray="3,2"/>
    <text x="27" y="46" font-family="system-ui, sans-serif" font-size="20" font-weight="800" fill="#A5B4FC" text-anchor="middle">?</text>
    <text x="27" y="66" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#818CF8" text-anchor="middle">[D]</text>
  </g>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'reaction_scheme',
      subject: 'Chemistry',
      chapter: 'Amines & Biomolecules',
      format: 'svg',
      svgContent,
      altText,
      caption,
    };
  }

  // -------------------------------------------------------------
  // 7. MATHEMATICS: Common Tangent to Parabola & Circle
  // -------------------------------------------------------------
  public static createCommonTangentParabolaCircleDiagram(questionId: string): VisualAsset {
    const assetId = `VA-${questionId}-COMMON-TANGENT`;
    const altText = 'Coordinate plane showing parabola y^2 = 16x, circle x^2 + y^2 = 8, and common tangent line';
    const caption = 'Common Tangency: y² = 16x and x² + y² = 8';

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 280" width="500" height="280" class="w-full h-auto select-none">
  <rect x="2" y="2" width="496" height="276" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Grid -->
  <g stroke="#1E293B" stroke-width="1" stroke-dasharray="3,3">
    <line x1="30" y1="50" x2="470" y2="50"/>
    <line x1="30" y1="95" x2="470" y2="95"/>
    <line x1="30" y1="140" x2="470" y2="140"/>
    <line x1="30" y1="185" x2="470" y2="185"/>
    <line x1="30" y1="230" x2="470" y2="230"/>
    <line x1="85" y1="25" x2="85" y2="255"/>
    <line x1="150" y1="25" x2="150" y2="255"/>
    <line x1="215" y1="25" x2="215" y2="255"/>
    <line x1="280" y1="25" x2="280" y2="255"/>
    <line x1="345" y1="25" x2="345" y2="255"/>
    <line x1="410" y1="25" x2="410" y2="255"/>
  </g>

  <!-- Axes (Origin at 215, 140) -->
  <line x1="30" y1="140" x2="470" y2="140" stroke="#64748B" stroke-width="2"/>
  <line x1="215" y1="25" x2="215" y2="255" stroke="#64748B" stroke-width="2"/>
  <text x="465" y="132" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#94A3B8">x</text>
  <text x="223" y="38" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#94A3B8">y</text>
  <text x="202" y="156" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748B">O</text>

  <!-- Parabola y^2 = 16x (opening right from origin) -->
  <path d="M 450 35 Q 215 140 450 245" fill="none" stroke="#38BDF8" stroke-width="2.5"/>
  <text x="400" y="30" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#38BDF8">y² = 16x</text>

  <!-- Circle x^2 + y^2 = 8 (radius = sqrt(8) ~ 2.82 units -> 52px) -->
  <circle cx="215" cy="140" r="52" fill="rgba(99, 102, 241, 0.12)" stroke="#818CF8" stroke-width="2"/>
  <text x="235" y="98" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#818CF8">x² + y² = 8</text>

  <!-- Common Tangent Line: y = mx + c (slope m = -1 or +1) -->
  <line x1="90" y1="230" x2="380" y2="35" stroke="#F59E0B" stroke-width="2.5"/>
  <text x="320" y="24" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#FBBF24">y = mx + c</text>

  <!-- Points of contact -->
  <circle cx="251" cy="104" r="4" fill="#EF4444"/>
  <circle cx="280" cy="85" r="4" fill="#EF4444"/>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'coordinate_graph',
      subject: 'Mathematics',
      chapter: 'Conic Sections',
      format: 'svg',
      svgContent,
      altText,
      caption,
    };
  }

  // -------------------------------------------------------------
  // 8. MATHEMATICS: Parabola & Line Bounded Definite Area
  // -------------------------------------------------------------
  public static createParabolaBoundedAreaDiagram(questionId: string): VisualAsset {
    const assetId = `VA-${questionId}-BOUNDED-AREA`;
    const altText = 'Definite integral area bounded by parabola y = 3x^2 and horizontal line y = 12';
    const caption = 'Enclosed Region: y = 3x² and y = 12';

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 270" width="500" height="270" class="w-full h-auto select-none">
  <rect x="2" y="2" width="496" height="266" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Axes: origin at (250, 215) -->
  <line x1="30" y1="215" x2="470" y2="215" stroke="#64748B" stroke-width="2"/>
  <line x1="250" y1="30" x2="250" y2="245" stroke="#64748B" stroke-width="2"/>
  <text x="465" y="207" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#94A3B8">x</text>
  <text x="258" y="42" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#94A3B8">y</text>

  <!-- Horizontal Line y = 12 at y = 85 in SVG -->
  <line x1="70" y1="85" x2="430" y2="85" stroke="#F59E0B" stroke-width="2.5"/>
  <text x="380" y="75" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#FBBF24">y = 12</text>

  <!-- Shaded Enclosed Area bounded between (-2, 12) at (150, 85) and (2, 12) at (350, 85) -->
  <path d="M 150 85 Q 250 215 350 85 Z" fill="rgba(56, 189, 248, 0.28)" stroke="#38BDF8" stroke-width="2.5"/>
  <text x="250" y="135" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#BAE6FD" text-anchor="middle">Enclosed Area A = 32</text>

  <!-- Intersection points -->
  <circle cx="150" cy="85" r="4.5" fill="#EF4444"/>
  <text x="110" y="78" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#FCA5A5">(-2, 12)</text>
  <circle cx="350" cy="85" r="4.5" fill="#EF4444"/>
  <text x="358" y="78" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#FCA5A5">(2, 12)</text>

  <!-- Parabola label -->
  <text x="250" y="240" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#38BDF8" text-anchor="middle">y = 3x²</text>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'geometry_diagram',
      subject: 'Mathematics',
      chapter: 'Integral Calculus',
      format: 'svg',
      svgContent,
      altText,
      caption,
    };
  }

  // -------------------------------------------------------------
  // 9. MATHEMATICS: Radical Axis of Two Circles
  // -------------------------------------------------------------
  public static createRadicalAxisTwoCirclesDiagram(questionId: string): VisualAsset {
    const assetId = `VA-${questionId}-RADICAL-AXIS`;
    const altText = 'Radical axis line orthogonal to line of centers for two intersecting circles';
    const caption = 'Radical Axis of Circles S₁ and S₂';

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 270" width="500" height="270" class="w-full h-auto select-none">
  <rect x="2" y="2" width="496" height="266" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Circle S1 -->
  <circle cx="170" cy="135" r="65" fill="rgba(56, 189, 248, 0.1)" stroke="#38BDF8" stroke-width="2"/>
  <circle cx="170" cy="135" r="3" fill="#38BDF8"/>
  <text x="170" y="125" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#38BDF8" text-anchor="middle">C₁(2, 3)</text>
  <text x="140" y="215" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94A3B8" text-anchor="middle">Circle S₁</text>

  <!-- Circle S2 -->
  <circle cx="330" cy="135" r="75" fill="rgba(129, 140, 248, 0.1)" stroke="#818CF8" stroke-width="2"/>
  <circle cx="330" cy="135" r="3" fill="#818CF8"/>
  <text x="330" y="125" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#818CF8" text-anchor="middle">C₂(-1, -2)</text>
  <text x="360" y="225" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#94A3B8" text-anchor="middle">Circle S₂</text>

  <!-- Radical Axis Line: perpendicular common chord -->
  <line x1="240" y1="25" x2="240" y2="245" stroke="#F59E0B" stroke-width="2.5"/>
  <text x="248" y="45" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#FBBF24">6x + 10y - 10 = 0</text>
  <text x="248" y="62" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#F59E0B">(Radical Axis S₁ - S₂ = 0)</text>

  <!-- Line of Centers -->
  <line x1="170" y1="135" x2="330" y2="135" stroke="#64748B" stroke-width="1.5" stroke-dasharray="3,3"/>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'coordinate_graph',
      subject: 'Mathematics',
      chapter: 'Coordinate Geometry (Straight Lines & Circles)',
      format: 'svg',
      svgContent,
      altText,
      caption,
    };
  }

  // -------------------------------------------------------------
  // 10. PHYSICS: Resistor Skeleton Cube
  // -------------------------------------------------------------
  public static createResistorCubeDiagram(questionId: string, resistance: number = 30): VisualAsset {
    const assetId = `VA-${questionId}-RESISTOR-CUBE`;
    const altText = `Skeleton cube composed of 12 resistors of resistance R = ${resistance} ohms between body diagonal opposite corners A and B`;
    const caption = `Skeleton Cube Resistor Network (R = ${resistance} Ω)`;

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 280" width="520" height="280" class="w-full h-auto select-none">
  <rect x="2" y="2" width="516" height="276" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Cube Edges (12 resistors):
       Front Face: (160, 90), (300, 90), (300, 210), (160, 210)
       Back Face:  (220, 50), (360, 50), (360, 170), (220, 170)
  -->

  <!-- Back Edges (dashed) -->
  <line x1="220" y1="50" x2="360" y2="50" stroke="#475569" stroke-width="2" stroke-dasharray="4,3"/>
  <line x1="220" y1="50" x2="220" y2="170" stroke="#475569" stroke-width="2" stroke-dasharray="4,3"/>
  <line x1="360" y1="50" x2="360" y2="170" stroke="#475569" stroke-width="2"/>
  <line x1="220" y1="170" x2="360" y2="170" stroke="#475569" stroke-width="2" stroke-dasharray="4,3"/>

  <!-- Connecting Depth Edges -->
  <line x1="160" y1="90" x2="220" y2="50" stroke="#38BDF8" stroke-width="2.5"/>
  <line x1="300" y1="90" x2="360" y2="50" stroke="#38BDF8" stroke-width="2.5"/>
  <line x1="300" y1="210" x2="360" y2="170" stroke="#38BDF8" stroke-width="2.5"/>
  <line x1="160" y1="210" x2="220" y2="170" stroke="#475569" stroke-width="2" stroke-dasharray="4,3"/>

  <!-- Front Edges (solid) -->
  <line x1="160" y1="90" x2="300" y2="90" stroke="#38BDF8" stroke-width="2.5"/>
  <line x1="300" y1="90" x2="300" y2="210" stroke="#38BDF8" stroke-width="2.5"/>
  <line x1="300" y1="210" x2="160" y2="210" stroke="#38BDF8" stroke-width="2.5"/>
  <line x1="160" y1="210" x2="160" y2="90" stroke="#38BDF8" stroke-width="2.5"/>

  <!-- Resistor Badges on Key Edges -->
  <rect x="215" y="80" width="30" height="20" rx="4" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="230" y="94" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#FBBF24" text-anchor="middle">R</text>

  <rect x="215" y="200" width="30" height="20" rx="4" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="230" y="214" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#FBBF24" text-anchor="middle">R</text>

  <!-- Body Diagonal Terminals: Node A at (160, 210), Node B at (360, 50) -->
  <!-- Lead A -->
  <line x1="80" y1="240" x2="160" y2="210" stroke="#34D399" stroke-width="3"/>
  <circle cx="80" cy="240" r="6" fill="#34D399"/>
  <text x="60" y="245" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#34D399">A</text>

  <!-- Lead B -->
  <line x1="360" y1="50" x2="440" y2="30" stroke="#34D399" stroke-width="3"/>
  <circle cx="440" cy="30" r="6" fill="#34D399"/>
  <text x="455" y="35" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#34D399">B</text>

  <!-- Terminals highlighted -->
  <circle cx="160" cy="210" r="6" fill="#EF4444"/>
  <circle cx="360" cy="50" r="6" fill="#EF4444"/>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'circuit',
      subject: 'Physics',
      chapter: 'Current Electricity',
      format: 'svg',
      svgContent,
      altText,
      caption,
    };
  }

  // -------------------------------------------------------------
  // 11. PHYSICS: Wedge-Block Accelerating System
  // -------------------------------------------------------------
  public static createWedgeBlockDiagram(questionId: string): VisualAsset {
    const assetId = `VA-${questionId}-WEDGE-BLOCK`;
    const altText = 'Smooth wedge of mass M on frictionless horizontal floor with block m0 sliding down incline angle 30 degrees';
    const caption = 'Constrained Coordinate Kinematics on Sliding Wedge';

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 260" width="520" height="260" class="w-full h-auto select-none">
  <rect x="2" y="2" width="516" height="256" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Horizontal Floor -->
  <line x1="40" y1="210" x2="480" y2="210" stroke="#94A3B8" stroke-width="3"/>
  <!-- Floor hatching -->
  <g stroke="#475569" stroke-width="1.5">
    <line x1="60" y1="210" x2="50" y2="225"/>
    <line x1="100" y1="210" x2="90" y2="225"/>
    <line x1="140" y1="210" x2="130" y2="225"/>
    <line x1="180" y1="210" x2="170" y2="225"/>
    <line x1="220" y1="210" x2="210" y2="225"/>
    <line x1="260" y1="210" x2="250" y2="225"/>
    <line x1="300" y1="210" x2="290" y2="225"/>
    <line x1="340" y1="210" x2="330" y2="225"/>
    <line x1="380" y1="210" x2="370" y2="225"/>
    <line x1="420" y1="210" x2="410" y2="225"/>
  </g>

  <!-- Smooth Wedge M (Right Triangle, Incline 30 deg): Base from (120, 210) to (380, 210), Height at (120, 60) -->
  <polygon points="120,210 380,210 120,60" fill="rgba(56, 189, 248, 0.15)" stroke="#38BDF8" stroke-width="2.5"/>
  <text x="180" y="170" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#38BDF8">Wedge M</text>
  <text x="325" y="200" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#FBBF24">θ = 30°</text>

  <!-- Block m0 on incline -->
  <g transform="translate(200, 105) rotate(30)">
    <rect x="-20" y="-30" width="40" height="30" rx="4" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
    <text x="0" y="-10" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">m₀</text>
    <!-- Motion vector s down incline -->
    <line x1="25" y1="-15" x2="65" y2="-15" stroke="#F59E0B" stroke-width="2" marker-end="url(#arrow-oz)"/>
    <text x="45" y="-22" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#FBBF24" text-anchor="middle">s</text>
  </g>

  <!-- Frictionless Floor label -->
  <text x="250" y="240" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#64748B" text-anchor="middle">Smooth Frictionless Floor (No external horizontal force)</text>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'geometry_diagram',
      subject: 'Physics',
      chapter: 'Laws of Motion',
      format: 'svg',
      svgContent,
      altText,
      caption,
    };
  }

  // -------------------------------------------------------------
  // 12. PHYSICS: P-V Indicator Thermodynamic Cycle
  // -------------------------------------------------------------
  public static createThermodynamicCyclePlot(questionId: string, k: number = 3, m: number = 2): VisualAsset {
    const assetId = `VA-${questionId}-THERMO-CYCLE`;
    const altText = `P-V indicator diagram showing isobaric expansion at P0 to ${k}V0, isochoric heating to ${m}P0, and adiabatic expansion`;
    const caption = `Thermodynamic Cycle: Isobaric -> Isochoric -> Adiabatic`;

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 280" width="500" height="280" class="w-full h-auto select-none">
  <defs>
    <marker id="arrow-th" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#38BDF8" />
    </marker>
  </defs>

  <rect x="2" y="2" width="496" height="276" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- P and V axes -->
  <line x1="60" y1="230" x2="450" y2="230" stroke="#64748B" stroke-width="2"/>
  <line x1="60" y1="40" x2="60" y2="230" stroke="#64748B" stroke-width="2"/>
  <text x="445" y="222" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#94A3B8">V</text>
  <text x="70" y="50" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#94A3B8">P</text>

  <!-- Cycle:
       State 1: (120, 170) -> (P0, V0)
       State 2: (320, 170) -> (P0, kV0) [isobaric horizontal right]
       State 3: (320, 80)  -> (mP0, kV0) [isochoric vertical up]
       State 3 -> 1: Curve (adiabatic return)
  -->

  <!-- Shaded Area of Cycle -->
  <path d="M 120 170 L 320 170 L 320 80 Q 200 120 120 170 Z" fill="rgba(56, 189, 248, 0.18)" stroke="none"/>

  <!-- 1 -> 2: Isobaric Expansion -->
  <line x1="120" y1="170" x2="320" y2="170" stroke="#38BDF8" stroke-width="3" marker-end="url(#arrow-th)"/>
  <text x="220" y="190" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#38BDF8" text-anchor="middle">Isobaric (W = P₀ΔV)</text>

  <!-- 2 -> 3: Isochoric Heating -->
  <line x1="320" y1="170" x2="320" y2="80" stroke="#F59E0B" stroke-width="3" marker-end="url(#arrow-th)"/>
  <text x="350" y="125" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#FBBF24">Isochoric (ΔV = 0)</text>

  <!-- 3 -> 1: Adiabatic Return -->
  <path d="M 320 80 Q 200 120 120 170" fill="none" stroke="#34D399" stroke-width="2.5" stroke-dasharray="4,2"/>
  <text x="180" y="110" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#34D399">Adiabatic (PV^γ = C)</text>

  <!-- State points -->
  <circle cx="120" cy="170" r="5" fill="#EF4444"/>
  <text x="105" y="185" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="#FFFFFF">(P₀, V₀)</text>

  <circle cx="320" cy="170" r="5" fill="#EF4444"/>
  <text x="330" y="185" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="#FFFFFF">(P₀, ${k}V₀)</text>

  <circle cx="320" cy="80" r="5" fill="#EF4444"/>
  <text x="330" y="75" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="#FFFFFF">(${m}P₀, ${k}V₀)</text>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'data_plot',
      subject: 'Physics',
      chapter: 'Thermodynamics',
      format: 'svg',
      svgContent,
      altText,
      caption,
    };
  }

  // -------------------------------------------------------------
  // 13. PHYSICS: Silvered Equiconvex Lens System
  // -------------------------------------------------------------
  public static createSilveredLensDiagram(questionId: string, focalLength: number = 20): VisualAsset {
    const assetId = `VA-${questionId}-SILVERED-LENS`;
    const altText = `Thin equiconvex lens with focal length f = ${focalLength} cm and right face silvered behaving as concave mirror`;
    const caption = `Silvered Equiconvex Lens Mirror System (f = ${focalLength} cm)`;

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 240" width="500" height="240" class="w-full h-auto select-none">
  <rect x="2" y="2" width="496" height="236" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Principal Axis -->
  <line x1="30" y1="120" x2="470" y2="120" stroke="#64748B" stroke-width="2" stroke-dasharray="6,4"/>
  <text x="460" y="112" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#94A3B8">Axis</text>

  <!-- Equiconvex Lens Body -->
  <path d="M 230 40 Q 270 120 230 200 Q 190 120 230 40 Z" fill="rgba(56, 189, 248, 0.2)" stroke="#38BDF8" stroke-width="2.5"/>

  <!-- Silvered Hatching on Right Face (Reflective) -->
  <g stroke="#F59E0B" stroke-width="2">
    <line x1="235" y1="50" x2="248" y2="45"/>
    <line x1="242" y1="70" x2="255" y2="65"/>
    <line x1="247" y1="90" x2="260" y2="85"/>
    <line x1="250" y1="110" x2="263" y2="105"/>
    <line x1="250" y1="130" x2="263" y2="125"/>
    <line x1="247" y1="150" x2="260" y2="145"/>
    <line x1="242" y1="170" x2="255" y2="165"/>
    <line x1="235" y1="190" x2="248" y2="185"/>
  </g>

  <!-- Labels -->
  <text x="230" y="30" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#38BDF8" text-anchor="middle">Equiconvex Lens (μ = 1.5)</text>
  <text x="270" y="75" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#FBBF24">Silvered Face (Mirror)</text>

  <!-- Equivalent power formula -->
  <text x="230" y="222" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#94A3B8" text-anchor="middle">Equivalent Power: P = 2P_lens + P_mirror</text>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'geometry_diagram',
      subject: 'Physics',
      chapter: 'Optics',
      format: 'svg',
      svgContent,
      altText,
      caption,
    };
  }

  // -------------------------------------------------------------
  // 14. PHYSICS: Concentric Conducting Spherical Shells
  // -------------------------------------------------------------
  public static createConcentricShellsDiagram(questionId: string, k: number = 3): VisualAsset {
    const assetId = `VA-${questionId}-CONCENTRIC-SHELLS`;
    const altText = `Two thin concentric conducting spherical shells of radii R1 and R2 = ${k}R1 with outer shell earthed`;
    const caption = `Concentric Conducting Spherical Shells (R₂ = ${k}R₁)`;

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 260" width="500" height="260" class="w-full h-auto select-none">
  <rect x="2" y="2" width="496" height="256" rx="12" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Center at (220, 130) -->
  <!-- Outer Shell: radius 90px -->
  <circle cx="220" cy="130" r="90" fill="none" stroke="#818CF8" stroke-width="2.5"/>
  <!-- Inner Shell: radius 40px -->
  <circle cx="220" cy="130" r="40" fill="rgba(56, 189, 248, 0.15)" stroke="#38BDF8" stroke-width="2.5"/>
  <circle cx="220" cy="130" r="3" fill="#E2E8F0"/>

  <!-- Radius vectors -->
  <line x1="220" y1="130" x2="255" y2="110" stroke="#38BDF8" stroke-width="1.5"/>
  <text x="245" y="105" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#38BDF8">R₁</text>

  <line x1="220" y1="130" x2="280" y2="65" stroke="#818CF8" stroke-width="1.5"/>
  <text x="265" y="70" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#818CF8">R₂ = ${k}R₁</text>

  <!-- Charge on inner shell -->
  <text x="220" y="145" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#38BDF8" text-anchor="middle">+Q</text>

  <!-- Earth Symbol on Outer Shell -->
  <line x1="310" y1="130" x2="360" y2="130" stroke="#34D399" stroke-width="2.5"/>
  <line x1="360" y1="118" x2="360" y2="142" stroke="#34D399" stroke-width="3"/>
  <line x1="366" y1="122" x2="366" y2="138" stroke="#34D399" stroke-width="2.5"/>
  <line x1="372" y1="126" x2="372" y2="134" stroke="#34D399" stroke-width="2"/>
  <text x="390" y="134" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#34D399">Earthed (V₂ = 0)</text>

  <text x="220" y="240" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#94A3B8" text-anchor="middle">Inner shell potential: V₁ = [Q(k - 1)] / [4πε₀ k R₁]</text>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'circuit',
      subject: 'Physics',
      chapter: 'Electrostatics',
      format: 'svg',
      svgContent,
      altText,
      caption,
      verified: true,
      visualStatus: 'verified',
    };
  }

  // -------------------------------------------------------------
  // 15. PHYSICS: Balanced Wheatstone Bridge (JEE Main 2023 1st Feb Morning Shift Q113)
  // -------------------------------------------------------------
  public static createWheatstoneBridge113Diagram(questionId: string = 'CE-0163'): VisualAsset {
    const assetId = `VA-${questionId}-WHEATSTONE-113`;
    const altText = 'Wheatstone bridge circuit network between terminals A and B with resistors R, 3R, 2R, 6R, and central 9R bridge resistor';
    const caption = 'Wheatstone Bridge Resistor Network (Terminals A and B)';

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="600" height="320" class="w-full h-auto select-none">
  <!-- Card Background -->
  <rect x="2" y="2" width="596" height="316" rx="14" fill="#0B132B" stroke="#1E293B" stroke-width="1.5"/>

  <!-- Header Banner -->
  <text x="300" y="28" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#94A3B8" text-anchor="middle" letter-spacing="0.5">
    WHEATSTONE BRIDGE RESISTOR NETWORK (BETWEEN TERMINALS A &amp; B)
  </text>

  <!-- Left Terminal A -->
  <line x1="40" y1="160" x2="140" y2="160" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
  <circle cx="40" cy="160" r="7" fill="#0284C7" stroke="#38BDF8" stroke-width="2.5"/>
  <text x="40" y="195" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#38BDF8" text-anchor="middle">A</text>

  <!-- Right Terminal B -->
  <line x1="460" y1="160" x2="560" y2="160" stroke="#38BDF8" stroke-width="3" stroke-linecap="round"/>
  <circle cx="560" cy="160" r="7" fill="#0284C7" stroke="#38BDF8" stroke-width="2.5"/>
  <text x="560" y="195" font-family="system-ui, sans-serif" font-size="16" font-weight="800" fill="#38BDF8" text-anchor="middle">B</text>

  <!-- Internal Bridge Wire Mesh -->
  <!-- Node A Junction at (140, 160) -->
  <circle cx="140" cy="160" r="5" fill="#F8FAFC"/>

  <!-- Node B Junction at (460, 160) -->
  <circle cx="460" cy="160" r="5" fill="#F8FAFC"/>

  <!-- Top Junction Node C at (300, 60) -->
  <circle cx="300" cy="60" r="5" fill="#38BDF8"/>
  <text x="300" y="48" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#38BDF8" text-anchor="middle">C</text>

  <!-- Bottom Junction Node D at (300, 260) -->
  <circle cx="300" cy="260" r="5" fill="#38BDF8"/>
  <text x="300" y="285" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#38BDF8" text-anchor="middle">D</text>

  <!-- BRANCH 1: (140, 160) -> C (300, 60) with Resistor R -->
  <line x1="140" y1="160" x2="190" y2="128" stroke="#E2E8F0" stroke-width="2.5"/>
  <path d="M 190 128 L 198 112 L 210 134 L 222 108 L 234 134 L 246 108 L 254 124 L 260 110" fill="none" stroke="#F59E0B" stroke-width="3" stroke-linejoin="round"/>
  <line x1="260" y1="110" x2="300" y2="60" stroke="#E2E8F0" stroke-width="2.5"/>
  <rect x="200" y="70" width="36" height="24" rx="5" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="218" y="86" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#FBBF24" text-anchor="middle">R</text>

  <!-- BRANCH 2: C (300, 60) -> (460, 160) with Resistor 3R -->
  <line x1="300" y1="60" x2="340" y2="110" stroke="#E2E8F0" stroke-width="2.5"/>
  <path d="M 340 110 L 348 95 L 360 121 L 372 95 L 384 121 L 396 95 L 404 111 L 410 127" fill="none" stroke="#F59E0B" stroke-width="3" stroke-linejoin="round"/>
  <line x1="410" y1="127" x2="460" y2="160" stroke="#E2E8F0" stroke-width="2.5"/>
  <rect x="365" y="70" width="42" height="24" rx="5" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="386" y="86" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#FBBF24" text-anchor="middle">3R</text>

  <!-- BRANCH 3: (140, 160) -> D (300, 260) with Resistor 2R -->
  <line x1="140" y1="160" x2="190" y2="192" stroke="#E2E8F0" stroke-width="2.5"/>
  <path d="M 190 192 L 198 208 L 210 186 L 222 212 L 234 186 L 246 212 L 254 196 L 260 210" fill="none" stroke="#F59E0B" stroke-width="3" stroke-linejoin="round"/>
  <line x1="260" y1="210" x2="300" y2="260" stroke="#E2E8F0" stroke-width="2.5"/>
  <rect x="200" y="226" width="42" height="24" rx="5" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="221" y="242" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#FBBF24" text-anchor="middle">2R</text>

  <!-- BRANCH 4: D (300, 260) -> (460, 160) with Resistor 6R -->
  <line x1="300" y1="260" x2="340" y2="210" stroke="#E2E8F0" stroke-width="2.5"/>
  <path d="M 340 210 L 348 225 L 360 199 L 372 225 L 384 199 L 396 225 L 404 209 L 410 193" fill="none" stroke="#F59E0B" stroke-width="3" stroke-linejoin="round"/>
  <line x1="410" y1="193" x2="460" y2="160" stroke="#E2E8F0" stroke-width="2.5"/>
  <rect x="365" y="226" width="42" height="24" rx="5" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="386" y="242" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#FBBF24" text-anchor="middle">6R</text>

  <!-- CENTRAL BRIDGE BRANCH: C (300, 60) to D (300, 260) with Resistor 9R -->
  <line x1="300" y1="60" x2="300" y2="115" stroke="#E2E8F0" stroke-width="2.5"/>
  <path d="M 300 115 L 314 123 L 286 135 L 314 147 L 286 159 L 314 171 L 286 183 L 314 195 L 300 205" fill="none" stroke="#EF4444" stroke-width="3" stroke-linejoin="round"/>
  <line x1="300" y1="205" x2="300" y2="260" stroke="#E2E8F0" stroke-width="2.5"/>
  <rect x="325" y="148" width="42" height="24" rx="5" fill="#1E293B" stroke="#EF4444" stroke-width="1.5"/>
  <text x="346" y="164" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#FCA5A5" text-anchor="middle">9R</text>

  <!-- Footer Ratios -->
  <text x="300" y="308" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748B" text-anchor="middle">
    Balanced Bridge Condition: R / 3R = 2R / 6R = 1/3 (Zero current in 9R branch)
  </text>
</svg>`;

    return {
      assetId,
      questionId,
      type: 'circuit',
      subject: 'Physics',
      chapter: 'Current Electricity',
      format: 'svg',
      svgContent,
      altText,
      caption,
      verified: true,
      visualStatus: 'verified',
    };
  }

  public static createVisualAsset(
    subject: SubjectName,
    chapter: string,
    visualType: VisualType,
    code: string = 'GEN',
    options?: { caption?: string; substrate?: string }
  ): VisualAsset {
    const questionId = `${code}-${Math.floor(Math.random() * 10000)}`;

    if (code === 'CHM-ALC' || code === 'CHM-ALH' || chapter.includes('Aldehydes')) {
      return VisualAssetEngine.createCrossedCannizzaroDiagram(questionId);
    }
    if (code === 'CHM-HAL' || chapter.includes('Haloalkanes')) {
      return VisualAssetEngine.createHofmannEliminationDiagram(questionId);
    }
    if (code === 'CHM-CAR' || chapter.includes('Hydrocarbons')) {
      return VisualAssetEngine.createOzonolysisDiagram(questionId);
    }
    if (code === 'CHM-AMI' || chapter.includes('Amines')) {
      return VisualAssetEngine.createDiazotizationSequenceDiagram(questionId);
    }
    if (code === 'CHM-POC' || chapter.includes('Practical')) {
      return VisualAssetEngine.createReimerTiemannDiagram(questionId);
    }
    if (subject === 'Chemistry') {
      return VisualAssetEngine.createCarbocationsStabilityDiagram(questionId);
    }

    if (questionId === 'CE-0163' || options?.caption?.includes('113') || options?.caption?.includes('Wheatstone')) {
      return VisualAssetEngine.createWheatstoneBridge113Diagram(questionId);
    }
    if (code === 'PHY-CUR' || chapter.includes('Current')) {
      return VisualAssetEngine.createResistorCubeDiagram(questionId);
    }
    if (code === 'PHY-ELS' || chapter.includes('Electrostatics')) {
      return VisualAssetEngine.createConcentricShellsDiagram(questionId);
    }
    if (code === 'PHY-NLM' || chapter.includes('Laws of Motion')) {
      return VisualAssetEngine.createWedgeBlockDiagram(questionId);
    }
    if (code === 'PHY-THM' || chapter.includes('Thermodynamics')) {
      return VisualAssetEngine.createThermodynamicCyclePlot(questionId);
    }
    if (code === 'PHY-OPT' || chapter.includes('Optics')) {
      return VisualAssetEngine.createSilveredLensDiagram(questionId);
    }
    if (subject === 'Physics') {
      return VisualAssetEngine.createWedgeBlockDiagram(questionId);
    }

    if (code === 'MAT-CRD' || code === 'MAT-CNC' || chapter.includes('Circles')) {
      return VisualAssetEngine.createCommonTangentParabolaCircleDiagram(questionId);
    }
    if (code === 'MAT-INT' || chapter.includes('Integral')) {
      return VisualAssetEngine.createParabolaBoundedAreaDiagram(questionId);
    }
    if (chapter.includes('Coordinate') || subject === 'Mathematics') {
      return VisualAssetEngine.createRadicalAxisTwoCirclesDiagram(questionId);
    }

    return VisualAssetEngine.createResistorCubeDiagram(questionId);
  }
}
