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
  Heart
} from 'lucide-react';
import { useSendNotification } from '@/lib/hooks/useNotifications';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'cart' | 'wishlist'>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const sendNotification = useSendNotification();

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
      });
      
      setSuccessMessage(response.message || 'Notification broadcast started successfully!');
      setTitle('');
      setBody('');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to send notification. Please try again.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Bell className="text-brand" />
          Push Notifications
        </h1>
        <p className="text-muted mt-1">
          Compose and send push notifications to your app users.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-border p-6 shadow-sm">
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

              <div>
                <label className="block text-sm font-medium text-primary mb-3">
                  Target Audience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`
                    flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${target === 'all' ? 'border-brand bg-brand/5 text-brand' : 'border-border hover:border-brand/50 text-muted'}
                  `}>
                    <input 
                      type="radio" 
                      className="hidden" 
                      name="target" 
                      value="all" 
                      checked={target === 'all'} 
                      onChange={() => setTarget('all')}
                    />
                    <Users size={24} className="mb-2" />
                    <span className="text-xs font-semibold">All Users</span>
                  </label>

                  <label className={`
                    flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${target === 'cart' ? 'border-brand bg-brand/5 text-brand' : 'border-border hover:border-brand/50 text-muted'}
                  `}>
                    <input 
                      type="radio" 
                      className="hidden" 
                      name="target" 
                      value="cart" 
                      checked={target === 'cart'} 
                      onChange={() => setTarget('cart')}
                    />
                    <ShoppingCart size={24} className="mb-2" />
                    <span className="text-xs font-semibold">Cart Users</span>
                  </label>

                  <label className={`
                    flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${target === 'wishlist' ? 'border-brand bg-brand/5 text-brand' : 'border-border hover:border-brand/50 text-muted'}
                  `}>
                    <input 
                      type="radio" 
                      className="hidden" 
                      name="target" 
                      value="wishlist" 
                      checked={target === 'wishlist'} 
                      onChange={() => setTarget('wishlist')}
                    />
                    <Heart size={24} className="mb-2" />
                    <span className="text-xs font-semibold">Wishlist Users</span>
                  </label>
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
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-5 shadow-sm">
            <h3 className="font-semibold text-primary mb-3">Audience Details</h3>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex gap-2">
                <span className="font-bold text-brand">• All Users:</span>
                Everyone who has registered a push token in the app.
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-brand">• Cart Users:</span>
                Users who currently have items in their shopping cart.
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-brand">• Wishlist Users:</span>
                Users who have added products to their wishlist.
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle size={18} />
              Best Practices
            </h3>
            <ul className="space-y-2 text-sm text-blue-800/80">
              <li>• Keep titles short and catchy.</li>
              <li>• Use emojis to increase engagement.</li>
              <li>• Send at appropriate times for your users.</li>
              <li>• Don't over-notify to avoid opt-outs.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
