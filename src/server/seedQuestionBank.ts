import fs from 'fs';
import path from 'path';
import { DifficultyLevel, ErrorCategory, SubjectName } from '../types/jee';

interface ChapterBlueprint {
  subject: SubjectName;
  chapter: string;
  slug: string;
  code: string;
  topics: string[];
  mcqTarget: number;
  intTarget: number;
  curatedMcqs: Array<{
    topic: string;
    difficulty: DifficultyLevel;
    question: string;
    options: [string, string, string, string];
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    solution: string;
    explanation: string;
    possibleErrorType: ErrorCategory;
    svgDiagram?: string;
  }>;
  curatedInts: Array<{
    topic: string;
    difficulty: DifficultyLevel;
    question: string;
    correctAnswer: number;
    solution: string;
    explanation: string;
    possibleErrorType: ErrorCategory;
  }>;
  parametricGenerator: (index: number, type: 'mcq' | 'integer') => {
    topic: string;
    difficulty: DifficultyLevel;
    question: string;
    options?: [string, string, string, string];
    correctAnswer: string | number;
    solution: string;
    explanation: string;
    possibleErrorType: ErrorCategory;
  };
}

const PROJECTILE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 180" width="420" height="180">
  <rect width="420" height="180" fill="#0B1120" rx="8"/>
  <line x1="30" y1="150" x2="390" y2="150" stroke="#475569" stroke-width="2"/>
  <line x1="40" y1="150" x2="40" y2="25" stroke="#475569" stroke-width="1.5" stroke-dasharray="4 4"/>
  <path d="M 40 150 Q 190 15 340 150" fill="none" stroke="#3B82F6" stroke-width="2.5"/>
  <line x1="40" y1="150" x2="105" y2="85" stroke="#10B981" stroke-width="2"/>
  <polygon points="105,85 95,88 102,95" fill="#10B981"/>
  <path d="M 75 150 A 35 35 0 0 0 65 125" fill="none" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="82" y="140" fill="#F59E0B" font-family="monospace" font-size="12">θ</text>
  <text x="95" y="78" fill="#10B981" font-family="monospace" font-size="12">u₀</text>
  <line x1="190" y1="82" x2="190" y2="150" stroke="#94A3B8" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="196" y="120" fill="#E2E8F0" font-family="monospace" font-size="11">H_max</text>
  <text x="330" y="168" fill="#94A3B8" font-family="monospace" font-size="11">R (Range)</text>
</svg>
`)}`;

const PULLEY_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" width="360" height="200">
  <rect width="360" height="200" fill="#0B1120" rx="8"/>
  <line x1="100" y1="20" x2="260" y2="20" stroke="#64748B" stroke-width="3"/>
  <line x1="180" y1="20" x2="180" y2="55" stroke="#94A3B8" stroke-width="2"/>
  <circle cx="180" cy="55" r="22" fill="#1E293B" stroke="#3B82F6" stroke-width="2.5"/>
  <circle cx="180" cy="55" r="4" fill="#94A3B8"/>
  <line x1="158" y1="55" x2="158" y2="135" stroke="#E2E8F0" stroke-width="2"/>
  <line x1="202" y1="55" x2="202" y2="115" stroke="#E2E8F0" stroke-width="2"/>
  <rect x="138" y="135" width="40" height="34" fill="#1E3A8A" stroke="#60A5FA" stroke-width="1.5" rx="4"/>
  <text x="150" y="156" fill="#F8FAFC" font-family="monospace" font-size="12">m₁</text>
  <rect x="182" y="115" width="40" height="42" fill="#065F46" stroke="#34D399" stroke-width="1.5" rx="4"/>
  <text x="194" y="140" fill="#F8FAFC" font-family="monospace" font-size="12">m₂</text>
</svg>
`)}`;

const CIRCUIT_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 180" width="400" height="180">
  <rect width="400" height="180" fill="#0B1120" rx="8"/>
  <rect x="60" y="40" width="280" height="100" fill="none" stroke="#94A3B8" stroke-width="2"/>
  <rect x="140" y="32" width="50" height="16" fill="#0B1120" stroke="#3B82F6" stroke-width="2"/>
  <text x="155" y="25" fill="#60A5FA" font-family="monospace" font-size="12">R₁</text>
  <line x1="255" y1="28" x2="255" y2="52" stroke="#10B981" stroke-width="2.5"/>
  <line x1="265" y1="28" x2="265" y2="52" stroke="#10B981" stroke-width="2.5"/>
  <rect x="256" y="35" width="8" height="10" fill="#0B1120"/>
  <text x="252" y="22" fill="#34D399" font-family="monospace" font-size="12">C</text>
  <line x1="190" y1="126" x2="190" y2="154" stroke="#F59E0B" stroke-width="2.5"/>
  <line x1="200" y1="133" x2="200" y2="147" stroke="#F59E0B" stroke-width="4"/>
  <rect x="191" y="135" width="8" height="10" fill="#0B1120"/>
  <text x="182" y="170" fill="#FBBF24" font-family="monospace" font-size="12">E = V₀</text>
</svg>
`)}`;

interface ChapterMeta {
  subject: SubjectName;
  chapter: string;
  code: string;
  topics: string[];
  isMinor?: boolean;
}

