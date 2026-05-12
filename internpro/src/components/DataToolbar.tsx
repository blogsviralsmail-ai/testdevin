"use client";

interface DataToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  filterOptions?: { value: string; label: string }[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterLabel?: string;
  children?: React.ReactNode;
}

export default function DataToolbar({
  searchValue, onSearchChange, searchPlaceholder = "Search...",
  onExportCSV, onExportPDF,
  filterOptions, filterValue, onFilterChange, filterLabel = "Filter",
  children,
}: DataToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <input
          type="text"
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full px-3 py-2 pl-9 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#0EA5B8]/50"
        />
        <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      {filterOptions && onFilterChange && (
        <select
          value={filterValue || ""}
          onChange={e => onFilterChange(e.target.value)}
          className="px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-sm min-w-[140px]"
        >
          <option value="">{filterLabel}: All</option>
          {filterOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
      {children}
      <div className="flex gap-2">
        {onExportCSV && (
          <button onClick={onExportCSV}
            className="px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-all flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            CSV
          </button>
        )}
        {onExportPDF && (
          <button onClick={onExportPDF}
            className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-all flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            PDF
          </button>
        )}
      </div>
    </div>
  );
}
