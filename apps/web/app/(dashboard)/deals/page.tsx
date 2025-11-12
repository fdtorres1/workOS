import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';

export default async function DealsPage() {
  const { org } = await requireAuth();
  const supabase = await createServerClient();

  // Get default pipeline
  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('id, name')
    .eq('org_id', org.orgId)
    .eq('is_default', true)
    .single();

  // Get stages for the pipeline
  const { data: stages } = await supabase
    .from('deal_stages')
    .select('id, name, position')
    .eq('org_id', org.orgId)
    .eq('pipeline_id', pipeline?.id || '')
    .order('position', { ascending: true });

  // Get deals for each stage
  const dealsByStage: Record<string, any[]> = {};
  if (stages) {
    for (const stage of stages) {
      const { data: deals } = await supabase
        .from('deals')
        .select('*')
        .eq('org_id', org.orgId)
        .eq('pipeline_id', pipeline?.id || '')
        .eq('stage_id', stage.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      dealsByStage[stage.id] = deals || [];
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deals</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <Link href="/deals/new">
          <Button>New Deal</Button>
        </Link>
      </div>

      {pipeline && stages ? (
        <div className="flex gap-4 overflow-x-auto">
          {stages.map((stage) => (
            <Card key={stage.id} className="min-w-[300px] flex-shrink-0">
              <CardHeader>
                <CardTitle className="text-lg">{stage.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {dealsByStage[stage.id]?.length || 0} deals
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {dealsByStage[stage.id]?.map((deal) => (
                  <Link key={deal.id} href={`/deals/${deal.id}`}>
                    <Card className="hover:bg-muted cursor-pointer">
                      <CardContent className="p-4">
                        <p className="font-medium">{deal.name}</p>
                        {deal.value_cents && (
                          <p className="text-sm text-muted-foreground">
                            ${(deal.value_cents / 100).toLocaleString()} {deal.currency}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {(!dealsByStage[stage.id] || dealsByStage[stage.id].length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No deals in this stage
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No pipeline configured</p>
            <Link href="/settings/pipelines">
              <Button variant="outline" className="mt-4">Create Pipeline</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

