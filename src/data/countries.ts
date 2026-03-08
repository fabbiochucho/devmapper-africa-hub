
export type Country = {
  code: string;
  code2: string; // ISO 3166-1 alpha-2
  name: string;
};

export const africanCountries: Country[] = [
  { code: "DZA", code2: "DZ", name: "Algeria" },
  { code: "AGO", code2: "AO", name: "Angola" },
  { code: "BEN", code2: "BJ", name: "Benin" },
  { code: "BWA", code2: "BW", name: "Botswana" },
  { code: "BFA", code2: "BF", name: "Burkina Faso" },
  { code: "BDI", code2: "BI", name: "Burundi" },
  { code: "CMR", code2: "CM", name: "Cameroon" },
  { code: "CPV", code2: "CV", name: "Cape Verde" },
  { code: "CAF", code2: "CF", name: "Central African Republic" },
  { code: "TCD", code2: "TD", name: "Chad" },
  { code: "COM", code2: "KM", name: "Comoros" },
  { code: "COG", code2: "CG", name: "Congo" },
  { code: "COD", code2: "CD", name: "Democratic Republic of Congo" },
  { code: "CIV", code2: "CI", name: "Côte d'Ivoire" },
  { code: "DJI", code2: "DJ", name: "Djibouti" },
  { code: "EGY", code2: "EG", name: "Egypt" },
  { code: "GNQ", code2: "GQ", name: "Equatorial Guinea" },
  { code: "ERI", code2: "ER", name: "Eritrea" },
  { code: "ETH", code2: "ET", name: "Ethiopia" },
  { code: "GAB", code2: "GA", name: "Gabon" },
  { code: "GMB", code2: "GM", name: "Gambia" },
  { code: "GHA", code2: "GH", name: "Ghana" },
  { code: "GIN", code2: "GN", name: "Guinea" },
  { code: "GNB", code2: "GW", name: "Guinea-Bissau" },
  { code: "KEN", code2: "KE", name: "Kenya" },
  { code: "LSO", code2: "LS", name: "Lesotho" },
  { code: "LBR", code2: "LR", name: "Liberia" },
  { code: "LBY", code2: "LY", name: "Libya" },
  { code: "MDG", code2: "MG", name: "Madagascar" },
  { code: "MWI", code2: "MW", name: "Malawi" },
  { code: "MLI", code2: "ML", name: "Mali" },
  { code: "MRT", code2: "MR", name: "Mauritania" },
  { code: "MUS", code2: "MU", name: "Mauritius" },
  { code: "MAR", code2: "MA", name: "Morocco" },
  { code: "MOZ", code2: "MZ", name: "Mozambique" },
  { code: "NAM", code2: "NA", name: "Namibia" },
  { code: "NER", code2: "NE", name: "Niger" },
  { code: "NGA", code2: "NG", name: "Nigeria" },
  { code: "RWA", code2: "RW", name: "Rwanda" },
  { code: "STP", code2: "ST", name: "São Tomé and Príncipe" },
  { code: "SEN", code2: "SN", name: "Senegal" },
  { code: "SYC", code2: "SC", name: "Seychelles" },
  { code: "SLE", code2: "SL", name: "Sierra Leone" },
  { code: "SOM", code2: "SO", name: "Somalia" },
  { code: "ZAF", code2: "ZA", name: "South Africa" },
  { code: "SSD", code2: "SS", name: "South Sudan" },
  { code: "SDN", code2: "SD", name: "Sudan" },
  { code: "SWZ", code2: "SZ", name: "Eswatini" },
  { code: "TZA", code2: "TZ", name: "Tanzania" },
  { code: "TGO", code2: "TG", name: "Togo" },
  { code: "TUN", code2: "TN", name: "Tunisia" },
  { code: "UGA", code2: "UG", name: "Uganda" },
  { code: "ZMB", code2: "ZM", name: "Zambia" },
  { code: "ZWE", code2: "ZW", name: "Zimbabwe" },
];

export const getCountries = async (): Promise<Country[]> => {
  return Promise.resolve(africanCountries);
};

/** Find country by ISO-2 code (from geocoding APIs) */
export const findCountryByCode2 = (code2: string): Country | undefined => {
  return africanCountries.find(c => c.code2 === code2.toUpperCase());
};

/** Find country by ISO-3 code */
export const findCountryByCode = (code: string): Country | undefined => {
  return africanCountries.find(c => c.code === code.toUpperCase());
};

