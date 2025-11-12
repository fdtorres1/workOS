'use client';

import * as React from 'react';
import { parsePhoneNumber, isValidPhoneNumber, AsYouType, CountryCode, getCountryCallingCode as getCC } from 'libphonenumber-js';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Common countries with their codes
const COUNTRIES: { code: CountryCode; name: string; flag: string }[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
];

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  defaultCountry?: CountryCode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export function PhoneInput({
  value = '',
  onChange,
  onValidationChange,
  defaultCountry = 'US',
  placeholder,
  disabled = false,
  className,
  error,
}: PhoneInputProps) {
  const [country, setCountry] = React.useState<CountryCode>(defaultCountry);
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [isValid, setIsValid] = React.useState(true);

  // Initialize from value if provided
  React.useEffect(() => {
    if (value) {
      try {
        const parsed = parsePhoneNumber(value);
        if (parsed.country) {
          setCountry(parsed.country);
          setPhoneNumber(parsed.nationalNumber);
        } else {
          // If no country detected, try to parse as-is
          setPhoneNumber(value.replace(/^\+/, ''));
        }
      } catch {
        // If parsing fails, just use the value as-is
        setPhoneNumber(value.replace(/^\+/, ''));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCountryChange = (newCountry: CountryCode) => {
    setCountry(newCountry);
    updatePhoneValue(phoneNumber, newCountry);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatter = new AsYouType(country);
    const formatted = formatter.input(input);
    setPhoneNumber(formatted);
    updatePhoneValue(formatted, country);
  };

  const updatePhoneValue = (nationalNumber: string, countryCode: CountryCode) => {
    if (!nationalNumber.trim()) {
      onChange?.('');
      setIsValid(true);
      onValidationChange?.(true);
      return;
    }

    try {
      // Try to parse and format the phone number
      const parsed = parsePhoneNumber(nationalNumber, countryCode);
      const formatted = parsed.format('E.164'); // E.164 format: +1234567890
      
      onChange?.(formatted);
      
      const valid = isValidPhoneNumber(parsed.number);
      setIsValid(valid);
      onValidationChange?.(valid);
    } catch {
      // If parsing fails, still pass the value but mark as invalid
      const fallback = nationalNumber.startsWith('+') 
        ? nationalNumber 
        : `+${getCountryCallingCode(countryCode)}${nationalNumber}`;
      onChange?.(fallback);
      setIsValid(false);
      onValidationChange?.(false);
    }
  };

  const getCountryCallingCode = (countryCode: CountryCode): string => {
    try {
      return getCC(countryCode);
    } catch {
      return countryCode === 'US' ? '1' : '';
    }
  };

  const countryData = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        <Select value={country} onValueChange={handleCountryChange} disabled={disabled}>
          <SelectTrigger className="w-[140px]">
            <SelectValue>
              <span className="flex items-center gap-2">
                <span>{countryData.flag}</span>
                <span className="text-xs">+{getCountryCallingCode(country)}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="flex items-center gap-2">
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                  <span className="text-muted-foreground ml-auto">
                    +{getCountryCallingCode(c.code)}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1">
          <Input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder || `Phone number`}
            disabled={disabled}
            className={cn(
              !isValid && 'border-destructive focus-visible:ring-destructive',
              error && 'border-destructive'
            )}
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {!isValid && phoneNumber && !error && (
        <p className="text-sm text-destructive">
          Please enter a valid phone number for {countryData.name}
        </p>
      )}
    </div>
  );
}

