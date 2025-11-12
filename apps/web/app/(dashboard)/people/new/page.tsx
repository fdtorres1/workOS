'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { PhoneInput } from '@/components/ui/phone-input';
import { CompanySelect } from '@/components/ui/company-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function NewPersonPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [birthdate, setBirthdate] = useState<Date | undefined>();
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(true);
  const [companyId, setCompanyId] = useState<string>('');
  const [showAddCompanyDialog, setShowAddCompanyDialog] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);

  useEffect(() => {
    // Fetch org ID and companies on mount
    Promise.all([
      fetch('/api/auth/me').then(res => res.json()),
      fetch('/api/companies?limit=100').then(res => res.json()),
    ])
      .then(([authData, companiesData]) => {
        if (authData.data?.org?.orgId) {
          setOrgId(authData.data.org.orgId);
        } else {
          setError('Failed to load organization');
        }
        if (companiesData.data) {
          setCompanies(companiesData.data);
        }
      })
      .catch(() => {
        setError('Failed to load data');
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!orgId) {
      setError('Organization not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData(e.target as HTMLFormElement);
    
    // Validate phone if provided
    if (phone && !phoneValid) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: orgId,
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          email: formData.get('email') || undefined,
          phone: phone || undefined,
          title: formData.get('title') || undefined,
          companyId: companyId || undefined,
          birthdate: birthdate ? birthdate.toISOString().split('T')[0] : undefined,
          tags: formData.get('tags') 
            ? formData.get('tags')?.toString().split(',').map(t => t.trim()).filter(Boolean)
            : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/people/${data.data.id}`);
      } else {
        setError(data.error?.message || 'Failed to create person');
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create person');
      setLoading(false);
    }
  };

  const handleAddCompany = () => {
    setShowAddCompanyDialog(true);
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim() || !orgId) {
      return;
    }

    setCreatingCompany(true);
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: orgId,
          name: newCompanyName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Add the new company to the list and select it
        const newCompany = { id: data.data.id, name: data.data.name };
        setCompanies([...companies, newCompany]);
        setCompanyId(newCompany.id);
        setNewCompanyName('');
        setShowAddCompanyDialog(false);
      } else {
        setError(data.error?.message || 'Failed to create company');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
    } finally {
      setCreatingCompany(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/people">
            <Button variant="ghost" size="sm">← Back to People</Button>
          </Link>
          <h1 className="text-3xl font-bold mt-2">New Person</h1>
          <p className="text-muted-foreground">Add a new contact to your CRM</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Person Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  placeholder="John"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  required
                  placeholder="Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  onValidationChange={setPhoneValid}
                  defaultCountry="US"
                  placeholder="Phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <CompanySelect
                  companies={companies}
                  value={companyId || undefined}
                  onChange={(id) => setCompanyId(id)}
                  onAddCompany={handleAddCompany}
                  placeholder="Select a company (optional)"
                />
                {companyId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCompanyId('')}
                    className="h-6 text-xs"
                  >
                    Clear selection
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdate">Birthdate</Label>
                <DatePicker
                  value={birthdate}
                  onChange={setBirthdate}
                  placeholder="Select birthdate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="CEO, Sales Manager, etc."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="lead, customer, partner (comma-separated)"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple tags with commas
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/people">
                <Button type="button" variant="outline" disabled={loading || !orgId}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading || !orgId}>
                {loading ? 'Creating...' : !orgId ? 'Loading...' : 'Create Person'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showAddCompanyDialog} onOpenChange={setShowAddCompanyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>
              Create a new company to associate with this person.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newCompanyName">Company Name *</Label>
              <Input
                id="newCompanyName"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Enter company name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCompanyName.trim()) {
                    e.preventDefault();
                    handleCreateCompany();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddCompanyDialog(false);
                setNewCompanyName('');
              }}
              disabled={creatingCompany}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateCompany}
              disabled={!newCompanyName.trim() || creatingCompany}
            >
              {creatingCompany ? 'Creating...' : 'Create Company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

