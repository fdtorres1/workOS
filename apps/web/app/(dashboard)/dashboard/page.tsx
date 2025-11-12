import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';

export default async function DashboardPage() {
  const { org } = await requireAuth();
  const supabase = await createServerClient();

  // Get KPIs
  const [peopleCount, companiesCount, dealsCount, tasksCount] = await Promise.all([
    supabase
      .from('people')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.orgId)
      .is('deleted_at', null),
    supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.orgId)
      .is('deleted_at', null),
    supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.orgId)
      .eq('status', 'open'),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.orgId)
      .eq('status', 'pending'),
  ]);

  // Get recent activities
  const { data: recentActivities } = await supabase
    .from('interactions')
    .select('*')
    .eq('org_id', org.orgId)
    .order('occurred_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your WorkOS dashboard
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">People</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{peopleCount.count || 0}</div>
            <p className="text-xs text-muted-foreground">Total contacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companiesCount.count || 0}</div>
            <p className="text-xs text-muted-foreground">Total companies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dealsCount.count || 0}</div>
            <p className="text-xs text-muted-foreground">Active deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksCount.count || 0}</div>
            <p className="text-xs text-muted-foreground">Pending tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{activity.summary || 'Activity'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.occurred_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {activity.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No recent activities</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

