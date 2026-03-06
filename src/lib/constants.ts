export function getSubjectClass(subject: string) {
  switch (subject) {
    case 'Physics': return 'subject-physics';
    case 'Chemistry': return 'subject-chemistry';
    case 'Mathematics': return 'subject-mathematics';
    default: return 'bg-muted';
  }
}

export const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'] as const;

export const CHAPTERS: Record<string, string[]> = {
  Physics: [
    'Units & Measurements', 'Kinematics', 'Laws of Motion', 'Work Energy Power',
    'Rotational Motion & Centre of Mass', 'Gravitation', 'Properties of Solids/Liquids',
    'Thermodynamics & Kinetic Theory', 'Oscillations & Waves', 'Electrostatics',
    'Current Electricity', 'Magnetism & Matter', 'Electromagnetic Induction & AC',
    'Electromagnetic Waves', 'Ray/Wave Optics', 'Dual Nature Atoms Nuclei', 'Semiconductors',
  ],
  Chemistry: [
    // Physical
    'Basic Concepts/Mole Concept', 'Atomic Structure', 'Chemical Bonding', 'States of Matter',
    'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Solutions', 'Electrochemistry',
    'Chemical Kinetics', 'Surface Chemistry',
    // Inorganic
    'Periodic Table/Classification', 'p-Block Elements', 'd/f-Block & Coordination Compounds',
    // Organic
    'GOC Basics', 'Hydrocarbons', 'Haloalkanes/Haloarenes', 'Alcohols Phenols Ethers',
    'Aldehydes Ketones Carboxylic Acids', 'Amines', 'Biomolecules & Polymers',
  ],
  Mathematics: [
    'Sets Relations Functions', 'Complex Numbers & Quadratic Equations', 'Sequences & Series',
    'Permutations & Combinations', 'Binomial Theorem', 'Trigonometry', 'Straight Lines',
    'Circles', 'Conic Sections', 'Limits Continuity & Differentiability',
    'Differentiation Applications', 'Indefinite/Definite Integration', 'Differential Equations',
    'Vector Algebra', '3D Geometry', 'Probability & Statistics',
  ],
};

export const CHEMISTRY_GROUPS: Record<string, string[]> = {
  'Physical Chemistry': [
    'Basic Concepts/Mole Concept', 'Atomic Structure', 'Chemical Bonding', 'States of Matter',
    'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Solutions', 'Electrochemistry',
    'Chemical Kinetics', 'Surface Chemistry',
  ],
  'Inorganic Chemistry': [
    'Periodic Table/Classification', 'p-Block Elements', 'd/f-Block & Coordination Compounds',
  ],
  'Organic Chemistry': [
    'GOC Basics', 'Hydrocarbons', 'Haloalkanes/Haloarenes', 'Alcohols Phenols Ethers',
    'Aldehydes Ketones Carboxylic Acids', 'Amines', 'Biomolecules & Polymers',
  ],
};

export const MISTAKE_TYPES = [
  'Silly Mistake',
  'Concept Not Clear',
  'Formula Forgotten',
  'Misread Question',
  'Calculation Error',
  'Time Management',
] as const;

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

export const REVISION_STATUSES = ['Not Started', 'In Progress', 'Revised Once', 'Fully Revised'] as const;
export type RevisionStatus = typeof REVISION_STATUSES[number];
