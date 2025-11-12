import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { ApiError, ErrorCodes } from '@/lib/api/errors';

export default async function PersonDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { org } = await requireAuth();
  const supabase = await createServerClient();

  const { data: person, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', org.orgId)
    .is('deleted_at', null)
    .single();

  if (error || !person) {
    throw new ApiError(ErrorCodes.NOT_FOUND, 'Person not found', 404);
  }

  // Get interactions
  const { data: interactions } = await supabase
    .from('interactions')
    .select('*')
    .eq('person_id', person.id)
    .order('occurred_at', { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/people">
            <Button variant="ghost" size="sm">← Back to People</Button>
          </Link>
          <h1 className="text-3xl font-bold mt-2">
            {person.first_name} {person.last_name}
          </h1>
        </div>
        <Button>Edit</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{person.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{person.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Title</p>
              <p className="font-medium">{person.title || '-'}</p>
            </div>
            {person.tags && person.tags.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {person.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {interactions && interactions.length > 0 ? (
              <div className="space-y-4">
                {interactions.map((interaction) => (
                  <div key={interaction.id} className="border-l-2 pl-4">
                    <p className="font-medium">{interaction.summary || 'Activity'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(interaction.occurred_at).toLocaleString()} • {interaction.type}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No activities yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

