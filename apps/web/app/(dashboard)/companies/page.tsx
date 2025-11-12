import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string };
}) {
  const { org } = await requireAuth();
  const supabase = await createServerClient();

  const page = parseInt(searchParams.page || '1');
  const limit = 50;
  const search = searchParams.search;

  let query = supabase
    .from('companies')
    .select('*', { count: 'exact' })
    .eq('org_id', org.orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data: companies, error, count } = await query;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Manage your companies</p>
        </div>
        <Link href="/companies/new">
          <Button>New Company</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Companies</CardTitle>
            <form method="get" className="flex gap-2">
              <Input
                name="search"
                placeholder="Search companies..."
                defaultValue={search}
                className="w-64"
              />
              <Button type="submit">Search</Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-destructive">Error loading companies</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies && companies.length > 0 ? (
                    companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.website || '-'}</TableCell>
                        <TableCell>{company.phone || '-'}</TableCell>
                        <TableCell>{company.city || '-'}</TableCell>
                        <TableCell>
                          <Link href={`/companies/${company.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No companies found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {count && count > limit && (
                <div className="mt-4 flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, count)} of {count}
                  </p>
                  <div className="flex gap-2">
                    {page > 1 && (
                      <Link href={`/companies?page=${page - 1}${search ? `&search=${search}` : ''}`}>
                        <Button variant="outline" size="sm">Previous</Button>
                      </Link>
                    )}
                    {count > page * limit && (
                      <Link href={`/companies?page=${page + 1}${search ? `&search=${search}` : ''}`}>
                        <Button variant="outline" size="sm">Next</Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

