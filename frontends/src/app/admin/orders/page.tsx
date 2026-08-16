'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminOrders, refundOrder } from '@/lib/services';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, statusFilter],
    queryFn: () => getAdminOrders({ page, limit: 20, status: statusFilter || undefined }),
  });

  const refundMutation = useMutation({
    mutationFn: refundOrder,
    onSuccess: () => { toast.success('Order refunded'); qc.invalidateQueries({ queryKey: ['admin-orders'] }); },
    onError: () => toast.error('Refund failed'),
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalRevenue = orders.filter((o: any) => o.status === 'paid').reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
  const avgOrder = orders.length ? totalRevenue / orders.filter((o: any) => o.status === 'paid').length : 0;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Orders & Revenue</h1>
          <p className="text-[var(--text-secondary)] mt-1">Track transactions, refunds, and earnings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-green-500">
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Page Revenue</p>
          <h3 className="text-2xl font-bold">{formatCurrency(totalRevenue)}</h3>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-blue-500">
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Total Orders</p>
          <h3 className="text-2xl font-bold">{total}</h3>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-[var(--brand-500)]">
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Avg. Order Value</p>
          <h3 className="text-2xl font-bold">{formatCurrency(avgOrder || 0)}</h3>
        </div>
      </div>

      <div className="glass-card flex min-h-[360px] flex-col overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/30 p-4 lg:flex-row">
          <select className="input-base h-9 text-sm px-3" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className="table-scroll flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--bg-surface)] text-[var(--text-muted)] border-b border-[var(--border-subtle)] uppercase text-xs font-semibold sticky top-0">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center"><div className="skeleton h-8 w-full" /></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-[var(--text-muted)]">No orders found</td></tr>
              ) : orders.map((order: any) => (
                <tr key={order._id} className="hover:bg-[var(--bg-surface)] transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-[var(--text-secondary)]">{order.invoiceNumber || order._id.slice(-8)}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[var(--text-primary)]">{order.userId?.name || '—'}</div>
                    <div className="text-xs text-[var(--text-muted)]">{order.userId?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{order.planId?.name || '—'}</td>
                  <td className="px-6 py-4 font-bold">{formatCurrency(order.totalAmount ?? 0)}</td>
                  <td className="px-6 py-4">
                    <span className={`badge text-[10px] px-2 py-0.5 ${
                      order.status === 'paid' ? 'badge-success' :
                      order.status === 'pending' ? 'badge-warning' :
                      order.status === 'refunded' ? 'bg-gray-500/10 text-gray-400' : 'badge-error'
                    }`}>{order.status}</span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)] text-xs">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    {order.status === 'paid' && (
                      <button
                        onClick={() => { if (confirm('Refund this order?')) refundMutation.mutate(order._id); }}
                        className="text-xs font-semibold text-red-600 hover:text-red-500 bg-red-500/10 px-2 py-1 rounded"
                      >
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <span className="text-sm text-[var(--text-muted)]">{orders.length} of {total} orders</span>
          <div className="flex gap-2">
            <button className="btn-outline px-3 py-1 text-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <button className="btn-outline px-3 py-1 text-sm" disabled={orders.length < 20} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
