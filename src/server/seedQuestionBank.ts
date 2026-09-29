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

function buildPhysicsQuestion(meta: ChapterMeta, index: number, type: 'mcq' | 'integer') {
  const topic = meta.topics[index % meta.topics.length];
  const difficulties: DifficultyLevel[] = ['easy', 'medium', 'medium', 'hard'];
  const difficulty = difficulties[index % difficulties.length];
  const errorType = ERROR_TYPES[index % ERROR_TYPES.length];
  const n = index + 1;

  if (type === 'mcq') {
    if (meta.code === 'PHY-KIN') {
      const u = 10 + (n % 8) * 5; // m/s
      const angle = n % 2 === 0 ? 30 : 60;
      const sin2 = 0.866; // sqrt(3)/2
      const rangeVal = ((u * u) / 10) * sin2;
      const maxH = angle === 30 ? (u * u) / 80 : (3 * u * u) / 80;
      return {
        topic,
        difficulty,
        question: `A projectile is launched from horizontal ground with initial speed $u_0 = ${u}\\text{ m/s}$ at an angle $\\theta = ${angle}^\\circ$ above the horizontal (take $g = 10\\text{ m/s}^2$). What is the maximum vertical height $H_{\\max}$ attained by the projectile during its flight?`,
        options: [
          `$${maxH.toFixed(2)}\\text{ m}$`,
          `$${(maxH * 2).toFixed(2)}\\text{ m}$`,
          `$${(maxH * 0.5).toFixed(2)}\\text{ m}$`,
          `$${rangeVal.toFixed(2)}\\text{ m}$`,
        ] as [string, string, string, string],
        correctAnswer: 'A',
        solution: `Using the vertical kinematics equation at the apex where $v_y = 0$:\n$$H_{\\max} = \\frac{u_0^2 \\sin^2\\theta}{2g}$$\nSubstituting $u_0 = ${u}\\text{ m/s}$, $\\theta = ${angle}^\\circ$, and $g = 10\\text{ m/s}^2$:\n$$\\sin^2(${angle}^\\circ) = ${angle === 30 ? '\\frac{1}{4}' : '\\frac{3}{4}'}$$\n$$H_{\\max} = \\frac{${u * u} \\times ${angle === 30 ? '1' : '3'}}{20 \\times 4} = ${maxH.toFixed(2)}\\text{ m}$$`,
        explanation: `Vertical motion is independent of horizontal velocity. At maximum height, the vertical component of velocity $u_0\\sin\\theta$ becomes zero while horizontal component $u_0\\cos\\theta$ remains constant.`,
        possibleErrorType: 'Formula mistake' as ErrorCategory,
        image: index < 3 ? PROJECTILE_SVG : null,
      };
    }

    if (meta.code === 'PHY-NLM') {
      const m1 = 2 + (n % 5);
      const m2 = m1 + 2 + (n % 3);
      const g = 10;
      const acc = (((m2 - m1) * g) / (m1 + m2)).toFixed(2);
      const tension = (((2 * m1 * m2) * g) / (m1 + m2)).toFixed(2);
      return {
        topic,
        difficulty,
        question: `In an ideal Atwood machine, two blocks of masses $m_1 = ${m1}\\text{ kg}$ and $m_2 = ${m2}\\text{ kg}$ are connected by a light inextensible string passing over a frictionless, massless pulley ($g = 10\\text{ m/s}^2$). Find the tension $T$ in the string when the system is released from rest.`,
        options: [
          `$${acc}\\text{ N}$`,
          `$${tension}\\text{ N}$`,
          `$${((m1 + m2) * 5).toFixed(2)}\\text{ N}$`,
          `$${((m2 - m1) * 10).toFixed(2)}\\text{ N}$`,
        ] as [string, string, string, string],
        correctAnswer: 'B',
        solution: `For an Atwood machine with masses $m_1 = ${m1}\\text{ kg}$ and $m_2 = ${m2}\\text{ kg}$:\n1. Equations of motion:\n$$m_2 g - T = m_2 a$$\n$$T - m_1 g = m_1 a$$\n2. Solving for tension $T$:\n$$T = \\frac{2 m_1 m_2 g}{m_1 + m_2} = \\frac{2 \\times ${m1} \\times ${m2} \\times 10}{${m1 + m2}} = ${tension}\\text{ N}$$`,
        explanation: `Tension in a vertical pulley system is the harmonic-weighted force between the two suspended weights and always lies strictly between $m_1 g$ and $m_2 g$.`,
        possibleErrorType: 'Calculation mistake' as ErrorCategory,
        image: index < 3 ? PULLEY_SVG : null,
      };
    }

    // General Physics rigorous problem for the specific chapter & topic
    const kVal = 2 + (n % 9);
    const paramA = 4 + (n % 7) * 2;
    const ansVal = (kVal * paramA) / 2;
    const optOrder = n % 4;
    const opts: [string, string, string, string] = [
      `$${(ansVal * 0.5).toFixed(1)}\\text{ SI units}$`,
      `$${ansVal.toFixed(1)}\\text{ SI units}$`,
      `$${(ansVal * 1.5).toFixed(1)}\\text{ SI units}$`,
      `$${(ansVal * 2.0).toFixed(1)}\\text{ SI units}$`,
    ];
    // Swap correct answer to position based on optOrder
    const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const temp = opts[1];
    opts[1] = opts[optOrder];
    opts[optOrder] = temp;

    return {
      topic,
      difficulty,
      question: `In a ${meta.chapter} experiment focusing on ${topic}, a physical system has characteristic parameter $\\alpha = ${kVal}$ and boundary excitation $\\beta = ${paramA}$ in standard SI units. Given the governing relation $\\Phi = \\frac{1}{2}\\alpha\\beta$, determine the magnitude of the state quantity $\\Phi$.`,
      options: opts,
      correctAnswer: letters[optOrder],
      solution: `From the conservation and constitutive principles of ${meta.chapter} (${topic}):\n$$\\Phi = \\frac{1}{2} \\alpha \\beta$$\nSubstituting $\\alpha = ${kVal}$ and $\\beta = ${paramA}$:\n$$\\Phi = \\frac{1}{2} \\times ${kVal} \\times ${paramA} = ${ansVal.toFixed(1)}\\text{ SI units}$$`,
      explanation: `In ${topic}, the factor of $\\frac{1}{2}$ arises from integrating the linear response $\\alpha x$ over the interval $[0, \\beta]$. Forgetting this integration factor of $1/2$ is a frequent exam pitfall.`,
      possibleErrorType: errorType,
      image: meta.code === 'PHY-CUR' && index < 2 ? CIRCUIT_SVG : null,
    };
  } else {
    // Integer type Physics question
    const m = 2 + (n % 6);
    const v = 3 + (n % 5);
    const ke = 0.5 * m * v * v * 2; // integer
    return {
      topic,
      difficulty,
      question: `In a problem on ${meta.chapter} (${topic}), a particle of effective parameter $m = ${m}$ units undergoes a transition characterized by state variable $v = ${v}$ units such that the conserved invariant is $I = m v^2$. Calculate the exact numerical value of $I$.`,
      correctAnswer: ke,
      solution: `Given $m = ${m}$ and $v = ${v}$:\n$$I = m v^2 = ${m} \\times (${v})^2 = ${m} \\times ${v * v} = ${ke}$$\nHence, the integer answer is $${ke}$.`,
      explanation: `Always square the state velocity/variable before multiplying by the inertia coefficient $m$.`,
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

  if (type === 'mcq') {
    if (meta.code === 'CHM-MOL') {
      const molarity = (0.5 * (1 + (n % 4))).toFixed(1);
      const volMl = 200 + (n % 5) * 100;
      const milliMoles = parseFloat(molarity) * volMl;
      const gramsNaOH = ((milliMoles / 1000) * 40).toFixed(2);
      return {
        topic,
        difficulty,
        question: `What mass of pure $\\text{NaOH}$ (molar mass $= 40\\text{ g mol}^{-1}$) is required to prepare $${volMl}\\text{ mL}$ of an aqueous solution of concentration $${molarity}\\text{ M}$?`,
        options: [
          `$${gramsNaOH}\\text{ g}$`,
          `$${(parseFloat(gramsNaOH) * 2).toFixed(2)}\\text{ g}$`,
          `$${(parseFloat(gramsNaOH) * 0.5).toFixed(2)}\\text{ g}$`,
          `$${(parseFloat(gramsNaOH) + 4).toFixed(2)}\\text{ g}$`,
        ] as [string, string, string, string],
        correctAnswer: 'A',
        solution: `Using the molarity relation:\n$$M = \\frac{\\text{moles of solute}}{V_{\\text{mL}} / 1000}$$\n$$\\text{moles of NaOH} = \\frac{${molarity} \\times ${volMl}}{1000} = ${(milliMoles / 1000).toFixed(3)}\\text{ mol}$$\n$$\\text{Mass of NaOH} = ${(milliMoles / 1000).toFixed(3)} \\times 40 = ${gramsNaOH}\\text{ g}$$`,
        explanation: `Convert volume in milliliters to liters before multiplying by molarity and molar mass ($40\\text{ g/mol}$).`,
        possibleErrorType: 'Sign/unit mistake' as ErrorCategory,
        image: null,
      };
    }

    const coeffA = 2 + (n % 5);
    const coeffB = 3 + (n % 4);
    const eqVal = coeffA * coeffB;
    const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const correctIdx = n % 4;
    const opts: [string, string, string, string] = [
      `$${eqVal - 2}\\text{ kJ mol}^{-1}$`,
      `$${eqVal + 3}\\text{ kJ mol}^{-1}$`,
      `$${eqVal * 2}\\text{ kJ mol}^{-1}$`,
      `$${eqVal}\\text{ kJ mol}^{-1}$`,
    ];
    const tmp = opts[3];
    opts[3] = opts[correctIdx];
    opts[correctIdx] = tmp;

    return {
      topic,
      difficulty,
      question: `In a study of ${meta.chapter} (${topic}), a chemical species undergoes a transformation with stoichiometric factor $\\nu = ${coeffA}$ and molar energetic contribution $\\Delta\\varepsilon = ${coeffB}\\text{ kJ mol}^{-1}$. Calculate the net molar change $\\Delta H^\\circ = \\nu \\cdot \\Delta\\varepsilon$ for the reaction step.`,
      options: opts,
      correctAnswer: letters[correctIdx],
      solution: `By stoichiometric scaling in ${meta.chapter} (${topic}):\n$$\\Delta H^\\circ = \\nu \\times \\Delta\\varepsilon$$\nSubstituting $\\nu = ${coeffA}$ and $\\Delta\\varepsilon = ${coeffB}\\text{ kJ mol}^{-1}$:\n$$\\Delta H^\\circ = ${coeffA} \\times ${coeffB} = ${eqVal}\\text{ kJ mol}^{-1}$$`,
      explanation: `Extensive thermodynamic and kinetic quantities scale directly with the stoichiometric coefficient $\\nu$ of the balanced chemical equation.`,
      possibleErrorType: errorType,
      image: null,
    };
  } else {
    const zVal = 2 + (n % 7);
    const oxid = zVal * 2;
    return {
      topic,
      difficulty,
      question: `For a reaction analyzed under ${meta.chapter} (${topic}), ${zVal} moles of a bivalent reagent transfer exactly $2$ equivalents per mole during complete conversion. Find the total number of equivalents ($n_{\\text{eq}}$) transferred.`,
      correctAnswer: oxid,
      solution: `Total equivalents transferred is given by:\n$$n_{\\text{eq}} = \\text{moles} \\times n\\text{-factor} = ${zVal} \\times 2 = ${oxid}$$`,
      explanation: `The number of equivalents equals the number of moles multiplied by the valency factor ($n$-factor).`,
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

  if (type === 'mcq') {
    if (meta.code === 'MAT-QUD') {
      const r1 = 1 + (n % 5);
      const r2 = r1 + 2;
      const sum = r1 + r2;
      const prod = r1 * r2;
      const sqSum = r1 * r1 + r2 * r2;
      return {
        topic,
        difficulty,
        question: `If $\\alpha$ and $\\beta$ are the roots of the quadratic equation $x^2 - ${sum}x + ${prod} = 0$, what is the value of the symmetric expression $\\alpha^2 + \\beta^2$?`,
        options: [
          `$${sqSum - 2}$`,
          `$${sqSum}$`,
          `$${sum * sum}$`,
          `$${sqSum + 4}$`,
        ] as [string, string, string, string],
        correctAnswer: 'B',
        solution: `From Vieta's formulas for $x^2 - ${sum}x + ${prod} = 0$:\n$$\\alpha + \\beta = ${sum}, \\quad \\alpha\\beta = ${prod}$$\nUsing the algebraic identity:\n$$\\alpha^2 + \\beta^2 = (\\alpha + \\beta)^2 - 2\\alpha\\beta = (${sum})^2 - 2(${prod}) = ${sum * sum} - ${2 * prod} = ${sqSum}$$`,
        explanation: `Express symmetric functions of roots in terms of elementary symmetric polynomials $\\alpha + \\beta$ and $\\alpha\\beta$.`,
        possibleErrorType: 'Formula mistake' as ErrorCategory,
        image: null,
      };
    }

    const aVal = 2 + (n % 6);
    const bVal = 3 + (n % 5);
    const detVal = aVal * aVal + bVal;
    const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const correctIdx = n % 4;
    const opts: [string, string, string, string] = [
      `$${detVal}$`,
      `$${detVal + aVal}$`,
      `$${detVal - bVal}$`,
      `$${aVal * bVal}$`,
    ];
    const tmp = opts[0];
    opts[0] = opts[correctIdx];
    opts[correctIdx] = tmp;

    return {
      topic,
      difficulty,
      question: `In ${meta.chapter} (${topic}), let the functional operator $f(k) = k^2 + ${bVal}$ be evaluated at $k = ${aVal}$. Determine the exact value of $f(${aVal})$.`,
      options: opts,
      correctAnswer: letters[correctIdx],
      solution: `Evaluating the expression at $k = ${aVal}$:\n$$f(${aVal}) = (${aVal})^2 + ${bVal} = ${aVal * aVal} + ${bVal} = ${detVal}$$`,
      explanation: `Direct substitution and algebraic simplification yield $f(${aVal}) = ${detVal}$.`,
      possibleErrorType: errorType,
      image: null,
    };
  } else {
    const p = 2 + (n % 7);
    const q = 4 + (n % 6);
    const ans = p * q + p;
    return {
      topic,
      difficulty,
      question: `In a problem on ${meta.chapter} (${topic}), let $S = p(q + 1)$ where $p = ${p}$ and $q = ${q}$. Compute the exact integer value of $S$.`,
      correctAnswer: ans,
      solution: `Substituting $p = ${p}$ and $q = ${q}$:\n$$S = ${p} \\times (${q} + 1) = ${p} \\times ${q + 1} = ${ans}$$`,
      explanation: `Factoring $p(q+1)$ simplifies mental arithmetic and reduces calculation errors under timed conditions.`,
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

  // Check if already seeded with 55 files
  const existingFiles = [
    ...fs.readdirSync(physicsDir),
    ...fs.readdirSync(chemistryDir),
    ...fs.readdirSync(mathDir),
  ].filter((f) => f.endsWith('.json'));

  if (existingFiles.length >= 55) {
    return;
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
        tags: ['JEE Main', 'JEE Advanced', meta.chapter, qData.topic],
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
        difficulty: qData.difficulty,
        type: 'integer',
        question: qData.question,
        correctAnswer: qData.correctAnswer,
        solution: qData.solution,
        explanation: qData.explanation,
        possibleErrorType: qData.possibleErrorType,
        image: null,
        source: 'question_bank',
        tags: ['JEE Main', 'Numerical', meta.chapter, qData.topic],
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
