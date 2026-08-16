'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, DownloadCloud, Search } from 'lucide-react';
import { getMyOrders } from '@/lib/services';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OrdersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page],
    queryFn: () => getMyOrders({ page, limit: 10 }),
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;

  const downloadInvoice = (order: any) => {
    const html = `<!DOCTYPE html><html><head><title>Invoice ${order.invoiceNumber || order._id}</title></head><body style="font-family:sans-serif;padding:40px">
      <h1>Aimentra</h1><h2>Invoice ${order.invoiceNumber || order._id.slice(-8)}</h2>
      <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
      <p><strong>Item:</strong> ${order.planId?.name || 'Course Purchase'}</p>
      <p><strong>Amount:</strong> ${formatCurrency(order.totalAmount ?? 0)}</p>
      <p><strong>Status:</strong> ${order.status}</p>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.invoiceNumber || order._id.slice(-8)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return <span className="badge badge-success text-xs">Paid</span>;
      case 'pending': return <span className="badge badge-warning text-xs">Pending</span>;
      case 'failed': return <span className="badge badge-error text-xs">Failed</span>;
      case 'refunded': return <span className="badge bg-blue-500/10 text-blue-600 border border-blue-500/20 text-xs">Refunded</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Order History</h1>
        <p className="text-[var(--text-secondary)] mt-1">View your previous purchases and download invoices.</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="table-scroll">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-6 py-4"><div className="skeleton h-4 w-full rounded" /></td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--text-secondary)]">No orders found.</p>
                  </td>
                </tr>
              ) : orders.map((order: any) => (
                <tr key={order._id} className="hover:bg-[var(--bg-surface)]/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[var(--text-secondary)]">{order.invoiceNumber || order._id.slice(-8)}</td>
                  <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{order.planId?.name || 'Course Purchase'}</td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{formatDate(order.createdAt)}</td>
                  <td className="px-6 py-4 font-semibold">{formatCurrency(order.totalAmount ?? 0)}</td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 text-right">
                    {order.status === 'paid' ? (
                      <button type="button" onClick={() => downloadInvoice(order)} className="btn-outline inline-flex items-center gap-1.5 px-2 py-1 text-xs">
                        <DownloadCloud className="w-3.5 h-3.5" /> Download
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <span className="text-sm text-[var(--text-muted)]">{orders.length} of {total} orders</span>
          <div className="flex gap-2">
            <button className="btn-outline px-3 py-1 text-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <button className="btn-outline px-3 py-1 text-sm" disabled={orders.length < 10} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
