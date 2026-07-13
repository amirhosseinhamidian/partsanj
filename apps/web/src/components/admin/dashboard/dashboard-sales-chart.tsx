'use client';

import { Activity } from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { AdminDashboardSalesChartItem } from '@/lib/admin/dashboard/admin-dashboard.types';
import { formatToman } from '@/lib/admin/orders/admin-order-presentation';

type DashboardSalesChartProps = {
  items: AdminDashboardSalesChartItem[];
};

type DashboardSalesChartRow = {
  date: string;
  dateLabel: string;
  revenueToman: number;
  ordersCount: number;
};

export function DashboardSalesChart({ items }: DashboardSalesChartProps) {
  const hasData = items.some((item) => item.revenueToman > 0 || item.ordersCount > 0);

  if (!hasData) {
    return (
      <div className='mt-6 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/40 px-4 text-center'>
        <Activity className='size-9 text-foreground-muted' />

        <p className='mt-3 font-extrabold text-foreground'>هنوز فروش ثبت نشده است</p>

        <p className='mt-1 max-w-md text-sm leading-7 text-foreground-secondary'>
          پس از ثبت اولین پرداخت موفق، روند فروش و تعداد سفارش‌ها در این بخش نمایش داده می‌شود.
        </p>
      </div>
    );
  }

  const chartData: DashboardSalesChartRow[] = items.map((item) => ({
    ...item,
    dateLabel: formatChartDate(item.date),
  }));

  return (
    <div className='mt-6 h-80 w-full rounded-2xl border border-border bg-background/40 p-3 sm:h-96 sm:p-5'>
      <ResponsiveContainer width='100%' height='100%' minWidth={0}>
        <ComposedChart
          data={chartData}
          margin={{
            top: 12,
            right: 8,
            bottom: 8,
            left: 8,
          }}
        >
          <CartesianGrid
            yAxisId='revenue'
            vertical={false}
            stroke='var(--color-border)'
            strokeDasharray='4 4'
            strokeOpacity={0.7}
          />

          <XAxis
            dataKey='dateLabel'
            axisLine={false}
            tickLine={false}
            minTickGap={24}
            tick={{
              fill: 'var(--color-foreground-muted)',
              fontSize: 11,
              fontWeight: 600,
            }}
          />

          <YAxis
            yAxisId='revenue'
            orientation='right'
            axisLine={false}
            tickLine={false}
            width={72}
            tickFormatter={formatCompactNumber}
            tick={{
              fill: 'var(--color-foreground-muted)',
              fontSize: 11,
              fontWeight: 600,
            }}
          />

          <YAxis
            yAxisId='orders'
            orientation='left'
            axisLine={false}
            tickLine={false}
            width={36}
            allowDecimals={false}
            tick={{
              fill: 'var(--color-foreground-muted)',
              fontSize: 11,
              fontWeight: 600,
            }}
          />

          <Tooltip
            cursor={{
              stroke: 'var(--color-border-strong)',
              strokeDasharray: '4 4',
            }}
            contentStyle={{
              direction: 'rtl',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              boxShadow: '0 16px 40px rgb(15 23 42 / 0.12)',
              padding: '12px 14px',
            }}
            labelStyle={{
              marginBottom: '8px',
              color: 'var(--color-foreground)',
              fontSize: '13px',
              fontWeight: 800,
            }}
            itemStyle={{
              direction: 'rtl',
              fontSize: '12px',
              fontWeight: 700,
            }}
            labelFormatter={(label) => String(label)}
            formatter={(value, name) => {
              const numericValue = Number(value) || 0;

              if (name === 'مبلغ فروش') {
                return [formatToman(numericValue), name];
              }

              return [new Intl.NumberFormat('fa-IR').format(numericValue), name];
            }}
          />

          <Legend
            verticalAlign='top'
            align='right'
            height={42}
            iconType='circle'
            iconSize={8}
            formatter={(value) => (
              <span className='ms-1 text-xs font-bold text-foreground-secondary'>{value}</span>
            )}
          />

          <defs>
            <linearGradient id='dashboard-revenue-gradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='var(--color-brand)' stopOpacity={0.28} />

              <stop offset='95%' stopColor='var(--color-brand)' stopOpacity={0} />
            </linearGradient>
          </defs>

          <Area
            yAxisId='revenue'
            type='monotone'
            dataKey='revenueToman'
            name='مبلغ فروش'
            stroke='var(--color-brand)'
            strokeWidth={3}
            fill='url(#dashboard-revenue-gradient)'
            activeDot={{
              r: 6,
              strokeWidth: 3,
              fill: 'var(--color-surface)',
              stroke: 'var(--color-brand)',
            }}
            dot={false}
            animationDuration={500}
          />

          <Line
            yAxisId='orders'
            type='monotone'
            dataKey='ordersCount'
            name='تعداد سفارش'
            stroke='var(--color-info)'
            strokeWidth={2}
            strokeDasharray='6 5'
            dot={{
              r: 3,
              strokeWidth: 2,
              fill: 'var(--color-surface)',
              stroke: 'var(--color-info)',
            }}
            activeDot={{
              r: 5,
              strokeWidth: 2,
              fill: 'var(--color-surface)',
              stroke: 'var(--color-info)',
            }}
            animationDuration={500}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('fa-IR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatChartDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat('fa-IR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
