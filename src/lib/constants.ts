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
  Physics: ['Motion', 'Laws of Motion', 'Work Energy Power', 'Gravitation', 'Thermodynamics', 'Waves', 'Electrostatics', 'Current Electricity', 'Magnetism', 'Optics', 'Modern Physics'],
  Chemistry: ['Atomic Structure', 'Chemical Bonding', 'Thermodynamics', 'Equilibrium', 'Redox', 'Electrochemistry', 'Organic Basics', 'Hydrocarbons', 'Coordination Compounds'],
  Mathematics: ['Algebra', 'Trigonometry', 'Coordinate Geometry', 'Calculus', 'Vectors', 'Statistics', 'Probability', 'Matrices'],
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
