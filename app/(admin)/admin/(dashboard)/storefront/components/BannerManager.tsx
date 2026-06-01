'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, Save, X, Info, Check } from 'lucide-react';
import { useAdminBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from '@/lib/hooks/useStorefront';
import { Banner } from '@/lib/types';
import { toast } from 'sonner';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

export default function BannerManager() {
  const { data: banners, isLoading } = useAdminBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    isActive: true,
    sortOrder: 0,
  });
  const [desktopImage, setDesktopImage] = useState<File | null>(null);
  const [mobileImage, setMobileImage] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string>('');
  const [mobilePreview, setMobilePreview] = useState<string>('');

  const resetForm = () => {
    setFormData({ title: '', link: '', isActive: true, sortOrder: 0 });
    setDesktopImage(null);
    setMobileImage(null);
    setDesktopPreview('');
    setMobilePreview('');
    setEditingBanner(null);
    setIsFormOpen(false);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      link: banner.link || '',
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    });
    setDesktopPreview(banner.desktopImage.url);
    setMobilePreview(banner.mobileImage.url);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBanner && (!desktopImage || !mobileImage)) {
      toast.error('Both desktop and mobile images are required for new banners');
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('link', formData.link);
    data.append('isActive', String(formData.isActive));
    data.append('sortOrder', String(formData.sortOrder));
    
    if (desktopImage) data.append('desktopImage', desktopImage);
    if (mobileImage) data.append('mobileImage', mobileImage);

    try {
      if (editingBanner) {
        await updateBanner.mutateAsync({ id: editingBanner._id, formData: data });
        toast.success('Banner updated successfully');
      } else {
        await createBanner.mutateAsync(data);
        toast.success('Banner created successfully');
      }
      resetForm();
    } catch (error) {
      toast.error('Failed to save banner');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBanner.mutateAsync(deleteId);
      toast.success('Banner deleted successfully');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete banner');
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading banners...</div>;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Banners List</h2>
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-all"
          >
            <Plus size={18} /> Add New Banner
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">{editingBanner ? 'Edit Banner' : 'New Banner'}</h3>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Banner Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  placeholder="e.g. Summer Collection 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Redirect Link (Optional)</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  placeholder="e.g. /category/new-arrivals"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded accent-brand"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Desktop Image (16:9)</label>
                  <div className="relative aspect-video rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center overflow-hidden group">
                    {desktopPreview ? (
                      <img src={desktopPreview} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <Plus size={24} className="mx-auto text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400">Desktop Image</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setDesktopImage(file);
                          setDesktopPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Image</label>
                  <div className="relative aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center overflow-hidden group">
                    {mobilePreview ? (
                      <img src={mobilePreview} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <Plus size={24} className="mx-auto text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400">Mobile Image</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setMobileImage(file);
                          setMobilePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <Info size={12} /> Click to replace image. Max size 2MB.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createBanner.isPending || updateBanner.isPending}
              className="px-8 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {(createBanner.isPending || updateBanner.isPending) ? (
                <Check className="animate-pulse" />
              ) : (
                <Save size={18} />
              )}
              {editingBanner ? 'Update Banner' : 'Create Banner'}
            </button>
          </div>
        </form>
      )}

      {/* Banners Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50 text-left border-y border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Sort</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Banner</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {banners?.map((banner) => (
              <tr key={banner._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-gray-400">#{banner.sortOrder}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      <img src={banner.desktopImage.url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{banner.title}</h4>
                      <p className="text-xs text-gray-400">{banner.link || 'No link'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    banner.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {banner.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(banner)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteId(banner._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {banners?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                  No banners found. Add your first banner to the hero slider!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={deleteBanner.isPending}
        title="Delete Banner"
        message="Are you sure you want to delete this hero banner? This will remove it from the homepage slider."
      />
    </div>
  );
}
