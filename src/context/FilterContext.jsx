import { createContext, useContext, useState } from "react";
import { FILTER_DEFAULTS, REGION_MARKET_MAP, CATEGORY_TREE, getSubCats, getSKUs } from "../data/mockData";

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState({ ...FILTER_DEFAULTS });

  const setFilter = (key) => (value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      // Region → reset Market
      if (key === "Region") {
        next.Market = REGION_MARKET_MAP[value]?.[0] || "";
      }
      // Category → reset SubCategory + SKU
      if (key === "Category") {
        const subs = getSubCats(value);
        next.SubCategory = subs[0] || "";
        next.SKU = getSKUs(value, subs[0])?.[0] || "";
      }
      // SubCategory → reset SKU
      if (key === "SubCategory") {
        next.SKU = getSKUs(prev.Category, value)?.[0] || "";
      }
      return next;
    });
  };

  return (
    <FilterContext.Provider value={{ filters, setFilter }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilters = () => useContext(FilterContext);