const ALL_55_CHAPTERS: ChapterMeta[] = [
  // PHYSICS (19 Chapters)
  { subject: 'Physics', chapter: 'Units & Measurements', code: 'PHY-UAM', topics: ['Dimensional Analysis', 'Significant Figures', 'Vernier Callipers & Screw Gauge', 'Error Propagation'] },
  { subject: 'Physics', chapter: 'Kinematics', code: 'PHY-KIN', topics: ['Projectile Motion', 'Relative Velocity', 'Non-Uniform Acceleration', 'River-Boat Problems'] },
  { subject: 'Physics', chapter: 'Laws of Motion', code: 'PHY-NLM', topics: ['Atwood Machine & Pulleys', 'Friction on Inclined Planes', 'Circular Banking', 'Pseudo Force & Wedge Constraints'] },
  { subject: 'Physics', chapter: 'Work, Energy & Power', code: 'PHY-WEP', topics: ['Work-Energy Theorem', 'Vertical Circular Motion', 'Variable Force Integration', 'Potential Energy Equilibrium'] },
  { subject: 'Physics', chapter: 'Rotational Motion', code: 'PHY-ROT', topics: ['Moment of Inertia & Parallel Axis', 'Rolling Without Slipping', 'Angular Momentum Conservation', 'Rigid Body Toppling'] },
  { subject: 'Physics', chapter: 'Gravitation', code: 'PHY-GRV', topics: ['Orbital Velocity & Satellites', 'Escape Energy', 'Gravitational Potential in Shells', 'Kepler Laws'] },
  { subject: 'Physics', chapter: 'Properties of Solids & Liquids', code: 'PHY-PSL', topics: ['Bernoulli Theorem & Efflux', 'Surface Tension & Capillary Rise', 'Terminal Velocity & Viscosity', 'Young Modulus & Elastic Energy'] },
  { subject: 'Physics', chapter: 'Thermodynamics', code: 'PHY-THM', topics: ['Polytropic Processes', 'Carnot Cycle Efficiency', 'First Law & Adiabatic Work', 'Cp - Cv Relations'] },
  { subject: 'Physics', chapter: 'Kinetic Theory of Gases', code: 'PHY-KTG', topics: ['RMS & Most Probable Speed', 'Degrees of Freedom & Equipartition', 'Mean Free Path', 'Gas Mixture Internal Energy'] },
  { subject: 'Physics', chapter: 'Oscillations & Waves', code: 'PHY-OSW', topics: ['Simple Harmonic Phase & Energy', 'Spring-Block Combinations', 'Standing Waves in Organ Pipes', 'Doppler Effect & Beats'] },
  { subject: 'Physics', chapter: 'Electrostatics', code: 'PHY-ELS', topics: ['Gauss Law & Flux', 'Electric Dipole Torque & Potential', 'Concentric Conducting Shells', 'Dielectric Capacitor Networks'] },
  { subject: 'Physics', chapter: 'Current Electricity', code: 'PHY-CUR', topics: ['Kirchhoff Laws & Nodal Analysis', 'Wheatstone & Meter Bridge', 'RC Transient Charging', 'Maximum Power Transfer'] },
  { subject: 'Physics', chapter: 'Magnetic Effects of Current & Magnetism', code: 'PHY-MAG', topics: ['Biot-Savart Law for Loops', 'Cyclotron Helical Trajectory', 'Ampere Circuital Law', 'Magnetic Dipole in Uniform Field'] },
  { subject: 'Physics', chapter: 'Electromagnetic Induction & AC', code: 'PHY-EMI', topics: ['Motional EMF on Rails', 'Self & Mutual Inductance', 'Series LCR Resonance & Q-Factor', 'Induced Electric Field in Solenoid'] },
  { subject: 'Physics', chapter: 'Electromagnetic Waves', code: 'PHY-EMW', topics: ['Poynting Vector & Intensity', 'Radiation Pressure', 'Displacement Current', 'E/B Wave Propagation'], isMinor: true },
  { subject: 'Physics', chapter: 'Ray & Wave Optics', code: 'PHY-OPT', topics: ['Lens Maker Formula & Silvered Lenses', 'Prism Minimum Deviation', 'Young Double Slit with Thin Slab', 'Single Slit Diffraction'] },
  { subject: 'Physics', chapter: 'Dual Nature of Matter & Radiation', code: 'PHY-DNM', topics: ['Photoelectric Stopping Potential', 'de Broglie Wavelength of Ions', 'Photon Momentum & Pressure', 'Work Function Graphs'] },
  { subject: 'Physics', chapter: 'Atoms & Nuclei', code: 'PHY-ATN', topics: ['Bohr Orbit Radius & Rydberg Spectra', 'Radioactive Decay & Half-Life', 'Binding Energy per Nucleon', 'Simultaneous Decay Chains'] },
  { subject: 'Physics', chapter: 'Electronic Devices', code: 'PHY-ELD', topics: ['Zener Diode Voltage Regulator', 'Logic Gates & De Morgan Truth Tables', 'PN Junction Forward/Reverse Bias', 'Half & Full Wave Rectifiers'], isMinor: true },

  // CHEMISTRY (18 Chapters)
  { subject: 'Chemistry', chapter: 'Mole Concept & Stoichiometry', code: 'CHM-MOL', topics: ['Limiting Reagent & Yield', 'Molarity & Dilution Equivalents', 'Back Titration & Oleum', 'Empirical & Vapor Density'] },
  { subject: 'Chemistry', chapter: 'Atomic Structure', code: 'CHM-ATM', topics: ['Quantum Numbers & Radial Nodes', 'Bohr Ionization Energy', 'Heisenberg Uncertainty', 'Electronic Configuration Exceptions'] },
  { subject: 'Chemistry', chapter: 'Chemical Bonding & Molecular Structure', code: 'CHM-BND', topics: ['VSEPR Geometry & Lone Pairs', 'Molecular Orbital Bond Order', 'Hybridization & Dipole Moment', 'Fajans Rule & Lattice Enthalpy'] },
  { subject: 'Chemistry', chapter: 'Chemical Thermodynamics', code: 'CHM-THD', topics: ['Gibbs Free Energy & Spontaneity', 'Hess Law & Bond Dissociation', 'Entropy in Isothermal Expansion', 'Enthalpy of Neutralization'] },
  { subject: 'Chemistry', chapter: 'Solutions & Colligative Properties', code: 'CHM-SOL', topics: ['Van t Hoff Factor & Association', 'Raoult Law & Ideal Mixtures', 'Elevation in Boiling Point', 'Osmotic Pressure of Polymers'] },
  { subject: 'Chemistry', chapter: 'Equilibrium (Chemical & Ionic)', code: 'CHM-EQL', topics: ['Kp and Kc Degree of Dissociation', 'Henderson-Hasselbalch Buffer pH', 'Solubility Product & Common Ion', 'Salt Hydrolysis Constants'] },
  { subject: 'Chemistry', chapter: 'Redox Reactions & Electrochemistry', code: 'CHM-ELC', topics: ['Nernst Equation & Concentration Cell', 'Faraday Laws of Electrolysis', 'Kohlrausch Law & Molar Conductance', 'Disproportionation Equivalents'] },
  { subject: 'Chemistry', chapter: 'Chemical Kinetics', code: 'CHM-KIN', topics: ['First Order Integrated Rate Law', 'Arrhenius Activation Energy', 'Parallel First Order Reactions', 'Order Determination from Initial Rates'] },
  { subject: 'Chemistry', chapter: 'Classification of Elements & Periodicity', code: 'CHM-PRD', topics: ['Successive Ionization Enthalpies', 'Electron Gain Enthalpy Anomalies', 'Isoelectronic Ionic Radii', 'Electronegativity & Oxide Nature'] },
  { subject: 'Chemistry', chapter: 'p-Block Elements', code: 'CHM-PBL', topics: ['Oxoacids of Phosphorus & Sulfur', 'Interhalogen Structures', 'Boranes & Banana Bonding', 'Xenon Fluorides Hydrolysis'] },
  { subject: 'Chemistry', chapter: 'd- and f-Block Elements', code: 'CHM-DFB', topics: ['Spin-Only Magnetic Moment', 'KMnO4 & K2Cr2O7 Oxidizing Actions', 'Lanthanoid Contraction Consequences', 'Color & d-d Transitions'] },
  { subject: 'Chemistry', chapter: 'Coordination Compounds', code: 'CHM-CRD', topics: ['Crystal Field Splitting Energy', 'Geometrical & Optical Isomerism', 'Werner Primary & Secondary Valency', 'Synergic Bonding in Carbonyls'] },
  { subject: 'Chemistry', chapter: 'General Organic Chemistry & Isomerism', code: 'CHM-GOC', topics: ['Carbocation & Carbanion Stability', 'Aromaticity & Huckel Rule', 'R/S Stereocenters & Enantiomers', 'Acidic & Basic Strength Order'] },
  { subject: 'Chemistry', chapter: 'Hydrocarbons', code: 'CHM-HYD', topics: ['Ozonolysis of Alkenes', 'Markovnikov & Peroxide Effect', 'Electrophilic Aromatic Substitution', 'Conformational Analysis of Butane'] },
  { subject: 'Chemistry', chapter: 'Haloalkanes & Haloarenes', code: 'CHM-HAL', topics: ['SN1 vs SN2 Stereochemistry', 'E2 Saytzeff vs Hofmann Elimination', 'Grignard Reagent Nucleophilic Attack', 'Aryl Halide Nucleophilic Substitution'] },
  { subject: 'Chemistry', chapter: 'Alcohols, Phenols & Ethers', code: 'CHM-ALC', topics: ['Reimer-Tiemann & Kolbe Reactions', 'Williamson Ether Synthesis & Cleavage', 'Pinacol-Pinacolone Rearrangement', 'Lucas & Victor Meyer Tests'] },
  { subject: 'Chemistry', chapter: 'Aldehydes, Ketones & Carboxylic Acids', code: 'CHM-ALD', topics: ['Aldol Condensation & Cannizzaro', 'Haloform & Tollens Oxidation', 'Clemmensen vs Wolff-Kishner', 'HVZ & Decarboxylation Kinetics'] },
  { subject: 'Chemistry', chapter: 'Amines & Biomolecules', code: 'CHM-AMN', topics: ['Hoffmann Bromamide Degradation', 'Diazonium Salt Coupling', 'Hinsberg Reagent Separation', 'Isoelectric Point of Amino Acids'] },

  // MATHEMATICS (18 Chapters)
  { subject: 'Mathematics', chapter: 'Sets, Relations & Functions', code: 'MAT-SRF', topics: ['Bijective & Inverse Functions', 'Equivalence Relations Counting', 'Domain & Range of Composite Functions', 'Functional Equations'] },
  { subject: 'Mathematics', chapter: 'Complex Numbers', code: 'MAT-CMP', topics: ['De Moivre Theorem & Roots of Unity', 'Argand Plane Locus & Rotation', 'Modulus Triangle Inequality', 'Euler Form & Principal Argument'] },
  { subject: 'Mathematics', chapter: 'Quadratic Equations', code: 'MAT-QUD', topics: ['Newton Sums & Symmetric Roots', 'Location of Roots on Real Axis', 'Common Roots Condition', 'Rational Algebraic Range'] },
  { subject: 'Mathematics', chapter: 'Matrices', code: 'MAT-MTX', topics: ['Cayley-Hamilton Characteristic Polynomial', 'Orthogonal & Idempotent Matrices', 'Symmetric & Skew-Symmetric Decomposition', 'Adjoint Properties'] },
  { subject: 'Mathematics', chapter: 'Determinants', code: 'MAT-DET', topics: ['Cramer Rule & System Consistency', 'Vandermonde & Cyclic Determinants', 'Determinant of Adjoint Powers', 'Differentiation of Determinants'] },
  { subject: 'Mathematics', chapter: 'Permutations & Combinations', code: 'MAT-PNC', topics: ['Derangements & Inclusion-Exclusion', 'Beggar Method & Multinomial Integral Solutions', 'Circular Permutations with Restrictions', 'Dictionary Rank & Grid Paths'] },
  { subject: 'Mathematics', chapter: 'Binomial Theorem', code: 'MAT-BIN', topics: ['Term Independent of x', 'Numerically Greatest Term', 'Binomial Coefficient Series Summation', 'Remainder Problems via Binomial'] },
  { subject: 'Mathematics', chapter: 'Sequence & Series', code: 'MAT-SNS', topics: ['Arithmetico-Geometric Progression (AGP)', 'Method of Telescoping Differences', 'AM-GM-HM Inequalities', 'Harmonic Means & Special Summations'] },
  { subject: 'Mathematics', chapter: 'Limits, Continuity & Differentiability', code: 'MAT-LCD', topics: ['L Hospital & Taylor Series Limits', '1^infinity Indeterminate Forms', 'Non-Differentiable Points with Modulus', 'Rolle & Lagrange Mean Value Theorem'] },
  { subject: 'Mathematics', chapter: 'Integral Calculus', code: 'MAT-INT', topics: ['King Property in Definite Integrals', 'Leibniz Rule for Variable Limits', 'Area Bounded by Curves', 'Reduction Formulas & Walli Integral'] },
  { subject: 'Mathematics', chapter: 'Differential Equations', code: 'MAT-DFE', topics: ['Linear Differential Equation Integrating Factor', 'Homogeneous Substitution y = vx', 'Exact Differentials Inspection', 'Orthogonal Trajectories'] },
  { subject: 'Mathematics', chapter: 'Coordinate Geometry (Straight Lines & Circles)', code: 'MAT-CRD', topics: ['Family of Circles & Radical Axis', 'Image of Point & Orthocenter', 'Director Circle & Chord of Contact', 'Orthogonal Circles Condition'] },
  { subject: 'Mathematics', chapter: 'Conic Sections (Parabola, Ellipse, Hyperbola)', code: 'MAT-CNC', topics: ['Focal Chord of Parabola', 'Eccentricity of Conjugate Hyperbola', 'Normal & Tangent Locus on Ellipse', 'Auxiliary Circle & Director Circle'] },
  { subject: 'Mathematics', chapter: 'Three-Dimensional Geometry', code: 'MAT-3DG', topics: ['Shortest Distance Between Skew Lines', 'Foot of Perpendicular on Plane/Line', 'Coplanarity of Lines', 'Direction Cosines & Projection'] },
  { subject: 'Mathematics', chapter: 'Vector Algebra', code: 'MAT-VEC', topics: ['Scalar & Vector Triple Product', 'Reciprocal System of Vectors', 'Projection & Angle Bisector Vectors', 'Lagrange Identity |a x b|^2'] },
  { subject: 'Mathematics', chapter: 'Statistics & Probability', code: 'MAT-PRB', topics: ['Bayes Theorem & Conditional Probability', 'Binomial Probability Distribution', 'Variance under Linear Transformation', 'Total Probability Theorem'] },
  { subject: 'Mathematics', chapter: 'Trigonometry', code: 'MAT-TRG', topics: ['Trigonometric Equations General Solutions', 'Principal Value of Inverse Trig', 'Conditional Identities in Triangle', 'Maximum & Minimum of a cos x + b sin x'] },
  { subject: 'Mathematics', chapter: 'Mathematical Reasoning & Linear Programming', code: 'MAT-MRL', topics: ['Tautology & Contrapositive Logic', 'Corner Point Feasible Region', 'Negation of Quantified Statements', 'Boolean Algebra Duality'], isMinor: true },
];

const ERROR_TYPES: ErrorCategory[] = [
  'Conceptual mistake',
  'Calculation mistake',
  'Formula mistake',
  'Reading mistake',
  'Sign/unit mistake',
  'Time-pressure error',
];

function makeOptionSet(
  correctText: string,
  distractors: [string, string, string],
  orderIdx: number
): { options: [string, string, string, string]; correctAnswer: 'A' | 'B' | 'C' | 'D' } {
  const pos = orderIdx % 4;
  const opts: string[] = [...distractors];
  opts.splice(pos, 0, correctText);
  const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  return {
    options: opts as [string, string, string, string],
    correctAnswer: letters[pos],
  };
}

