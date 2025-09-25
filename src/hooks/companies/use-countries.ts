import { useQuery } from "@tanstack/react-query";
import { Country, CountryOption } from "@/types/country";

const COUNTRIES_API_URL = "https://restcountries.com/v3.1/all?fields=name,cca2";

export function useCountries() {
  return useQuery<CountryOption[]>({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await fetch(COUNTRIES_API_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch countries");
      }

      const countries: Country[] = await response.json();

      // Transform to options and sort alphabetically
      const countryOptions: CountryOption[] = countries
        .map((country) => ({
          value: country.name.common, // Use common name as value
          label: country.name.common, // Use common name as label
          code: country.cca2, // Keep code for reference
          searchTerms: [country.name.common, country.name.official],
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      return countryOptions;
    },
    // Keep countries fresh for a long time — they rarely change
    staleTime: 1000 * 60 * 60 * 24 * 30, // 30 days
    // Don't refetch on window focus/mount/reconnect — explicit refetch isn't needed
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
