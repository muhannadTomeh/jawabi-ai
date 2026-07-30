import { ReactNode } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  RadialBarChart, RadialBar, PolarAngleAxis, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';

export interface DailyPoint {
  label: string;
  messages: number;
  users: number;
}

export interface ChannelPoint {
  label: string;
  value: number;
  color: string;
}

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  color: 'hsl(var(--popover-foreground))',
  fontSize: 12,
  direction: 'rtl' as const,
  boxShadow: 'var(--shadow-md, 0 4px 16px rgb(0 0 0 / 0.08))',
};

const axisTick = { fill: 'hsl(var(--muted-foreground))', fontSize: 12 };

export function ChartCard({
  title, description, action, children, className = '',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card-elevated rounded-2xl p-4 sm:p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-section-title">{title}</h3>
          {description && <p className="mt-1 text-card-desc">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">{text}</div>
  );
}

/** Messages over the last 7 days */
export function MessagesTrendChart({ data }: { data: DailyPoint[] }) {
  const empty = data.every((d) => d.messages === 0);
  if (empty) return <EmptyState text="لا توجد رسائل خلال آخر ٧ أيام." />;
  return (
    <div className="h-64 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="msgFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" reversed tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis orientation="right" allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={axisTick} />
          <Tooltip
            cursor={{ stroke: 'hsl(var(--primary))', strokeOpacity: 0.2 }}
            contentStyle={tooltipStyle}
            formatter={(v: any) => [v, 'رسائل']}
          />
          <Area type="monotone" dataKey="messages" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#msgFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Unique active users per day */
export function ActiveUsersChart({ data }: { data: DailyPoint[] }) {
  const empty = data.every((d) => d.users === 0);
  if (empty) return <EmptyState text="لا يوجد مستخدمون نشطون بعد." />;
  return (
    <div className="h-56 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" reversed tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis orientation="right" allowDecimals={false} tickLine={false} axisLine={false} width={32} tick={axisTick} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [v, 'مستخدم']} />
          <Line
            type="monotone" dataKey="users" stroke="hsl(var(--success, 142 71% 45%))"
            strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: 'hsl(var(--success, 142 71% 45%))' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Conversations per channel */
export function ChannelsChart({ data }: { data: ChannelPoint[] }) {
  const rows = data.filter((d) => d.value > 0);
  if (rows.length === 0) return <EmptyState text="لا توجد محادثات بعد." />;
  return (
    <div className="h-56 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} />
          <YAxis
            type="category" dataKey="label" orientation="right" width={90}
            tickLine={false} axisLine={false} tick={axisTick}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.4 }}
            contentStyle={tooltipStyle}
            formatter={(v: any) => [v, 'محادثة']}
          />
          <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={18}>
            {rows.map((r) => (
              <Cell key={r.label} fill={r.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** AI response rate gauge */
export function ResponseRateChart({ rate, avgSeconds }: { rate: number; avgSeconds: number | null }) {
  const data = [{ name: 'rate', value: Math.max(0, Math.min(100, rate)) }];
  return (
    <div className="flex h-56 flex-col items-center justify-center" dir="ltr">
      <div className="relative h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data} innerRadius="72%" outerRadius="100%"
            startAngle={210} endAngle={-30} barSize={14}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="value" cornerRadius={8} background={{ fill: 'hsl(var(--muted))' }}
              fill="hsl(var(--primary))"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tracking-tight text-foreground">{rate}%</span>
          <span className="text-xs text-muted-foreground">ردود مؤتمتة</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground" dir="rtl">
        {avgSeconds !== null ? `متوسط زمن الرد ${avgSeconds} ثانية` : 'لا توجد بيانات كافية'}
      </p>
    </div>
  );
}