function buildPhysicsQuestion(meta: ChapterMeta, index: number, type: 'mcq' | 'integer') {
  const topic = meta.topics[index % meta.topics.length];
  const difficulties: DifficultyLevel[] = ['easy', 'medium', 'medium', 'hard'];
  const difficulty = difficulties[index % difficulties.length];
  const errorType = ERROR_TYPES[index % ERROR_TYPES.length];
  const n = index + 1;
  const a = 2 + n;
  const b = 3 + (n % 7);

  if (type === 'mcq') {
    const categories = [
      'Conservation & Invariant Balance',
      'Instantaneous Rate & Gradient Law',
      'Boundary Ratio & Scaling Analysis',
      'Graphical Slope & Area Integration',
      'Dimensional & Exponent Homogeneity',
      'Two-Source Superposition & Phase',
      'Energy Efficiency & Dissipation',
      'Critical Threshold & Equilibrium',
      'Resonance & Extremum Condition',
      'Relative Frame & Coupling Constraint',
      'Transient Decay & Time Constant',
      'Flux, Field & Uncertainty Analysis',
    ];
    const category = categories[Math.floor(index / 2) % categories.length];

    const stems: Array<{ q: string; ans: string; d: [string, string, string]; sol: string }> = [
      {
        q: `In a ${meta.chapter} setup investigating ${topic}, an isolated system transitions from initial state parameter $p_i = ${a}$ to final configuration $p_f = ${a + b}$ while conserving the invariant $\\mathcal{E} = p_i^2 + 2p_f$. What is the conserved value of $\\mathcal{E}$ in SI units?`,
        ans: `$${a * a + 2 * (a + b)}$`,
        d: [`$${a * a + a + b}$`, `$${(a + b) * (a + b)}$`, `$${2 * a * b}$`],
        sol: `Evaluating $\\mathcal{E} = p_i^2 + 2p_f = ${a}^2 + 2(${a + b}) = ${a * a + 2 * (a + b)}$.`,
      },
      {
        q: `During an experiment on ${topic} (${meta.chapter}), two coupled components carry momenta in the ratio $1 : ${b}$. If the lighter component acquires kinetic energy $K_0 = ${a}\\text{ J}$, what is the total kinetic energy of the two-component assembly assuming identical inertia?`,
        ans: `$${a * (1 + b * b)}\\text{ J}$`,
        d: [`$${a * (1 + b)}\\text{ J}$`, `$${a * b * b}\\text{ J}$`, `$${2 * a * b}\\text{ J}$`],
        sol: `Since $K \\propto p^2$, $K_{\\text{total}} = K_0(1 + ${b}^2) = ${a * (1 + b * b)}\\text{ J}$.`,
      },
      {
        q: `For a time-dependent process in ${meta.chapter} (${topic}), the state variable evolves as $y(t) = ${a}t^2 - ${b}t$ (SI units). Find the instantaneous rate of change $\\frac{dy}{dt}$ at $t = 2\\text{ s}$.`,
        ans: `$${4 * a - b}\\text{ SI units}$`,
        d: [`$${2 * a - b}\\text{ SI units}$`, `$${4 * a + b}\\text{ SI units}$`, `$${4 * a - 2 * b}\\text{ SI units}$`],
        sol: `Differentiating $y(t)$ gives $y'(t) = 2(${a})t - ${b}$. At $t=2$, $y'(2) = ${4 * a - b}$.`,
      },
      {
        q: `In ${meta.chapter}, the potential profile along a coordinate $x$ for ${topic} is given by $U(x) = ${b}x^3 - ${6 * a}x\\text{ J}$. At what positive coordinate $x > 0$ does the restoring generalized force vanish?`,
        ans: `$\\sqrt{${(2 * a) / b}}\\text{ m}$`,
        d: [`$${(2 * a) / b}\\text{ m}$`, `$\\sqrt{${(6 * a) / b}}\\text{ m}$`, `$${a / b}\\text{ m}$`],
        sol: `Setting $-\\frac{dU}{dx} = 0 \\implies 3(${b})x^2 - ${6 * a} = 0 \\implies x = \\sqrt{${(2 * a) / b}}\\text{ m}$.`,
      },
      {
        q: `Two geometrically similar apparatus in ${meta.chapter} (${topic}) have characteristic linear dimensions in the ratio $L_2 / L_1 = ${b}$. If the response quantity scales as $R \\propto L^2$, what is the ratio $R_2 / (R_1 + R_2)$?`,
        ans: `$\\frac{${b * b}}{${1 + b * b}}$`,
        d: [`$\\frac{${b}}{${1 + b}}$`, `$\\frac{1}{${1 + b * b}}$`, `$\\frac{${b * b - 1}}{${b * b}}$`],
        sol: `Since $R_2/R_1 = ${b}^2 = ${b * b}$, the fraction is $\\frac{${b * b}}{1 + ${b * b}}$.`,
      },
      {
        q: `When the driving parameter in a ${topic} (${meta.chapter}) system is quadrupled while keeping resistance constant at $${a}$ units, by what factor does the quadratic power dissipation change?`,
        ans: `Increases by a factor of $16$`,
        d: [`Increases by a factor of $4$`, `Increases by a factor of $8$`, `Decreases by a factor of $4$`],
        sol: `Quadratic dependence on the driving parameter yields a $4^2 = 16$-fold increase.`,
      },
      {
        q: `The linear response graph of a ${meta.chapter} sensor (${topic}) increases uniformly from $0$ to $${2 * a}$ units over the interval $z \\in [0, ${b}]$. Compute the definite integral $\\int_0^{${b}} f(z)\\,dz$ represented by the area under the graph.`,
        ans: `$${a * b}$`,
        d: [`$${2 * a * b}$`, `$${(a * b) / 2}$`, `$${a + b}$`],
        sol: `Area of the right triangle under the linear curve is $\\frac{1}{2} \\times ${b} \\times ${2 * a} = ${a * b}$.`,
      },
      {
        q: `In a ${topic} experiment (${meta.chapter}), the slope of the characteristic curve at operating point $P$ is $${a}$ and the intercept on the vertical axis is $-${b}$. Find the horizontal intercept where the net output vanishes.`,
        ans: `$\\frac{${b}}{${a}}$`,
        d: [`$-\\frac{${b}}{${a}}$`, `$\\frac{${a}}{${b}}$`, `$${a * b}$`],
        sol: `From $y = ${a}x - ${b} = 0$, the horizontal intercept is $x = ${b}/${a}$.`,
      },
      {
        q: `A derived physical quantity $Z$ in ${meta.chapter} (${topic}) depends on measurable quantities $A$ and $B$ via $Z = A^{${b}} B^{-2}$. If the fractional error in $A$ is $1\\%$ and in $B$ is $${a}\\%$, what is the maximum percentage uncertainty in $Z$?`,
        ans: `$${b + 2 * a}\\%$`,
        d: [`$${b - 2 * a}\\%$`, `$${b * a}\\%$`, `$${2 * b + a}\\%$`],
        sol: `Maximum percentage error is $\\frac{\\Delta Z}{Z}\\times 100 = ${b}(1\\%) + 2(${a}\\%) = ${b + 2 * a}\\%$.`,
      },
      {
        q: `In dimensional modeling of ${topic} (${meta.chapter}), a dimensionless group is formed as $\\Pi = P^x Q^{${b}} R^{-1}$. If the exponents must satisfy the homogeneity condition $2x - ${b} + 1 = 0$, find $x$.`,
        ans: `$\\frac{${b - 1}}{2}$`,
        d: [`$\\frac{${b + 1}}{2}$`, `$${b - 1}$`, `$\\frac{1 - ${b}}{2}$`],
        sol: `Solving $2x - ${b} + 1 = 0$ directly gives $x = \\frac{${b - 1}}{2}$.`,
      },
      {
        q: `Two coherent excitations in ${meta.chapter} (${topic}) of amplitudes $A_1 = ${a}$ and $A_2 = ${b}$ superpose with a phase difference of $\\pi\\text{ rad}$. What is the ratio of maximum possible intensity to this minimum resultant intensity?`,
        ans: `$\\left(\\frac{${a + b}}{${Math.abs(a - b) || 1}}\\right)^2$`,
        d: [`$\\frac{${a + b}}{${Math.abs(a - b) || 1}}$`, `$\\frac{${a * a + b * b}}{${Math.abs(a * a - b * b) || 1}}$`, `$\\left(\\frac{${a}}{${b}}\\right)^2$`],
        sol: `$I_{\\max}/I_{\\min} = (A_1 + A_2)^2 / (A_1 - A_2)^2$.`,
      },
      {
        q: `In ${topic} (${meta.chapter}), two orthogonal field vectors have magnitudes $F_x = ${3 * b}$ and $F_y = ${4 * b}$. What is the magnitude of their resultant vector and the cosine of the angle it makes with the $x$-axis?`,
        ans: `$${5 * b},\\; \\frac{3}{5}$`,
        d: [`$${5 * b},\\; \\frac{4}{5}$`, `$${7 * b},\\; \\frac{3}{5}$`, `$${5 * b},\\; \\frac{3}{4}$`],
        sol: `Resultant magnitude $= \\sqrt{(3\\cdot ${b})^2 + (4\\cdot ${b})^2} = ${5 * b}$ and $\\cos\\theta = 3/5$.`,
      },
      {
        q: `A conversion device operating under ${meta.chapter} (${topic}) absorbs $${10 * a}\\text{ J}$ of input energy per cycle and rejects $${2 * a}\\text{ J}$ to the sink. Determine its conversion efficiency $\\eta$.`,
        ans: `$80\\%$`,
        d: [`$20\\%$`, `$75\\%$`, `$85\\%$`],
        sol: `$\\eta = \\frac{W_{\\text{out}}}{Q_{\\text{in}}} = \\frac{${10 * a} - ${2 * a}}{${10 * a}} = 0.80 = 80\\%$.`,
      },
      {
        q: `In ${topic} (${meta.chapter}), an inelastic interaction reduces the active mechanical energy of a system to $\\frac{1}{${b}}$ of its initial value $E_0 = ${a * b}\\text{ J}$. How much energy is dissipated as losses?`,
        ans: `$${a * (b - 1)}\\text{ J}$`,
        d: [`$${a}\\text{ J}$`, `$${a * b}\\text{ J}$`, `$${(a * b) / 2}\\text{ J}$`],
        sol: `Dissipated energy $\\Delta E = E_0 - E_0/${b} = ${a * b} - ${a} = ${a * (b - 1)}\\text{ J}$.`,
      },
      {
        q: `For stability in a ${meta.chapter} configuration (${topic}), the restoring parameter $k$ must exceed the critical threshold $k_c = \\frac{${a * b}}{${b}}$. If $k = ${2 * a}$, what is the stability safety margin $k - k_c$?`,
        ans: `$${a}$`,
        d: [`$${2 * a}$`, `$${a + b}$`, `$${b}$`],
        sol: `Here $k_c = ${a}$, so the stability margin is $k - k_c = ${2 * a} - ${a} = ${a}$.`,
      },
      {
        q: `Three coplanar forces in a ${meta.chapter} equilibrium setup (${topic}) maintain a particle at rest. If two mutually perpendicular forces have magnitudes $${a}\\text{ N}$ and $${b}\\text{ N}$, what must be the magnitude of the third equilibrant force?`,
        ans: `$\\sqrt{${a * a + b * b}}\\text{ N}$`,
        d: [`$${a + b}\\text{ N}$`, `$${Math.abs(a - b)}\\text{ N}$`, `$${a * b}\\text{ N}$`],
        sol: `For static equilibrium, $\\vec{F}_3 = -(\\vec{F}_1 + \\vec{F}_2)$, so $|\\vec{F}_3| = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}}\\text{ N}$.`,
      },
      {
        q: `In a ${topic} study (${meta.chapter}), the transfer function $H(\\omega) = \\frac{${a * b}}{\\omega + ${b}^2 / \\omega}$ attains its peak value at angular frequency $\\omega = \\omega_0$. Find $\\omega_0$ and $H(\\omega_0)$.`,
        ans: `$\\omega_0 = ${b},\\; H_{\\max} = \\frac{${a}}{2}$`,
        d: [`$\\omega_0 = ${b * b},\\; H_{\\max} = ${a}$`, `$\\omega_0 = ${b},\\; H_{\\max} = ${a}$`, `$\\omega_0 = \\sqrt{${b}},\\; H_{\\max} = \\frac{${a}}{2}$`],
        sol: `By AM-GM, $\\omega + ${b}^2/\\omega \\ge 2(${b})$ with equality at $\\omega_0 = ${b}$, giving $H_{\\max} = \\frac{${a * b}}{2\\cdot ${b}} = \\frac{${a}}{2}$.`,
      },
      {
        q: `For maximum power transfer in a ${meta.chapter} network (${topic}) with internal impedance $Z_s = ${a}\\,\\Omega$, what load resistance $R_L$ maximizes power delivered for source EMF $E = ${2 * a}\\text{ V}$?`,
        ans: `$R_L = ${a}\\,\\Omega,\\; P_{\\max} = ${a}\\text{ W}$`,
        d: [`$R_L = ${2 * a}\\,\\Omega,\\; P_{\\max} = ${2 * a}\\text{ W}$`, `$R_L = ${a}\\,\\Omega,\\; P_{\\max} = ${2 * a}\\text{ W}$`, `$R_L = \\frac{${a}}{2}\\,\\Omega,\\; P_{\\max} = ${a}\\text{ W}$`],
        sol: `Matching $R_L = Z_s = ${a}\\,\\Omega$ yields $P_{\\max} = \\frac{E^2}{4 R_L} = \\frac{4\\cdot ${a}^2}{4\\cdot ${a}} = ${a}\\text{ W}$.`,
      },
      {
        q: `Two observers $S_1$ and $S_2$ in a ${meta.chapter} problem (${topic}) move along the same axis with velocities $+${a}\\text{ m/s}$ and $-${b}\\text{ m/s}$ relative to the lab frame. What is the speed of $S_1$ as measured from the rest frame of $S_2$?`,
        ans: `$${a + b}\\text{ m/s}$`,
        d: [`$${Math.abs(a - b)}\\text{ m/s}$`, `$\\sqrt{${a * a + b * b}}\\text{ m/s}$`, `$\\frac{${a + b}}{2}\\text{ m/s}$`],
        sol: `Relative velocity $v_{12} = v_1 - v_2 = ${a} - (-${b}) = ${a + b}\\text{ m/s}$.`,
      },
      {
        q: `In a constrained system of ${meta.chapter} (${topic}), coordinates $x_1$ and $x_2$ satisfy the linkage relation $x_1 + ${b}x_2 = \\text{constant}$. If element $2$ accelerates at $+${a}\\text{ m/s}^2$, what is the magnitude of acceleration of element $1$?`,
        ans: `$${a * b}\\text{ m/s}^2$`,
        d: [`$\\frac{${a}}{${b}}\\text{ m/s}^2$`, `$${a + b}\\text{ m/s}^2$`, `$${a}\\text{ m/s}^2$`],
        sol: `Differentiating twice gives $a_1 + ${b}a_2 = 0 \\implies |a_1| = ${a * b}\\text{ m/s}^2$.`,
      },
      {
        q: `A relaxation process in ${meta.chapter} (${topic}) follows $N(t) = N_0 e^{-t/\\tau}$ with time constant $\\tau = ${a}\\text{ s}$. At what time $t$ does the quantity decay to $e^{-${b}}$ of its initial value $N_0$?`,
        ans: `$${a * b}\\text{ s}$`,
        d: [`$\\frac{${a}}{${b}}\\text{ s}$`, `$${a + b}\\text{ s}$`, `$${a * b * 2}\\text{ s}$`],
        sol: `Setting $e^{-t/${a}} = e^{-${b}}$ gives $t = ${a * b}\\text{ s}$.`,
      },
      {
        q: `During transient charging in ${topic} (${meta.chapter}), the state variable approaches its asymptote $Q_\\infty = ${a * b}$ units as $Q(t) = Q_\\infty(1 - e^{-t/\\tau})$. What is the initial rate of change $\\left.\\frac{dQ}{dt}\\right|_{t=0}$ if $\\tau = ${b}\\text{ s}$?`,
        ans: `$${a}\\text{ units/s}$`,
        d: [`$${a * b}\\text{ units/s}$`, `$${b}\\text{ units/s}$`, `$\\frac{${a}}{${b}}\\text{ units/s}$`],
        sol: `At $t=0$, $\\frac{dQ}{dt} = \\frac{Q_\\infty}{\\tau} = \\frac{${a * b}}{${b}} = ${a}\\text{ units/s}$.`,
      },
      {
        q: `A uniform vector field $\\vec{F} = ${a}\\hat{i} + ${b}\\hat{j}$ in ${meta.chapter} (${topic}) passes through a planar surface element of area vector $\\vec{A} = 2\\hat{i} + 3\\hat{j}$ (SI units). Compute the scalar flux $\\Phi = \\vec{F}\\cdot\\vec{A}$.`,
        ans: `$${2 * a + 3 * b}$`,
        d: [`$${3 * a + 2 * b}$`, `$${2 * a - 3 * b}$`, `$${5 * (a + b)}$`],
        sol: `Scalar dot product $\\Phi = 2(${a}) + 3(${b}) = ${2 * a + 3 * b}$.`,
      },
      {
        q: `In ${meta.chapter} (${topic}), the radial field intensity at distance $r$ from a localized source is $E(r) = \\frac{${a * b * b}}{r^2}$. Evaluate the field intensity at radial distance $r = ${b}\\text{ m}$.`,
        ans: `$${a}\\text{ SI units}$`,
        d: [`$${a * b}\\text{ SI units}$`, `$\\frac{${a}}{${b}}\\text{ SI units}$`, `$${a * b * b}\\text{ SI units}$`],
        sol: `Substituting $r = ${b}$ into $E(r) = \\frac{${a * b * b}}{r^2}$ gives $E(${b}) = ${a}$.`,
      },
    ];

    const item = stems[index % stems.length];
    const { options, correctAnswer } = makeOptionSet(item.ans, item.d, index);
    return {
      topic,
      category,
      difficulty,
      question: item.q,
      options,
      correctAnswer,
      solution: item.sol,
      explanation: `Apply the ${category.toLowerCase()} principles in ${meta.chapter} (${topic}).`,
      possibleErrorType: errorType,
      image: meta.code === 'PHY-KIN' && index === 0 ? PROJECTILE_SVG : meta.code === 'PHY-NLM' && index === 0 ? PULLEY_SVG : meta.code === 'PHY-CUR' && index === 0 ? CIRCUIT_SVG : null,
    };
  } else {
    const intCategories = [
      'Numerical Conservation Law',
      'Numerical Rate & Gradient Evaluation',
      'Numerical Ratio & Scaling Factor',
      'Numerical Work & Area Integration',
      'Numerical Extremum & Threshold',
      'Numerical Flux & Field Magnitude',
    ];
    const category = intCategories[index % intCategories.length];
    const intStems: Array<{ q: string; ans: number; sol: string }> = [
      {
        q: `In a ${meta.chapter} experiment on ${topic}, a conserved quantity is given by $I = m v^2$ with $m = ${a}$ and $v = ${b}$. Calculate the exact numerical value of $I$.`,
        ans: a * b * b,
        sol: `$I = ${a} \\times ${b}^2 = ${a * b * b}$.`,
      },
      {
        q: `For a system in ${meta.chapter} (${topic}), the coordinate varies with time as $s(t) = ${a}t^3 + ${b}t$. Find the instantaneous rate $\\frac{ds}{dt}$ at $t = 2\\text{ s}$.`,
        ans: 12 * a + b,
        sol: `$s'(t) = 3(${a})t^2 + ${b}$. At $t = 2$, $s'(2) = 12(${a}) + ${b} = ${12 * a + b}$.`,
      },
      {
        q: `Two coupled stages in ${meta.chapter} (${topic}) have gains $G_1 = ${a + 2}$ and $G_2 = ${b + 1}$. What is the combined cascade gain $G_{\\text{net}} = G_1 \\times G_2$?`,
        ans: (a + 2) * (b + 1),
        sol: `$G_{\\text{net}} = (${a + 2}) \\times (${b + 1}) = ${(a + 2) * (b + 1)}$.`,
      },
      {
        q: `A variable force $F(x) = ${2 * a}x$ acts on a body in ${meta.chapter} (${topic}) from $x = 0$ to $x = ${b}\\text{ m}$. Compute the work done $\\int_0^{${b}} F(x)\\,dx$ in Joules.`,
        ans: a * b * b,
        sol: `$W = [ ${a}x^2 ]_0^{${b}} = ${a * b * b}\\text{ J}$.`,
      },
      {
        q: `In ${meta.chapter} (${topic}), the potential energy is $U(x) = (x - ${a + b})^2 + ${3 * a}\\text{ J}$. What is the minimum possible potential energy (in J) of the system?`,
        ans: 3 * a,
        sol: `Since $(x - ${a + b})^2 \\ge 0$, the minimum potential energy is $${3 * a}\\text{ J}$.`,
      },
      {
        q: `A field $\\vec{E} = ${a}\\hat{i} + ${b}\\hat{j} + 2\\hat{k}$ crosses a surface $\\vec{S} = 3\\hat{i} + 2\\hat{j} + ${a}\\hat{k}$ in ${meta.chapter} (${topic}). Find the flux $\\vec{E}\\cdot\\vec{S}$.`,
        ans: 5 * a + 2 * b,
        sol: `$\\vec{E}\\cdot\\vec{S} = 3(${a}) + 2(${b}) + 2(${a}) = ${5 * a + 2 * b}$.`,
      },
    ];
    const item = intStems[index % intStems.length];
    return {
      topic,
      category,
      difficulty,
      question: item.q,
      correctAnswer: item.ans,
      solution: item.sol,
      explanation: `Apply ${category.toLowerCase()} in ${meta.chapter}.`,
      possibleErrorType: 'Calculation mistake' as ErrorCategory,
      image: null,
    };
  }
}

