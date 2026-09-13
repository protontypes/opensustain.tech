"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { listParam, useUrlState } from "@/lib/hooks/use-url-state";
import { categoryColor } from "@/lib/sunburst/color";

import { MultiSelectField, type MultiSelectOption } from "./multi-select-field";

export type ProjectFilters = {
  /** Selected categories; empty means every category. */
  categories: string[];
  /** Selected sub-categories; empty means every one in scope. */
  subCategories: string[];
  active: boolean;
  /** True when a project's category and sub-category pass the filters. */
  matches: (category: string, subCategory: string) => boolean;
  /** Names the filtered view in export filenames; null when unfiltered. */
  exportPart: string | null;
};

const EMPTY: ProjectFilters = {
  categories: [],
  subCategories: [],
  active: false,
  matches: () => true,
  exportPart: null,
};

const Context = createContext<ProjectFilters>(EMPTY);

export function useProjectFilters(): ProjectFilters {
  return useContext(Context);
}

/**
 * Category and sub-category filters for the whole project analytics page, the
 * counterpart of OrganizationFiltersProvider: one bar drives every chart
 * rather than a category select repeated on each.
 *
 * Both fields take several values, so a reader can look at every energy
 * category together — Renewable Energy, Energy Storage and Energy Systems —
 * instead of one at a time.
 */
export function ProjectFiltersProvider({
  categories,
  subCategoriesByCategory,
  categoryColors,
  children,
}: {
  categories: string[];
  subCategoriesByCategory: Record<string, string[]>;
  categoryColors: Record<string, string>;
  children: ReactNode;
}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const { params, write } = useUrlState();

  // Sub-category → category. 1:1 across all 81 sub-categories.
  const parentOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const [category, subCategories] of Object.entries(subCategoriesByCategory)) {
      for (const subCategory of subCategories) map.set(subCategory, category);
    }
    return map;
  }, [subCategoriesByCategory]);

  // A sub-category outside the chosen categories would filter every chart to
  // nothing, with no option left in the list to clear it.
  const inScope = useCallback(
    (subCategories: string[], scope: string[]) =>
      scope.length === 0
        ? subCategories
        : subCategories.filter((name) => scope.includes(parentOf.get(name) ?? "")),
    [parentOf],
  );

  useEffect(() => {
    if (!params) return;
    const known = new Set(categories);
    // `cat` is the single category the rankings chart wrote before this bar
    // existed; honour links that still carry it.
    const fromUrl = params.has("cats") ? listParam(params, "cats") : listParam(params, "cat");
    const nextCategories = fromUrl.filter((name) => known.has(name));
    const nextSubCategories = inScope(
      listParam(params, "subs").filter((name) => parentOf.has(name)),
      nextCategories,
    );
    setSelectedCategories(nextCategories);
    setSelectedSubCategories(nextSubCategories);
  }, [params, categories, parentOf, inScope]);

  const choose = useCallback(
    (patch: { categories?: string[]; subCategories?: string[] }) => {
      const nextCategories = patch.categories ?? selectedCategories;
      const nextSubCategories = inScope(
        patch.subCategories ?? selectedSubCategories,
        nextCategories,
      );
      setSelectedCategories(nextCategories);
      setSelectedSubCategories(nextSubCategories);
      write({
        cats: nextCategories.join(",") || null,
        subs: nextSubCategories.join(",") || null,
        cat: null,
      });
    },
    [selectedCategories, selectedSubCategories, inScope, write],
  );

  const categoryOptions = useMemo<MultiSelectOption[]>(
    () =>
      categories.map((name) => ({
        value: name,
        label: name,
        swatch: categoryColor(name, categoryColors),
      })),
    [categories, categoryColors],
  );

  const subCategoryOptions = useMemo<MultiSelectOption[]>(() => {
    const scope = selectedCategories.length > 0 ? selectedCategories : categories;
    return scope.flatMap((category) =>
      (subCategoriesByCategory[category] ?? []).map((name) => ({
        value: name,
        label: name,
        group: category,
      })),
    );
  }, [selectedCategories, categories, subCategoriesByCategory]);

  const value = useMemo<ProjectFilters>(() => {
    const categorySet = new Set(selectedCategories);
    const subCategorySet = new Set(selectedSubCategories);
    const active = categorySet.size > 0 || subCategorySet.size > 0;
    const picked = [...selectedCategories, ...selectedSubCategories];
    return {
      categories: selectedCategories,
      subCategories: selectedSubCategories,
      active,
      matches: (category, subCategory) =>
        (categorySet.size === 0 || categorySet.has(category)) &&
        (subCategorySet.size === 0 || subCategorySet.has(subCategory)),
      exportPart: !active
        ? null
        : picked.length === 1
          ? picked[0]
          : `${picked.length}-filters`,
    };
  }, [selectedCategories, selectedSubCategories]);

  return (
    <Context.Provider value={value}>
      <div className="page-filters">
        <div className="page-filters__fields">
          <MultiSelectField
            label="Categories"
            noun="categories"
            options={categoryOptions}
            value={selectedCategories}
            onChange={(next) => choose({ categories: next })}
          />
          <MultiSelectField
            label="Sub-categories"
            noun="sub-categories"
            options={subCategoryOptions}
            value={selectedSubCategories}
            onChange={(next) => choose({ subCategories: next })}
          />
          <button
            type="button"
            className="viz-button"
            onClick={() => choose({ categories: [], subCategories: [] })}
            disabled={!value.active}
          >
            Reset
          </button>
        </div>

        <p className="page-filters__note" role="status">
          {value.active
            ? "Every chart below is filtered."
            : "Filters apply to every chart on this page."}
        </p>
      </div>

      {children}
    </Context.Provider>
  );
}
