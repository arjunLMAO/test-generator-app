import {
  ChapterInventory,
  DifficultyLevel,
  ErrorCategory,
  NormalizedQuestion,
  QuestionBankDiagnostics,
  QuestionType,
  QuestionValidationIssue,
  SubjectName,
} from '../types/jee';

export interface RawFilePayload {
  filePath: string;
  content: unknown;
  rawBaseUrl?: string;
}

export function buildQuestionContentFingerprint(
  subject: string,
  questionText: string,
  options?: [string, string, string, string]
): string {
  const cleanText = String(questionText || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9\\{}^_+-=]/g, '');
  const cleanOpts = options
    ? options
        .map((o) =>
          String(o || '')
            .toLowerCase()
            .replace(/\s+/g, '')
        )
        .join('|')
    : '';
  return `${subject.toLowerCase()}::${cleanText}::${cleanOpts}`;
}

export function buildQuestionTemplateSignature(
  subject: string,
  chapter: string,
  questionText: string
): string {
  const plain = String(questionText || '')
    .replace(/<[^>]+>/g, ' ')
    // Replace display and inline math blocks with structural token keeping only LaTeX command names
    .replace(/\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^\n$]+?\$/g, (m) => {
      const cmds = (m.match(/\\[a-zA-Z]+/g) || [])
        .filter((c) => !['\\text', '\\mathrm', '\\left', '\\right', '\\displaystyle'].includes(c))
        .slice(0, 4)
        .join('');
      return ` MATH(${cmds}) `;
    })
    .replace(/-?\d+(?:\.\d+)?/g, '#')
    .replace(/[^a-zA-Z#()]+/g, ' ')
    .trim()
    .toLowerCase();

  return `${subject.toLowerCase()}::${chapter.toLowerCase()}::${plain.slice(0, 180)}`;
}

export function classifyQuestionCategory(
  subject: SubjectName,
  chapter: string,
  topic: string,
  questionText: string,
  options?: [string, string, string, string],
  explicitCategory?: string
): string {
  if (explicitCategory && explicitCategory.trim().length > 0) {
    return `${chapter} :: ${explicitCategory.trim()}`;
  }

  const qLower = String(questionText || '')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase();
  const optsJoined = (options || []).join(' ').toLowerCase();

  const cleanTopic = (topic && topic.toLowerCase() !== 'needs review' ? topic : chapter).trim();

  // Structural JEE format archetypes
  if (qLower.includes('match list') || qLower.includes('list - i') || qLower.includes('list-i') || qLower.includes('column i')) {
    return `${chapter} :: ${cleanTopic} — Matrix & List Matching`;
  }
  if (
    (qLower.includes('assertion') && qLower.includes('reason')) ||
    (optsJoined.includes('(a)') && optsJoined.includes('(r)') && optsJoined.includes('explanation'))
  ) {
    return `${chapter} :: ${cleanTopic} — Assertion & Reason`;
  }
  if (qLower.includes('statement i') || qLower.includes('statement-i') || qLower.includes('statement 1')) {
    return `${chapter} :: ${cleanTopic} — Statement Analysis`;
  }
  if (
    qLower.includes('correct statement') ||
    qLower.includes('incorrect statement') ||
    qLower.includes('not correct') ||
    qLower.includes('how many of the following') ||
    qLower.includes('number of correct')
  ) {
    return `${chapter} :: ${cleanTopic} — Multi-Statement Verification`;
  }

  // Specific problem-type pattern keywords
  const patternChecks: Array<[RegExp, string]> = [
    [/common root|one root in common|both roots in common/i, 'Common Roots Condition'],
    [/location of root|lie in the interval|lies between the roots|greater than|less than/i, 'Location of Roots'],
    [/symmetric|alpha\^2\s*\+\s*\\beta\^2|\\alpha\^3|\bvieta/i, 'Symmetric Functions of Roots'],
    [/equation whose roots are|transformation of/i, 'Transformation of Equations'],
    [/discriminant|real and distinct|equal roots|imaginary roots|no real root/i, 'Nature of Roots & Discriminant'],
    [/maximum value|minimum value|extremum|least value|greatest value|range of/i, 'Extremum & Range Analysis'],
    [/number of real|number of integral|number of solutions|how many solutions/i, 'Number of Solutions & Counting'],
    [/domain of|range of the function|bijective|one-one|onto|inverse of/i, 'Domain, Range & Invertibility'],
    [/limit|continuous|differentiable|non-differentiable|rolle|lagrange/i, 'Continuity & Differentiability'],
    [/area bounded|area of the region|enclosed by/i, 'Area Bounded by Curves'],
    [/differential equation|integrating factor|general solution|particular solution/i, 'Differential Equation Solution'],
    [/shortest distance|skew lines|foot of perpendicular|image of the point|plane/i, '3D Line & Plane Geometry'],
    [/tangent|normal|chord of contact|director circle|focal chord|eccentricity|latus rectum/i, 'Tangent, Normal & Conic Locus'],
    [/system of linear|cramer|no solution|infinitely many solutions|nontrivial|eigen|cayley|adjoint/i, 'Matrix Algebra & Linear Systems'],
    [/variance|standard deviation|mean deviation|median/i, 'Statistical Dispersion & Moments'],
    [/bayes|conditional probability|binomial distribution|independent events/i, 'Probability & Distributions'],
    [/dimension|dimensional formula/i, 'Dimensional Formula Analysis'],
    [/percentage error|vernier|screw gauge|significant figure|least count/i, 'Precision Instruments & Error Propagation'],
    [/projectile|time of flight|horizontal range|maximum height|trajectory/i, 'Projectile & 2D Kinematics'],
    [/relative velocity|river|rain|boat|wind/i, 'Relative Motion Analysis'],
    [/pulley|atwood|tension in the string/i, 'Pulley & Constraint Mechanics'],
    [/inclined plane|friction|normal reaction|angle of repose/i, 'Friction & Inclined Dynamics'],
    [/work done|potential energy|power delivered|vertical circle|spring/i, 'Work-Energy & Conservative Forces'],
    [/moment of inertia|radius of gyration/i, 'Moment of Inertia & Theorems'],
    [/rolling without slipping|angular momentum|torque/i, 'Rotational Dynamics & Angular Momentum'],
    [/escape velocity|orbital|satellite|kepler|gravitational potential/i, 'Gravitation & Orbital Mechanics'],
    [/carnot|efficiency of|heat engine|refrigerator/i, 'Heat Engines & Carnot Cycle'],
    [/adiabatic|isothermal|polytropic|isobaric|isochoric/i, 'Thermodynamic Processes & Work'],
    [/internal energy|entropy|first law|gibbs|spontaneous/i, 'Enthalpy, Entropy & Free Energy'],
    [/hess|enthalpy of formation|enthalpy of combustion|bond dissociation|neutralization/i, 'Thermochemistry & Hess Law'],
    [/simple harmonic|time period of oscillation|phase difference|spring-block|pendulum/i, 'Simple Harmonic Oscillations'],
    [/doppler|organ pipe|standing wave|beats|wave speed/i, 'Wave Superposition & Acoustics'],
    [/young's double slit|fringe width|interference/i, 'YDSE & Wave Interference'],
    [/diffraction|polarisation|brewster|resolving power/i, 'Diffraction & Polarization'],
    [/lens|mirror|prism|refractive index|total internal reflection|magnification/i, 'Geometrical Optics'],
    [/gauss|electric flux|dipole|equipotential|electrostatic potential/i, 'Electrostatic Field & Potential'],
    [/capacitor|dielectric|equivalent capacitance|energy stored in capacitor/i, 'Capacitance & Dielectrics'],
    [/kirchhoff|wheatstone|meter bridge|potentiometer|equivalent resistance|galvanometer/i, 'Circuit Networks & Bridges'],
    [/biot-savart|ampere|solenoid|toroid/i, 'Magnetic Field Generation'],
    [/cyclotron|magnetic force|magnetic moment|moving coil/i, 'Lorentz Force & Magnetic Dipoles'],
    [/faraday|lenz|motional emf|mutual inductance|self inductance|eddy/i, 'Electromagnetic Induction'],
    [/lcr|impedance|resonance|rms current|power factor|alternating/i, 'AC Circuits & Resonance'],
    [/photoelectric|work function|stopping potential|de broglie|matter wave/i, 'Photoelectric & Matter Waves'],
    [/bohr|rydberg|spectral|ionization energy/i, 'Bohr Model & Atomic Spectra'],
    [/radial node|angular node|quantum number|electronic configuration|orbital/i, 'Quantum Numbers & Nodal Analysis'],
    [/half-life|decay constant|binding energy|nuclear/i, 'Radioactive & Nuclear Kinetics'],
    [/zener|logic gate|truth table|diode|transistor|rectifier/i, 'Semiconductors & Logic Gates'],
    [/molarity|molality|mole fraction|normality/i, 'Solution Concentration & Dilution'],
    [/limiting reagent|empirical formula|stoichiometr|yield|combustion/i, 'Stoichiometry & Limiting Reagent'],
    [/hybridization|vsepr|lone pair|geometry|shape of/i, 'VSEPR Geometry & Hybridization'],
    [/bond order|molecular orbital|paramagnetic|diamagnetic/i, 'Molecular Orbital Theory & Magnetism'],
    [/dipole moment|hydrogen bond|fajan|lattice/i, 'Polarity, Dipole & Intermolecular Forces'],
    [/raoult|vapor pressure|ideal solution|azeotrope/i, 'Raoult Law & Vapor Pressure'],
    [/colligative|osmotic pressure|freezing point|boiling point|van't hoff/i, 'Colligative Properties & Van t Hoff Factor'],
    [/equilibrium constant|le chatelier|degree of dissociation/i, 'Chemical Equilibrium & Le Chatelier'],
    [/ph of|buffer|solubility product|hydrolysis|common ion/i, 'Ionic Equilibrium, pH & Solubility'],
    [/nernst|cell potential|emf|standard reduction/i, 'Nernst Equation & Cell EMF'],
    [/faraday|electrolysis|electrochemical equivalent/i, 'Faraday Laws & Electrolysis'],
    [/molar conductivity|kohlrausch|conductance|cell constant/i, 'Electrolytic Conductance & Kohlrausch Law'],
    [/first order|zero order|rate law|order of reaction/i, 'Integrated Rate Laws & Order'],
    [/activation energy|arrhenius|rate constant|collision/i, 'Arrhenius Equation & Activation Energy'],
    [/coordination number|crystal field|cfse|isomerism in complex|ligand|synergic/i, 'Coordination Complexes & CFT'],
    [/iupac|stereoisomer|enantiomer|chiral|aromatic|carbocation|inductive|hyperconjugation/i, 'GOC, Isomerism & Electronic Effects'],
    [/ozonolysis|markovnikov|grignard|aldol|cannizzaro|haloform|sandmeyer|hoffmann|reimer|williamson/i, 'Named Organic Reactions & Mechanisms'],
  ];

  // Build a structural math + domain concept sub-key so distinct mathematical setups
  // within the same chapter topic are sub-categorized while identical problem types share a key
  const mathTokens: string[] = [];
  if (/\\int|integral/i.test(questionText)) mathTokens.push('int');
  if (/\\sum|summation|\bsigma\b/i.test(questionText)) mathTokens.push('sum');
  if (/\\lim|limit/i.test(questionText)) mathTokens.push('lim');
  if (/\\frac\{d|derivative|differenti/i.test(questionText)) mathTokens.push('deriv');
  if (/\\sqrt|surd|radical/i.test(questionText)) mathTokens.push('sqrt');
  if (/\\log|\\ln|logarithm/i.test(questionText)) mathTokens.push('log');
  if (/\\sin|\\cos|\\tan|\\cot|\\sec|\\csc/i.test(questionText)) mathTokens.push('trig');
  if (/\\vec|vector|\\hat/i.test(questionText)) mathTokens.push('vec');
  if (/\\begin\{[bpv]?matrix\}|determinant|matrix/i.test(questionText)) mathTokens.push('mat');
  if (/<table|\.tg\b/i.test(questionText)) mathTokens.push('table');
  if (/<img|\[image:/i.test(questionText)) mathTokens.push('diagram');

  const stopWords = new Set([
    'which', 'following', 'given', 'value', 'values', 'equal', 'equals', 'find', 'correct',
    'statement', 'statements', 'question', 'where', 'when', 'then', 'that', 'with', 'from',
    'have', 'will', 'what', 'respectively', 'shown', 'figure', 'below', 'above', 'option',
    'options', 'number', 'particle', 'system', 'body', 'mass', 'time', 'point', 'line',
    'function', 'equation', 'roots', 'root', 'quadratic', 'simple', 'harmonic', 'motion',
    'wave', 'waves', 'solution', 'solutions', 'reaction', 'compound', 'element', 'elements',
  ]);
  const words = qLower
    .replace(/\\[a-z]+/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 2);
  const subKey = [...mathTokens.slice(0, 2), ...words].join('_') || 'core';

  for (const [regex, catLabel] of patternChecks) {
    if (regex.test(qLower)) {
      return `${chapter} :: ${catLabel} [${subKey.slice(0, 22)}]`;
    }
  }

  return `${chapter} :: ${cleanTopic} [${subKey.slice(0, 24)}]`;
}

function normalizeSubject(raw: unknown, filePath: string): SubjectName | null {
  const str = String(raw || '').trim().toLowerCase();
  const pathLower = filePath.toLowerCase();

  if (str.includes('phys') || str === 'p' || pathLower.includes('physics') || pathLower.includes('/phy')) {
    return 'Physics';
  }
  if (str.includes('chem') || str === 'c' || pathLower.includes('chemistry') || pathLower.includes('/chm')) {
    return 'Chemistry';
  }
  if (
    str.includes('math') ||
    str === 'm' ||
    pathLower.includes('mathematics') ||
    pathLower.includes('/math') ||
    pathLower.includes('/mat')
  ) {
    return 'Mathematics';
  }
  return null;
}

function normalizeDifficulty(raw: unknown, fallbackSeedId = ''): DifficultyLevel {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'easy' || s === '1' || s === 'low' || s === 'basic') return 'easy';
  if (s === 'hard' || s === '3' || s === 'high' || s === 'advanced' || s === 'tough') return 'hard';
  if (s === 'medium' || s === '2' || s === 'moderate') return 'medium';
  // If difficulty is "Unknown" or unspecified, deterministically assign balanced difficulty from ID hash
  if (fallbackSeedId) {
    let hash = 0;
    for (let i = 0; i < fallbackSeedId.length; i++) {
      hash = (hash * 31 + fallbackSeedId.charCodeAt(i)) >>> 0;
    }
    const bucket = hash % 4;
    if (bucket === 0) return 'easy';
    if (bucket === 3) return 'hard';
  }
  return 'medium';
}

const CHAPTER_CANONICAL_MAP: Record<string, string> = {
  'units and measurements': 'Units & Measurements',
  'work, power and energy': 'Work, Energy & Power',
  'work power and energy': 'Work, Energy & Power',
  'properties of matter': 'Properties of Solids & Liquids',
  'mechanical properties of fluids': 'Properties of Solids & Liquids',
  'magnetics': 'Magnetic Effects of Current & Magnetism',
  'dual nature of radiation': 'Dual Nature of Matter & Radiation',
  'simple harmonic motion': 'Oscillations & Waves',
  'waves': 'Oscillations & Waves',
  'wave optics': 'Ray & Wave Optics',
  'ray optics': 'Ray & Wave Optics',
  'some basic concepts of chemistry': 'Mole Concept & Stoichiometry',
  'structure of atom': 'Atomic Structure',
  'chemical bonding and molecular structure': 'Chemical Bonding & Molecular Structure',
  'thermodynamics': 'Thermodynamics',
  'electrochemistry': 'Redox Reactions & Electrochemistry',
  'redox reactions': 'Redox Reactions & Electrochemistry',
  'ionic equilibrium': 'Equilibrium (Chemical & Ionic)',
  'chemical equilibrium': 'Equilibrium (Chemical & Ionic)',
  'periodic table and periodicity': 'Classification of Elements & Periodicity',
  'd and f block elements': 'd- and f-Block Elements',
  'haloalkanes and haloarenes': 'Haloalkanes & Haloarenes',
  'aldehydes ketones and carboxylic acids': 'Aldehydes, Ketones & Carboxylic Acids',
  'biomolecules': 'Amines & Biomolecules',
  'solutions': 'Solutions & Colligative Properties',
  'chemical kinetics and nuclear chemistry': 'Chemical Kinetics',
  'complex numbers 2': 'Complex Numbers',
  'quadratic equation and inequalities': 'Quadratic Equations',
  'sequences and series': 'Sequence & Series',
  'limits, continuity and differentiability': 'Limits, Continuity & Differentiability',
  'trigonometric functions and equations': 'Trigonometry',
  'sets and relations': 'Sets, Relations & Functions',
  'straight lines and pair of straight lines': 'Coordinate Geometry (Straight Lines & Circles)',
  'straight lines': 'Coordinate Geometry (Straight Lines & Circles)',
  'circles': 'Coordinate Geometry (Straight Lines & Circles)',
  'statistics': 'Statistics & Probability',
  'probability': 'Statistics & Probability',
};

function canonicalizeChapterName(rawChapter: string, subject: SubjectName): string {
  const trimmed = rawChapter.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'thermodynamics' && subject === 'Chemistry') {
    return 'Chemical Thermodynamics';
  }
  if (CHAPTER_CANONICAL_MAP[lower]) {
    return CHAPTER_CANONICAL_MAP[lower];
  }
  return trimmed;
}

function normalizeQuestionType(rawType: unknown, hasOptions: boolean, rawAnswer: unknown): QuestionType | null {
  const s = String(rawType || '').trim().toLowerCase();
  if (s === 'mcq' || s === 'single_choice' || s === 'multiple_choice' || s === 'objective' || s === 'scq') {
    return 'mcq';
  }
  if (
    s === 'integer' ||
    s === 'numerical' ||
    s === 'nat' ||
    s === 'numeric' ||
    s === 'int' ||
    s === 'subjective_integer'
  ) {
    return 'integer';
  }
  if (hasOptions) return 'mcq';
  if (rawAnswer !== undefined && rawAnswer !== null && !Number.isNaN(Number(rawAnswer))) {
    return 'integer';
  }
  return null;
}

function extractOptions(record: Record<string, any>): [string, string, string, string] | null {
  const rawOpts = record.options ?? record.choices ?? record.optionList ?? record.answers;
  if (Array.isArray(rawOpts) && rawOpts.length === 4) {
    const mapped = rawOpts.map((item) => {
      if (typeof item === 'string' || typeof item === 'number') {
        return String(item).trim();
      }
      if (item && typeof item === 'object') {
        return String(item.text ?? item.label ?? item.value ?? item.content ?? '').trim();
      }
      return '';
    });
    if (mapped.every((m) => m.length > 0)) {
      // Reject options that are purely broken scraper image placeholders with no text and no actual <img> tag
      const hasPureImagePlaceholder = mapped.some((m) => {
        if (/<img\b[^>]+src\s*=\s*["']https?:\/\//i.test(m)) {
          return false;
        }
        const withoutPlaceholder = m.replace(/\[image:\s*[^\]]+\]/gi, '').replace(/<[^>]+>/g, '').trim();
        return withoutPlaceholder.length === 0;
      });
      if (hasPureImagePlaceholder) {
        return null;
      }
      return mapped as [string, string, string, string];
    }
  } else if (rawOpts && typeof rawOpts === 'object' && !Array.isArray(rawOpts)) {
    const a = rawOpts.A ?? rawOpts.a ?? rawOpts['1'] ?? rawOpts.optionA;
    const b = rawOpts.B ?? rawOpts.b ?? rawOpts['2'] ?? rawOpts.optionB;
    const c = rawOpts.C ?? rawOpts.c ?? rawOpts['3'] ?? rawOpts.optionC;
    const d = rawOpts.D ?? rawOpts.d ?? rawOpts['4'] ?? rawOpts.optionD;
    if (a !== undefined && b !== undefined && c !== undefined && d !== undefined) {
      return [String(a).trim(), String(b).trim(), String(c).trim(), String(d).trim()];
    }
  }

  // Check top-level optionA / optionB / optionC / optionD
  const optA = record.optionA ?? record.optA ?? record.A;
  const optB = record.optionB ?? record.optB ?? record.B;
  const optC = record.optionC ?? record.optC ?? record.C;
  const optD = record.optionD ?? record.optD ?? record.D;
  if (optA !== undefined && optB !== undefined && optC !== undefined && optD !== undefined) {
    return [String(optA).trim(), String(optB).trim(), String(optC).trim(), String(optD).trim()];
  }

  return null;
}

function normalizeMcqAnswer(
  rawAns: unknown,
  options: [string, string, string, string] | null
): 'A' | 'B' | 'C' | 'D' | null {
  if (rawAns === undefined || rawAns === null) return null;
  const str = String(rawAns).trim().toUpperCase();
  if (str === 'A' || str === 'B' || str === 'C' || str === 'D') {
    return str;
  }
  if (str === '0' && typeof rawAns === 'number') return 'A';
  if (str === '1' && typeof rawAns === 'number') return 'B';
  if (str === '2' && typeof rawAns === 'number') return 'C';
  if (str === '3' && typeof rawAns === 'number') return 'D';
  if (str === 'OPTION A' || str === '(A)') return 'A';
  if (str === 'OPTION B' || str === '(B)') return 'B';
  if (str === 'OPTION C' || str === '(C)') return 'C';
  if (str === 'OPTION D' || str === '(D)') return 'D';

  // Match against option text
  if (options) {
    const idx = options.findIndex((o) => o.trim().toLowerCase() === String(rawAns).trim().toLowerCase());
    if (idx === 0) return 'A';
    if (idx === 1) return 'B';
    if (idx === 2) return 'C';
    if (idx === 3) return 'D';
  }
  return null;
}

function cleanFormulaForMatch(s: string): string {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\mathrm|\\text|\\mathbf|\\mathit/g, '')
    .replace(/\\left|\\right|\\\(|\\\)|\\\[|\\\]|\$/g, '')
    .replace(/[_^{}~]/g, '')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function inferAnswerFromExplanation(
  raw: Record<string, any>,
  options: [string, string, string, string] | null
): string | number | null {
  const exp = String(raw.explanation ?? raw.solution ?? '');
  if (!exp) return null;

  if (options && options.length === 4) {
    const expTailPlain = exp
      .slice(-500)
      .replace(/\\text\s*\{([^}]*)\}/g, '$1')
      .replace(/[{}\\]/g, ' ');
    const letterMatch = expTailPlain.match(
      /(?:option|ans(?:wer)?|correct\s+option|correct\s+answer)\s*(?:is|=|:|-)?\s*\(?([A-D1-4])\)?\b/i
    );
    if (letterMatch) {
      const tok = letterMatch[1].toUpperCase();
      if (tok === '1') return 'A';
      if (tok === '2') return 'B';
      if (tok === '3') return 'C';
      if (tok === '4') return 'D';
      return tok;
    }

    const lowerOpts = options.map((o) => String(o).replace(/<[^>]+>/g, ' ').toLowerCase());
    const lowerExp = exp.replace(/<[^>]+>/g, ' ').toLowerCase();
    if (
      lowerOpts.some(
        (o) => (o.includes('(a)') && o.includes('(r)')) || (o.includes('statement') && o.includes('true'))
      )
    ) {
      if (
        lowerExp.includes('not the correct explanation') ||
        lowerExp.includes('does not correctly explain') ||
        lowerExp.includes('not a correct explanation')
      ) {
        const idx = lowerOpts.findIndex((o) => o.includes('not') && o.includes('explanation'));
        if (idx >= 0) return ['A', 'B', 'C', 'D'][idx];
      }
      if (
        lowerExp.includes('is the correct explanation') ||
        lowerExp.includes('correctly explains') ||
        lowerExp.includes('explain assertion with the given reason')
      ) {
        const idx = lowerOpts.findIndex((o) => !o.includes('not') && o.includes('explanation'));
        if (idx >= 0) return ['A', 'B', 'C', 'D'][idx];
      }
    }

    const cleanTail = cleanFormulaForMatch(exp.slice(-350));
    const matchedIndices: number[] = [];
    for (let i = 0; i < 4; i++) {
      const co = cleanFormulaForMatch(options[i]);
      if (co.length >= 2 && cleanTail.includes(co)) {
        matchedIndices.push(i);
      }
    }
    if (matchedIndices.length === 1) {
      return ['A', 'B', 'C', 'D'][matchedIndices[0]];
    }
  } else if (!options) {
    const plainTail = exp
      .replace(/<[^>]+>/g, ' ')
      .replace(/\\\)|\\\]/g, ' ')
      .slice(-300);
    const numMatches = [
      ...plainTail.matchAll(/(?:=|is|ans(?:wer)?\s*[:=]?|equals)\s*(-?\d+(?:\.\d+)?)\b/gi),
    ];
    if (numMatches.length > 0) {
      const lastNum = Number(numMatches[numMatches.length - 1][1]);
      if (!Number.isNaN(lastNum)) return lastNum;
    }
  }

  return null;
}