function buildChemistryQuestion(meta: ChapterMeta, index: number, type: 'mcq' | 'integer') {
  const topic = meta.topics[index % meta.topics.length];
  const difficulties: DifficultyLevel[] = ['easy', 'medium', 'medium', 'hard'];
  const difficulty = difficulties[index % difficulties.length];
  const errorType = ERROR_TYPES[(index + 1) % ERROR_TYPES.length];
  const n = index + 1;
  const a = 2 + n;
  const b = 3 + (n % 7);

  if (type === 'mcq') {
    const categories = [
      'Stoichiometric & Molar Equivalence',
      'Thermodynamic & Energetic Balance',
      'Equilibrium & Extent of Reaction',
      'Kinetic Rate & Half-Life Analysis',
      'Electronic Structure & Quantum Rules',
      'Bonding, Hybridization & Polarity',
      'Colligative & Phase Behavior',
      'Electrochemical Potential & Nernst',
      'Periodic Trends & Oxidation States',
      'Coordination & Crystal Field Theory',
      'Stereochemistry & Isomeric Counting',
      'Reaction Mechanism & Selectivity',
    ];
    const category = categories[Math.floor(index / 2) % categories.length];

    const stems: Array<{ q: string; ans: string; d: [string, string, string]; sol: string }> = [
      {
        q: `In an analysis of ${meta.chapter} (${topic}), $${a}\\text{ mmol}$ of a reactant completely reacts with excess reagent in $${b * 10}\\text{ mL}$ of solution. What is the initial molar concentration of the reactant?`,
        ans: `$${(a / (b * 10)).toFixed(3)}\\text{ M}$`,
        d: [`$${((2 * a) / (b * 10)).toFixed(3)}\\text{ M}$`, `$${(a / b).toFixed(3)}\\text{ M}$`, `$${((a + b) / 100).toFixed(3)}\\text{ M}$`],
        sol: `Molarity $M = \\frac{\\text{mmol}}{\\text{mL}} = \\frac{${a}}{${b * 10}} = ${(a / (b * 10)).toFixed(3)}\\text{ M}$.`,
      },
      {
        q: `During a titration experiment in ${meta.chapter} (${topic}), $${a}\\text{ moles}$ of a species undergo an oxidation state change of $\\Delta n = ${b}$ units per formula unit. How many Faradays of charge are equivalent to this transformation?`,
        ans: `$${a * b}\\text{ F}$`,
        d: [`$${a + b}\\text{ F}$`, `$\\frac{${a}}{${b}}\\text{ F}$`, `$${2 * a * b}\\text{ F}$`],
        sol: `Number of equivalents $= \\text{moles} \\times n\\text{-factor} = ${a} \\times ${b} = ${a * b}\\text{ F}$.`,
      },
      {
        q: `For a chemical process studied under ${meta.chapter} (${topic}), the enthalpy change is $\\Delta H^\\circ = -${a * 10}\\text{ kJ mol}^{-1}$ and $T\\Delta S^\\circ = +${b * 5}\\text{ kJ mol}^{-1}$. Calculate the standard Gibbs free energy change $\\Delta G^\\circ$.`,
        ans: `$-${a * 10 + b * 5}\\text{ kJ mol}^{-1}$`,
        d: [`$-${Math.abs(a * 10 - b * 5)}\\text{ kJ mol}^{-1}$`, `$+${a * 10 + b * 5}\\text{ kJ mol}^{-1}$`, `$+${a * 10 - b * 5}\\text{ kJ mol}^{-1}$`],
        sol: `$\\Delta G^\\circ = \\Delta H^\\circ - T\\Delta S^\\circ = -${a * 10} - ${b * 5} = -${a * 10 + b * 5}\\text{ kJ mol}^{-1}$.`,
      },
      {
        q: `Two coupled elementary steps in ${meta.chapter} (${topic}) have standard enthalpy changes $\\Delta H_1^\\circ = +${a * 4}\\text{ kJ/mol}$ and $\\Delta H_2^\\circ = -${b * 6}\\text{ kJ/mol}$. By Hess's law, what is $\\Delta H^\\circ$ for the target reaction $2\\text{ Step}_1 + \\text{Step}_2$?`,
        ans: `$${8 * a - 6 * b}\\text{ kJ/mol}$`,
        d: [`$${4 * a - 6 * b}\\text{ kJ/mol}$`, `$${8 * a + 6 * b}\\text{ kJ/mol}$`, `$${4 * a - 12 * b}\\text{ kJ/mol}$`],
        sol: `$\\Delta H^\\circ = 2(${4 * a}) + (-${6 * b}) = ${8 * a - 6 * b}\\text{ kJ/mol}$.`,
      },
      {
        q: `In a reversible system of ${meta.chapter} (${topic}), the forward and backward rate constants are $k_f = ${a * b}\\text{ s}^{-1}$ and $k_b = ${b}\\text{ s}^{-1}$. What is the equilibrium constant $K_c$ and the equilibrium ratio $[\\text{Product}]/[\\text{Reactant}]$?`,
        ans: `$${a}$`,
        d: [`$\\frac{1}{${a}}$`, `$${a * b}$`, `$${a + b}$`],
        sol: `$K_c = k_f / k_b = (${a * b}) / ${b} = ${a}$.`,
      },
      {
        q: `When $1\\text{ mole}$ of a weak electrolyte in ${meta.chapter} (${topic}) dissociates into $${b}$ ions with degree of dissociation $\\alpha = 0.5$, what is the Van't Hoff factor $i$?`,
        ans: `$${(1 + 0.5 * (b - 1)).toFixed(2)}$`,
        d: [`$${b.toFixed(2)}$`, `$${(1 + b).toFixed(2)}$`, `$${(0.5 * b).toFixed(2)}$`],
        sol: `Using $i = 1 + (n - 1)\\alpha = 1 + (${b} - 1)(0.5) = ${(1 + 0.5 * (b - 1)).toFixed(2)}$.`,
      },
      {
        q: `For a first-order transformation in ${meta.chapter} (${topic}) with rate constant $k = \\frac{\\ln 2}{${a}}\\text{ min}^{-1}$, how much time is required for the reactant concentration to drop to $\\frac{1}{2^{${b}}}$ of its initial value?`,
        ans: `$${a * b}\\text{ min}$`,
        d: [`$${a + b}\\text{ min}$`, `$\\frac{${a}}{${b}}\\text{ min}$`, `$${2 * a * b}\\text{ min}$`],
        sol: `Half-life $t_{1/2} = \\frac{\\ln 2}{k} = ${a}\\text{ min}$. For ${b} half-lives, $t = ${a * b}\\text{ min}$.`,
      },
      {
        q: `In a kinetic study of ${topic} (${meta.chapter}), tripling the concentration of reactant $X$ increases the instantaneous reaction rate by a factor of $9$. What is the order of reaction with respect to $X$?`,
        ans: `$2$`,
        d: [`$1$`, `$3$`, `$0.5$`],
        sol: `Since $3^n = 9 \\implies n = 2$ (second order in $X$).`,
      },
      {
        q: `In an atomic/molecular orbital level studied in ${meta.chapter} (${topic}) with principal quantum parameter $n = ${b + 1}$ and azimuthal parameter $l = ${b - 1}$, how many radial nodes are present in the wavefunction?`,
        ans: `$1$`,
        d: [`$0$`, `$${b}$`, `$2$`],
        sol: `Number of radial nodes $= n - l - 1 = (${b + 1}) - (${b - 1}) - 1 = 1$.`,
      },
      {
        q: `A paramagnetic species analyzed in ${meta.chapter} (${topic}) contains $n = ${b}$ unpaired electrons in its valence shell. What is its spin-only magnetic moment $\\mu_s$ in Bohr Magnetons ($\\text{BM}$)?`,
        ans: `$\\sqrt{${b * (b + 2)}}\\text{ BM}$`,
        d: [`$${b}\\text{ BM}$`, `$\\sqrt{${b * b + 1}}\\text{ BM}$`, `$${b + 2}\\text{ BM}$`],
        sol: `Spin-only magnetic moment $\\mu_s = \\sqrt{n(n+2)} = \\sqrt{${b}(${b + 2})} = \\sqrt{${b * (b + 2)}}\\text{ BM}$.`,
      },
      {
        q: `In ${meta.chapter} (${topic}), a central atom forms $\\sigma$-bonds with $${b}$ monovalent ligands and possesses $1$ lone pair of electrons. What is the steric number of the central atom?`,
        ans: `$${b + 1}$`,
        d: [`$${b}$`, `$${b - 1}$`, `$${b + 2}$`],
        sol: `Steric number $= (\\text{number of } \\sigma\\text{-bonds}) + (\\text{lone pairs}) = ${b} + 1 = ${b + 1}$.`,
      },
      {
        q: `If a diatomic molecular species in ${meta.chapter} (${topic}) has $10$ bonding electrons and $${2 * (b % 3 + 1)}$ antibonding electrons, what is its Molecular Orbital bond order?`,
        ans: `$${5 - (b % 3 + 1)}$`,
        d: [`$${5 + (b % 3 + 1)}$`, `$${(5 - (b % 3 + 1)) * 0.5}$`, `$${10 - (b % 3 + 1)}$`],
        sol: `Bond order $= \\frac{N_b - N_a}{2} = \\frac{10 - ${2 * (b % 3 + 1)}}{2} = ${5 - (b % 3 + 1)}$.`,
      },
      {
        q: `In a binary ideal solution examined in ${meta.chapter} (${topic}), pure component $A$ has vapor pressure $P_A^\\circ = ${a * 20}\\text{ Torr}$ and mole fraction $x_A = 0.5$. What is the partial vapor pressure of $A$ above the solution by Raoult's law?`,
        ans: `$${a * 10}\\text{ Torr}$`,
        d: [`$${a * 20}\\text{ Torr}$`, `$${a * 5}\\text{ Torr}$`, `$${a * 40}\\text{ Torr}$`],
        sol: `By Raoult's law, $P_A = x_A P_A^\\circ = 0.5 \\times ${a * 20} = ${a * 10}\\text{ Torr}$.`,
      },
      {
        q: `Adding a non-volatile non-electrolyte solute to a solvent in ${meta.chapter} (${topic}) produces a molality of $m = ${b}\\text{ mol kg}^{-1}$. If the ebullioscopic constant is $K_b = 0.52\\text{ K kg mol}^{-1}$, find the boiling point elevation $\\Delta T_b$.`,
        ans: `$${(0.52 * b).toFixed(2)}\\text{ K}$`,
        d: [`$${(1.04 * b).toFixed(2)}\\text{ K}$`, `$${(0.26 * b).toFixed(2)}\\text{ K}$`, `$${(b / 0.52).toFixed(2)}\\text{ K}$`],
        sol: `$\\Delta T_b = K_b \\cdot m = 0.52 \\times ${b} = ${(0.52 * b).toFixed(2)}\\text{ K}$.`,
      },
      {
        q: `In an electrochemical cell studied under ${meta.chapter} (${topic}), the standard reduction potentials of cathode and anode are $+${(a * 0.1).toFixed(2)}\\text{ V}$ and $-${(b * 0.1).toFixed(2)}\\text{ V}$ respectively. What is the standard cell EMF $E_{\\text{cell}}^\\circ$?`,
        ans: `$+${((a + b) * 0.1).toFixed(2)}\\text{ V}$`,
        d: [`$+${(Math.abs(a - b) * 0.1).toFixed(2)}\\text{ V}$`, `$-${((a + b) * 0.1).toFixed(2)}\\text{ V}$`, `$+${((a * b) * 0.1).toFixed(2)}\\text{ V}$`],
        sol: `$E_{\\text{cell}}^\\circ = E_{\\text{cathode}}^\\circ - E_{\\text{anode}}^\\circ = ${(a * 0.1).toFixed(2)} - (-${(b * 0.1).toFixed(2)}) = +${((a + b) * 0.1).toFixed(2)}\\text{ V}$.`,
      },
      {
        q: `At $298\\text{ K}$, the Nernst equation for an $n$-electron redox couple in ${meta.chapter} (${topic}) shows a slope of $-\\frac{0.059}{n}\\text{ V}$ per decade of reaction quotient $Q$. If $n = ${b}$, by how many millivolts does $E$ change when $Q$ increases by a factor of $10^{${b}}$?`,
        ans: `Decreases by $59\\text{ mV}$`,
        d: [`Increases by $59\\text{ mV}$`, `Decreases by $${59 * b}\\text{ mV}$`, `Remains unchanged`],
        sol: `$\\Delta E = -\\frac{0.059}{${b}} \\log_{10}(10^{${b}}) = -0.059\\text{ V} = -59\\text{ mV}$.`,
      },
      {
        q: `In a neutral polyatomic oxo-anion $\\text{XO}_{${b}}^{2-}$ studied in ${meta.chapter} (${topic}), oxygen exhibits its standard oxidation state of $-2$. What is the oxidation state of central element $\\text{X}$?`,
        ans: `$+${2 * b - 2}$`,
        d: [`$+${2 * b}$`, `$+${2 * b + 2}$`, `$+${b - 2}$`],
        sol: `Let oxidation state of $\\text{X}$ be $x$: $x + ${b}(-2) = -2 \\implies x = +${2 * b - 2}$.`,
      },
      {
        q: `Across a period in ${meta.chapter} (${topic}), effective nuclear charge $Z_{\\text{eff}} = Z - \\sigma$ increases by $0.65$ per unit increase in atomic number $Z$ according to Slater's rules. By how much does $Z_{\\text{eff}}$ increase across $${b}$ consecutive main-group elements in the same period?`,
        ans: `$${(0.65 * (b - 1)).toFixed(2)}$`,
        d: [`$${(0.65 * b).toFixed(2)}$`, `$${(0.35 * (b - 1)).toFixed(2)}$`, `$${(b - 1).toFixed(2)}$`],
        sol: `Across ${b} consecutive elements there are ${b - 1} steps, giving $\\Delta Z_{\\text{eff}} = 0.65 \\times ${b - 1} = ${(0.65 * (b - 1)).toFixed(2)}$.`,
      },
      {
        q: `In an octahedral coordination complex $[\\text{M}(\\text{L})_6]^{n+}$ analyzed in ${meta.chapter} (${topic}), a $d^1$ metal ion experiences crystal field splitting $\\Delta_o = ${a * 1000}\\text{ cm}^{-1}$. What is the magnitude of its Crystal Field Stabilization Energy (CFSE)?`,
        ans: `$${(0.4 * a * 1000).toFixed(0)}\\text{ cm}^{-1}$`,
        d: [`$${(0.6 * a * 1000).toFixed(0)}\\text{ cm}^{-1}$`, `$${(a * 1000).toFixed(0)}\\text{ cm}^{-1}$`, `$${(1.2 * a * 1000).toFixed(0)}\\text{ cm}^{-1}$`],
        sol: `For $t_{2g}^1 e_g^0$ in an octahedral field, $|\\text{CFSE}| = 0.4\\Delta_o = ${0.4 * a * 1000}\\text{ cm}^{-1}$.`,
      },
      {
        q: `A chelating ligand in ${meta.chapter} (${topic}) has denticity $d = ${b}$ and coordinates to a metal ion of coordination number $${2 * b}$. How many such ligand molecules are bound in the homoleptic coordination sphere?`,
        ans: `$2$`,
        d: [`$${b}$`, `$${2 * b}$`, `$3$`],
        sol: `Number of ligands $= \\frac{\\text{Coordination Number}}{\\text{Denticity}} = \\frac{${2 * b}}{${b}} = 2$.`,
      },
      {
        q: `An unsymmetrical organic molecule studied in ${meta.chapter} (${topic}) contains $n = ${b % 3 + 2}$ distinct chiral stereocenters and no internal plane or center of symmetry. What is the total number of optically active stereoisomers?`,
        ans: `$${Math.pow(2, b % 3 + 2)}$`,
        d: [`$${Math.pow(2, b % 3 + 1)}$`, `$${2 * (b % 3 + 2)}$`, `$${Math.pow(2, b % 3 + 2) - 1}$`],
        sol: `For an unsymmetrical molecule with $n = ${b % 3 + 2}$ chiral centers, total optically active isomers $= 2^n = ${Math.pow(2, b % 3 + 2)}$.`,
      },
      {
        q: `Determine the Degree of Unsaturation (Double Bond Equivalent) for a neutral hydrocarbon in ${meta.chapter} (${topic}) having molecular formula $\\text{C}_{${a}}\\text{H}_{${2 * a - 2}}$.`,
        ans: `$2$`,
        d: [`$1$`, `$3$`, `$0$`],
        sol: `$\\text{DBE} = C + 1 - \\frac{H}{2} = ${a} + 1 - \\frac{${2 * a - 2}}{2} = 2$.`,
      },
      {
        q: `In a two-step synthetic sequence in ${meta.chapter} (${topic}), Step 1 proceeds with $80\\%$ yield and Step 2 proceeds with $75\\%$ yield starting from $${a}\\text{ moles}$ of substrate. How many moles of final purified product are obtained?`,
        ans: `$${(0.6 * a).toFixed(2)}\\text{ mol}$`,
        d: [`$${(0.775 * a).toFixed(2)}\\text{ mol}$`, `$${(0.8 * a).toFixed(2)}\\text{ mol}$`, `$${(0.5 * a).toFixed(2)}\\text{ mol}$`],
        sol: `Overall yield $= 0.80 \\times 0.75 = 0.60$. Moles of product $= 0.60 \\times ${a} = ${(0.6 * a).toFixed(2)}\\text{ mol}$.`,
      },
      {
        q: `In a competing nucleophilic substitution vs elimination pathway in ${meta.chapter} (${topic}), the major product to minor product ratio is $${b} : 1$. What percentage of the total product mixture is the major regioisomer?`,
        ans: `$${((b / (b + 1)) * 100).toFixed(1)}\\%$`,
        d: [`$${((1 / (b + 1)) * 100).toFixed(1)}\\%$`, `$${((b / (b + 2)) * 100).toFixed(1)}\\%$`, `$${(100 / b).toFixed(1)}\\%$`],
        sol: `Percentage of major product $= \\frac{${b}}{${b} + 1} \\times 100\\% = ${((b / (b + 1)) * 100).toFixed(1)}\\%$.`,
      },
    ];

    const item = stems[index % stems.length];
    const { options, correctAnswer } = makeOptionSet(item.ans, item.d, index);
    return {
      topic,
      category,
      difficulty,
      question: item.q,
      options,
      correctAnswer,
      solution: item.sol,
      explanation: `Apply ${category.toLowerCase()} relations in ${meta.chapter} (${topic}).`,
      possibleErrorType: errorType,
      image: null,
    };
  } else {
    const intCategories = [
      'Numerical Stoichiometric Equivalents',
      'Numerical Enthalpy & Free Energy',
      'Numerical Quantum & Nodal Count',
      'Numerical Oxidation & Coordination Number',
      'Numerical Degree of Unsaturation',
      'Numerical Kinetics & Half-Life',
    ];
    const category = intCategories[index % intCategories.length];
    const intStems: Array<{ q: string; ans: number; sol: string }> = [
      {
        q: `For a reaction analyzed under ${meta.chapter} (${topic}), $${a}$ moles of a reagent with $n$-factor $${b}$ react completely. Find the total number of equivalents transferred.`,
        ans: a * b,
        sol: `$n_{\\text{eq}} = ${a} \\times ${b} = ${a * b}$.`,
      },
      {
        q: `In a thermochemical cycle in ${meta.chapter} (${topic}), three sequential steps have enthalpy changes $+${4 * a}\\text{ kJ}$, $-${b}\\text{ kJ}$, and $+${2 * b}\\text{ kJ}$. What is the net enthalpy change $\\Delta H_{\\text{net}}$ in kJ?`,
        ans: 4 * a + b,
        sol: `$\\Delta H_{\\text{net}} = ${4 * a} - ${b} + ${2 * b} = ${4 * a + b}\\text{ kJ}$.`,
      },
      {
        q: `What is the total number of orbitals (excluding spin degeneracy) associated with principal quantum shell $n = ${b}$ in ${meta.chapter} (${topic})?`,
        ans: b * b,
        sol: `Total orbitals in shell $n$ is $n^2 = ${b}^2 = ${b * b}$.`,
      },
      {
        q: `In a neutral coordination carbonyl $\\text{M}(\\text{CO})_{${b}}$ studied in ${meta.chapter} (${topic}), each $\\text{CO}$ ligand donates $2$ electrons. How many electrons are donated in total by all $\\text{CO}$ ligands to the central metal?`,
        ans: 2 * b,
        sol: `Total electrons donated $= 2 \\times ${b} = ${2 * b}$.`,
      },
      {
        q: `Find the Degree of Unsaturation (DBE) of an organic compound with molecular formula $\\text{C}_{${a + b}}\\text{H}_{${2 * a}}\\text{O}_2$ studied in ${meta.chapter} (${topic}).`,
        ans: b + 1,
        sol: `$\\text{DBE} = (${a + b}) + 1 - \\frac{${2 * a}}{2} = ${b + 1}$.`,
      },
      {
        q: `A zero-order catalytic reaction in ${meta.chapter} (${topic}) has rate constant $k = 2\\text{ M s}^{-1}$ and initial concentration $[A]_0 = ${4 * a}\\text{ M}$. Find its half-life $t_{1/2}$ in seconds.`,
        ans: a,
        sol: `For zero-order kinetics, $t_{1/2} = \\frac{[A]_0}{2k} = \\frac{${4 * a}}{4} = ${a}\\text{ s}$.`,
      },
    ];
    const item = intStems[index % intStems.length];
    return {
      topic,
      category,
      difficulty,
      question: item.q,
      correctAnswer: item.ans,
      solution: item.sol,
      explanation: `Apply ${category.toLowerCase()} in ${meta.chapter}.`,
      possibleErrorType: 'Conceptual mistake' as ErrorCategory,
      image: null,
    };
  }
}

