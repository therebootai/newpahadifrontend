'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, Save, X, Info, Check, Image as ImageIcon } from 'lucide-react';
import { useAdminPopups, useCreatePopup, useUpdatePopup, useDeletePopup } from '@/lib/hooks/useStorefront';
import { PopupContent } from '@/lib/types';
import { toast } from 'sonner';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

export default function PopupManager() {
  const { data: popups, isLoading } = useAdminPopups();
  const createPopup = useCreatePopup();
  const updatePopup = useUpdatePopup();
  const deletePopup = useDeletePopup();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<PopupContent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    isActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const resetForm = () => {
    setFormData({ title: '', link: '', isActive: true });
    setImageFile(null);
    setImagePreview('');
    setEditingPopup(null);
    setIsFormOpen(false);
  };

  const handleEdit = (popup: PopupContent) => {
    setEditingPopup(popup);
    setFormData({
      title: popup.title,
      link: popup.link || '',
      isActive: popup.isActive,
    });
    setImagePreview(popup.image.url);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingPopup && !imageFile) {
      toast.error('Popup image is required');
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('link', formData.link);
    data.append('isActive', String(formData.isActive));
    
    if (imageFile) data.append('image', imageFile);

    try {
      if (editingPopup) {
        await updatePopup.mutateAsync({ id: editingPopup._id, formData: data });
        toast.success('Popup updated successfully');
      } else {
        await createPopup.mutateAsync(data);
        toast.success('Popup created successfully');
      }
      resetForm();
    } catch (error) {
      toast.error('Failed to save popup');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePopup.mutateAsync(deleteId);
      toast.success('Popup deleted successfully');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete popup');
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading popups...</div>;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Welcome Popups</h2>
          <p className="text-sm text-gray-400">Only one popup can be active at a time.</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-all"
          >
            <Plus size={18} /> Create New Popup
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">{editingPopup ? 'Edit Popup' : 'New Popup'}</h3>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Popup Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  placeholder="e.g. 10% Off Your First Order"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Redirect Link (Optional)</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  placeholder="e.g. /category/all-jewellery"
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
                  <span className="text-sm font-medium">Active (Will deactivate other popups)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Popup Image</label>
              <div className="relative aspect-square max-h-[300px] w-auto mx-auto rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center overflow-hidden group">
                {imagePreview ? (
                  <img src={imagePreview} className="w-full h-full object-contain p-4" />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                    <span className="text-xs font-bold text-gray-400">Upload Image</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 justify-center">
                <Info size={12} /> Recommended size: 600x600px.
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
              disabled={createPopup.isPending || updatePopup.isPending}
              className="px-8 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {(createPopup.isPending || updatePopup.isPending) ? (
                <Check className="animate-pulse" />
              ) : (
                <Save size={18} />
              )}
              {editingPopup ? 'Update Popup' : 'Create Popup'}
            </button>
          </div>
        </form>
      )}

      {/* Popups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {popups?.map((popup) => (
          <div key={popup._id} className="group relative bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
            <div className="relative aspect-square bg-white flex items-center justify-center">
              <img src={popup.image.url} alt="" className="w-full h-full object-contain p-4" />
              <div className="absolute top-3 left-3">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                  popup.isActive ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-400 text-white'
                }`}>
                  {popup.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="absolute top-3 right-3 flex gap-1">
                <button
                  onClick={() => handleEdit(popup)}
                  className="p-2 bg-white/90 text-blue-500 rounded-lg shadow-sm hover:bg-white transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => setDeleteId(popup._id)}
                  className="p-2 bg-white/90 text-red-500 rounded-lg shadow-sm hover:bg-white transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <h4 className="font-bold text-gray-800 text-sm truncate">{popup.title}</h4>
              <p className="text-xs text-gray-400 truncate">{popup.link || 'No redirect link'}</p>
            </div>
          </div>
        ))}
        {popups?.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 italic">
            No popups found. Create one to welcome your visitors!
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={deletePopup.isPending}
        title="Delete Popup"
        message="Are you sure you want to delete this welcome popup?"
      />
    </div>
  );
}
