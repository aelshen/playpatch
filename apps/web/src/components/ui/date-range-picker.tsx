'use client';

/**
 * Date Range Picker Component
 * Allows selecting date ranges with presets and custom calendar selection
 */

import { useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar } from 'lucide-react';

export interface DateRangeValue {
  start: Date;
  end: Date;
}

export interface DateRangePickerProps {
  /** Current selected date range */
  value: DateRangeValue;
  /** Callback when date range changes */
  onChange: (range: DateRangeValue) => void;
  /** Preset date ranges */
  presets?: Array<{ label: string; getDates: () => [Date, Date] }>;
  /** Enable comparison mode (selects 2 date ranges) */
  comparisonMode?: boolean;
}

const DEFAULT_PRESETS = [
  {
    label: 'Last 7 Days',
    getDates: () => [subDays(new Date(), 6), new Date()] as [Date, Date],
  },
  {
    label: 'Last 30 Days',
    getDates: () => [subDays(new Date(), 29), new Date()] as [Date, Date],
  },
  {
    label: 'Last 90 Days',
    getDates: () => [subDays(new Date(), 89), new Date()] as [Date, Date],
  },
  {
    label: 'This Week',
    getDates: () => {
      const now = new Date();
      return [startOfWeek(now), endOfWeek(now)] as [Date, Date];
    },
  },
  {
    label: 'This Month',
    getDates: () => {
      const now = new Date();
      return [startOfMonth(now), endOfMonth(now)] as [Date, Date];
    },
  },
];

export function DateRangePicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  comparisonMode = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>({
    from: value.start,
    to: value.end,
  });

  const handlePresetClick = (preset: typeof DEFAULT_PRESETS[0]) => {
    const [start, end] = preset.getDates();
    onChange({ start, end });
    setIsOpen(false);
  };

  const handleApply = () => {
    if (tempRange?.from && tempRange?.to) {
      onChange({ start: tempRange.from, end: tempRange.to });
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setTempRange({ from: value.start, to: value.end });
    setIsOpen(false);
  };

  const formatDateRange = () => {
    return `${format(value.start, 'MMM d, yyyy')} - ${format(value.end, 'MMM d, yyyy')}`;
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Calendar className="w-4 h-4" />
        <span>{formatDateRange()}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 z-40 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-auto">
            <div className="p-4">
              {/* Presets */}
              <div className="mb-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  Quick Select
                </div>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => {
                    const [start, end] = preset.getDates();
                    const isActive =
                      format(value.start, 'yyyy-MM-dd') === format(start, 'yyyy-MM-dd') &&
                      format(value.end, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd');

                    return (
                      <button
                        key={preset.label}
                        onClick={() => handlePresetClick(preset)}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Range Selector */}
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  Custom Range
                </div>
                <DayPicker
                  mode="range"
                  selected={tempRange}
                  onSelect={setTempRange}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }} // Disable future dates
                  classNames={{
                    months: 'flex gap-4',
                    month: 'space-y-4',
                    caption: 'flex justify-center pt-1 relative items-center',
                    caption_label: 'text-sm font-medium',
                    nav: 'space-x-1 flex items-center',
                    nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                    nav_button_previous: 'absolute left-1',
                    nav_button_next: 'absolute right-1',
                    table: 'w-full border-collapse space-y-1',
                    head_row: 'flex',
                    head_cell: 'text-gray-500 rounded-md w-9 font-normal text-[0.8rem]',
                    row: 'flex w-full mt-2',
                    cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                    day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 hover:rounded-md',
                    day_selected: 'bg-blue-500 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-md',
                    day_today: 'bg-gray-100 text-gray-900 rounded-md',
                    day_outside: 'text-gray-400 opacity-50',
                    day_disabled: 'text-gray-400 opacity-50',
                    day_range_middle: 'aria-selected:bg-gray-100 aria-selected:text-gray-900',
                    day_hidden: 'invisible',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={!tempRange?.from || !tempRange?.to}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
