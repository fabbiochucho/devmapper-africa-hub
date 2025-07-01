
export const sdgGoals = [
  { number: 1, title: "No Poverty", value: "1", label: "Goal 1: No Poverty" },
  { number: 2, title: "Zero Hunger", value: "2", label: "Goal 2: Zero Hunger" },
  { number: 3, title: "Good Health and Well-being", value: "3", label: "Goal 3: Good Health and Well-being" },
  { number: 4, title: "Quality Education", value: "4", label: "Goal 4: Quality Education" },
  { number: 5, title: "Gender Equality", value: "5", label: "Goal 5: Gender Equality" },
  { number: 6, title: "Clean Water and Sanitation", value: "6", label: "Goal 6: Clean Water and Sanitation" },
  { number: 7, title: "Affordable and Clean Energy", value: "7", label: "Goal 7: Affordable and Clean Energy" },
  { number: 8, title: "Decent Work and Economic Growth", value: "8", label: "Goal 8: Decent Work and Economic Growth" },
  { number: 9, title: "Industry, Innovation and Infrastructure", value: "9", label: "Goal 9: Industry, Innovation and Infrastructure" },
  { number: 10, title: "Reduced Inequalities", value: "10", label: "Goal 10: Reduced Inequalities" },
  { number: 11, title: "Sustainable Cities and Communities", value: "11", label: "Goal 11: Sustainable Cities and Communities" },
  { number: 12, title: "Responsible Consumption and Production", value: "12", label: "Goal 12: Responsible Consumption and Production" },
  { number: 13, title: "Climate Action", value: "13", label: "Goal 13: Climate Action" },
  { number: 14, title: "Life Below Water", value: "14", label: "Goal 14: Life Below Water" },
  { number: 15, title: "Life on Land", value: "15", label: "Goal 15: Life on Land" },
  { number: 16, title: "Peace, Justice and Strong Institutions", value: "16", label: "Goal 16: Peace, Justice and Strong Institutions" },
  { number: 17, title: "Partnerships for the Goals", value: "17", label: "Goal 17: Partnerships for the Goals" }
];

export const africaCountries = [
  { name: 'Algeria', code: 'DZ' },
  { name: 'Angola', code: 'AO' },
  { name: 'Benin', code: 'BJ' },
  { name: 'Botswana', code: 'BW' },
  { name: 'Burkina Faso', code: 'BF' },
  { name: 'Burundi', code: 'BI' },
  { name: 'Cabo Verde', code: 'CV' },
  { name: 'Cameroon', code: 'CM' },
  { name: 'Central African Republic', code: 'CF' },
  { name: 'Chad', code: 'TD' },
  { name: 'Comoros', code: 'KM' },
  { name: 'Congo', code: 'CG' },
  { name: 'Congo, Democratic Republic of the', code: 'CD' },
  { name: 'Cote d\'Ivoire', code: 'CI' },
  { name: 'Djibouti', code: 'DJ' },
  { name: 'Egypt', code: 'EG' },
  { name: 'Equatorial Guinea', code: 'GQ' },
  { name: 'Eritrea', code: 'ER' },
  { name: 'Eswatini', code: 'SZ' },
  { name: 'Ethiopia', code: 'ET' },
  { name: 'Gabon', code: 'GA' },
  { name: 'Gambia', code: 'GM' },
  { name: 'Ghana', code: 'GH' },
  { name: 'Guinea', code: 'GN' },
  { name: 'Guinea-Bissau', code: 'GW' },
  { name: 'Kenya', code: 'KE' },
  { name: 'Lesotho', code: 'LS' },
  { name: 'Liberia', code: 'LR' },
  { name: 'Libya', code: 'LY' },
  { name: 'Madagascar', code: 'MG' },
  { name: 'Malawi', code: 'MW' },
  { name: 'Mali', code: 'ML' },
  { name: 'Mauritania', code: 'MR' },
  { name: 'Mauritius', code: 'MU' },
  { name: 'Morocco', code: 'MA' },
  { name: 'Mozambique', code: 'MZ' },
  { name: 'Namibia', code: 'NA' },
  { name: 'Niger', code: 'NE' },
  { name: 'Nigeria', code: 'NG' },
  { name: 'Rwanda', code: 'RW' },
  { name: 'Sao Tome and Principe', code: 'ST' },
  { name: 'Senegal', code: 'SN' },
  { name: 'Seychelles', code: 'SC' },
  { name: 'Sierra Leone', code: 'SL' },
  { name: 'Somalia', code: 'SO' },
  { name: 'South Africa', code: 'ZA' },
  { name: 'South Sudan', code: 'SS' },
  { name: 'Sudan', code: 'SD' },
  { name: 'Tanzania', code: 'TZ' },
  { name: 'Togo', code: 'TG' },
  { name: 'Tunisia', code: 'TN' },
  { name: 'Uganda', code: 'UG' },
  { name: 'Zambia', code: 'ZM' },
  { name: 'Zimbabwe', code: 'ZW' }
];

