'use client';

import * as React from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Company {
  id: string;
  name: string;
}

interface CompanySelectProps {
  companies: Company[];
  value?: string;
  onChange?: (companyId: string) => void;
  onAddCompany?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CompanySelect({
  companies,
  value,
  onChange,
  onAddCompany,
  placeholder = 'Select a company',
  disabled = false,
  className,
}: CompanySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedCompany = companies.find(c => c.id === value);

  const filteredCompanies = React.useMemo(() => {
    if (!search.trim()) {
      return companies;
    }
    const searchLower = search.toLowerCase();
    return companies.filter(company =>
      company.name.toLowerCase().includes(searchLower)
    );
  }, [companies, search]);

  const handleSelect = (companyId: string) => {
    onChange?.(companyId);
    setOpen(false);
    setSearch('');
  };

  const handleAddCompany = () => {
    setOpen(false);
    setSearch('');
    onAddCompany?.();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selectedCompany && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">
            {selectedCompany ? selectedCompany.name : placeholder}
          </span>
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex flex-col">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filteredCompanies.length > 0 ? (
              <>
                {filteredCompanies.map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleSelect(company.id)}
                    className={cn(
                      'w-full px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                      value === company.id && 'bg-accent text-accent-foreground'
                    )}
                  >
                    {company.name}
                  </button>
                ))}
              </>
            ) : (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                {search ? 'No companies found' : 'No companies available'}
              </div>
            )}
          </div>
          {filteredCompanies.length > 0 && <Separator />}
          <button
            type="button"
            onClick={handleAddCompany}
            className="flex items-center gap-2 px-2 py-1.5 text-sm text-primary hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="h-4 w-4" />
            Add a Company
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

