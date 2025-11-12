'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  className,
}: DatePickerProps) {
  const [inputValue, setInputValue] = React.useState(
    value ? format(value, 'yyyy-MM-dd') : ''
  );

  React.useEffect(() => {
    if (value) {
      setInputValue(format(value, 'yyyy-MM-dd'));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setInputValue(input);

    // Try to parse the date
    if (input) {
      const date = new Date(input);
      if (!isNaN(date.getTime())) {
        onChange?.(date);
      }
    } else {
      onChange?.(undefined);
    }
  };

  return (
    <Input
      type="date"
      value={inputValue}
      onChange={handleInputChange}
      placeholder={placeholder}
      disabled={disabled}
      className={cn('w-full', className)}
    />
  );
}