function buildMathQuestion(meta: ChapterMeta, index: number, type: 'mcq' | 'integer') {
  const topic = meta.topics[index % meta.topics.length];
  const difficulties: DifficultyLevel[] = ['easy', 'medium', 'medium', 'hard'];
  const difficulty = difficulties[index % difficulties.length];
  const errorType = ERROR_TYPES[(index + 2) % ERROR_TYPES.length];
  const n = index + 1;
  const a = 2 + n;
  const b = 3 + (n % 7);

  if (type === 'mcq') {
    const categories = [
      'Symmetric Functions & Vieta Relations',
      'Discriminant & Nature of Roots',
      'Common Roots & Parameter Elimination',
      'Location of Roots on Real Axis',
      'Transformation of Equations',
      'Rational Range & Extremum Analysis',
      'Functional Equations & Composition',
      'Telescoping Series & Recurrence',
      'Differential Rate & Tangent Locus',
      'Definite Integration & Symmetry',
      'Linear Systems & Determinant Rank',
      'Combinatorial Counting & Probability',
    ];
    const category = categories[Math.floor(index / 2) % categories.length];

    const stems: Array<{ q: string; ans: string; d: [string, string, string]; sol: string }> = [
      {
        q: `In ${meta.chapter} (${topic}), if $\\alpha$ and $\\beta$ are the roots of $x^2 - ${a + b}x + ${a * b} = 0$, what is the value of $\\alpha^2 + \\beta^2$?`,
        ans: `$${a * a + b * b}$`,
        d: [`$${(a + b) * (a + b)}$`, `$${a * a + b * b - 2}$`, `$${a * a + b * b + 4}$`],
        sol: `$\\alpha + \\beta = ${a + b}$ and $\\alpha\\beta = ${a * b}$, so $\\alpha^2 + \\beta^2 = (${a + b})^2 - 2(${a * b}) = ${a * a + b * b}$.`,
      },
      {
        q: `For the polynomial equation $x^2 - ${a}x + ${b} = 0$ studied in ${meta.chapter} (${topic}) with roots $r_1, r_2$, evaluate the reciprocal sum $\\frac{1}{r_1} + \\frac{1}{r_2}$.`,
        ans: `$\\frac{${a}}{${b}}$`,
        d: [`$\\frac{${b}}{${a}}$`, `$\\frac{${a * a}}{${b}}$`, `$-\\frac{${a}}{${b}}$`],
        sol: `$\\frac{1}{r_1} + \\frac{1}{r_2} = \\frac{r_1 + r_2}{r_1 r_2} = \\frac{${a}}{${b}}$.`,
      },
      {
        q: `In ${meta.chapter} (${topic}), for what positive value of parameter $k$ does the quadratic equation $x^2 - k x + ${b * b} = 0$ possess coincident (equal) real roots?`,
        ans: `$${2 * b}$`,
        d: [`$${b}$`, `$${b * b}$`, `$${4 * b}$`],
        sol: `Setting discriminant $\\Delta = k^2 - 4(${b * b}) = 0$ for $k > 0$ gives $k = ${2 * b}$.`,
      },
      {
        q: `How many distinct real roots does the biquadratic equation $x^4 - ${a + b}x^2 + ${a * b} = 0$ analyzed in ${meta.chapter} (${topic}) possess?`,
        ans: `$4$`,
        d: [`$2$`, `$0$`, `$3$`],
        sol: `Factoring $(x^2 - ${a})(x^2 - ${b}) = 0$ with $${a} \\neq ${b} > 0$ yields $4$ distinct real roots $\\pm\\sqrt{${a}}, \\pm\\sqrt{${b}}$.`,
      },
      {
        q: `If the equations $x^2 - ${a + 1}x + ${a} = 0$ and $x^2 - ${b + 1}x + k = 0$ in ${meta.chapter} (${topic}) share the common root $x = 1$, find the value of $k$.`,
        ans: `$${b}$`,
        d: [`$${b + 1}$`, `$${a}$`, `$${a + b}$`],
        sol: `Substituting the common root $x = 1$ into the second equation gives $1 - (${b + 1}) + k = 0 \\implies k = ${b}$.`,
      },
      {
        q: `Two quadratic equations $2x^2 + ${2 * a}x + ${2 * b} = 0$ and $x^2 + p x + q = 0$ in ${meta.chapter} (${topic}) have both roots in common. Find $p + q$.`,
        ans: `$${a + b}$`,
        d: [`$${2 * (a + b)}$`, `$${a * b}$`, `$${Math.abs(a - b)}$`],
        sol: `Proportionality of coefficients $\\frac{1}{2} = \\frac{p}{${2 * a}} = \\frac{q}{${2 * b}} \\implies p = ${a},\\; q = ${b} \\implies p + q = ${a + b}$.`,
      },
      {
        q: `In ${meta.chapter} (${topic}), find the largest integral value of parameter $m$ for which the number $x = ${b}$ lies strictly between the roots of $f(x) = x^2 - ${2 * b}x + m = 0$.`,
        ans: `$${b * b - 1}$`,
        d: [`$${b * b}$`, `$${b * b + 1}$`, `$${2 * b - 1}$`],
        sol: `For $x = ${b}$ to lie strictly between the roots, $f(${b}) < 0 \\implies ${b}^2 - 2(${b}^2) + m < 0 \\implies m < ${b * b}$, so largest integer is $${b * b - 1}$.`,
      },
      {
        q: `What is the abscissa of the vertex of the parabola $y = x^2 - ${2 * a}x + ${b}$ studied in ${meta.chapter} (${topic}), where the function attains its global minimum?`,
        ans: `$x = ${a}$`,
        d: [`$x = -${a}$`, `$x = ${2 * a}$`, `$x = ${b}$`],
        sol: `Vertex abscissa $x_v = -\\frac{-${2 * a}}{2(1)} = ${a}$.`,
      },
      {
        q: `If $\\alpha, \\beta$ are the roots of $x^2 - ${a}x + ${b} = 0$ in ${meta.chapter} (${topic}), what is the monic quadratic equation whose roots are $\\alpha + 1$ and $\\beta + 1$?`,
        ans: `$x^2 - ${a + 2}x + ${a + b + 1} = 0$`,
        d: [`$x^2 - ${a}x + ${b + 1} = 0$`, `$x^2 - ${a + 1}x + ${a + b} = 0$`, `$x^2 - ${a - 2}x + ${b - a + 1} = 0$`],
        sol: `Replacing $x \\to x - 1$ gives $(x - 1)^2 - ${a}(x - 1) + ${b} = x^2 - ${a + 2}x + ${a + b + 1} = 0$.`,
      },
      {
        q: `In ${meta.chapter} (${topic}), if one root of $x^2 + p x + q = 0$ ($p, q \\in \\mathbb{Q}$) is the surd $${a} + \\sqrt{${b}}$ (where $\\sqrt{${b}} \\notin \\mathbb{Q}$), what is the rational coefficient $p$?`,
        ans: `$-${2 * a}$`,
        d: [`$+${2 * a}$`, `$${a * a - b}$`, `$-${a}$`],
        sol: `Conjugate surd roots are $${a} \\pm \\sqrt{${b}}$, so sum of roots $= -p = ${2 * a} \\implies p = -${2 * a}$.`,
      },
      {
        q: `Determine the minimum value of the quadratic expression $E(x) = x^2 - ${2 * b}x + ${b * b + a}$ over all real $x \\in \\mathbb{R}$ in ${meta.chapter} (${topic}).`,
        ans: `$${a}$`,
        d: [`$${b * b + a}$`, `$0$`, `$${b}$`],
        sol: `Completing the square gives $E(x) = (x - ${b})^2 + ${a} \\ge ${a}$.`,
      },
      {
        q: `For positive real $x > 0$ in ${meta.chapter} (${topic}), find the minimum value of the sum $S(x) = x + \\frac{${a * a}}{x}$.`,
        ans: `$${2 * a}$`,
        d: [`$${a}$`, `$${a * a}$`, `$${a + 1}$`],
        sol: `By AM-GM inequality, $x + \\frac{${a}^2}{x} \\ge 2\\sqrt{x \\cdot \\frac{${a}^2}{x}} = ${2 * a}$.`,
      },
      {
        q: `In ${meta.chapter} (${topic}), let $f(x) = ${a}x + ${b}$ and $g(x) = 2x - 1$. Evaluate the composite function $(f \\circ g)(2)$.`,
        ans: `$${3 * a + b}$`,
        d: [`$${2 * a + b - 1}$`, `$${4 * a + b}$`, `$${3 * (a + b)}$`],
        sol: `$g(2) = 3$, and $f(g(2)) = f(3) = 3(${a}) + ${b} = ${3 * a + b}$.`,
      },
      {
        q: `If a function $f$ in ${meta.chapter} (${topic}) satisfies the linear relation $f(x) + 2f(1 - x) = ${3 * a}x$ for all $x \\in \\mathbb{R}$, find $f(1)$.`,
        ans: `$-${a}$`,
        d: [`$+${a}$`, `$${2 * a}$`, `$0$`],
        sol: `At $x = 1$: $f(1) + 2f(0) = ${3 * a}$. At $x = 0$: $f(0) + 2f(1) = 0 \\implies f(0) = -2f(1)$. Thus $-3f(1) = ${3 * a} \\implies f(1) = -${a}$.`,
      },
      {
        q: `In ${meta.chapter} (${topic}), let $S_n = \\alpha^n + \\beta^n$ for roots of $x^2 - ${a}x + ${b} = 0$. Using Newton's recurrence $S_3 = ${a}S_2 - ${b}S_1$, express $S_3$ in terms of $a = ${a}$ and $b = ${b}$.`,
        ans: `$${a * (a * a - 3 * b)}$`,
        d: [`$${a * a * a - b}$`, `$${a * (a * a - 2 * b)}$`, `$${a * a - 3 * b}$`],
        sol: `$S_1 = ${a}$, $S_2 = ${a * a - 2 * b}$, so $S_3 = ${a}(${a * a - 2 * b}) - ${b}(${a}) = ${a * (a * a - 3 * b)}$.`,
      },
      {
        q: `Evaluate the telescoping finite sum $\\sum_{r=1}^{${a}} \\left(\\frac{1}{r} - \\frac{1}{r+1}\\right)$ encountered in ${meta.chapter} (${topic}).`,
        ans: `$\\frac{${a}}{${a + 1}}$`,
        d: [`$\\frac{1}{${a + 1}}$`, `$\\frac{${a - 1}}{${a}}$`, `$\\frac{${a + 1}}{${a}}$`],
        sol: `Telescoping cancellation leaves $1 - \\frac{1}{${a + 1}} = \\frac{${a}}{${a + 1}}$.`,
      },
      {
        q: `Find the slope of the tangent to the curve $y = x^3 - ${a}x^2 + ${b}$ at the point where $x = 2$ in ${meta.chapter} (${topic}).`,
        ans: `$${12 - 4 * a}$`,
        d: [`$${12 - 2 * a}$`, `$${8 - 4 * a + b}$`, `$${6 - 2 * a}$`],
        sol: `$\\frac{dy}{dx} = 3x^2 - 2(${a})x$. At $x = 2$, slope $= 12 - 4(${a}) = ${12 - 4 * a}$.`,
      },
      {
        q: `At what abscissa $x$ does the normal to the parabola $y = x^2 - ${2 * b}x$ in ${meta.chapter} (${topic}) become parallel to the $y$-axis?`,
        ans: `$x = ${b}$`,
        d: [`$x = -${b}$`, `$x = ${2 * b}$`, `$x = 0$`],
        sol: `Normal is parallel to the $y$-axis when tangent is horizontal: $y'(x) = 2x - ${2 * b} = 0 \\implies x = ${b}$.`,
      },
      {
        q: `Using the King property $\\int_0^a f(x)\\,dx = \\int_0^a f(a-x)\\,dx$ in ${meta.chapter} (${topic}), evaluate $I = \\int_0^{${2 * a}} \\frac{\\sqrt{x}}{\\sqrt{x} + \\sqrt{${2 * a} - x}}\\,dx$.`,
        ans: `$${a}$`,
        d: [`$${2 * a}$`, `$\\frac{${a}}{2}$`, `$0$`],
        sol: `Adding $I + I = \\int_0^{${2 * a}} 1\\,dx = ${2 * a} \\implies I = ${a}$.`,
      },
      {
        q: `Compute the area bounded by the line $y = ${b}x$, the $x$-axis, and the vertical ordinate $x = 2$ in ${meta.chapter} (${topic}).`,
        ans: `$${2 * b}$`,
        d: [`$${4 * b}$`, `$${b}$`, `$${b * b}$`],
        sol: `Area $= \\int_0^2 ${b}x\\,dx = \\left[ \\frac{${b}}{2}x^2 \\right]_0^2 = ${2 * b}$.`,
      },
      {
        q: `For what value of $\\lambda$ is the $2 \\times 2$ matrix $A = \\begin{pmatrix} ${a} & ${b} \\\\ 2 & \\lambda \\end{pmatrix}$ in ${meta.chapter} (${topic}) singular ($\\det A = 0$)?`,
        ans: `$\\frac{${2 * b}}{${a}}$`,
        d: [`$\\frac{${a}}{${2 * b}}$`, `$-\\frac{${2 * b}}{${a}}$`, `$${2 * a * b}$`],
        sol: `$\\det A = ${a}\\lambda - 2(${b}) = 0 \\implies \\lambda = \\frac{${2 * b}}{${a}}$.`,
      },
      {
        q: `If $A$ is a $3 \\times 3$ matrix in ${meta.chapter} (${topic}) with determinant $|A| = ${b}$, what is the determinant of its adjoint matrix $|\\text{adj}(A)|$?`,
        ans: `$${b * b}$`,
        d: [`$${b}$`, `$${b * b * b}$`, `$${3 * b}$`],
        sol: `For an $n \\times n$ matrix, $|\\text{adj}(A)| = |A|^{n-1} = ${b}^{3-1} = ${b * b}$.`,
      },
      {
        q: `In ${meta.chapter} (${topic}), how many distinct $2$-element subsets can be chosen from a finite set containing $${a + 2}$ distinct elements?`,
        ans: `$${((a + 2) * (a + 1)) / 2}$`,
        d: [`$${(a + 2) * (a + 1)}$`, `$${a * (a + 1) / 2}$`, `$${2 * (a + 2)}$`],
        sol: `$\\binom{${a + 2}}{2} = \\frac{(${a + 2})(${a + 1})}{2} = ${((a + 2) * (a + 1)) / 2}$.`,
      },
      {
        q: `Two independent events $E_1$ and $E_2$ in ${meta.chapter} (${topic}) have probabilities $P(E_1) = \\frac{1}{${b}}$ and $P(E_2) = \\frac{1}{2}$. What is the probability $P(E_1 \\cap E_2)$ that both occur?`,
        ans: `$\\frac{1}{${2 * b}}$`,
        d: [`$\\frac{${b + 2}}{${2 * b}}$`, `$\\frac{${b + 1}}{${2 * b}}$`, `$\\frac{2}{${b}}$`],
        sol: `For independent events, $P(E_1 \\cap E_2) = P(E_1)P(E_2) = \\frac{1}{${b}} \\times \\frac{1}{2} = \\frac{1}{${2 * b}}$.`,
      },
    ];

    const item = stems[index % stems.length];
    const { options, correctAnswer } = makeOptionSet(item.ans, item.d, index);
    return {
      topic,
      category,
      difficulty,
      question: item.q,
      options,
      correctAnswer,
      solution: item.sol,
      explanation: `Apply ${category.toLowerCase()} techniques in ${meta.chapter} (${topic}).`,
      possibleErrorType: errorType,
      image: null,
    };
  } else {
    const intCategories = [
      'Numerical Vieta & Root Sum',
      'Numerical Discriminant Parameter',
      'Numerical Extremum & Minimum Value',
      'Numerical Function & Composite Value',
      'Numerical Definite Integral & Area',
      'Numerical Combinatorial & Determinant Value',
    ];
    const category = intCategories[index % intCategories.length];
    const intStems: Array<{ q: string; ans: number; sol: string }> = [
      {
        q: `If $\\alpha, \\beta$ are the roots of $x^2 - ${a}x + ${b} = 0$ in ${meta.chapter} (${topic}), compute the exact integer value of $(\\alpha + \\beta)^2 - \\alpha\\beta$.`,
        ans: a * a - b,
        sol: `$(\\alpha + \\beta)^2 - \\alpha\\beta = ${a}^2 - ${b} = ${a * a - b}$.`,
      },
      {
        q: `Find the positive constant $c$ for which the quadratic $x^2 - ${2 * a}x + c = 0$ in ${meta.chapter} (${topic}) has discriminant equal to $0$.`,
        ans: a * a,
        sol: `$\\Delta = (-${2 * a})^2 - 4c = 0 \\implies c = ${a * a}$.`,
      },
      {
        q: `What is the minimum value of the polynomial $P(x) = (x - ${a})^2 + (x - ${a + 2})^2 + ${b}$ over $x \\in \\mathbb{R}$ in ${meta.chapter} (${topic})?`,
        ans: b + 2,
        sol: `Minimum occurs at midpoint $x = ${a + 1}$, giving $1^2 + (-1)^2 + ${b} = ${b + 2}$.`,
      },
      {
        q: `In ${meta.chapter} (${topic}), if $f(x) = x^2 + ${a}x + ${b}$, evaluate $f(3) - f(1)$.`,
        ans: 8 + 2 * a,
        sol: `$f(3) - f(1) = (9 + 3(${a}) + ${b}) - (1 + ${a} + ${b}) = ${8 + 2 * a}$.`,
      },
      {
        q: `Compute the definite integral $\\int_0^2 (3x^2 + ${2 * a}x + ${b})\\,dx$ in ${meta.chapter} (${topic}).`,
        ans: 8 + 4 * a + 2 * b,
        sol: `$\\left[ x^3 + ${a}x^2 + ${b}x \\right]_0^2 = 8 + 4(${a}) + 2(${b}) = ${8 + 4 * a + 2 * b}$.`,
      },
      {
        q: `Evaluate the determinant $\\begin{vmatrix} ${a} & 1 \\\\ -${b} & 2 \\end{vmatrix}$ in ${meta.chapter} (${topic}).`,
        ans: 2 * a + b,
        sol: `$2(${a}) - (1)(-${b}) = ${2 * a + b}$.`,
      },
    ];
    const item = intStems[index % intStems.length];
    return {
      topic,
      category,
      difficulty,
      question: item.q,
      correctAnswer: item.ans,
      solution: item.sol,
      explanation: `Apply ${category.toLowerCase()} in ${meta.chapter}.`,
      possibleErrorType: 'Calculation mistake' as ErrorCategory,
      image: null,
    };
  }
}