export const sdgGoalColors: { [key: string]: string } = {
  "1": "#E5243B",
  "2": "#DDA63A",
  "3": "#4C9F38",
  "4": "#C5192D",
  "5": "#FF3A21",
  "6": "#26BDE2",
  "7": "#FCC30B",
  "8": "#A21942",
  "9": "#FD6925",
  "10": "#DD1367",
  "11": "#FD9D24",
  "12": "#BF8B2E",
  "13": "#3F7E44",
  "14": "#0A97D9",
  "15": "#56C02B",
  "16": "#00689D",
  "17": "#19486A"
};

export const projectStatuses = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const projectStatusColors: { [key: string]: string } = {
  planning: '#94A3B8',
  active: '#10B981',
  completed: '#3B82F6',
  'on-hold': '#F59E0B',
  cancelled: '#EF4444'
};

export const projectStatusChartColors: { [key: string]: string } = {
  planning: '#94A3B8',
  active: '#10B981',
  completed: '#3B82F6',
  'on-hold': '#F59E0B',
  cancelled: '#EF4444'
};

export const sdgTargets = [
  { id: 1, title: "No Poverty", description: "End poverty in all its forms everywhere" },
  { id: 2, title: "Zero Hunger", description: "End hunger, achieve food security and improved nutrition and promote sustainable agriculture" },
  { id: 3, title: "Good Health and Well-being", description: "Ensure healthy lives and promote well-being for all at all ages" },
  { id: 4, title: "Quality Education", description: "Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all" },
  { id: 5, title: "Gender Equality", description: "Achieve gender equality and empower all women and girls" },
  { id: 6, title: "Clean Water and Sanitation", description: "Ensure availability and sustainable management of water and sanitation for all" },
  { id: 7, title: "Affordable and Clean Energy", description: "Ensure access to affordable, reliable, sustainable and modern energy for all" },
  { id: 8, title: "Decent Work and Economic Growth", description: "Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all" },
  { id: 9, title: "Industry, Innovation and Infrastructure", description: "Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation" },
  { id: 10, title: "Reduced Inequalities", description: "Reduce inequality within and among countries" },
  { id: 11, title: "Sustainable Cities and Communities", description: "Make cities and human settlements inclusive, safe, resilient and sustainable" },
  { id: 12, title: "Responsible Consumption and Production", description: "Ensure sustainable consumption and production patterns" },
  { id: 13, title: "Climate Action", description: "Take urgent action to combat climate change and its impacts" },
  { id: 14, title: "Life Below Water", description: "Conserve and sustainably use the oceans, seas and marine resources for sustainable development" },
  { id: 15, title: "Life on Land", description: "Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss" },
  { id: 16, title: "Peace, Justice and Strong Institutions", description: "Promote peaceful and inclusive societies for sustainable development, provide access to justice for all and build effective, accountable and inclusive institutions at all levels" },
  { id: 17, title: "Partnerships for the Goals", description: "Strengthen the means of implementation and revitalize the global partnership for sustainable development" }
];
