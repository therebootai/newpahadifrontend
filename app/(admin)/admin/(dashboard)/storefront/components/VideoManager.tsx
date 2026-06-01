'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit, Save, X, Info, Check, Play } from 'lucide-react';
import { useAdminVideos, useCreateVideo, useUpdateVideo, useDeleteVideo } from '@/lib/hooks/useStorefront';
import { VideoContent } from '@/lib/types';
import { toast } from 'sonner';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

export default function VideoManager() {
  const { data: videos, isLoading } = useAdminVideos();
  const createVideo = useCreateVideo();
  const updateVideo = useUpdateVideo();
  const deleteVideo = useDeleteVideo();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoContent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    isActive: true,
    sortOrder: 0,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');

  const resetForm = () => {
    setFormData({ title: '', isActive: true, sortOrder: 0 });
    setVideoFile(null);
    setVideoPreview('');
    setEditingVideo(null);
    setIsFormOpen(false);
  };

  const handleEdit = (video: VideoContent) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      isActive: video.isActive,
      sortOrder: video.sortOrder,
    });
    setVideoPreview(video.video.url);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingVideo && !videoFile) {
      toast.error('Video file is required for new trending videos');
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('isActive', String(formData.isActive));
    data.append('sortOrder', String(formData.sortOrder));
    
    if (videoFile) data.append('video', videoFile);

    try {
      if (editingVideo) {
        await updateVideo.mutateAsync({ id: editingVideo._id, formData: data });
        toast.success('Video updated successfully');
      } else {
        await createVideo.mutateAsync(data);
        toast.success('Video created successfully');
      }
      resetForm();
    } catch (error) {
      toast.error('Failed to save video');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteVideo.mutateAsync(deleteId);
      toast.success('Video deleted successfully');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete video');
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading videos...</div>;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Trending Videos</h2>
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-all"
          >
            <Plus size={18} /> Add New Video
          </button>
        )}
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">{editingVideo ? 'Edit Video' : 'New Video'}</h3>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Video Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  placeholder="e.g. Traditional Necklace Showcase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Video File (MP4)</label>
              <div className="relative aspect-[9/16] max-h-[300px] w-auto mx-auto rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center overflow-hidden group">
                {videoPreview ? (
                  <video src={videoPreview} className="w-full h-full object-cover" muted autoPlay loop />
                ) : (
                  <div className="text-center p-4">
                    <Play size={32} className="mx-auto text-gray-400 mb-2" />
                    <span className="text-xs font-bold text-gray-400">Upload Video</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="video/mp4"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setVideoFile(file);
                      setVideoPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 justify-center">
                <Info size={12} /> Prefer portrait videos for the slider.
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
              disabled={createVideo.isPending || updateVideo.isPending}
              className="px-8 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {(createVideo.isPending || updateVideo.isPending) ? (
                <Check className="animate-pulse" />
              ) : (
                <Save size={18} />
              )}
              {editingVideo ? 'Update Video' : 'Create Video'}
            </button>
          </div>
        </form>
      )}

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos?.map((video) => (
          <div key={video._id} className="group relative bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
            <div className="relative aspect-[9/16] bg-black">
              <video src={video.video.url} className="w-full h-full object-cover" muted />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <Play className="text-white fill-current" size={40} />
              </div>
              <div className="absolute top-3 left-3">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                  video.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {video.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="absolute top-3 right-3 flex gap-1">
                <button
                  onClick={() => handleEdit(video)}
                  className="p-2 bg-white/90 text-blue-500 rounded-lg shadow-sm hover:bg-white transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => setDeleteId(video._id)}
                  className="p-2 bg-white/90 text-red-500 rounded-lg shadow-sm hover:bg-white transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-gray-800 text-sm truncate pr-2">{video.title}</h4>
                <span className="text-xs font-bold text-gray-400">#{video.sortOrder}</span>
              </div>
            </div>
          </div>
        ))}
        {videos?.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 italic">
            No videos found. Upload some to showcase your collections!
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={deleteVideo.isPending}
        title="Delete Video"
        message="Are you sure you want to delete this video? It will be removed from the trending section."
      />
    </div>
  );
}
