import fs from 'fs';
import path from 'path';
import { DifficultyLevel, ErrorCategory, SubjectName } from '../types/jee';

export interface ChapterMeta {
  subject: SubjectName;
  chapter: string;
  code: string;
  topics: string[];
  isMinor?: boolean;
}

export const ALL_55_CHAPTERS: ChapterMeta[] = [
  // PHYSICS (19 Chapters)
  { subject: 'Physics', chapter: 'Units & Measurements', code: 'PHY-UAM', topics: ['Vernier & Screw Gauge Precision', 'Error Propagation in Experiments', 'Dimensional Equations & Constants', 'Significant Figures & Rounding'] },
  { subject: 'Physics', chapter: 'Kinematics', code: 'PHY-KIN', topics: ['Projectile on Inclined Planes', 'Relative Motion & Closest Approach', 'Variable Acceleration Integrals', 'Constrained Coordinate Kinematics'] },
  { subject: 'Physics', chapter: 'Laws of Motion', code: 'PHY-NLM', topics: ['Wedge-Block Accelerating Constraints', 'Friction Thresholds on Double Blocks', 'Banking & Critical Conical Angle', 'Movable Pulley Dynamic Systems'] },
  { subject: 'Physics', chapter: 'Work, Energy & Power', code: 'PHY-WEP', topics: ['Vertical Circular Motion & Slack Conditions', 'Potential Energy Wells & Equilibrium Stability', 'Variable Force Work Integration', 'Conservation of Mechanical Energy'] },
  { subject: 'Physics', chapter: 'Rotational Motion', code: 'PHY-ROT', topics: ['Rolling Without Slipping & Friction Conditions', 'Angular Momentum About Non-Fixed Axes', 'Rigid Body Toppling vs Sliding', 'Instantaneous Axis of Rotation'] },
  { subject: 'Physics', chapter: 'Gravitation', code: 'PHY-GRV', topics: ['Hohmann Satellite Transfer Orbits', 'Gravitational Self-Energy & Cavities', 'Escape Velocity from Rotating Bodies', 'Kepler Elliptical Orbit Dynamics'] },
  { subject: 'Physics', chapter: 'Properties of Solids & Liquids', code: 'PHY-PSL', topics: ['Terminal Velocity in Viscous Fluid', 'Capillary Rise & Contact Angle Variations', 'Bernoulli Efflux with Variable Heights', 'Elastic Strain Energy in Tapered Wires'] },
  { subject: 'Physics', chapter: 'Thermodynamics', code: 'PHY-THM', topics: ['Indicator Diagram Cyclic Efficiency', 'Polytropic Processes & Molar Heat Capacity', 'Adiabatic Work vs Isothermal Free Expansion', 'Entropy Balance in Cyclic Processes'] },
  { subject: 'Physics', chapter: 'Kinetic Theory of Gases', code: 'PHY-KTG', topics: ['Gas Mixture Equivalent Heat Capacities', 'Maxwellian Speed Distribution Ratios', 'Degrees of Freedom & Equipartition Law', 'Mean Free Path & Pressure Dependence'] },
  { subject: 'Physics', chapter: 'Oscillations & Waves', code: 'PHY-OSW', topics: ['Spring-Mass Systems with Cut Springs', 'Perpendicular SHM Superposition & Phase', 'Organ Pipe Resonances with End Corrections', 'Doppler Effect with Moving Reflector & Wind'] },
  { subject: 'Physics', chapter: 'Electrostatics', code: 'PHY-ELS', topics: ['Concentric Conducting Shells with Earthing', 'Gauss Law for Non-Uniform Density', 'Dielectric Insertion Forces in Capacitors', 'Electric Dipole in Inhomogeneous Fields'] },
  { subject: 'Physics', chapter: 'Current Electricity', code: 'PHY-CUR', topics: ['Symmetric Cube & Bridge Network Resistance', 'RC Transient Charging & Discharging', 'Potentiometer Internal Resistance Accuracy', 'Nodal Analysis with Multiple Sources'] },
  { subject: 'Physics', chapter: 'Magnetic Effects of Current & Magnetism', code: 'PHY-MAG', topics: ['Helical Motion with Pitch & Oblique Angle', 'Magnetic Force on Non-Planar Current Loops', 'Biot-Savart Law for Finite & Curved Wires', 'Magnetic Dipole Oscillation in Fields'] },
  { subject: 'Physics', chapter: 'Electromagnetic Induction & AC', code: 'PHY-EMI', topics: ['Terminal Speed of Rail-Sliding Rods in Gravity', 'Series LCR Quality Factor & Sharpness', 'Induced Cylindrical Electric Field Torque', 'Mutual Inductance in Nested Solenoids'] },
  { subject: 'Physics', chapter: 'Electromagnetic Waves', code: 'PHY-EMW', topics: ['Poynting Vector & Average Intensity', 'Radiation Pressure on Partial Reflectors', 'Displacement Current in Charging Capacitors', 'Polarization & Wave Vector Relations'], isMinor: true },
  { subject: 'Physics', chapter: 'Ray & Wave Optics', code: 'PHY-OPT', topics: ['Silvered Plano-Convex Lenses as Mirrors', 'Prism Minimum Deviation & Internal Reflection', 'YDSE Fringe Shift via Variable Thin Slabs', 'Single Slit Diffraction Resolving Limit'] },
  { subject: 'Physics', chapter: 'Dual Nature of Matter & Radiation', code: 'PHY-DNM', topics: ['Stopping Potential vs Frequency Slope', 'de Broglie Wavelength of Relativistic Particles', 'Radiation Force on Inclined Mirrors', 'Work Function & Multi-Wavelength Thresholds'] },
  { subject: 'Physics', chapter: 'Atoms & Nuclei', code: 'PHY-ATN', topics: ['Hydrogen-Like Ion Rydberg Transitions', 'Radioactive Branching Simultaneous Decay', 'Mass Defect & Q-Value of Nuclear Reactions', 'Bohr Orbital Magnetic Dipole Moments'] },
  { subject: 'Physics', chapter: 'Electronic Devices', code: 'PHY-ELD', topics: ['Zener Diode Dynamic Regulation Range', 'Complex Logic Gate Truth Table De Morgan', 'PN Junction Depletion Capacitance & Barrier', 'Full Wave Rectifier Ripple Factor'], isMinor: true },

  // CHEMISTRY (18 Chapters)
  { subject: 'Chemistry', chapter: 'Mole Concept & Stoichiometry', code: 'CHM-MOL', topics: ['Back Titration of Excess Reagent Mixtures', 'Combustion Analysis & Empirical Formula', 'Redox Equivalents & Disproportionation', 'Oleum Percentage Free SO3 Titration'] },
  { subject: 'Chemistry', chapter: 'Atomic Structure', code: 'CHM-ATM', topics: ['Quantum Radial Nodes & Probability Density', 'de Broglie Wavelength Ratio of Bound States', 'Heisenberg Uncertainty in Confined Particles', 'Bohr Orbit Ionization with Nuclear Shielding'] },
  { subject: 'Chemistry', chapter: 'Chemical Bonding & Molecular Structure', code: 'CHM-BND', topics: ['Molecular Orbital Theory Bond Orders & Magnetism', 'VSEPR Stereochemical Lone Pair Repulsion', 'Dipole Moment Vectors in Substituted Aromatics', 'Fajans Rules & Covalent Character in Halides'] },
  { subject: 'Chemistry', chapter: 'Chemical Thermodynamics', code: 'CHM-THD', topics: ['Gibbs Free Energy & Equilibrium Quotient', 'Hess Law Enthalpy of Hydrogenation Cycles', 'Entropy of Mixing & Phase Transition Balance', 'Bond Dissociation Energies in Conjugated Bonds'] },
  { subject: 'Chemistry', chapter: 'Solutions & Colligative Properties', code: 'CHM-SOL', topics: ['Van t Hoff Factor for Partial Dimerization', 'Raoult Law Deviations & Azeotropic Limits', 'Osmotic Pressure in Mixed Polyelectrolytes', 'Freezing Point Depression in Associated Solutes'] },
  { subject: 'Chemistry', chapter: 'Equilibrium (Chemical & Ionic)', code: 'CHM-EQL', topics: ['Simultaneous Solubility with Common Ion Effect', 'Buffer Solution Capacity & Polyprotic Hydrolysis', 'Kp and Kc Shift under Inert Gas Injection', 'Amphiprotic Salt pH Derivation'] },
  { subject: 'Chemistry', chapter: 'Redox Reactions & Electrochemistry', code: 'CHM-ELC', topics: ['Nernst Concentration Cell Potentials', 'Kohlrausch Law & Weak Electrolyte Dissociation', 'Faraday Electrolysis with Overpotentials', 'Cell Potential Relation to Solubility Product'] },
  { subject: 'Chemistry', chapter: 'Chemical Kinetics', code: 'CHM-KIN', topics: ['Parallel First-Order Arrhenius Activations', 'Steady-State Intermediate Approximations', 'Rate Law Determination via Differential Rates', 'Temperature Coefficient & Collision Frequency'] },
  { subject: 'Chemistry', chapter: 'Classification of Elements & Periodicity', code: 'CHM-PRD', topics: ['Successive Ionization Jump & Valence Shells', 'Electron Gain Enthalpy Anomalies in Chalcogens', 'Diagonal Relationship & Polarizing Powers', 'Acid-Base Amphoteric Nature Across Periods'] },
  { subject: 'Chemistry', chapter: 'p-Block Elements', code: 'CHM-PBL', topics: ['Oxoacids of Phosphorus Basicity & Reducing Bonds', 'Diborane 3-Center 2-Electron Bridge Bonding', 'Xenon Fluoride Hydrolysis Product Ratios', 'Interhalogen T-Shaped & Pyramidal Geometries'] },
  { subject: 'Chemistry', chapter: 'd- and f-Block Elements', code: 'CHM-DFB', topics: ['Spin-Only Magnetic Moments of High/Low Spin', 'Permanganate & Dichromate Acidic Equivalents', 'Lanthanoid Contraction Radii Consequences', 'Color & Charge-Transfer Absorption in Oxoions'] },
  { subject: 'Chemistry', chapter: 'Coordination Compounds', code: 'CHM-CRD', topics: ['Crystal Field Splitting CFSE in Ligand Fields', 'Geometrical & Optical Isomers in Bis-Chelates', 'Synergic Metal-Carbonyl Back-Bonding Extent', 'Inner vs Outer Orbital Hybridization Complex'] },
  { subject: 'Chemistry', chapter: 'General Organic Chemistry & Isomerism', code: 'CHM-GOC', topics: ['Aromaticity via Huckel Rule in Non-Benzenoids', 'Acidic Strength of Substituted Benzoic Acids', 'Carbocation Migratory Shifts & Stability', 'Stereoisomers & Optical Activity with Symmetry'] },
  { subject: 'Chemistry', chapter: 'Hydrocarbons', code: 'CHM-HYD', topics: ['Ozonolysis Cleavage & Structure Elucidation', 'Anti-Markovnikov Hydroboration vs Hydration', 'Electrophilic Aromatic Bromination Directing', 'Birch Reduction of Substituted Arenes'] },
  { subject: 'Chemistry', chapter: 'Haloalkanes & Haloarenes', code: 'CHM-HAL', topics: ['SN1 vs SN2 Inversion & Rearrangement', 'E2 Regioselectivity Saytzeff vs Hofmann Bulky', 'Grignard Reagent Multi-Step Nucleophilic Addition', 'Nucleophilic Aromatic Substitution with Nitro'] },
  { subject: 'Chemistry', chapter: 'Alcohols, Phenols & Ethers', code: 'CHM-ALC', topics: ['Reimer-Tiemann Dichlorocarbene Intermediate', 'Kolbe-Schmitt Carboxylation to Salicylic Acid', 'Pinacol-Pinacolone Acidic Rearrangement', 'Williamson Ether Cleavage with Excess HI'] },
  { subject: 'Chemistry', chapter: 'Aldehydes, Ketones & Carboxylic Acids', code: 'CHM-ALD', topics: ['Crossed Aldol Condensation Dehydration', 'Cannizzaro Disproportionation Kinetics', 'Clemmensen vs Wolff-Kishner Reduction Pathways', 'Haloform Reaction of Methyl Carbonyls'] },
  { subject: 'Chemistry', chapter: 'Amines & Biomolecules', code: 'CHM-AMN', topics: ['Hoffmann Bromamide Degradation Degradation', 'Benzenediazonium Salt Coupling to Azo Dyes', 'Hinsberg Separation of Primary/Secondary Amines', 'Peptide Linkage & Isoelectric Points'] },

  // MATHEMATICS (18 Chapters)
  { subject: 'Mathematics', chapter: 'Sets, Relations & Functions', code: 'MAT-SRF', topics: ['Functional Equations & Invertibility', 'Composite Function Domain & Range Constraints', 'Counting Equivalence & Symmetric Relations', 'Bijective Mapping Criteria on Subsets'] },
  { subject: 'Mathematics', chapter: 'Complex Numbers', code: 'MAT-CMP', topics: ['Argand Plane Geometry & Apollonius Circles', 'Roots of Unity Algebraic Sums & Products', 'Rotation Theorem of Vector Amplitudes', 'Triangle Inequality Extremum Moduli'] },
  { subject: 'Mathematics', chapter: 'Quadratic Equations', code: 'MAT-QUD', topics: ['Location of Roots on Bounded Intervals', 'Common Root Elimination with Parameters', 'Newton Recurrence Sums of Higher Powers', 'Rational Algebraic Expression Range'] },
  { subject: 'Mathematics', chapter: 'Matrices', code: 'MAT-MTX', topics: ['Cayley-Hamilton Characteristic Polynomials', 'Powers of Involutary & Idempotent Matrices', 'Symmetric & Skew-Symmetric Orthogonality', 'Matrix Adjoint Properties & Inversion'] },
  { subject: 'Mathematics', chapter: 'Determinants', code: 'MAT-DET', topics: ['Cramer Rule Inconsistent & Infinite Systems', 'Adjoint Determinant Power Formulas', 'Circulant & Vandermonde Determinant Proofs', 'Differentiation of Parameterized Determinants'] },
  { subject: 'Mathematics', chapter: 'Permutations & Combinations', code: 'MAT-PNC', topics: ['Derangements with Partial Matches', 'Multinomial Beggar Method with Minimum Caps', 'Restricted Circular Arrangements & Symmetry', 'Grid Path Counting with Obstacle Exclusions'] },
  { subject: 'Mathematics', chapter: 'Binomial Theorem', code: 'MAT-BIN', topics: ['Binomial Coefficient Weighted Series Summations', 'Numerically Greatest Term in Expansions', 'Remainder Determination using Binomial Expansions', 'Fractional Power Binomial Series Approximations'] },
  { subject: 'Mathematics', chapter: 'Sequence & Series', code: 'MAT-SNS', topics: ['Arithmetico-Geometric Infinite Series Sums', 'Telescoping Differences & Partial Fractions', 'AM-GM-HM Inequalities with Weighted Terms', 'Recurrence Relation Asymptotic Limits'] },
  { subject: 'Mathematics', chapter: 'Limits, Continuity & Differentiability', code: 'MAT-LCD', topics: ['1 to the Infinity Indeterminate Limits', 'Non-Differentiable Points of Modulus Functions', 'Rolle & Lagrange Mean Value Intermediate Roots', 'Piecewise Junction Point Smoothness'] },
  { subject: 'Mathematics', chapter: 'Integral Calculus', code: 'MAT-INT', topics: ['Kings Property & Symmetric Definite Integrals', 'Leibniz Differentiation under Integral Sign', 'Area Bounded by Inverse & Piecewise Curves', 'Reduction Integrals with Trigonometric Limits'] },
  { subject: 'Mathematics', chapter: 'Differential Equations', code: 'MAT-DFE', topics: ['Linear Differential Equations & Integrating Factors', 'Homogeneous Substitution y = vx Solvability', 'Exact Differentials & Orthogonal Trajectories', 'Boundary Value Initial Rate Formulations'] },
  { subject: 'Mathematics', chapter: 'Coordinate Geometry (Straight Lines & Circles)', code: 'MAT-CRD', topics: ['Family of Circles & Radical Axis Properties', 'Director Circles & Chords of Contact', 'Orthogonal Circles Coefficient Condition', 'Image & Orthocenter Coordinate Geometry'] },
  { subject: 'Mathematics', chapter: 'Conic Sections (Parabola, Ellipse, Hyperbola)', code: 'MAT-CNC', topics: ['Focal Chord & Normal Parameter Relations', 'Director Circle Locus of Perpendicular Tangents', 'Conjugate Hyperbola Eccentricity Reciprocals', 'Auxiliary Circle Contact Points on Ellipse'] },
  { subject: 'Mathematics', chapter: 'Three-Dimensional Geometry', code: 'MAT-3DG', topics: ['Shortest Distance Formula for Skew Lines', 'Foot of Perpendicular & Mirror Image in Planes', 'Plane Passing through Line of Intersection', 'Coplanar Line Condition & Normal Vectors'] },
  { subject: 'Mathematics', chapter: 'Vector Algebra', code: 'MAT-VEC', topics: ['Scalar Triple Product Parallelepiped Volume', 'Vector Triple Product Expansion & Linear Dependency', 'Angle Bisector & Projection Vector Operations', 'Reciprocal Systems of Non-Coplanar Vectors'] },
  { subject: 'Mathematics', chapter: 'Statistics & Probability', code: 'MAT-PRB', topics: ['Bayes Theorem with Multi-Stage Urns', 'Binomial Probability Distribution Expectation', 'Variance Transformation with Covariance', 'Total Probability Theorem with Evidence'] },
  { subject: 'Mathematics', chapter: 'Trigonometry', code: 'MAT-TRG', topics: ['Inverse Trigonometric Principal Domains & Sums', 'General Solutions with Extraneous Root Checks', 'Extremum of Linear Sine-Cosine Combinations', 'Conditional Triangle Angle Identities'] },
  { subject: 'Mathematics', chapter: 'Mathematical Reasoning & Linear Programming', code: 'MAT-MRL', topics: ['Contrapositive & Negation of Quantifiers', 'Tautology Verification via Truth Tables', 'Linear Programming Feasible Corner Extrema', 'Duality in Compound Propositions'], isMinor: true },
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

export const ORGANIC_CHAPTER_CODES = new Set([
  'CHM-GOC',
  'CHM-HYD',
  'CHM-HAL',
  'CHM-ALC',
  'CHM-ALD',
  'CHM-AMN',
]);

// -------------------------------------------------------------
// PHYSICS GENERATOR (Customized per chapter code)
// -------------------------------------------------------------
function buildPhysicsQuestion(meta: ChapterMeta, index: number, type: 'mcq' | 'integer') {
  const topic = meta.topics[index % meta.topics.length];
  // Target hard mode distribution: 50% hard, 35% medium, 15% easy
  const difficulties: DifficultyLevel[] = ['hard', 'medium', 'hard', 'medium', 'hard', 'easy'];
  const difficulty = difficulties[index % difficulties.length];
  const errorType = ERROR_TYPES[index % ERROR_TYPES.length];
  const n = index + 1;
  const k = 2 + (index % 5);
  const m = 3 + (index % 4);

  if (type === 'mcq') {
    let q = '';
    let ans = '';
    let d: [string, string, string] = ['', '', ''];
    let sol = '';
    const cat = `${meta.chapter} :: Multi-Concept Physical Modeling (Type ${n % 6 + 1})`;

    switch (meta.code) {
      case 'PHY-UAM':
        q = `In a vernier caliper measurement in [${meta.chapter}], 10 vernier scale divisions coincide with 9 main scale divisions ($1\\text{ MSD} = 1\\text{ mm}$). When measuring a sphere of diameter with zero error $+${k * 0.02}\\text{ mm}$, the main scale reads $${k * 10}\\text{ mm}$ and the $${m}^{\\text{th}}$ vernier division coincides with a main scale mark. What is the corrected true diameter of the sphere?`;
        ans = `$${(k * 10 + m * 0.1 - k * 0.02).toFixed(2)}\\text{ mm}$`;
        d = [`$${(k * 10 + m * 0.1 + k * 0.02).toFixed(2)}\\text{ mm}$`, `$${(k * 10 + m * 0.1).toFixed(2)}\\text{ mm}$`, `$${(k * 10 + (m - 1) * 0.1).toFixed(2)}\\text{ mm}$`];
        sol = `Least count is $1\\text{ MSD} - 1\\text{ VSD} = 0.1\\text{ mm}$. Observed reading $= \\text{MSR} + \\text{VSR} \\times \\text{LC} = ${k * 10} + ${m} \\times 0.1 = ${k * 10 + m * 0.1}\\text{ mm}$. True reading $= \\text{Observed} - (\\text{Zero Error}) = ${(k * 10 + m * 0.1 - k * 0.02).toFixed(2)}\\text{ mm}$.`;
        break;

      case 'PHY-KIN':
        q = `A particle moving along a straight line in [${meta.chapter}] has velocity $v = \\alpha \\sqrt{x}$, where $\\alpha = ${k}\\text{ m}^{1/2}\\text{s}^{-1}$. At time $t = 0$, $x = 0$. Determine the acceleration of the particle and its velocity at $t = ${m}\\text{ s}$.`;
        ans = `$a = ${((k * k) / 2).toFixed(1)}\\text{ m/s}^2,\\; v = ${(((k * k) / 2) * m).toFixed(1)}\\text{ m/s}$`;
        d = [`$a = ${(k * k).toFixed(1)}\\text{ m/s}^2,\\; v = ${(k * k * m).toFixed(1)}\\text{ m/s}$`, `$a = ${k}\\text{ m/s}^2,\\; v = ${(k * m).toFixed(1)}\\text{ m/s}$`, `$a = ${(k / 2).toFixed(1)}\\text{ m/s}^2,\\; v = ${((k / 2) * m).toFixed(1)}\\text{ m/s}$`];
        sol = `Acceleration is $a = v \\frac{dv}{dx} = (\\alpha \\sqrt{x})\\left(\\frac{\\alpha}{2\\sqrt{x}}\\right) = \\frac{\\alpha^2}{2} = \\frac{${k}^2}{2} = ${((k * k) / 2).toFixed(1)}\\text{ m/s}^2$. Since acceleration is constant, $v(t) = a t = ${(((k * k) / 2) * m).toFixed(1)}\\text{ m/s}$.`;
        break;

      case 'PHY-NLM':
        q = `In a wedge-block system in [${meta.chapter}], a smooth wedge of mass $M = ${m}\\text{ kg}$ with incline angle $\\theta = 30^\\circ$ is free to slide horizontally on a frictionless floor. A block of mass $m_0 = 1\\text{ kg}$ slides down a distance $s = 2\\text{ m}$ along the face of the wedge relative to the incline. What is the horizontal displacement of the wedge?`;
        ans = `$\\frac{\\sqrt{3}}{${m + 1}}\\text{ m}$`;
        d = [`$\\frac{1}{${m + 1}}\\text{ m}$`, `$\\frac{\\sqrt{3}}{${m}}\\text{ m}$`, `$\\frac{2\\sqrt{3}}{${m + 1}}\\text{ m}$`];
        sol = `Since horizontal net external force is zero, center of mass position is invariant horizontally: $M \\Delta x_W + m_0(\\Delta x_W - s \\cos 30^\\circ) = 0 \\implies \\Delta x_W = \\frac{m_0 s \\cos 30^\\circ}{M + m_0} = \\frac{1 \\times 2 \\times \\frac{\\sqrt{3}}{2}}{${m} + 1} = \\frac{\\sqrt{3}}{${m + 1}}\\text{ m}$.`;
        break;

      case 'PHY-WEP':
        q = `In vertical circular motion in [${meta.chapter}], a bob of mass $m$ suspended by a light string of length $\\ell$ is projected horizontally with velocity $v_0 = \\sqrt{${k + 2} g \\ell}$ at the lowest point. If the string becomes slack before reaching the highest point, find the cosine of the angle $\\theta$ made by the string with the upward vertical at the instant of slack.`;
        ans = `$-\\frac{${k - 1}}{3}$`;
        d = [`$-\\frac{${k}}{3}$`, `$-\\frac{${k - 1}}{2}$`, `$-\\frac{1}{3}$`];
        sol = `At the instant string goes slack, tension $T = 0 \\implies v^2 = g\\ell \\cos\\phi$ (where $\\phi$ is angle with upward vertical). Energy conservation gives $\\frac{1}{2}m v_0^2 = \\frac{1}{2}m v^2 + mg\\ell(1 + \\cos\\phi) \\implies (${k + 2})g\\ell = g\\ell\\cos\\phi + 2g\\ell(1+\\cos\\phi) \\implies 3\\cos\\phi = ${k - 1} \\implies \\cos\\phi = \\frac{${k - 1}}{3}$. With respect to the upward vertical vector, $\\cos\\theta = -\\frac{${k - 1}}{3}$.`;
        break;

      case 'PHY-ROT':
        q = `A solid uniform cylinder of mass $M$ and radius $R$ in [${meta.chapter}] is placed on a rough horizontal surface with zero initial angular speed and given a forward horizontal velocity $v_0 = ${k * 3}\\text{ m/s}$. After sliding a certain distance, it transitions into pure rolling. What is the linear velocity $v_f$ when pure rolling begins?`;
        ans = `$${((2 * k * 3) / 3).toFixed(1)}\\text{ m/s}$`;
        d = [`$${((k * 3) / 2).toFixed(1)}\\text{ m/s}$`, `$${((3 * k * 3) / 4).toFixed(1)}\\text{ m/s}$`, `$${((4 * k * 3) / 5).toFixed(1)}\\text{ m/s}$`];
        sol = `Friction acts through the ground contact line, so angular momentum is conserved about any point on the ground surface: $M v_0 R = M v_f R + I \\omega_f = M v_f R + \\frac{1}{2} M R^2 \\left(\\frac{v_f}{R}\\right) = \\frac{3}{2} M v_f R \\implies v_f = \\frac{2}{3}v_0 = \\frac{2 \\times ${k * 3}}{3} = ${((2 * k * 3) / 3).toFixed(1)}\\text{ m/s}$.`;
        break;

      case 'PHY-GRV':
        q = `A planet of mass $M$ and radius $R$ in [${meta.chapter}] has a uniform mass density. A narrow tunnel is drilled through its center. A small particle of mass $m$ is released from rest at a distance $r = \\frac{R}{${k}}$ from the center. What is the period of oscillation $T$ of the particle in terms of $G$ and density $\\rho$?`;
        ans = `$\\sqrt{\\frac{3\\pi}{G \\rho}}$`;
        d = [`$\\sqrt{\\frac{4\\pi}{3G \\rho}}$`, `$\\sqrt{\\frac{2\\pi}{G \\rho}}$`, `$\\frac{1}{2}\\sqrt{\\frac{3\\pi}{G \\rho}}$`];
        sol = `Inside a uniform sphere, gravitational force at radius $r$ is $F = -\\frac{G M(r) m}{r^2} = -\\frac{4}{3}\\pi G \\rho m r$. This is simple harmonic motion with $\\omega = \\sqrt{\\frac{4}{3}\\pi G \\rho}$. The time period is $T = \\frac{2\\pi}{\\omega} = \\sqrt{\\frac{3\\pi}{G\\rho}}$, independent of the initial release radius.`;
        break;

      case 'PHY-PSL':
        q = `A spherical ball of radius $r$ and density $\\rho$ falls in a viscous liquid of density $\\sigma < \\rho$ and coefficient of viscosity $\\eta$ in [${meta.chapter}]. If its terminal velocity is $v_t$, what is the rate of heat dissipation due to viscous friction at terminal velocity?`;
        ans = `$6\\pi \\eta r v_t^2$`;
        d = [`$3\\pi \\eta r v_t^2$`, `$\\frac{6}{5}\\pi \\eta r v_t^2$`, `$12\\pi \\eta r v_t^2$`];
        sol = `At terminal velocity, the net downward gravitational force minus buoyancy equals the upward viscous drag force $F_v = 6\\pi \\eta r v_t$. The rate of work done by viscous drag (which dissipates entirely as heat) is $P = F_v v_t = 6\\pi \\eta r v_t^2$.`;
        break;

      case 'PHY-THM':
        q = `One mole of a monoatomic ideal gas $(\\gamma = 5/3)$ in [${meta.chapter}] undergoes a cycle composed of: an isobaric expansion at $P_0$ from $V_0$ to $${k}V_0$, an isochoric heating to $${m}P_0$, and an adiabatic expansion back to initial temperature. What is the total work done during the isobaric step?`;
        ans = `$${k - 1} P_0 V_0$`;
        d = [`$${k} P_0 V_0$`, `$\\frac{${k - 1}}{2} P_0 V_0$`, `$\\frac{3}{2}(${k - 1}) P_0 V_0$`];
        sol = `For an isobaric expansion at constant pressure $P_0$, the work done is $W = P_0 \\Delta V = P_0 (${k}V_0 - V_0) = ${k - 1} P_0 V_0$.`;
        break;

      case 'PHY-KTG':
        q = `A container in [${meta.chapter}] holds a mixture of $1\\text{ mole}$ of Helium (monoatomic, $C_v = \\frac{3}{2}R$) and $${k}\\text{ moles}$ of Hydrogen (diatomic, $C_v = \\frac{5}{2}R$). What is the effective molar heat capacity at constant volume $C_{v,\\text{mix}}$ of the mixture?`;
        ans = `$\\frac{${3 + 5 * k}}{${2 * (1 + k)}} R$`;
        d = [`$\\frac{${3 + 5 * k}}{2} R$`, `$\\frac{${4 + 5 * k}}{${2 * (1 + k)}} R$`, `$\\frac{4}{${1 + k}} R$`];
        sol = `By thermal equipartition, $C_{v,\\text{mix}} = \\frac{n_1 C_{v1} + n_2 C_{v2}}{n_1 + n_2} = \\frac{1(\\frac{3}{2}R) + ${k}(\\frac{5}{2}R)}{1 + ${k}} = \\frac{${3 + 5 * k}}{${2 * (1 + k)}} R$.`;
        break;

      case 'PHY-OSW':
        q = `A uniform light spring of force constant $k_s$ in [${meta.chapter}] is cut into two segments of length ratio $1:${k}$. The shorter segment is connected to a mass $m$. What is the angular frequency $\\omega$ of simple harmonic oscillations of this system?`;
        ans = `$\\sqrt{\\frac{${k + 1} k_s}{m}}$`;
        d = [`$\\sqrt{\\frac{k_s}{${k + 1} m}}$`, `$\\sqrt{\\frac{${k} k_s}{m}}$`, `$\\frac{1}{${k + 1}}\\sqrt{\\frac{k_s}{m}}$`];
        sol = `Spring constant is inversely proportional to length: $k' = k_s \\times \\frac{L}{L_1} = k_s \\times \\frac{1 + ${k}}{1} = (${k + 1})k_s$. Therefore, angular frequency $\\omega = \\sqrt{\\frac{k'}{m}} = \\sqrt{\\frac{(${k + 1})k_s}{m}}$.`;
        break;

      case 'PHY-ELS':
        q = `Two thin concentric conducting spherical shells in [${meta.chapter}] have radii $R_1$ and $R_2 = ${k}R_1$. The inner shell has charge $Q = +${m}\\,\\mu\\text{C}$ and the outer shell is earthed. What is the electrostatic potential of the inner shell?`;
        ans = `$\\frac{${m} \\times 10^{-6} (${k - 1})}{4\\pi \\varepsilon_0 ${k} R_1}$`;
        d = [`$\\frac{${m} \\times 10^{-6}}{4\\pi \\varepsilon_0 R_1}$`, `$\\frac{${m} \\times 10^{-6}}{4\\pi \\varepsilon_0 ${k} R_1}$`, `$0\\text{ V}$`];
        sol = `Since outer shell is earthed, its potential is zero: $V_2 = \\frac{1}{4\\pi\\varepsilon_0}\\left(\\frac{Q}{R_2} + \\frac{Q'}{R_2}\\right) = 0 \\implies Q' = -Q$. Potential of inner shell is $V_1 = \\frac{1}{4\\pi\\varepsilon_0}\\left(\\frac{Q}{R_1} + \\frac{Q'}{R_2}\\right) = \\frac{Q}{4\\pi\\varepsilon_0}\\left(\\frac{1}{R_1} - \\frac{1}{${k}R_1}\\right) = \\frac{Q(${k - 1})}{4\\pi\\varepsilon_0 ${k} R_1}$.`;
        break;

      case 'PHY-CUR':
        q = `Twelve identical resistors of resistance $R = ${k * 6}\\,\\Omega$ in [${meta.chapter}] form the edges of a skeleton cube. What is the equivalent resistance between two body diagonally opposite corners of the cube?`;
        ans = `$${5 * k}\\,\\Omega$`;
        d = [`$${6 * k}\\,\\Omega$`, `$${(4.5 * k).toFixed(1)}\\,\\Omega$`, `$${(3.5 * k).toFixed(1)}\\,\\Omega$`];
        sol = `By path symmetry, total current $I$ entering divides into three $I/3$ currents, then six $I/6$ currents, then three $I/3$ currents. Total potential difference is $V = \\frac{I R}{3} + \\frac{I R}{6} + \\frac{I R}{3} = \\frac{5}{6} I R \\implies R_{eq} = \\frac{5}{6} R = \\frac{5}{6} \\times (${k * 6}) = ${5 * k}\\,\\Omega$.`;
        break;

      case 'PHY-MAG':
        q = `A charged particle of mass $m$ and charge $q$ enters a uniform magnetic field $B$ at an angle $\\theta = 60^\\circ$ to the field with speed $v = ${k * 10}\\text{ m/s}$ in [${meta.chapter}]. What is the pitch of the resulting helical path?`;
        ans = `$\\frac{\\pi m (${k * 10})}{q B}$`;
        d = [`$\\frac{2\\pi m (${k * 10})}{q B}$`, `$\\frac{\\sqrt{3}\\pi m (${k * 10})}{q B}$`, `$\\frac{\\pi m (${k * 10})}{2 q B}$`];
        sol = `Pitch $p = v_\\parallel T = (v \\cos 60^\\circ) \\left(\\frac{2\\pi m}{q B}\\right) = \\left(v \\times \\frac{1}{2}\\right)\\left(\\frac{2\\pi m}{q B}\\right) = \\frac{\\pi m v}{q B} = \\frac{\\pi m (${k * 10})}{q B}$.`;
        break;

      case 'PHY-EMI':
        q = `A conducting rod of length $\\ell$, mass $m$, and resistance $R$ in [${meta.chapter}] slides down frictionless vertical rails in a horizontal uniform magnetic field $B$. What is its terminal velocity under gravity?`;
        ans = `$\\frac{mgR}{B^2 \\ell^2}$`;
        d = [`$\\frac{2mgR}{B^2 \\ell^2}$`, `$\\frac{mgR}{2B^2 \\ell^2}$`, `$\\frac{B^2 \\ell^2}{mgR}$`];
        sol = `Induced EMF is $\\mathcal{E} = B \\ell v$, current is $I = \\frac{B \\ell v}{R}$, and upward magnetic Lorentz force is $F_B = I \\ell B = \\frac{B^2 \\ell^2 v}{R}$. At terminal velocity, $F_B = mg \\implies v_t = \\frac{mgR}{B^2 \\ell^2}$.`;
        break;

      case 'PHY-EMW':
        q = `An electromagnetic wave propagating in vacuum in [${meta.chapter}] has an electric field amplitude $E_0 = ${k * 60}\\text{ V/m}$. What is the radiation pressure exerted by this beam when it is completely absorbed upon normal incidence on a surface?`;
        ans = `$${((k * 60) ** 2 * 8.854e-12 / 2).toExponential(2)}\\text{ N/m}^2$`;
        d = [`$${((k * 60) ** 2 * 8.854e-12).toExponential(2)}\\text{ N/m}^2$`, `$${((k * 60) ** 2 * 8.854e-12 / 4).toExponential(2)}\\text{ N/m}^2$`, `$0\\text{ N/m}^2$`];
        sol = `Average energy density is $u_{avg} = \\frac{1}{2}\\varepsilon_0 E_0^2$. Radiation pressure on complete absorption is $P_{rad} = u_{avg} = \\frac{1}{2}\\varepsilon_0 E_0^2$.`;
        break;

      case 'PHY-OPT':
        q = `A thin equiconvex lens of focal length $f = ${k * 10}\\text{ cm}$ and refractive index $\\mu = 1.5$ in [${meta.chapter}] has one of its surfaces silvered so that it behaves as a concave mirror. What is the magnitude of the equivalent focal length of this silvered lens system?`;
        ans = `$${((k * 10) / 4).toFixed(1)}\\text{ cm}$`;
        d = [`$${((k * 10) / 2).toFixed(1)}\\text{ cm}$`, `$${(k * 10).toFixed(1)}\\text{ cm}$`, `$${((k * 10) / 3).toFixed(1)}\\text{ cm}$`];
        sol = `For an equiconvex lens with $\\mu = 1.5$, $\\frac{1}{f} = (1.5 - 1)\\left(\\frac{2}{R}\\right) = \\frac{1}{R} \\implies R = f = ${k * 10}\\text{ cm}$. Silvering one face creates a mirror of focal length $f_m = \\frac{R}{2} = \\frac{f}{2}$. Equivalent power $P = 2P_l + P_m \\implies \\frac{1}{F} = \\frac{2}{f} + \\frac{1}{f_m} = \\frac{2}{f} + \\frac{2}{f} = \\frac{4}{f} \\implies F = \\frac{f}{4} = ${((k * 10) / 4).toFixed(1)}\\text{ cm}$.`;
        break;

      case 'PHY-DNM':
        q = `Monochromatic light of wavelength $\\lambda$ falls on a metal surface in [${meta.chapter}], causing emission of photoelectrons with maximum kinetic energy $K_1 = ${k}\\text{ eV}$. When light of wavelength $\\frac{\\lambda}{2}$ is used on the same surface, the maximum kinetic energy becomes $K_2 = ${k * 2 + 3}\\text{ eV}$. What is the work function $\\Phi$ of the metal?`;
        ans = `$3.0\\text{ eV}$`;
        d = [`$2.0\\text{ eV}$`, `$1.5\\text{ eV}$`, `$4.0\\text{ eV}$`];
        sol = `Einstein's equations: $K_1 = \\frac{hc}{\\lambda} - \\Phi \\implies \\frac{hc}{\\lambda} = K_1 + \\Phi$. For $\\lambda/2$: $K_2 = \\frac{2hc}{\\lambda} - \\Phi = 2(K_1 + \\Phi) - \\Phi = 2K_1 + \\Phi \\implies \\Phi = K_2 - 2K_1 = (${k * 2 + 3}) - 2(${k}) = 3.0\\text{ eV}$.`;
        break;

      case 'PHY-ATN':
        q = `A radioactive substance $X$ in [${meta.chapter}] decays simultaneously by two channels: $\\alpha$-decay with half-life $T_1 = ${k * 6}\\text{ hours}$ and $\\beta$-decay with half-life $T_2 = ${k * 3}\\text{ hours}$. What is the effective composite half-life of $X$?`;
        ans = `$${k * 2}\\text{ hours}$`;
        d = [`$${k * 4.5}\\text{ hours}$`, `$${k * 9}\\text{ hours}$`, `$${k * 1.5}\\text{ hours}$`];
        sol = `The decay constants add directly: $\\lambda_{eff} = \\lambda_1 + \\lambda_2 \\implies \\frac{\\ln 2}{T_{eff}} = \\frac{\\ln 2}{T_1} + \\frac{\\ln 2}{T_2} \\implies \\frac{1}{T_{eff}} = \\frac{1}{${k * 6}} + \\frac{1}{${k * 3}} = \\frac{3}{${k * 6}} = \\frac{1}{${k * 2}} \\implies T_{eff} = ${k * 2}\\text{ hours}$.`;
        break;

      default: // PHY-ELD
        q = `A Zener diode voltage regulator in [${meta.chapter}] has a breakdown voltage $V_Z = ${k * 2}\\text{ V}$ and is connected across an unregulated input source $V_{in} = ${k * 2 + 6}\\text{ V}$ with a series resistor $R_s = 200\\,\\Omega$. What is the current flowing through the series resistor $R_s$?`;
        ans = `$30\\text{ mA}$`;
        d = [`$15\\text{ mA}$`, `$45\\text{ mA}$`, `$60\\text{ mA}$`];
        sol = `The voltage drop across the series resistor is $V_{Rs} = V_{in} - V_Z = (${k * 2 + 6}) - (${k * 2}) = 6\\text{ V}$. Current through $R_s$ is $I_s = \\frac{V_{Rs}}{R_s} = \\frac{6}{200} = 0.03\\text{ A} = 30\\text{ mA}$.`;
        break;
    }

    const { options, correctAnswer } = makeOptionSet(ans, d, index);
    return {
      topic,
      category: cat,
      difficulty,
      question: q,
      options,
      correctAnswer,
      solution: sol,
      explanation: `Analyze the physical model and equations in ${meta.chapter}.`,
      possibleErrorType: errorType,
      image: null,
    };
  } else {
    // Integer / Numerical Physics Problems
    const n = index + 1;
    const k = 2 + (index % 4);
    let q = '';
    let ans = 0;
    let sol = '';

    switch (meta.code) {
      case 'PHY-ROT':
        q = `A horizontal uniform disc of mass $M = ${k * 2}\\text{ kg}$ and radius $R = 1\\text{ m}$ is rotating with angular speed $\\omega_0 = 12\\text{ rad/s}$ about its central vertical axis in [${meta.chapter}]. A small insect of mass $m = ${k}\\text{ kg}$ lands gently on its rim. What is the new angular velocity of the disc in rad/s?`;
        ans = 6;
        sol = `Conservation of angular momentum: $I_i \\omega_0 = I_f \\omega_f \\implies (\\frac{1}{2} M R^2) \\omega_0 = (\\frac{1}{2} M R^2 + m R^2) \\omega_f \\implies (${k}) \\times 12 = (${k} + ${k}) \\omega_f \\implies \\omega_f = 6\\text{ rad/s}$.`;
        break;

      case 'PHY-NLM':
        q = `A block of mass $m = 10\\text{ kg}$ rests on a rough horizontal floor with static friction coefficient $\\mu_s = 0.5$. A horizontal force of $F = ${k * 10}\\text{ N}$ is applied to the block. If $F < f_s^{\\max}$, what is the magnitude of the frictional force exerted by the floor on the block in Newtons?`;
        ans = k * 10;
        sol = `Maximum static friction is $f_s^{\\max} = \\mu_s m g = 0.5 \\times 10 \\times 9.8 = 49\\text{ N}$ (or $50\\text{ N}$ with $g=10$). Since applied force $F = ${k * 10}\\text{ N} \\le 40\\text{ N} < f_s^{\\max}$, the block remains at rest and static friction exactly balances the applied force: $f_s = F = ${k * 10}\\text{ N}$.`;
        break;

      case 'PHY-CUR':
        q = `A potentiometer wire of length $L = 10\\text{ m}$ and resistance $R = 20\\,\\Omega$ is connected in series with an accumulator of EMF $E = 4\\text{ V}$ and internal resistance $0$. What is the potential gradient along the wire in $\\text{V/m}$ multiplied by $10$?`;
        ans = 4;
        sol = `Potential gradient is $k_g = \\frac{E}{L} = \\frac{4}{10} = 0.4\\text{ V/m}$. Multiplied by 10, the integer value is $4$.`;
        break;

      case 'PHY-ATN':
        q = `In a hydrogen-like atom of atomic number $Z = ${k}$, what is the energy (in eV) required to excite the electron from the ground state $(n=1)$ to the first excited state $(n=2)$ divided by $10.2$?`;
        ans = k * k;
        sol = `Excitation energy is $\\Delta E = 13.6 \\times Z^2 \\left(1 - \\frac{1}{4}\\right) = 10.2 Z^2\\text{ eV}$. Divided by $10.2$, the integer value is $Z^2 = ${k * k}$.`;
        break;

      default:
        q = `One mole of ideal gas undergoes a polytropic expansion $P V^2 = C$ in [${meta.chapter}] from volume $V_0 = 1\\text{ m}^3$ at pressure $P_0 = 10^5\\text{ Pa}$ to $V_1 = 2\\text{ m}^3$. Calculate the magnitude of work done by the gas in $\\text{kJ}$ rounded to nearest integer.`;
        ans = 50;
        sol = `Work done in polytropic process with $n=2$: $W = \\frac{P_0 V_0 - P_1 V_1}{n - 1} = P_0 V_0 \\left(1 - \\frac{V_0}{V_1}\\right) = 10^5 \\times 1 \\times (1 - 0.5) = 5 \\times 10^4\\text{ J} = 50\\text{ kJ}$.`;
        break;
    }

    return {
      topic,
      category: `${meta.chapter} :: Numerical Derivation`,
      difficulty: 'hard' as DifficultyLevel,
      question: q,
      correctAnswer: ans,
      solution: sol,
      explanation: `Calculate using quantitative physical laws in ${meta.chapter}.`,
      possibleErrorType: 'Calculation mistake' as ErrorCategory,
      image: null,
    };
  }
}

// -------------------------------------------------------------
// CHEMISTRY GENERATOR (Customized per chapter code)
// -------------------------------------------------------------
function buildChemistryQuestion(meta: ChapterMeta, index: number, type: 'mcq' | 'integer') {
  const isOrganic = ORGANIC_CHAPTER_CODES.has(meta.code);
  const topic = meta.topics[index % meta.topics.length];
  const difficulties: DifficultyLevel[] = ['hard', 'medium', 'hard', 'medium', 'hard', 'easy'];
  const difficulty = difficulties[index % difficulties.length];
  const errorType = ERROR_TYPES[(index + 1) % ERROR_TYPES.length];
  const k = 2 + (index % 4);

  if (isOrganic) {
    if (type === 'mcq') {
      let q = '';
      let ans = '';
      let d: [string, string, string] = ['', '', ''];
      let sol = '';
      const cat = `${meta.chapter} :: Organic Reaction Pathway (Type ${index % 5 + 1})`;

      switch (meta.code) {
        case 'CHM-GOC':
          q = `Consider the following carbocations in [${meta.chapter}]:
(I) Tropylium cation $(\\text{C}_7\\text{H}_7^+)$, (II) Cyclopentadienyl cation $(\\text{C}_5\\text{H}_5^+)$, (III) Allyl cation $(\\text{CH}_2=\\text{CH}-\\text{CH}_2^+)$, and (IV) Benzyl cation $(\\text{C}_6\\text{H}_5\\text{CH}_2^+)$.
What is the correct decreasing order of their thermodynamic stability?`;
          ans = `$(\\text{I}) > (\\text{IV}) > (\\text{III}) > (\\text{II})$`;
          d = [`$(\\text{IV}) > (\\text{I}) > (\\text{III}) > (\\text{II})$`, `$(\\text{I}) > (\\text{III}) > (\\text{IV}) > (\\text{II})$`, `$(\\text{II}) > (\\text{I}) > (\\text{IV}) > (\\text{III})$`];
          sol = `Tropylium cation (I) is aromatic with $6\\pi$ electrons delocalized over 7 carbons (exceptionally stable). Cyclopentadienyl cation (II) has $4\\pi$ electrons in a planar conjugated ring and is anti-aromatic (highly unstable). Benzyl cation (IV) has extensive benzylic resonance (more stable than allyl III). Stability: I > IV > III > II.`;
          break;

        case 'CHM-HYD':
          q = `An alkene $[X]$ of formula $\\text{C}_6\\text{H}_{12}$ in [${meta.chapter}] upon reductive ozonolysis $(\\text{O}_3 \\text{ followed by } \\text{Zn}/\\text{H}_2\\text{O})$ yields acetone and propionaldehyde in equimolar ratio. What is the IUPAC name of alkene $[X]$?`;
          ans = `2-Methylpent-2-ene`;
          d = [`2-Methylpent-1-ene`, `3-Methylpent-2-ene`, `Hex-2-ene`];
          sol = `Cleaving the $\\text{C=C}$ bond gives acetone $(\\text{CH}_3)_2\\text{C=O}$ and propionaldehyde $\\text{O=CH}-\\text{CH}_2\\text{CH}_3$. Recombining: $(\\text{CH}_3)_2\\text{C}=\\text{CH}-\\text{CH}_2\\text{CH}_3$, which is 2-methylpent-2-ene.`;
          break;

        case 'CHM-HAL':
          q = `When 1-bromo-1-methylcyclohexane is treated with potassium tert-butoxide $(t\\text{-BuOK})$ in tert-butanol at $75^\\circ\\text{C}$ in [${meta.chapter}], what is the major organic elimination product?`;
          ans = `Methylenecyclohexane (Hofmann product)`;
          d = [`1-Methylcyclohexene (Saytzeff product)`, `1-tert-Butoxy-1-methylcyclohexane`, `3-Methylcyclohexene`];
          sol = `Potassium tert-butoxide is a sterically hindered bulky base. Steric repulsion impedes abstraction of the internal endocyclic hydrogen, forcing regioselective deprotonation of the accessible exocyclic methyl hydrogens to yield the less substituted Hofmann alkene: methylenecyclohexane.`;
          break;

        case 'CHM-ALC':
          q = `In [${meta.chapter}], phenol is treated with chloroform and aqueous $\\text{NaOH}$ at $60^\\circ\\text{C}$ (Reimer-Tiemann condition) to form an intermediate that on acidification yields salicylaldehyde $[A]$. When $[A]$ is distilled with zinc dust, what is the major organic compound obtained?`;
          ans = `Benzaldehyde`;
          d = [`Benzene`, `Toluene`, `Benzoic acid`];
          sol = `The Reimer-Tiemann reaction introduces an ortho-formyl $(-\\text{CHO})$ group to yield salicylaldehyde (2-hydroxybenzaldehyde). Heating with zinc dust selectively reduces the phenolic $-\\text{OH}$ group to $-\\text{H}$ while preserving the formyl group, yielding benzaldehyde.`;
          break;

        case 'CHM-ALD':
          q = `An equimolar mixture of benzaldehyde and formaldehyde is treated with concentrated $(50\\%)$ aqueous $\\text{NaOH}$ (Crossed Cannizzaro condition) in [${meta.chapter}]. What are the major products isolated after acidification?`;
          ans = `Benzyl alcohol and Sodium formate`;
          d = [`Sodium benzoate and Methanol`, `Benzyl alcohol and Methanol`, `Benzoic acid and Formic acid`];
          sol = `Formaldehyde has no $\\alpha$-hydrogens and is far more electrophilic than benzaldehyde. Nucleophilic addition of $\\text{OH}^-$ occurs rapidly on formaldehyde, forming an intermediate that transfers hydride $(\\text{H}^-)$ to benzaldehyde. Formaldehyde is oxidized to sodium formate, and benzaldehyde is reduced to benzyl alcohol.`;
          break;

        default: // CHM-AMN
          q = `In [${meta.chapter}], aniline is subjected to diazotization with $\\text{NaNO}_2 + \\text{HCl}$ at $0-5^\\circ\\text{C}$ to form $[A]$. Reaction of $[A]$ with $\\text{CuCN}$ yields $[B]$, which upon complete acidic hydrolysis gives $[C]$. Reduction of $[C]$ with $\\text{LiAlH}_4$ yields what final product $[D]$?`;
          ans = `Benzyl alcohol`;
          d = [`Benzoic acid`, `Benzylamine`, `Benzaldehyde`];
          sol = `Diazotization gives benzenediazonium chloride $[A]$. Sandmeyer cyanidation gives benzonitrile $[B]$. Acidic hydrolysis of the cyano group gives benzoic acid $[C]$. Strong reduction of benzoic acid by $\\text{LiAlH}_4$ yields benzyl alcohol $[D]$.`;
          break;
      }

      const { options, correctAnswer } = makeOptionSet(ans, d, index);
      return {
        topic,
        category: cat,
        difficulty,
        question: q,
        options,
        correctAnswer,
        solution: sol,
        explanation: `Deduce using established organic reaction mechanisms in ${meta.chapter}.`,
        possibleErrorType: errorType,
        isReactionBased: true,
        image: null,
      };
    } else {
      // Organic reaction integer question
      const cat = `${meta.chapter} :: Stoichiometric Reaction Calculation`;
      let q = '';
      let ans = 0;
      let sol = '';

      switch (meta.code) {
        case 'CHM-GOC':
          q = `How many structural and geometrical isomers (excluding stereoisomers) exist for the acyclic alkene formula $\\text{C}_4\\text{H}_8$ in [${meta.chapter}]?`;
          ans = 4;
          sol = `The acyclic isomers of $\\text{C}_4\\text{H}_8$ are: but-1-ene, cis-but-2-ene, trans-but-2-ene, and 2-methylprop-1-ene (isobutylene). Total $= 4$.`;
          break;

        case 'CHM-HYD':
          q = `How many moles of $\\text{H}_2$ gas are absorbed per mole of phenylacetylene $(\\text{C}_6\\text{H}_5-\\text{C}\\equiv\\text{CH})$ during complete catalytic hydrogenation over nickel to form ethylbenzene in [${meta.chapter}]?`;
          ans = 2;
          sol = `Reduction of the terminal alkyne $(-\\text{C}\\equiv\\text{CH})$ to an ethyl group $(-\\text{CH}_2\\text{CH}_3)$ consumes exactly $2\\text{ moles of }\\text{H}_2$ per mole of compound.`;
          break;

        case 'CHM-HAL':
          q = `Addition of $\\text{HBr}$ in the presence of benzoyl peroxide to 3-methylpent-1-ene in [${meta.chapter}] gives 1-bromo-3-methylpentane. How many chiral carbon centers are present in this addition product?`;
          ans = 1;
          sol = `The structure is $\\text{BrCH}_2-\\text{CH}_2-\\text{C}^*\\text{H}(\\text{CH}_3)-\\text{CH}_2\\text{CH}_3$. Carbon-3 has four distinct groups $(-\\text{H}, -\\text{CH}_3, -\\text{C}_2\\text{H}_5, -\\text{CH}_2\\text{CH}_2\\text{Br})$, making it the single chiral center ($1$).`;
          break;

        case 'CHM-ALC':
          q = `In [${meta.chapter}], one mole of glycerol $(\\text{CH}_2\\text{OH}-\\text{CHOH}-\\text{CH}_2\\text{OH})$ reacts completely with excess periodic acid $(\\text{HIO}_4)$. How many moles of formaldehyde $(\\text{HCHO})$ are formed?`;
          ans = 2;
          sol = `Periodic acid cleaves vicinal diols. Cleavage of the two $\\text{C-C}$ bonds consumes $2\\text{ moles of }\\text{HIO}_4$ to yield $2\\text{ moles of }\\text{HCHO}$ from the terminal carbons and $1\\text{ mole of }\\text{HCOOH}$ from the central carbon.`;
          break;

        case 'CHM-ALD':
          q = `In [${meta.chapter}], how many moles of $\\text{NaOH}$ are consumed in the complete haloform reaction of one mole of acetone $(\\text{CH}_3\\text{COCH}_3)$ with iodine to form iodoform and sodium acetate?`;
          ans = 4;
          sol = `The balanced equation is: $\\text{CH}_3\\text{COCH}_3 + 3\\text{I}_2 + 4\\text{NaOH} \\longrightarrow \\text{CHI}_3\\downarrow + \\text{CH}_3\\text{COONa} + 3\\text{NaI} + 3\\text{H}_2\\text{O}$. Exactly $4$ moles of $\\text{NaOH}$ are consumed.`;
          break;

        default: // CHM-AMN
          q = `In [${meta.chapter}], an aliphatic primary amide on treatment with bromine and aqueous $\\text{KOH}$ (Hoffmann degradation) yields an amine containing $3$ carbon atoms. How many carbon atoms were present in the precursor amide?`;
          ans = 4;
          sol = `Hoffmann bromamide degradation eliminates the carbonyl carbon as carbonate: $\\text{R-CONH}_2 \\to \\text{R-NH}_2$. If the product amine has 3 carbon atoms, the starting amide had $3 + 1 = 4$ carbon atoms (butanamide).`;
          break;
      }

      return {
        topic,
        category: cat,
        difficulty: 'hard' as DifficultyLevel,
        question: q,
        correctAnswer: ans,
        solution: sol,
        explanation: `Solve using reaction stoichiometry in ${meta.chapter}.`,
        possibleErrorType: 'Conceptual mistake' as ErrorCategory,
        isReactionBased: true,
        image: null,
      };
    }
  }

  // PHYSICAL & INORGANIC CHEMISTRY
  if (type === 'mcq') {
    let q = '';
    let ans = '';
    let d: [string, string, string] = ['', '', ''];
    let sol = '';
    let isRx = false;
    const cat = `${meta.chapter} :: Quantitative & Structural Chemistry (Type ${index % 5 + 1})`;

    switch (meta.code) {
      case 'CHM-MOL':
        q = `In [${meta.chapter}], a $100\\text{ mL}$ mixture of $0.1\\text{ M } \\text{FeSO}_4$ and $0.1\\text{ M } \\text{Fe}_2(\\text{SO}_4)_3$ is completely oxidized in acidic medium. What volume (in $\\text{mL}$) of $0.02\\text{ M } \\text{KMnO}_4$ is required?`;
        ans = `$100\\text{ mL}$`;
        d = [`$200\\text{ mL}$`, `$50\\text{ mL}$`, `$150\\text{ mL}$`];
        sol = `Only $\\text{Fe}^{2+}$ is oxidized by $\\text{KMnO}_4$. Moles of $\\text{Fe}^{2+} = 0.1\\text{ L} \\times 0.1\\text{ M} = 0.01\\text{ mol}$. Equivalents of $\\text{Fe}^{2+} = 0.01 \\times 1 = 0.01$. In acidic medium, $\\text{Mn}^{7+} + 5e^- \\to \\text{Mn}^{2+}$ ($n$-factor $= 5$). Normality of $\\text{KMnO}_4 = 0.02 \\times 5 = 0.1\\text{ N}$. Volume required $= \\frac{0.01\\text{ eq}}{0.1\\text{ N}} = 0.1\\text{ L} = 100\\text{ mL}$.`;
        isRx = true;
        break;

      case 'CHM-ATM':
        q = `For the $3d_{z^2}$ atomic orbital of a hydrogen-like atom in [${meta.chapter}], what are the numbers of radial nodes and angular nodes respectively?`;
        ans = `$0$ radial nodes and $2$ angular nodes`;
        d = [`$1$ radial node and $1$ angular node`, `$2$ radial nodes and $0$ angular nodes`, `$0$ radial nodes and $0$ angular nodes`];
        sol = `For a $3d$ orbital: principal quantum number $n = 3$, azimuthal quantum number $l = 2$. Radial nodes $= n - l - 1 = 3 - 2 - 1 = 0$. Angular nodes $= l = 2$ (conical nodal surfaces).`;
        break;

      case 'CHM-BND':
        q = `According to Molecular Orbital Theory in [${meta.chapter}], which of the following diatomic species has a bond order of $2.5$ and is paramagnetic with one unpaired electron?`;
        ans = `$\\text{O}_2^+$`;
        d = [`$\\text{N}_2^+$`, `$\\text{O}_2^{2-}$`, `$\\text{NO}^+$`];
        sol = `$\\text{O}_2^+$ has 15 electrons. Configuration: $\\sigma_{1s}^2 \\sigma_{1s}^{*2} \\sigma_{2s}^2 \\sigma_{2s}^{*2} \\sigma_{2p_z}^2 (\\pi_{2p_x}^2 = \\pi_{2p_y}^2) (\\pi_{2p_x}^{*1})$. Bond order $= \\frac{10 - 5}{2} = 2.5$. It has one unpaired electron in $\\pi^*$ and is paramagnetic.`;
        break;

      case 'CHM-THD':
        q = `For a reversible phase transition $\\text{H}_2\\text{O}(l) \\rightleftharpoons \\text{H}_2\\text{O}(g)$ at $100^\\circ\\text{C}$ and $1\\text{ atm}$ in [${meta.chapter}], which of the following thermodynamic statements is strictly true?`;
        ans = `$\\Delta G = 0$ and $\\Delta S_{sys} = \\frac{\\Delta H_{vap}}{373.15}$`;
        d = [`$\\Delta G < 0$ and $\\Delta S_{sys} > 0$`, `$\\Delta G = 0$ and $\\Delta S_{sys} = 0$`, `$\\Delta H = 0$ and $\\Delta G = 0$`];
        sol = `At normal boiling point, liquid and vapor are in dynamic thermodynamic equilibrium at constant $T$ and $P$, so $\\Delta G = 0$. For a reversible process, $\\Delta S_{sys} = \\frac{\\Delta H_{rev}}{T} = \\frac{\\Delta H_{vap}}{373.15\\text{ K}}$.`;
        break;

      case 'CHM-SOL':
        q = `A weak monobasic organic acid $(\\text{HA})$ undergoes partial dimerization in benzene solution in [${meta.chapter}]: $2\\text{HA} \\rightleftharpoons (\\text{HA})_2$. If the degree of association is $\\alpha = 0.60$, what is the van 't Hoff factor $i$?`;
        ans = `$0.70$`;
        d = [`$0.40$`, `$0.80$`, `$1.30$`];
        sol = `For association into an $n$-mer $(n=2)$: $i = 1 - \\alpha\\left(1 - \\frac{1}{n}\\right) = 1 - 0.60\\left(1 - \\frac{1}{2}\\right) = 1 - 0.30 = 0.70$.`;
        break;

      case 'CHM-EQL':
        q = `A buffer solution in [${meta.chapter}] contains $0.1\\text{ M}$ acetic acid $(\\text{p}K_a = 4.74)$ and $0.1\\text{ M}$ sodium acetate. If $0.02\\text{ moles}$ of solid $\\text{NaOH}$ are added to $1\\text{ L}$ of this buffer, what is the new $\\text{pH}$? $(\\log 1.5 = 0.18)$`;
        ans = `$4.92$`;
        d = [`$4.56$`, `$4.74$`, `$5.12$`];
        sol = `Added $\\text{OH}^-$ neutralizes acid: $[\\text{CH}_3\\text{COOH}] = 0.1 - 0.02 = 0.08\\text{ M}$, $[\\text{CH}_3\\text{COO}^-] = 0.1 + 0.02 = 0.12\\text{ M}$. By Henderson equation: $\\text{pH} = \\text{p}K_a + \\log\\frac{[\\text{salt}]}{[\\text{acid}]} = 4.74 + \\log\\frac{0.12}{0.08} = 4.74 + \\log(1.5) = 4.74 + 0.18 = 4.92$.`;
        break;

      case 'CHM-ELC':
        q = `In an electrochemical cell in [${meta.chapter}]: $\\text{Zn}(s) | \\text{Zn}^{2+}(0.01\\text{ M}) || \\text{Cu}^{2+}(0.1\\text{ M}) | \\text{Cu}(s)$ with $E^\\circ_{\\text{cell}} = 1.10\\text{ V}$. What is the cell potential $E_{\\text{cell}}$ at $298\\text{ K}$? $(\\text{Take } \\frac{2.303 RT}{F} = 0.059\\text{ V})$`;
        ans = `$1.13\\text{ V}$`;
        d = [`$1.07\\text{ V}$`, `$1.10\\text{ V}$`, `$1.16\\text{ V}$`];
        sol = `Nernst equation: $E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.059}{2}\\log\\frac{[\\text{Zn}^{2+}]}{[\\text{Cu}^{2+}]} = 1.10 - 0.0295\\log\\left(\\frac{0.01}{0.1}\\right) = 1.10 - 0.0295(-1) = 1.10 + 0.0295 \\approx 1.13\\text{ V}$.`;
        isRx = true;
        break;

      case 'CHM-KIN':
        q = `A first-order gaseous reaction $A(g) \\longrightarrow 2B(g) + C(g)$ in [${meta.chapter}] starts with pure $A$ at initial pressure $P_0$. After time $t$, total pressure is $P_t$. What is the expression for rate constant $k$?`;
        ans = `$k = \\frac{1}{t}\\ln\\frac{2 P_0}{3 P_0 - P_t}$`;
        d = [`$k = \\frac{1}{t}\\ln\\frac{P_0}{P_t - P_0}$`, `$k = \\frac{1}{t}\\ln\\frac{P_0}{2 P_0 - P_t}$`, `$k = \\frac{1}{t}\\ln\\frac{3 P_0}{3 P_0 - P_t}$`];
        sol = `At time $t$: $P_A = P_0 - x$, $P_B = 2x$, $P_C = x$. Total pressure $P_t = P_0 - x + 2x + x = P_0 + 2x \\implies x = \\frac{P_t - P_0}{2}$. Then $P_A = P_0 - \\frac{P_t - P_0}{2} = \\frac{3P_0 - P_t}{2}$. For first order, $k = \\frac{1}{t}\\ln\\frac{P_0}{P_A} = \\frac{1}{t}\\ln\\frac{2P_0}{3P_0 - P_t}$.`;
        break;

      case 'CHM-CRD':
        q = `The octahedral complex $[\\text{Co}(\\text{en})_2\\text{Cl}_2]^+$ in [${meta.chapter}] exists as cis and trans geometrical isomers. Which of the following statements is strictly correct regarding their optical activity?`;
        ans = `The cis-isomer is chiral and optically active; the trans-isomer possesses a center of inversion and is optically inactive`;
        d = [`Both cis and trans isomers are optically active`, `Both cis and trans isomers are optically inactive`, `The trans-isomer is optically active and cis is inactive`];
        sol = `The trans-isomer has an inversion center (and mirror plane) and is achiral (optically inactive). The cis-isomer has no plane or center of inversion ($C_2$ symmetry) and exists as a pair of non-superimposable enantiomers (optically active).`;
        break;

      default:
        q = `In [${meta.chapter}], how does the basicity and reducing nature of orthophosphorous acid $(\\text{H}_3\\text{PO}_3)$ compare to orthophosphoric acid $(\\text{H}_3\\text{PO}_4)$?`;
        ans = `$\\text{H}_3\\text{PO}_3$ is dibasic and a strong reducing agent due to one $\\text{P-H}$ bond; $\\text{H}_3\\text{PO}_4$ is tribasic and non-reducing`;
        d = [`Both are tribasic and non-reducing`, `$\\text{H}_3\\text{PO}_3$ is tribasic and reducing`, `$\\text{H}_3\\text{PO}_3$ is monobasic and non-reducing`];
        sol = `$\\text{H}_3\\text{PO}_3$ has tetrahedral coordination with two ionizable $-\\text{OH}$ groups (dibasic) and one direct $\\text{P-H}$ bond that imparts strong reducing properties. $\\text{H}_3\\text{PO}_4$ has three $-\\text{OH}$ groups (tribasic) and no $\\text{P-H}$ bond (non-reducing).`;
        isRx = true;
        break;
    }

    const { options, correctAnswer } = makeOptionSet(ans, d, index);
    return {
      topic,
      category: cat,
      difficulty,
      question: q,
      options,
      correctAnswer,
      solution: sol,
      explanation: `Analyze using fundamental chemical principles in ${meta.chapter}.`,
      possibleErrorType: errorType,
      isReactionBased: isRx,
      image: null,
    };
  } else {
    // Non-organic integer chemistry
    let q = '';
    let ans = 0;
    let sol = '';
    let isRx = false;

    switch (meta.code) {
      case 'CHM-MOL':
        q = `How many moles of electrons are transferred per mole of dichromate ion $(\\text{Cr}_2\\text{O}_7^{2-})$ during its complete reduction to $\\text{Cr}^{3+}$ in acidic medium in [${meta.chapter}]?`;
        ans = 6;
        sol = `Each $\\text{Cr}$ atom changes oxidation state from $+6$ to $+3$ (3 electrons). For $\\text{Cr}_2\\text{O}_7^{2-}$ containing two chromium atoms, total electrons transferred $= 2 \\times 3 = 6$.`;
        isRx = true;
        break;

      case 'CHM-BND':
        q = `In [${meta.chapter}], what is the number of lone pairs of electrons located on the central xenon atom in xenon tetrafluoride $(\\text{XeF}_4)$?`;
        ans = 2;
        sol = `Xenon has 8 valence electrons. Four form single bonds with fluorine atoms, leaving $8 - 4 = 4$ non-bonding electrons, which correspond to $2$ lone pairs (square planar geometry, $sp^3d^2$).`;
        break;

      case 'CHM-CRD':
        q = `What is the spin-only magnetic moment (in Bohr Magnetons, rounded to the nearest integer) of the high-spin complex ion $[\\text{Fe}(\\text{H}_2\\text{O})_6]^{3+}$ in [${meta.chapter}]? (Take $\\sqrt{35} \\approx 6$)`;
        ans = 6;
        sol = `$\\text{Fe}^{3+}$ has $d^5$ electron configuration. Since $\\text{H}_2\\text{O}$ is a weak-field ligand, it forms a high-spin complex with $n = 5$ unpaired electrons. $\\mu = \\sqrt{5(5 + 2)} = \\sqrt{35} \\approx 5.92\\text{ BM} \\approx 6$.`;
        break;

      default:
        q = `What is the basicity (number of ionizable hydrogen atoms per molecule) of pyrophosphoric acid $(\\text{H}_4\\text{P}_2\\text{O}_7)$ in [${meta.chapter}]?`;
        ans = 4;
        sol = `Pyrophosphoric acid contains two tetrahedral phosphorus atoms connected by a $\\text{P-O-P}$ bridge, with four $-\\text{OH}$ groups attached directly to phosphorus. All four hydrogens are acidic, so its basicity is $4$.`;
        break;
    }

    return {
      topic,
      category: `${meta.chapter} :: Quantitative Chemistry`,
      difficulty: 'hard' as DifficultyLevel,
      question: q,
      correctAnswer: ans,
      solution: sol,
      explanation: `Calculate using quantitative laws in ${meta.chapter}.`,
      possibleErrorType: 'Calculation mistake' as ErrorCategory,
      isReactionBased: isRx,
      image: null,
    };
  }
}

// -------------------------------------------------------------
// MATHEMATICS GENERATOR (Customized per chapter code)
// -------------------------------------------------------------
function buildMathQuestion(meta: ChapterMeta, index: number, type: 'mcq' | 'integer') {
  const topic = meta.topics[index % meta.topics.length];
  const difficulties: DifficultyLevel[] = ['hard', 'medium', 'hard', 'medium', 'hard', 'easy'];
  const difficulty = difficulties[index % difficulties.length];
  const errorType = ERROR_TYPES[(index + 2) % ERROR_TYPES.length];
  const k = 2 + (index % 4);

  if (meta.code === 'MAT-QUD') {
    // Quadratic Equations ONLY in MAT-QUD
    if (type === 'mcq') {
      const qArchetypes = [
        {
          cat: 'Location of Roots Inequalities',
          q: `In [${meta.chapter}], find the complete set of real values of parameter $a$ for which both roots of $x^2 - (a - ${k})x + a = 0$ are real and strictly greater than $2$.`,
          ans: `$a \\in [${k * 2 + 5}, ${k * 2 + 6})$`,
          d: [`$a \\in (${k * 2 + 5}, \\infty)$`, `$a \\in (2, ${k * 2 + 5}]$`, `$a \\in [4, ${k * 2 + 5})$`] as [string, string, string],
          sol: `Require $\\Delta \\ge 0$, vertex $> 2$, and $f(2) > 0$. Intersection gives $a \\in [${k * 2 + 5}, ${k * 2 + 6})$.`,
        },
        {
          cat: 'Common Roots Elimination',
          q: `If the quadratic equations $x^2 + a x + ${k} = 0$ and $x^2 + ${k} x + a = 0$ have a common non-zero real root in [${meta.chapter}], find the value of $(a + ${k})^2$.`,
          ans: `1`,
          d: [`$${k * k}$`, `$0$`, `$4$`] as [string, string, string],
          sol: `Subtracting the equations: $(a - ${k})x + (${k} - a) = 0 \\implies (a - ${k})(x - 1) = 0$. Since $a \\ne ${k}$, $x = 1$. Substituting into $x^2 + ax + ${k} = 0$: $1 + a + ${k} = 0 \\implies a = -(${k} + 1)$. Then $(a + ${k})^2 = (-1)^2 = 1$.`,
        },
        {
          cat: 'Rational Expression Range Analysis',
          q: `In [${meta.chapter}], if $x$ is real, what is the range of values taken by the rational function $f(x) = \\frac{x^2 - 2x + ${k * 2}}{x^2 + 2x + ${k * 2}}$?`,
          ans: `Bounded closed interval in $\\mathbb{R}^+$`,
          d: [`$(0, \\infty)$`, `$[-1, 1]$`, `$[0, 1]$`] as [string, string, string],
          sol: `Set $y = \\frac{x^2 - 2x + 2k}{x^2 + 2x + 2k} \\implies (y - 1)x^2 + 2(y + 1)x + 2k(y - 1) = 0$. For real $x$, $\\Delta \\ge 0$. Solving gives the bounded range.`,
        },
        {
          cat: 'Modulus Roots & Intersection Multiplicity',
          q: `In [${meta.chapter}], find the number of distinct real roots of the equation $|x^2 - ${k * 2}x + ${k * 2 - 1}| = ${k}$.`,
          ans: `$4$ distinct real roots`,
          d: [`$2$ distinct real roots`, `$3$ distinct real roots`, `$0$ real roots`] as [string, string, string],
          sol: `The vertex of the inverted parabola lies at $(k, -1)$ with height $1$. The horizontal line $y = ${k}$ intersects the outer branches twice and the inner reflected branch twice, giving exactly $4$ real roots.`,
        },
        {
          cat: 'Symmetric Roots & Higher Powers',
          q: `Let $\\alpha$ and $\\beta$ be the roots of $x^2 - ${k + 2}x + 1 = 0$ in [${meta.chapter}]. What is the exact value of $\\alpha^3 + \\beta^3$?`,
          ans: `$${(k + 2) ** 3 - 3 * (k + 2)}$`,
          d: [`$${(k + 2) ** 3}$`, `$${(k + 2) ** 3 - (k + 2)}$`, `$${(k + 2) ** 2 - 2}$`] as [string, string, string],
          sol: `$\\alpha + \\beta = ${k + 2}$ and $\\alpha\\beta = 1$. $\\alpha^3 + \\beta^3 = (\\alpha + \\beta)^3 - 3\\alpha\\beta(\\alpha + \\beta) = (${k + 2})^3 - 3(1)(${k + 2}) = ${(k + 2) ** 3 - 3 * (k + 2)}$.`,
        },
        {
          cat: 'Transformation of Roots Formulations',
          q: `In [${meta.chapter}], if $\\alpha$ and $\\beta$ are the roots of $a x^2 + b x + c = 0$, which equation has roots $\\frac{1}{\\alpha + ${k}}$ and $\\frac{1}{\\beta + ${k}}$?`,
          ans: `$c y^2 + (b - 2 a k) y + a = 0$ with shift substitution`,
          d: [`$a y^2 + b y + c = 0$`, `$c y^2 - b y + a = 0$`, `$a k^2 y^2 + b y + c = 0$`] as [string, string, string],
          sol: `Let $y = \\frac{1}{x + k} \\implies x = \\frac{1}{y} - k = \\frac{1 - k y}{y}$. Substituting into $a x^2 + b x + c = 0$ yields the transformed equation in $y$.`,
        },
      ];

      const item = qArchetypes[index % qArchetypes.length];
      const { options, correctAnswer } = makeOptionSet(item.ans, item.d, index);
      return {
        topic,
        category: `${meta.chapter} :: ${item.cat}`,
        difficulty,
        question: item.q,
        options,
        correctAnswer,
        solution: item.sol,
        explanation: `Solve using quadratic theory in ${meta.chapter}.`,
        possibleErrorType: errorType,
        image: null,
      };
    } else {
      const intArchetypes = [
        {
          cat: 'Newton Sums Recurrence',
          q: `Let $\\alpha$ and $\\beta$ be the roots of $x^2 - 6x - 2 = 0$ in [${meta.chapter}]. If $a_n = \\alpha^n - \\beta^n$ for $n \\ge 1$, evaluate the integer value of $\\frac{a_{10} - 2 a_8}{2 a_9}$.`,
          ans: 3,
          sol: `$\\alpha^2 - 6\\alpha - 2 = 0 \\implies a_{10} - 6a_9 - 2a_8 = 0 \\implies a_{10} - 2a_8 = 6a_9 \\implies \\frac{a_{10} - 2a_8}{2a_9} = 3$.`,
        },
        {
          cat: 'Number of Integral Values of Parameter',
          q: `Find the number of integral values of parameter $k$ for which both roots of $x^2 - 2 k x + k^2 - 1 = 0$ lie strictly between $-2$ and $4$ in [${meta.chapter}].`,
          ans: 3,
          sol: `Roots are $x = k \\pm 1$. We need $-2 < k - 1$ and $k + 1 < 4 \\implies -1 < k < 3$. The integral values are $k \\in \\{0, 1, 2\\}$ (total $3$).`,
        },
        {
          cat: 'Minimum Value of Quadratic on Bounded Interval',
          q: `Find the minimum value of $f(x) = x^2 - 4x + 9$ on the closed interval $[0, 5]$ in [${meta.chapter}].`,
          ans: 5,
          sol: `Vertex is at $x = -b/(2a) = 2 \\in [0, 5]$. Minimum value is $f(2) = 4 - 8 + 9 = 5$.`,
        },
        {
          cat: 'Count of Real Roots for Absolute Quadratic',
          q: `Find the total number of distinct real solutions to the equation $(x - 1)^2 - 5|x - 1| + 6 = 0$ in [${meta.chapter}].`,
          ans: 4,
          sol: `Let $t = |x - 1| \\ge 0$. Equation is $t^2 - 5t + 6 = 0 \\implies (t - 2)(t - 3) = 0 \\implies t = 2$ or $t = 3$. For $t = 2$, $|x - 1| = 2 \\implies x = 3, -1$. For $t = 3$, $|x - 1| = 3 \\implies x = 4, -2$. Total $= 4$ real solutions.`,
        },
        {
          cat: 'Common Root Magnitude Evaluation',
          q: `If $x^2 + 3x + 2 = 0$ and $x^2 + 5x + 6 = 0$ have a common root $\\alpha$ in [${meta.chapter}], evaluate the positive integer value of $\\alpha^2$.`,
          ans: 4,
          sol: `Roots of $x^2 + 3x + 2 = 0$ are $-1, -2$. Roots of $x^2 + 5x + 6 = 0$ are $-2, -3$. Common root is $\\alpha = -2$. Then $\\alpha^2 = (-2)^2 = 4$.`,
        },
        {
          cat: 'Discriminant Zero Tangency Condition',
          q: `For how many integer values of $c$ does the line $y = 2x + c$ touch the parabola $y = x^2 + 4x + 5$ in [${meta.chapter}]?`,
          ans: 1,
          sol: `$x^2 + 4x + 5 = 2x + c \\implies x^2 + 2x + (5 - c) = 0$. For tangency $\\Delta = 0 \\implies 4 - 4(5 - c) = 0 \\implies 4 - 20 + 4c = 0 \\implies 4c = 16 \\implies c = 4$. Exactly $1$ integer value.`,
        },
      ];

      const item = intArchetypes[index % intArchetypes.length];
      return {
        topic,
        category: `${meta.chapter} :: ${item.cat}`,
        difficulty: 'hard' as DifficultyLevel,
        question: item.q,
        correctAnswer: item.ans,
        solution: item.sol,
        explanation: `Solve using quadratic conditions in ${meta.chapter}.`,
        possibleErrorType: 'Calculation mistake' as ErrorCategory,
        image: null,
      };
    }
  }

  // Non-quadratic Mathematics chapters
  if (type === 'mcq') {
    let q = '';
    let ans = '';
    let d: [string, string, string] = ['', '', ''];
    let sol = '';
    const cat = `${meta.chapter} :: Advanced Mathematical Structure (Type ${index % 5 + 1})`;

    switch (meta.code) {
      case 'MAT-SRF':
        q = `If a function $f: \\mathbb{R} \\setminus \\{0\\} \\to \\mathbb{R}$ in [${meta.chapter}] satisfies the functional equation $f(x) + 2 f\\left(\\frac{1}{x}\\right) = 3x$, what is the value of $f(2)$?`;
        ans = `$-1$`;
        d = [`$1$`, `$3$`, `$-\\frac{1}{2}$`];
        sol = `At $x = 2$: $f(2) + 2f(1/2) = 6$. At $x = 1/2$: $f(1/2) + 2f(2) = 3/2 \\implies 2f(1/2) + 4f(2) = 3$. Subtracting the first equation: $3f(2) = 3 - 6 = -3 \\implies f(2) = -1$.`;
        break;

      case 'MAT-CMP':
        q = `In [${meta.chapter}], if $|z - 3| = 2 |z + 3|$ for a complex number $z = x + iy$, what is the locus of $z$ in the complex Argand plane?`;
        ans = `A circle with center $(-5, 0)$ and radius $4$`;
        d = [`A circle with center $(5, 0)$ and radius $4$`, `A straight line parallel to the imaginary axis`, `An ellipse with foci at $(3, 0)$ and $(-3, 0)$`];
        sol = `Squaring: $(x - 3)^2 + y^2 = 4[(x + 3)^2 + y^2] \\implies x^2 - 6x + 9 + y^2 = 4(x^2 + 6x + 9 + y^2) \\implies 3x^2 + 3y^2 + 30x + 27 = 0 \\implies x^2 + y^2 + 10x + 9 = 0 \\implies (x + 5)^2 + y^2 = 16$. This is an Apollonius circle centered at $(-5, 0)$ with radius $4$.`;
        break;

      case 'MAT-MTX':
        q = `Let $A = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}$ in [${meta.chapter}]. By the Cayley-Hamilton theorem, $A^2 - 5A - 2I = 0$. What is the inverse matrix $A^{-1}$ expressed in terms of $A$ and $I$?`;
        ans = `$\\frac{1}{2}(A - 5I)$`;
        d = [`$\\frac{1}{2}(5I - A)$`, `$\\frac{1}{5}(A - 2I)$`, `$2(A - 5I)$`];
        sol = `Multiplying $A^2 - 5A - 2I = 0$ by $A^{-1}$ yields $A - 5I - 2A^{-1} = 0 \\implies 2A^{-1} = A - 5I \\implies A^{-1} = \\frac{1}{2}(A - 5I)$.`;
        break;

      case 'MAT-DET':
        q = `In [${meta.chapter}], consider the system of linear equations:
$x + y + z = 6,\\; x + 2y + 3z = 10,\\; x + 2y + \\lambda z = \\mu$.
For what values of parameters $\\lambda$ and $\\mu$ does this system have infinitely many solutions?`;
        ans = `$\\lambda = 3$ and $\\mu = 10$`;
        d = [`$\\lambda = 3$ and $\\mu \\ne 10$`, `$\\lambda \\ne 3$ and $\\mu = 10$`, `$\\lambda = 2$ and $\\mu = 8$`];
        sol = `Coefficient determinant is $\\Delta = \\begin{vmatrix} 1 & 1 & 1 \\\\ 1 & 2 & 3 \\\\ 1 & 2 & \\lambda \\end{vmatrix} = \\lambda - 3$. For infinite solutions, $\\Delta = 0 \\implies \\lambda = 3$. With $\\lambda = 3$, the third equation becomes identical to the second only if $\\mu = 10$.`;
        break;

      case 'MAT-PNC':
        q = `In [${meta.chapter}], four letters are to be placed randomly into four directed envelopes. How many permutations exist such that exactly two letters are placed in the correct envelopes while the other two letters are placed into incorrect envelopes?`;
        ans = `$6$`;
        d = [`$12$`, `$8$`, `$4$`];
        sol = `Number of ways to choose the two correctly placed envelopes is $\\binom{4}{2} = 6$. The remaining 2 letters must be deranged: $D_2 = 2!(1 - 1 + 1/2!) = 1$. Total outcomes $= 6 \\times 1 = 6$.`;
        break;

      case 'MAT-BIN':
        q = `What is the remainder when $7^{103}$ is divided by $25$ in [${meta.chapter}]?`;
        ans = `$18$`;
        d = [`$7$`, `$1$`, `$14$`];
        sol = `$7^2 = 49 = 50 - 1 = 2(25) - 1$. Then $7^{103} = 7 \\times (7^2)^{51} = 7 \\times (50 - 1)^{51} = 7 \\times (25k - 1) = 25k' - 7 = 25(k' - 1) + 18$. The remainder is $18$.`;
        break;

      case 'MAT-SNS':
        q = `Find the sum of the infinite arithmetico-geometric series (AGP) in [${meta.chapter}]:
$$S = 1 + \\frac{2}{3} + \\frac{3}{3^2} + \\frac{4}{3^3} + \\dots$$`;
        ans = `$\\frac{9}{4}$`;
        d = [`$\\frac{3}{2}$`, `$\\frac{9}{2}$`, `$2$`];
        sol = `$S = 1 + \\frac{2}{3} + \\frac{3}{9} + \\dots$ and $\\frac{1}{3}S = \\frac{1}{3} + \\frac{2}{9} + \\dots$. Subtracting gives $\\frac{2}{3}S = 1 + \\frac{1}{3} + \\frac{1}{9} + \\dots = \\frac{1}{1 - 1/3} = \\frac{3}{2} \\implies S = \\frac{3}{2} \\times \\frac{3}{2} = \\frac{9}{4}$.`;
        break;

      case 'MAT-LCD':
        q = `Evaluate the indeterminate limit in [${meta.chapter}]:
$$L = \\lim_{x \\to 0} \\left(\\frac{\\sin x}{x}\\right)^{1/x^2}$$`;
        ans = `$e^{-1/6}$`;
        d = [`$e^{-1/3}$`, `$1$`, `$e^{-1/2}$`];
        sol = `Form is $1^\\infty$. $L = \\exp\\left(\\lim_{x \\to 0} \\frac{\\frac{\\sin x}{x} - 1}{x^2}\\right) = \\exp\\left(\\lim_{x \\to 0} \\frac{\\sin x - x}{x^3}\\right)$. Taylor expansion gives $\\sin x = x - \\frac{x^3}{6} + O(x^5) \\implies \\lim \\frac{-x^3/6}{x^3} = -\\frac{1}{6}$. Hence $L = e^{-1/6}$.`;
        break;

      case 'MAT-INT':
        q = `Evaluate the definite integral using King's property in [${meta.chapter}]:
$$I = \\int_0^{\\pi} \\frac{x \\sin x}{1 + \\cos^2 x}\\,dx$$`;
        ans = `$\\frac{\\pi^2}{4}$`;
        d = [`$\\frac{\\pi^2}{2}$`, `$\\pi^2$`, `$\\frac{\\pi}{4}$`];
        sol = `Applying King's property $\\int_0^a f(x)dx = \\int_0^a f(a-x)dx$: $I = \\int_0^\\pi \\frac{(\\pi - x)\\sin x}{1 + \\cos^2 x}dx$. Adding gives $2I = \\pi \\int_0^\\pi \\frac{\\sin x}{1 + \\cos^2 x}dx$. Let $u = \\cos x, du = -\\sin x dx$: $2I = \\pi [-\\arctan u]_{-1}^1 = \\pi [\\frac{\\pi}{4} - (-\\frac{\\pi}{4})] = \\frac{\\pi^2}{2} \\implies I = \\frac{\\pi^2}{4}$.`;
        break;

      case 'MAT-DFE':
        q = `Find the integrating factor $\\text{IF}$ and general solution of the linear differential equation in [${meta.chapter}]:
$$\\frac{dy}{dx} + \\frac{2x}{1 + x^2} y = \\frac{1}{(1 + x^2)^2}$$`;
        ans = `$y(1 + x^2) = \\arctan x + C$`;
        d = [`$y(1 + x^2)^2 = x + C$`, `$y = (1 + x^2)\\arctan x + C$`, `$y = \\frac{\\arctan x + C}{1 + x}$`];
        sol = `Here $P(x) = \\frac{2x}{1 + x^2}$. The integrating factor is $\\text{IF} = e^{\\int \\frac{2x}{1+x^2}dx} = e^{\\ln(1 + x^2)} = 1 + x^2$. Multiplying gives $\\frac{d}{dx}[y(1 + x^2)] = \\frac{1}{1 + x^2} \\implies y(1 + x^2) = \\int \\frac{dx}{1 + x^2} = \\arctan x + C$.`;
        break;

      case 'MAT-CRD':
        q = `In [${meta.chapter}], find the equation of the radical axis of the two circles:
$S_1: x^2 + y^2 - 4x - 6y + 4 = 0 \\quad \\text{and} \\quad S_2: x^2 + y^2 + 2x + 4y - 6 = 0$.`;
        ans = `$6x + 10y - 10 = 0$`;
        d = [`$2x + 2y - 10 = 0$`, `$6x - 2y + 10 = 0$`, `$3x + 5y + 5 = 0$`];
        sol = `The equation of the radical axis is $S_1 - S_2 = 0 \\implies (-4x - 2x) + (-6y - 4y) + (4 - (-6)) = 0 \\implies -6x - 10y + 10 = 0 \\implies 6x + 10y - 10 = 0$.`;
        break;

      case 'MAT-CNC':
        q = `If the line $y = m x + c$ is a common tangent to the parabola $y^2 = 16x$ and the circle $x^2 + y^2 = 8$ in [${meta.chapter}], what is the value of $m^2$?`;
        ans = `$1$`;
        d = [`$2$`, `$\\frac{1}{2}$`, `$4$`];
        sol = `For parabola $y^2 = 4ax$ with $a = 4$, condition for tangency is $c = \\frac{a}{m} = \\frac{4}{m}$. For circle $x^2 + y^2 = r^2$ with $r = \\sqrt{8}$, condition is $c^2 = r^2(1 + m^2) = 8(1 + m^2)$. Equating gives $\\frac{16}{m^2} = 8(1 + m^2) \\implies 2 = m^2(1 + m^2) \\implies m^4 + m^2 - 2 = 0 \\implies (m^2 + 2)(m^2 - 1) = 0 \\implies m^2 = 1$.`;
        break;

      case 'MAT-3DG':
        q = `Find the shortest distance between the two skew lines in [${meta.chapter}]:
$$\\vec{r}_1 = (\\hat{i} + 2\\hat{j} + 3\\hat{k}) + \\lambda(\\hat{i} - 3\\hat{j} + 2\\hat{k}) \\quad \\text{and} \\quad \\vec{r}_2 = (4\\hat{i} + 5\\hat{j} + 6\\hat{k}) + \\mu(2\\hat{i} + 3\\hat{j} + \\hat{k})$$`;
        ans = `$\\frac{3}{\\sqrt{19}}$`;
        d = [`$\\frac{6}{\\sqrt{19}}$`, `$\\frac{9}{\\sqrt{19}}$`, `$0$`];
        sol = `$\\vec{a}_2 - \\vec{a}_1 = 3\\hat{i} + 3\\hat{j} + 3\\hat{k}$. Cross product $\\vec{b}_1 \\times \\vec{b}_2 = \\begin{vmatrix} \\hat{i} & \\hat{j} & \\hat{k} \\\\ 1 & -3 & 2 \\\\ 2 & 3 & 1 \\end{vmatrix} = -9\\hat{i} + 3\\hat{j} + 9\\hat{k}$. Shortest distance $d = \\frac{|(\\vec{a}_2 - \\vec{a}_1)\\cdot(\\vec{b}_1 \\times \\vec{b}_2)|}{|\\vec{b}_1 \\times \\vec{b}_2|} = \\frac{|-27 + 9 + 27|}{\\sqrt{81 + 9 + 81}} = \\frac{9}{\\sqrt{171}} = \\frac{9}{3\\sqrt{19}} = \\frac{3}{\\sqrt{19}}$.`;
        break;

      case 'MAT-VEC':
        q = `Let $\\vec{a}, \\vec{b}, \\vec{c}$ be three non-coplanar vectors in [${meta.chapter}]. What is the simplified value of the scalar expression:
$$[(\\vec{a} + \\vec{b}) \\; (\\vec{b} + \\vec{c}) \\; (\\vec{c} + \\vec{a})]$$`;
        ans = `$2 [\\vec{a} \\; \\vec{b} \\; \\vec{c}]$`;
        d = [`$[\\vec{a} \\; \\vec{b} \\; \\vec{c}]$`, `$0$`, `$4 [\\vec{a} \\; \\vec{b} \\; \\vec{c}]$`];
        sol = `Expand the scalar triple product: $(\\vec{a} + \\vec{b}) \\cdot [(\\vec{b} + \\vec{c}) \\times (\\vec{c} + \\vec{a})] = (\\vec{a} + \\vec{b}) \\cdot [\\vec{b} \\times \\vec{c} + \\vec{b} \\times \\vec{a} + \\vec{c} \\times \\vec{a}] = [\\vec{a} \\; \\vec{b} \\; \\vec{c}] + [\\vec{b} \\; \\vec{c} \\; \\vec{a}] = 2 [\\vec{a} \\; \\vec{b} \\; \\vec{c}]$.`;
        break;

      case 'MAT-PRB':
        q = `In [${meta.chapter}], an urn contains $4$ white and $6$ black balls. A second urn contains $5$ white and $5$ black balls. One ball is transferred at random from the first urn to the second urn, and then a ball is drawn from the second urn. What is the probability that the drawn ball is white?`;
        ans = `$\\frac{27}{55}$`;
        d = [`$\\frac{1}{2}$`, `$\\frac{23}{55}$`, `$\\frac{29}{55}$`];
        sol = `By total probability: $P(W) = P(W|W_1)P(W_1) + P(W|B_1)P(B_1) = \\left(\\frac{6}{11}\\right)\\left(\\frac{4}{10}\\right) + \\left(\\frac{5}{11}\\right)\\left(\\frac{6}{10}\\right) = \\frac{24 + 30}{110} = \\frac{54}{110} = \\frac{27}{55}$.`;
        break;

      case 'MAT-TRG':
        q = `Evaluate the exact value of the expression in [${meta.chapter}]:
$$\\tan\\left(2 \\arctan\\left(\\frac{1}{3}\\right) + \\arctan\\left(\\frac{1}{7}\\right)\\right)$$`;
        ans = `$1$`;
        d = [`$\\frac{1}{\\sqrt{3}}$`, `$\\sqrt{3}$`, `$\\frac{4}{3}$`];
        sol = `$2 \\arctan(1/3) = \\arctan\\left(\\frac{2/3}{1 - 1/9}\\right) = \\arctan\\left(\\frac{2/3}{8/9}\\right) = \\arctan\\left(\\frac{3}{4}\\right)$. Then $\\arctan(3/4) + \\arctan(1/7) = \\arctan\\left(\\frac{3/4 + 1/7}{1 - (3/4)(1/7)}\\right) = \\arctan\\left(\\frac{25/28}{25/28}\\right) = \\arctan(1) = \\frac{\\pi}{4}$. Thus the tangent is $\\tan(\\pi/4) = 1$.`;
        break;

      default: // MAT-MRL
        q = `Which of the following compound propositions is a logical tautology in [${meta.chapter}]?`;
        ans = `$(p \\implies q) \\lor (q \\implies p)$`;
        d = [`$(p \\land q) \\implies (p \\lor q)$ is false`, `$(p \\implies q) \\land (q \\implies p)$`, `$p \\land \\neg p$`];
        sol = `$(p \\implies q) \\lor (q \\implies p) \\equiv (\\neg p \\lor q) \\lor (\\neg q \\lor p) \\equiv (\\neg p \\lor p) \\lor (\\neg q \\lor q) \\equiv T \\lor T \\equiv T$. It is always true regardless of the truth values of $p$ and $q$, making it a tautology.`;
        break;
    }

    const { options, correctAnswer } = makeOptionSet(ans, d, index);
    return {
      topic,
      category: cat,
      difficulty,
      question: q,
      options,
      correctAnswer,
      solution: sol,
      explanation: `Solve using rigorous mathematical proofs and transformations in ${meta.chapter}.`,
      possibleErrorType: errorType,
      image: null,
    };
  } else {
    // Non-quadratic Mathematics Integers
    let q = '';
    let ans = 0;
    let sol = '';

    switch (meta.code) {
      case 'MAT-MTX':
        q = `Let $A$ be a $3 \\times 3$ invertible matrix with determinant $|A| = 2$ in [${meta.chapter}]. What is the integer value of $|\\text{adj}(\\text{adj}(A))|$?`;
        ans = 16;
        sol = `For an $n \\times n$ matrix, $|\\text{adj}(\\text{adj}(A))| = |A|^{(n-1)^2}$. For $n = 3$, $(3 - 1)^2 = 4$. Thus $|A|^4 = 2^4 = 16$.`;
        break;

      case 'MAT-INT':
        q = `Find the integer area of the region bounded by the parabola $y = 3x^2$ and the horizontal line $y = 12$ in [${meta.chapter}].`;
        ans = 32;
        sol = `Intersection points: $3x^2 = 12 \\implies x^2 = 4 \\implies x = \\pm 2$. Due to symmetry about the y-axis, the enclosed area is $A = 2 \\int_0^2 (12 - 3x^2)\\,dx = 2 [12x - x^3]_0^2 = 2(24 - 8) = 2(16) = 32$.`;
        break;

      case 'MAT-VEC':
        q = `If $\\vec{a} = \\hat{i} + \\hat{j} + \\hat{k}$, $\\vec{b} = \\hat{i} - \\hat{j} + \\hat{k}$, and $\\vec{c} = \\hat{i} + 2\\hat{j} - \\hat{k}$ in [${meta.chapter}], calculate the integer scalar triple product $[\\vec{a}\\; \\vec{b}\\; \\vec{c}]$.`;
        ans = 4;
        sol = `$[\\vec{a}\\; \\vec{b}\\; \\vec{c}] = \\begin{vmatrix} 1 & 1 & 1 \\\\ 1 & -1 & 1 \\\\ 1 & 2 & -1 \\end{vmatrix} = 1(1 - 2) - 1(-1 - 1) + 1(2 - (-1)) = -1 + 2 + 3 = 4$.`;
        break;

      default:
        q = `Evaluate the integer value of the limit in [${meta.chapter}]:
$$\\lim_{x \\to 0} \\frac{x - \\sin x}{x^3} \\times 6$$`;
        ans = 1;
        sol = `Using Taylor series $\\sin x = x - \\frac{x^3}{6} + O(x^5)$, we have $\\frac{x - \\sin x}{x^3} = \\frac{1}{6} + O(x^2) \\to \\frac{1}{6}$. Multiplied by $6$, the value is $1$.`;
        break;
    }

    return {
      topic,
      category: `${meta.chapter} :: Quantitative Deduction`,
      difficulty: 'hard' as DifficultyLevel,
      question: q,
      correctAnswer: ans,
      solution: sol,
      explanation: `Derive using rigorous mathematical theorems in ${meta.chapter}.`,
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

  const SCHEMA_VERSION = 'v6-hard-mode-authentic';

  // Check if already seeded with v5 hard mode questions
  const sampleCheckFile = path.join(chemistryDir, 'aldehydes-ketones-carboxylic-acids.json');
  if (fs.existsSync(sampleCheckFile)) {
    try {
      const sampleParsed = JSON.parse(fs.readFileSync(sampleCheckFile, 'utf-8'));
      if (sampleParsed.schemaVersion === SCHEMA_VERSION) {
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
        isReactionBased: (qData as any).isReactionBased || false,
        image: (qData as any).image || null,
        source: 'question_bank',
        tags: [
          'JEE Main',
          'JEE Advanced',
          meta.chapter,
          qData.topic,
          (qData as any).isReactionBased ? 'reaction-based' : 'conceptual',
        ],
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
        isReactionBased: (qData as any).isReactionBased || false,
        image: null,
        source: 'question_bank',
        tags: [
          'JEE Main',
          'Numerical',
          meta.chapter,
          qData.topic,
          (qData as any).isReactionBased ? 'reaction-based' : 'numerical',
        ],
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
          schemaVersion: SCHEMA_VERSION,
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
