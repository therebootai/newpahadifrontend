'use client';

import { useState } from 'react';
import { 
  Search, 
  X, 
  Eye, 
  Star,
  User,
  MessageSquare,
  Calendar,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Pagination from '@/components/admin/Pagination';
import { useAdminReviews, useUpdateReviewStatus } from '@/lib/hooks/useAdminReviews';
import { Skeleton } from '@/components/ui/Skeleton';
import { Review } from '@/lib/services/review';

export default function ProductReviewsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingReview, setViewingReview] = useState<Review | null>(null);

  const { data: reviews, isLoading, isError, refetch } = useAdminReviews();
  const updateStatus = useUpdateReviewStatus();

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateStatus.mutateAsync({ id, isActive: !currentStatus });
    } catch (error) {
      console.error('Failed to update review status:', error);
    }
  };

  const filteredReviews = (reviews || []).filter(rev => {
    const customerName = typeof rev.userId === 'object' ? rev.userId.name : '';
    const productTitle = rev.productId?.title || '';
    
    const matchesSearch = 
      productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rev.comment.toLowerCase().includes(searchQuery.toLowerCase());
    
    const status = rev.isActive ? 'active' : 'inactive';
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const currentReviews = filteredReviews.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Helper to render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={12} 
            className={`${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-[1600px] mx-auto">
      {/* Header - Simple Title only as requested */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Product Reviews</h1>
          <p className="text-muted text-sm mt-1">Monitor and manage customer feedback for your products.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="p-4 border-b border-border bg-surface flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <input
              type="text"
              placeholder="Search by product, customer or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 shrink-0 flex-1 sm:flex-none">
              <Filter size={16} className="text-muted" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-sm font-medium focus:outline-none border-none p-0 cursor-pointer flex-1"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="text-xs font-medium text-muted text-center sm:text-right shrink-0">
              {filteredReviews.length} Reviews Found
            </div>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#F2F9F4] border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Reviewer</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Review Content</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-12 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-12 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-12 w-64" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-12" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-10 w-10 ml-auto" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-red-500">
                      <AlertCircle size={24} />
                      <p className="font-bold">Failed to load reviews</p>
                      <button onClick={() => refetch()} className="text-xs underline">Retry</button>
                    </div>
                  </td>
                </tr>
              ) : currentReviews.length > 0 ? (
                currentReviews.map(rev => (
                  <tr key={rev._id} className="hover:bg-background transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 max-w-[200px]">
                        <div className="w-12 h-12 rounded-lg bg-background border border-border overflow-hidden shrink-0">
                          <img 
                            src={rev.productId?.coverImage?.url || '/favicon.png'} 
                            alt={rev.productId?.title} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-bold text-primary truncate" title={rev.productId?.title}>
                            {rev.productId?.title}
                          </div>
                          <div className="text-[10px] text-muted font-medium uppercase tracking-wider">
                            {rev.productId?._id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-bold text-primary flex items-center gap-1.5">
                          <User size={12} className="text-muted" />
                          {typeof rev.userId === 'object' ? rev.userId.name : 'Unknown User'}
                        </div>
                        <div className="text-[10px] text-muted font-medium flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5 max-w-[300px]">
                        {renderStars(rev.rating)}
                        <div 
                          className="relative group/tooltip"
                        >
                          <p className="text-sm text-muted line-clamp-2 leading-relaxed">
                            {rev.comment}
                          </p>
                          {/* Hover Preview Tooltip */}
                          <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-surface border border-border rounded-xl shadow-xl z-10 hidden group-hover/tooltip:block animate-in fade-in zoom-in-95 duration-200">
                             <div className="text-xs text-primary font-medium leading-relaxed">
                               {rev.comment}
                             </div>
                             <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-surface border-r border-b border-border rotate-45" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(rev._id, rev.isActive)}
                        disabled={updateStatus.isPending}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          rev.isActive ? 'bg-brand' : 'bg-gray-300'
                        } ${updateStatus.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            rev.isActive ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setViewingReview(rev)}
                        className="p-2 text-brand-dark hover:bg-brand/10 rounded-lg transition-all"
                        title="View Full Review"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-muted">
                        <MessageSquare size={24} />
                      </div>
                      <div>
                        <p className="text-primary font-bold">No reviews found</p>
                        <p className="text-muted text-sm">Try adjusting your filters or search query</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages || 1} 
        onPageChange={(page) => setCurrentPage(page)} 
      />

      {/* Review Detail Modal */}
      {viewingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-border animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-border flex justify-between items-center bg-[#F9FAFB]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand-dark">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary">Review Details</h2>
                  <p className="text-xs text-muted">Review submitted on {new Date(viewingReview.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingReview(null)}
                className="p-2 hover:bg-background rounded-lg text-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Product Info */}
              <div className="flex items-center gap-4 p-4 bg-background rounded-2xl border border-border">
                <img 
                  src={viewingReview.productId?.coverImage?.url || '/favicon.png'} 
                  alt={viewingReview.productId?.title} 
                  className="w-16 h-16 rounded-xl object-cover border border-border" 
                />
                <div>
                  <h4 className="font-bold text-primary">{viewingReview.productId?.title}</h4>
                  <p className="text-xs text-muted font-medium mt-0.5">ID: {viewingReview.productId?._id}</p>
                </div>
              </div>

              {/* Reviewer & Rating */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Reviewer</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand-dark font-bold text-sm">
                      {(typeof viewingReview.userId === 'object' ? viewingReview.userId.name : 'U').charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {typeof viewingReview.userId === 'object' ? viewingReview.userId.name : 'Unknown User'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Rating</p>
                  {renderStars(viewingReview.rating)}
                </div>
              </div>

              {/* Review Comment */}
              <div>
                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Review Content</p>
                <div className="p-4 bg-background rounded-2xl border border-border italic text-primary leading-relaxed">
                  &quot;{viewingReview.comment}&quot;
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-bold text-muted uppercase tracking-wider">Public Visibility</p>
                  <button
                    onClick={() => toggleStatus(viewingReview._id, viewingReview.isActive)}
                    disabled={updateStatus.isPending}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      viewingReview.isActive ? 'bg-brand' : 'bg-gray-300'
                    } ${updateStatus.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        viewingReview.isActive ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  viewingReview.isActive ? 'bg-brand/10 text-brand-dark' : 'bg-muted/10 text-muted'
                }`}>
                  {viewingReview.isActive ? 'active' : 'inactive'}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-[#F9FAFB]">
              <button 
                onClick={() => setViewingReview(null)}
                className="w-full py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 active:scale-95"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
