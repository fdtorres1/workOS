import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createServerClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { Users, Building2, TrendingUp, CheckSquare, Mail, Phone, MessageSquare, FileText, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default async function DashboardPage() {
  const { org } = await requireAuth();
  const supabase = await createServerClient();

  // Get KPIs with more detailed data
  const [peopleCount, companiesCount, dealsData, tasksData] = await Promise.all([
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
      .select('id, status, value_cents')
      .eq('org_id', org.orgId),
    supabase
      .from('tasks')
      .select('id, status, priority')
      .eq('org_id', org.orgId),
  ]);

  // Calculate deal metrics
  const openDeals = dealsData.data?.filter(d => d.status === 'open').length || 0;
  const totalDeals = dealsData.data?.length || 0;
  const totalDealValue = dealsData.data?.reduce((sum, d) => sum + (d.value_cents || 0), 0) || 0;
  const dealValueFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalDealValue / 100);

  // Calculate task metrics
  const pendingTasks = tasksData.data?.filter(t => t.status === 'pending').length || 0;
  const totalTasks = tasksData.data?.length || 0;
  const urgentTasks = tasksData.data?.filter(t => t.priority === 'urgent').length || 0;

  // Get recent activities
  const { data: recentActivities } = await supabase
    .from('interactions')
    .select('*')
    .eq('org_id', org.orgId)
    .order('occurred_at', { ascending: false })
    .limit(10);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-lg mt-1">
              Stay on top of your work, monitor progress, and track status. Streamline your workflow and transform how you deliver results.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-white to-blue-50/50 dark:from-card dark:to-blue-950/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              People
            </CardTitle>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Users className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold">{peopleCount.count || 0}</div>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Total contacts</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-white to-green-50/50 dark:from-card dark:to-green-950/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Companies
            </CardTitle>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold">{companiesCount.count || 0}</div>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Total companies</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-white to-purple-50/50 dark:from-card dark:to-purple-950/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Open Deals
            </CardTitle>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold">{openDeals}</div>
              {totalDeals > 0 && (
                <span className="text-sm text-muted-foreground">/ {totalDeals}</span>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Active deals</p>
              {totalDeals > 0 && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${(openDeals / totalDeals) * 100}%` }}
                  />
                </div>
              )}
            </div>
            {totalDealValue > 0 && (
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-2">
                {dealValueFormatted} total value
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-white to-orange-50/50 dark:from-card dark:to-orange-950/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Tasks
            </CardTitle>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold">{pendingTasks}</div>
              {totalTasks > 0 && (
                <span className="text-sm text-muted-foreground">/ {totalTasks}</span>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">Pending tasks</p>
              {totalTasks > 0 && (
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                    style={{ width: `${(pendingTasks / totalTasks) * 100}%` }}
                  />
                </div>
              )}
            </div>
            {urgentTasks > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Badge variant="destructive" className="text-xs">
                  {urgentTasks} urgent
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Recent Activities</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Latest interactions and updates from your workspace
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {recentActivities && recentActivities.length > 0 ? (
            <div className="space-y-2">
              {recentActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="group flex items-start gap-4 p-4 rounded-xl border-2 hover:border-primary/20 hover:bg-accent/30 transition-all duration-200 hover:shadow-md"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10 group-hover:border-primary/30 transition-colors">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-base leading-tight mb-1">
                          {activity.summary || 'Activity'}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className="text-xs capitalize font-medium border-2"
                          >
                            {activity.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(activity.occurred_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-6 shadow-inner">
                <Clock className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-semibold text-lg mb-1">No recent activities</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Activities will appear here as you interact with contacts, send emails, make calls, or create notes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