function inferChapterFromFilename(filePath: string): string {
  const base = filePath.split(/[/\\]/).pop() || '';
  const withoutExt = base.replace(/\.json$/i, '');
  if (!withoutExt || withoutExt === 'questions' || withoutExt === 'index' || withoutExt === 'bank') {
    return '';
  }
  return withoutExt
    .split(/[-_]+/)
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export class QuestionBankEngine {
  private questions: NormalizedQuestion[] = [];
  private byId = new Map<string, NormalizedQuestion>();
  private bySubject = new Map<SubjectName, NormalizedQuestion[]>();
  private byChapter = new Map<string, NormalizedQuestion[]>();
  private byType = new Map<QuestionType, NormalizedQuestion[]>();
  private byDifficulty = new Map<DifficultyLevel, NormalizedQuestion[]>();
  private diagnostics: QuestionBankDiagnostics;

  constructor(files: RawFilePayload[] = []) {
    this.diagnostics = this.createEmptyDiagnostics();
    if (files.length > 0) {
      this.ingestFiles(files);
    }
  }

  private createEmptyDiagnostics(): QuestionBankDiagnostics {
    return {
      version: 'v1.0.0-empty',
      loadedAt: new Date().toISOString(),
      filesScanned: 0,
      totalRawRecords: 0,
      validQuestionsCount: 0,
      invalidQuestionsCount: 0,
      warningsCount: 0,
      bySubject: {
        Physics: { total: 0, mcq: 0, integer: 0, chaptersCount: 0 },
        Chemistry: { total: 0, mcq: 0, integer: 0, chaptersCount: 0 },
        Mathematics: { total: 0, mcq: 0, integer: 0, chaptersCount: 0 },
      },
      chapterInventories: [],
      duplicateIds: [],
      missingSolutionsCount: 0,
      brokenImagesCount: 0,
      issues: [],
    };
  }

  public ingestFiles(files: RawFilePayload[]): QuestionBankDiagnostics {
    this.questions = [];
    this.byId.clear();
    this.bySubject.clear();
    this.byChapter.clear();
    this.byType.clear();
    this.byDifficulty.clear();

    const issues: QuestionValidationIssue[] = [];
    const duplicateIds: string[] = [];
    const seenContentFingerprints = new Map<string, string>();
    let totalRawRecords = 0;
    let missingSolutionsCount = 0;
    let brokenImagesCount = 0;

    const extractRawRecords = (
      node: any,
      filePath: string,
      inheritedSubject?: string,
      inheritedChapter?: string
    ): Array<{ raw: Record<string, any>; filePath: string; inheritedSubject?: string; inheritedChapter?: string }> => {
      if (!node) return [];
      if (Array.isArray(node)) {
        return node
          .filter((item) => item && typeof item === 'object')
          .map((raw) => ({ raw, filePath, inheritedSubject, inheritedChapter }));
      }
      if (typeof node === 'object') {
        const sub = node.subject ?? node.discipline ?? inheritedSubject;
        const chap = node.chapter ?? node.chapterName ?? node.unit ?? inheritedChapter;
        const arrCandidate = node.questions ?? node.items ?? node.data ?? node.records ?? node.problems;
        if (Array.isArray(arrCandidate)) {
          return extractRawRecords(arrCandidate, filePath, sub, chap);
        }
        // Check if it's a single question object directly
        if (node.question || node.questionText || node.statement || node.prompt) {
          return [{ raw: node, filePath, inheritedSubject: sub, inheritedChapter: chap }];
        }
        // Otherwise could be a map of chapters or subjects
        const collected: Array<{
          raw: Record<string, any>;
          filePath: string;
          inheritedSubject?: string;
          inheritedChapter?: string;
        }> = [];
        for (const [key, val] of Object.entries(node)) {
          if (Array.isArray(val) || (val && typeof val === 'object')) {
            const keyAsSub = normalizeSubject(key, '');
            collected.push(
              ...extractRawRecords(
                val,
                filePath,
                keyAsSub || sub,
                keyAsSub ? chap : key
              )
            );
          }
        }
        return collected;
      }
      return [];
    };

    for (const file of files) {
      const extracted = extractRawRecords(file.content, file.filePath);
      for (let idx = 0; idx < extracted.length; idx++) {
        totalRawRecords++;
        const { raw, filePath, inheritedSubject, inheritedChapter } = extracted[idx];

        const rawId =
          raw.id ??
          raw.questionId ??
          raw.qId ??
          raw._id ??
          raw.code ??
          `${filePath.replace(/[^a-zA-Z0-9]/g, '_')}_${idx + 1}`;
        const id = String(rawId).trim();

        const subject = normalizeSubject(raw.subject ?? inheritedSubject, filePath);
        if (!subject) {
          issues.push({
            id,
            sourceFile: filePath,
            reason: 'invalid_subject',
            message: `Question "${id}" has an unrecognized or missing subject.`,
            severity: 'error',
          });
          continue;
        }

        const chapterRaw = raw.chapter ?? raw.chapterName ?? raw.unit ?? inheritedChapter ?? inferChapterFromFilename(filePath);
        const rawChapterTrimmed = String(chapterRaw || '').trim();
        if (!rawChapterTrimmed) {
          issues.push({
            id,
            sourceFile: filePath,
            reason: 'missing_chapter',
            message: `Question "${id}" is missing a chapter name.`,
            severity: 'error',
          });
          continue;
        }
        const chapter = canonicalizeChapterName(rawChapterTrimmed, subject);

        if (this.byId.has(id)) {
          duplicateIds.push(id);
          issues.push({
            id,
            sourceFile: filePath,
            reason: 'duplicate_id',
            message: `Duplicate question ID "${id}" detected in ${filePath}.`,
            severity: 'error',
          });
          continue;
        }

        const questionText = String(
          raw.question ?? raw.questionText ?? raw.statement ?? raw.prompt ?? raw.text ?? ''
        ).trim();
        if (!questionText) {
          issues.push({
            id,
            sourceFile: filePath,
            reason: 'missing_question_text',
            message: `Question "${id}" has empty question text.`,
            severity: 'error',
          });
          continue;
        }

        const options = extractOptions(raw);
        const contentFingerprint = buildQuestionContentFingerprint(
          subject,
          questionText,
          options || undefined
        );
        const existingIdForContent = seenContentFingerprints.get(contentFingerprint);
        if (existingIdForContent) {
          duplicateIds.push(id);
          issues.push({
            id,
            sourceFile: filePath,
            reason: 'duplicate_id',
            message: `Duplicate question content detected in "${id}" (identical to question "${existingIdForContent}").`,
            severity: 'error',
          });
          continue;
        }

        let rawAnswer =
          raw.correctAnswer ?? raw.answer ?? raw.ans ?? raw.correct_option ?? raw.correct ?? raw.key;
        if (rawAnswer === undefined || rawAnswer === null || String(rawAnswer).trim() === '') {
          const inferred = inferAnswerFromExplanation(raw, options);
          if (inferred !== null) {
            rawAnswer = inferred;
          }
        }
        const qType = normalizeQuestionType(raw.type ?? raw.questionType ?? raw.format, Boolean(options), rawAnswer);

        if (!qType) {
          issues.push({
            id,
            sourceFile: filePath,
            reason: 'invalid_question_type',
            message: `Question "${id}" has an invalid or unresolvable question type.`,
            severity: 'error',
          });
          continue;
        }

        let normalizedAnswer: string | number | null = null;
        if (qType === 'mcq') {
          if (!options || options.length !== 4) {
            issues.push({
              id,
              sourceFile: filePath,
              reason: 'malformed_options',
              message: `MCQ "${id}" must have exactly 4 non-empty options.`,
              severity: 'error',
            });
            continue;
          }
          const mcqAns = normalizeMcqAnswer(rawAnswer, options);
          if (!mcqAns) {
            issues.push({
              id,
              sourceFile: filePath,
              reason: 'missing_answer',
              message: `MCQ "${id}" is missing a valid correct answer (A, B, C, or D).`,
              severity: 'error',
            });
            continue;
          }
          normalizedAnswer = mcqAns;
        } else {
          // Integer / numerical type
          if (rawAnswer === undefined || rawAnswer === null || String(rawAnswer).trim() === '') {
            issues.push({
              id,
              sourceFile: filePath,
              reason: 'missing_answer',
              message: `Integer question "${id}" is missing a numeric answer.`,
              severity: 'error',
            });
            continue;
          }
          const numVal = Number(String(rawAnswer).trim());
          if (Number.isNaN(numVal)) {
            issues.push({
              id,
              sourceFile: filePath,
              reason: 'missing_answer',
              message: `Integer question "${id}" has non-numeric answer "${rawAnswer}".`,
              severity: 'error',
            });
            continue;
          }
          normalizedAnswer = numVal;
        }

        const explanationText = String(
          raw.explanation ?? raw.concept ?? raw.keyConcept ?? ''
        ).trim();
        const solutionText = String(
          raw.solution ?? raw.workedSolution ?? raw.solutionText ?? raw.derivation ?? explanationText ?? ''
        ).trim();

        if (!solutionText) {
          missingSolutionsCount++;
          issues.push({
            id,
            sourceFile: filePath,
            reason: 'missing_solution',
            message: `Question "${id}" has no worked solution; fallback explanation will be used.`,
            severity: 'warning',
          });
        }

        let imageRef: string | null = null;
        const rawImage = raw.image ?? raw.imageUrl ?? raw.diagram ?? raw.figure ?? null;
        if (rawImage && typeof rawImage === 'string' && rawImage.trim().length > 0) {
          const trimmedImg = rawImage.trim();
          if (
            trimmedImg.startsWith('data:image/') ||
            trimmedImg.startsWith('http://') ||
            trimmedImg.startsWith('https://') ||
            trimmedImg.startsWith('/') ||
            /\.(png|jpg|jpeg|webp|svg)$/i.test(trimmedImg)
          ) {
            imageRef = trimmedImg.startsWith('images/') ? `/question-bank/${trimmedImg}` : trimmedImg;
          } else {
            brokenImagesCount++;
            issues.push({
              id,
              sourceFile: filePath,
              reason: 'broken_image',
              message: `Question "${id}" has an unrecognized image reference "${trimmedImg}".`,
              severity: 'warning',
            });
          }
        }

        const difficulty = normalizeDifficulty(raw.difficulty ?? raw.level, id);
        const topic = String(raw.topic ?? raw.subtopic ?? chapter).trim();
        const tags = Array.isArray(raw.tags)
          ? raw.tags.map((t: any) => String(t))
          : [subject, chapter, topic];
        const templateSignature = buildQuestionTemplateSignature(subject, chapter, questionText);
        const category = classifyQuestionCategory(
          subject,
          chapter,
          topic,
          questionText,
          qType === 'mcq' ? (options as [string, string, string, string]) : undefined,
          raw.category
        );

        const normalizedQuestion: NormalizedQuestion = {
          id,
          subject,
          chapter,
          topic,
          difficulty,
          type: qType,
          question: questionText,
          options: qType === 'mcq' ? (options as [string, string, string, string]) : undefined,
          correctAnswer: normalizedAnswer,
          solution:
            solutionText ||
            `Correct answer is ${normalizedAnswer}. Apply core principles of ${chapter} (${topic}) to evaluate the expression.`,
          explanation:
            explanationText ||
            `Review the fundamental relations of ${topic} in ${chapter}.`,
          possibleErrorType: (raw.possibleErrorType as ErrorCategory) || 'Conceptual mistake',
          image: imageRef,
          source: String(raw.source ?? 'question_bank'),
          sourceFile: filePath,
          tags,
          rawSourceId: String(raw.id ?? id),
          category,
          templateSignature,
        };

        seenContentFingerprints.set(contentFingerprint, id);
        this.indexQuestion(normalizedQuestion);
      }
    }

    // Build diagnostics
    const chapterMap = new Map<string, ChapterInventory>();
    const subjectChaptersSet: Record<SubjectName, Set<string>> = {
      Physics: new Set(),
      Chemistry: new Set(),
      Mathematics: new Set(),
    };

    const bySubjectSummary: QuestionBankDiagnostics['bySubject'] = {
      Physics: { total: 0, mcq: 0, integer: 0, chaptersCount: 0 },
      Chemistry: { total: 0, mcq: 0, integer: 0, chaptersCount: 0 },
      Mathematics: { total: 0, mcq: 0, integer: 0, chaptersCount: 0 },
    };

    for (const q of this.questions) {
      const subSummary = bySubjectSummary[q.subject];
      subSummary.total++;
      if (q.type === 'mcq') subSummary.mcq++;
      else subSummary.integer++;
      subjectChaptersSet[q.subject].add(q.chapter);

      const chapKey = `${q.subject}::${q.chapter}`;
      let inv = chapterMap.get(chapKey);
      if (!inv) {
        inv = {
          subject: q.subject,
          chapter: q.chapter,
          totalQuestions: 0,
          mcqCount: 0,
          integerCount: 0,
          easyCount: 0,
          mediumCount: 0,
          hardCount: 0,
          topics: [],
        };
        chapterMap.set(chapKey, inv);
      }
      inv.totalQuestions++;
      if (q.type === 'mcq') inv.mcqCount++;
      else inv.integerCount++;
      if (q.difficulty === 'easy') inv.easyCount++;
      else if (q.difficulty === 'medium') inv.mediumCount++;
      else inv.hardCount++;
      if (q.topic && !inv.topics.includes(q.topic)) {
        inv.topics.push(q.topic);
      }
    }

    bySubjectSummary.Physics.chaptersCount = subjectChaptersSet.Physics.size;
    bySubjectSummary.Chemistry.chaptersCount = subjectChaptersSet.Chemistry.size;
    bySubjectSummary.Mathematics.chaptersCount = subjectChaptersSet.Mathematics.size;

    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;

    this.diagnostics = {
      version: `qb-${this.questions.length}-${files.length}f`,
      loadedAt: new Date().toISOString(),
      filesScanned: files.length,
      totalRawRecords,
      validQuestionsCount: this.questions.length,
      invalidQuestionsCount: errorCount,
      warningsCount: warningCount,
      bySubject: bySubjectSummary,
      chapterInventories: Array.from(chapterMap.values()),
      duplicateIds,
      missingSolutionsCount,
      brokenImagesCount,
      issues,
    };

    return this.diagnostics;
  }

  private indexQuestion(q: NormalizedQuestion): void {
    this.questions.push(q);
    this.byId.set(q.id, q);

    const subList = this.bySubject.get(q.subject) || [];
    subList.push(q);
    this.bySubject.set(q.subject, subList);

    const chapKey = `${q.subject}::${q.chapter}`;
    const chapList = this.byChapter.get(chapKey) || [];
    chapList.push(q);
    this.byChapter.set(chapKey, chapList);

    const typeList = this.byType.get(q.type) || [];
    typeList.push(q);
    this.byType.set(q.type, typeList);

    const diffList = this.byDifficulty.get(q.difficulty) || [];
    diffList.push(q);
    this.byDifficulty.set(q.difficulty, diffList);
  }

  public getAllQuestions(): NormalizedQuestion[] {
    return this.questions;
  }

  public getQuestionById(id: string): NormalizedQuestion | undefined {
    return this.byId.get(id);
  }

  public getQuestionsBySubject(subject: SubjectName): NormalizedQuestion[] {
    return this.bySubject.get(subject) || [];
  }

  public getQuestionsByChapter(subject: SubjectName, chapter: string): NormalizedQuestion[] {
    return this.byChapter.get(`${subject}::${chapter}`) || [];
  }

  public getQuestionsByChapters(
    chaptersBySubject: Partial<Record<SubjectName, string[]>>
  ): NormalizedQuestion[] {
    const result: NormalizedQuestion[] = [];
    const seen = new Set<string>();
    for (const [sub, chapters] of Object.entries(chaptersBySubject) as [SubjectName, string[]][]) {
      if (!chapters) continue;
      for (const chap of chapters) {
        const list = this.getQuestionsByChapter(sub, chap);
        for (const q of list) {
          if (!seen.has(q.id)) {
            seen.add(q.id);
            result.push(q);
          }
        }
      }
    }
    return result;
  }

  public getDiagnostics(): QuestionBankDiagnostics {
    return this.diagnostics;
  }
}
