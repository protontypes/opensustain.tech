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

import { useAnalyticsPayload } from "@/lib/data/use-analytics-payload";
import { useUrlState } from "@/lib/hooks/use-url-state";
import { formatNumber } from "@/lib/format";
import type { OrganizationsOverviewPayload } from "@/lib/types";
import {
  buildCountryIndex,
  normalizeType,
  titleCase,
  verifyGeography,
  type CountryIndex,
} from "@/lib/charts/organization-geography";

export type OrganizationFilters = {
  /** Payload bucket key ("DEU", "Global"); empty means every country. */
  country: string;
  /** Lower-cased `form_of_organization`; empty means every type. */
  type: string;
  active: boolean;
  index: CountryIndex | null;
  /** True when an organization's raw fields pass the current filters. */
  matches: (
    rawCountry: string | null | undefined,
    rawType: string | null | undefined,
  ) => boolean;
};

/** Matches the label the types chart draws for organisations with no type. */
const UNKNOWN_TYPE = "unknown";

const EMPTY: OrganizationFilters = {
  country: "",
  type: "",
  active: false,
  index: null,
  matches: () => true,
};

const Context = createContext<OrganizationFilters>(EMPTY);

export function useOrganizationFilters(): OrganizationFilters {
  return useContext(Context);
}

/**
 * Country and organization-type filters for the whole organizations page.
 *
 * Streamlit puts this pair on each of its four organisation tabs
 * (tabs/tab_utils.py:24). This page is those four tabs at once, so one bar at
 * the top drives every chart rather than seven copies of the same two selects.
 *
 * The country values are the payload's own buckets, not the raw column: that
 * is uncleaned and offers "Berlin", "German" and "Frace" alongside "Germany".
 */
export function OrganizationFiltersProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data } = useAnalyticsPayload<OrganizationsOverviewPayload>(
    "organizationsOverview",
  );
  const [country, setCountry] = useState("");
  const [type, setType] = useState("");
  const { params, write } = useUrlState();

  // One bar drives seven charts, so its state is the most worth sharing on
  // this page — and Back has to undo it.
  useEffect(() => {
    if (!params) return;
    setCountry(params.get("country") ?? "");
    setType(params.get("type") ?? "");
  }, [params]);

  const choose = useCallback(
    (patch: { country?: string; type?: string }) => {
      if (patch.country !== undefined) setCountry(patch.country);
      if (patch.type !== undefined) setType(patch.type);
      write({
        ...(patch.country !== undefined
          ? { country: patch.country || null }
          : {}),
        ...(patch.type !== undefined ? { type: patch.type || null } : {}),
      });
    },
    [write],
  );

  const index = useMemo(() => {
    if (!data) return null;
    verifyGeography(data);
    return buildCountryIndex(data.countries);
  }, [data]);

  const types = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of data?.organizations_by_project_count ?? []) {
      // The types chart draws an "Unknown" bar for the 101 organisations with
      // no type recorded; skipping the empty key here made that bar the one
      // thing on the page the filter could not reach.
      const key = normalizeType(record.form_of_organization) || UNKNOWN_TYPE;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, label: titleCase(value), count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data]);

  const countries = useMemo(
    () =>
      [...(data?.countries ?? [])].sort((a, b) =>
        a.country_name.localeCompare(b.country_name),
      ),
    [data],
  );

  const value = useMemo<OrganizationFilters>(() => {
    const active = Boolean(country || type);
    return {
      country,
      type,
      active,
      index,
      matches: (rawCountry, rawType) => {
        if (country && index?.resolve(rawCountry) !== country) return false;
        if (type && (normalizeType(rawType) || UNKNOWN_TYPE) !== type) return false;
        return true;
      },
    };
  }, [country, type, index]);

  return (
    <Context.Provider value={value}>
      <div className="org-filters">
        <div className="org-filters__fields">
          <label className="viz-field viz-field--select">
            <span className="viz-field__label">Country</span>
            <select
              value={country}
              onChange={(event) => choose({ country: event.target.value })}
              disabled={!data}
            >
              <option value="">All countries</option>
              {countries.map((item) => (
                <option key={item.iso_alpha} value={item.iso_alpha}>
                  {item.country_name} ({item.organization_count})
                </option>
              ))}
            </select>
          </label>

          <label className="viz-field viz-field--select">
            <span className="viz-field__label">Organization type</span>
            <select
              value={type}
              onChange={(event) => choose({ type: event.target.value })}
              disabled={!data}
            >
              <option value="">All types</option>
              {types.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label} ({formatNumber(item.count)})
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="viz-button"
            onClick={() => choose({ country: "", type: "" })}
            disabled={!country && !type}
          >
            Reset
          </button>
        </div>

        <p className="org-filters__note" role="status">
          {value.active
            ? "Every chart below is filtered."
            : "Filters apply to every chart on this page."}
        </p>
      </div>

      {children}
    </Context.Provider>
  );
}
