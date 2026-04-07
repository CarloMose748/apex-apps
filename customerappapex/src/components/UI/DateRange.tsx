import { useState } from 'react';
import type { DateRange } from '../../lib/types';

interface DateRangeProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
}

export function DateRangePicker({ value, onChange, label }: DateRangeProps) {
  const [fromDate, setFromDate] = useState(
    value?.from ? value.from.toISOString().split('T')[0] : ''
  );
  const [toDate, setToDate] = useState(
    value?.to ? value.to.toISOString().split('T')[0] : ''
  );

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrom = e.target.value;
    setFromDate(newFrom);
    if (newFrom && toDate) {
      onChange({
        from: new Date(newFrom),
        to: new Date(toDate)
      });
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTo = e.target.value;
    setToDate(newTo);
    if (fromDate && newTo) {
      onChange({
        from: new Date(fromDate),
        to: new Date(newTo)
      });
    }
  };

  return (
    <div className="form__group">
      {label && <label className="form__label">{label}</label>}
      <div className="date-range">
        <input
          type="date"
          value={fromDate}
          onChange={handleFromChange}
          className="input"
          placeholder="From"
        />
        <span className="date-range__separator">to</span>
        <input
          type="date"
          value={toDate}
          onChange={handleToChange}
          className="input"
          placeholder="To"
        />
      </div>
    </div>
  );
}