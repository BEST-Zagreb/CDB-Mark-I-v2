export interface CountryName {
  common: string;
  official: string;
  nativeName?: {
    [key: string]: {
      official: string;
      common: string;
    };
  };
}

export interface Country {
  name: CountryName;
  cca2: string;
}

export interface CountryOption {
  value: string; // common name (what we store in DB)
  label: string; // common name for display
  code: string; // cca2 code for reference
  searchTerms: string[]; // both common and official names for searching
}
