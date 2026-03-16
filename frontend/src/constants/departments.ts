export const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Finance',
  'Operations',
  'Human Resources',
  'Product',
  'Design',
  'Sales',
  'Customer Success',
  'Legal',
  'Other', // This will trigger custom input
] as const;

export type Department = typeof DEPARTMENTS[number] | string;