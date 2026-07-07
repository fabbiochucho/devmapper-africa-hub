export const SDG_OPTIONS = [
  { value: 1, label: "SDG 1: No Poverty" },
  { value: 2, label: "SDG 2: Zero Hunger" },
  { value: 3, label: "SDG 3: Good Health" },
  { value: 4, label: "SDG 4: Quality Education" },
  { value: 5, label: "SDG 5: Gender Equality" },
  { value: 6, label: "SDG 6: Clean Water" },
  { value: 7, label: "SDG 7: Clean Energy" },
  { value: 8, label: "SDG 8: Decent Work" },
  { value: 9, label: "SDG 9: Industry Innovation" },
  { value: 10, label: "SDG 10: Reduced Inequalities" },
  { value: 11, label: "SDG 11: Sustainable Cities" },
  { value: 12, label: "SDG 12: Responsible Consumption" },
  { value: 13, label: "SDG 13: Climate Action" },
  { value: 14, label: "SDG 14: Life Below Water" },
  { value: 15, label: "SDG 15: Life on Land" },
  { value: 16, label: "SDG 16: Peace and Justice" },
  { value: 17, label: "SDG 17: Partnerships" }
];

export const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD – US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR – Euro", symbol: "€" },
  { value: "GBP", label: "GBP – British Pound", symbol: "£" },
  { value: "NGN", label: "NGN – Nigerian Naira", symbol: "₦" },
  { value: "KES", label: "KES – Kenyan Shilling", symbol: "KSh" },
  { value: "GHS", label: "GHS – Ghanaian Cedi", symbol: "GH₵" },
  { value: "ZAR", label: "ZAR – South African Rand", symbol: "R" },
  { value: "TZS", label: "TZS – Tanzanian Shilling", symbol: "TSh" },
  { value: "UGX", label: "UGX – Ugandan Shilling", symbol: "USh" },
  { value: "RWF", label: "RWF – Rwandan Franc", symbol: "FRw" },
  { value: "ETB", label: "ETB – Ethiopian Birr", symbol: "Br" },
  { value: "XOF", label: "XOF – West African CFA", symbol: "CFA" },
  { value: "XAF", label: "XAF – Central African CFA", symbol: "FCFA" },
  { value: "EGP", label: "EGP – Egyptian Pound", symbol: "E£" },
  { value: "MAD", label: "MAD – Moroccan Dirham", symbol: "MAD" },
];

export const getCurrencySymbol = (code: string) => {
  return CURRENCY_OPTIONS.find(c => c.value === code)?.symbol || code;
};