export function ensureQuestionBankSeeded(baseDir: string): void {
  const physicsDir = path.join(baseDir, 'physics');
  const chemistryDir = path.join(baseDir, 'chemistry');
  const mathDir = path.join(baseDir, 'mathematics');

  fs.mkdirSync(physicsDir, { recursive: true });
  fs.mkdirSync(chemistryDir, { recursive: true });
  fs.mkdirSync(mathDir, { recursive: true });

  // Check if already seeded with v2 categorized diverse archetypes
  const sampleCheckFile = path.join(mathDir, 'quadratic-equations.json');
  if (fs.existsSync(sampleCheckFile)) {
    try {
      const sampleParsed = JSON.parse(fs.readFileSync(sampleCheckFile, 'utf-8'));
      if (sampleParsed.schemaVersion === 'v2-categorized-diverse') {
        return;
      }
    } catch {
      // Proceed to regenerate
    }
  }

  for (const meta of ALL_55_CHAPTERS) {
    const mcqCount = meta.isMinor ? 12 : 24;
    const intCount = meta.isMinor ? 3 : 6;
    const questions: any[] = [];

    for (let i = 0; i < mcqCount; i++) {
      const qData =
        meta.subject === 'Physics'
          ? buildPhysicsQuestion(meta, i, 'mcq')
          : meta.subject === 'Chemistry'
            ? buildChemistryQuestion(meta, i, 'mcq')
            : buildMathQuestion(meta, i, 'mcq');

      questions.push({
        id: `${meta.code}-M${String(i + 1).padStart(3, '0')}`,
        subject: meta.subject,
        chapter: meta.chapter,
        topic: qData.topic,
        category: qData.category,
        difficulty: qData.difficulty,
        type: 'mcq',
        question: qData.question,
        options: qData.options,
        correctAnswer: qData.correctAnswer,
        solution: qData.solution,
        explanation: qData.explanation,
        possibleErrorType: qData.possibleErrorType,
        image: qData.image,
        source: 'question_bank',
        tags: ['JEE Main', 'JEE Advanced', meta.chapter, qData.topic, qData.category],
      });
    }

    for (let j = 0; j < intCount; j++) {
      const qData =
        meta.subject === 'Physics'
          ? buildPhysicsQuestion(meta, j, 'integer')
          : meta.subject === 'Chemistry'
            ? buildChemistryQuestion(meta, j, 'integer')
            : buildMathQuestion(meta, j, 'integer');

      questions.push({
        id: `${meta.code}-I${String(j + 1).padStart(3, '0')}`,
        subject: meta.subject,
        chapter: meta.chapter,
        topic: qData.topic,
        category: qData.category,
        difficulty: qData.difficulty,
        type: 'integer',
        question: qData.question,
        correctAnswer: qData.correctAnswer,
        solution: qData.solution,
        explanation: qData.explanation,
        possibleErrorType: qData.possibleErrorType,
        image: null,
        source: 'question_bank',
        tags: ['JEE Main', 'Numerical', meta.chapter, qData.topic, qData.category],
      });
    }

    const targetFolder =
      meta.subject === 'Physics'
        ? physicsDir
        : meta.subject === 'Chemistry'
          ? chemistryDir
          : mathDir;

    const slug = meta.chapter
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const filePath = path.join(targetFolder, `${slug}.json`);
    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          schemaVersion: 'v2-categorized-diverse',
          subject: meta.subject,
          chapter: meta.chapter,
          chapterCode: meta.code,
          questions,
        },
        null,
        2
      ),
      'utf-8'
    );
  }
}
