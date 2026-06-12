'use client';

import { useState } from 'react';
import { 
  Bell, 
  Send, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Users,
  ShoppingCart,
  Heart,
  Calendar,
  Clock,
  Trash2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { 
  useSendNotification, 
  useGetNotifications, 
  useCancelNotification,
  Notification 
} from '@/lib/hooks/useNotifications';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'cart' | 'wishlist'>('all');
  const [scheduledAt, setScheduledAt] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const sendNotification = useSendNotification();
  const { data, isLoading, isError, refetch } = useGetNotifications(page);
  const cancelNotification = useCancelNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setServerError(null);

    if (!title.trim() || !body.trim()) {
      setServerError('Title and body are required');
      return;
    }

    try {
      const response = await sendNotification.mutateAsync({
        title,
        body,
        target,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      
      setSuccessMessage(response.message || 'Notification broadcast scheduled successfully!');
      setTitle('');
      setBody('');
      setScheduledAt('');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to send notification. Please try again.');
    }
  };

  const handleCancel = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this scheduled notification?')) {
      try {
        await cancelNotification.mutateAsync(id);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to cancel notification');
      }
    }
  };

  const getStatusBadge = (status: Notification['status']) => {
    switch (status) {
      case 'sent':
        return <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Sent</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">Pending</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">Failed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Bell className="text-brand" />
          Push Notifications
        </h1>
        <p className="text-muted mt-1">
          Compose, schedule, and track push notifications for your app users.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Send size={18} className="text-brand" />
              Compose Notification
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notification title"
                  className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Message Body
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter the message you want to send"
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-3">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTarget('all')}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${target === 'all' ? 'border-brand bg-brand/5 text-brand' : 'border-border text-muted'}`}
                    >
                      <Users size={20} />
                      <span className="text-[10px] font-semibold mt-1">All</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTarget('cart')}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${target === 'cart' ? 'border-brand bg-brand/5 text-brand' : 'border-border text-muted'}`}
                    >
                      <ShoppingCart size={20} />
                      <span className="text-[10px] font-semibold mt-1">Cart</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTarget('wishlist')}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${target === 'wishlist' ? 'border-brand bg-brand/5 text-brand' : 'border-border text-muted'}`}
                    >
                      <Heart size={20} />
                      <span className="text-[10px] font-semibold mt-1">Wishlist</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1 flex items-center gap-1">
                    <Calendar size={14} />
                    Schedule (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-[10px] text-muted mt-1">Leave empty to send immediately.</p>
                </div>
              </div>

              {serverError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {serverError}
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={sendNotification.isPending}
                className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70"
              >
                {sendNotification.isPending ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {scheduledAt ? <Calendar size={20} /> : <Send size={20} />}
                    {scheduledAt ? 'Schedule Notification' : 'Send Immediately'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tips Section */}
        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
            <h3 className="font-semibold text-primary mb-3">Audience Insights</h3>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex gap-2">
                <span className="font-bold text-brand">• All Users:</span>
                Everyone with a registered push token.
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-brand">• Cart Users:</span>
                Users with items currently in their cart.
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-brand">• Wishlist Users:</span>
                Users who favorited products.
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Clock size={18} />
              Scheduling Tips
            </h3>
            <ul className="space-y-2 text-sm text-blue-800/80">
              <li>• Schedule for peak engagement times.</li>
              <li>• You can cancel pending notifications anytime.</li>
              <li>• System automatically handles retries on failure.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <RefreshCw size={18} className="text-brand" />
            Notification History
          </h2>
          <button 
            onClick={() => refetch()}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-xs font-semibold text-muted uppercase">
              <tr>
                <th className="px-6 py-4">Title & Message</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Timing</th>
                <th className="px-6 py-4">Reach</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading history...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-red-500">
                    <AlertCircle className="mx-auto mb-2" size={24} />
                    Failed to load notification history.
                  </td>
                </tr>
              ) : data?.notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted">
                    No notifications sent yet.
                  </td>
                </tr>
              ) : (
                data?.notifications.map((notif: Notification) => (
                  <tr key={notif._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-semibold text-sm truncate">{notif.title}</div>
                      <div className="text-xs text-muted truncate">{notif.body}</div>
                    </td>
                    <td className="px-6 py-4 text-xs capitalize">
                      {notif.target}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(notif.status)}
                    </td>
                    <td className="px-6 py-4 text-[10px] text-muted space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar size={10} />
                        Created: {format(new Date(notif.createdAt), 'MMM d, HH:mm')}
                      </div>
                      {notif.scheduledAt && (
                        <div className="flex items-center gap-1 text-brand font-medium">
                          <Clock size={10} />
                          Scheduled: {format(new Date(notif.scheduledAt), 'MMM d, HH:mm')}
                        </div>
                      )}
                      {notif.sentAt && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 size={10} />
                          Sent: {format(new Date(notif.sentAt), 'MMM d, HH:mm')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Users size={12} className="text-muted" />
                        {notif.sentCount} recipients
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {notif.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(notif._id)}
                          disabled={cancelNotification.isPending}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel schedule"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.pagination && data.pagination.pages > 1 && (
          <div className="p-4 border-t border-border flex justify-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-sm border border-border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm">
              Page {page} of {data.pagination.pages}
            </span>
            <button
              disabled={page === data.pagination.pages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-sm border border-border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
