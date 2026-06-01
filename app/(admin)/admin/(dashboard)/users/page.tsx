'use client';

import { useState } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  Edit, 
  Trash2, 
  User as UserIcon,
  Phone,
  Mail,
  Shield,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import Pagination from '@/components/admin/Pagination';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { adminApi } from '@/lib/fetchers';
import { 
  useUsers, 
  useCreateStaff, 
  useUpdateUser, 
  useToggleUserStatus, 
  useDeleteUser,
  User
} from '@/lib/hooks/useUsers';
import { createStaffSchema, updateUserSchema } from '@/lib/validations/user';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [promotionUser, setPromotionUser] = useState<{ name: string, phone: string, role: string } | null>(null);

  // Form Field States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [password, setPassword] = useState('');

  const ITEMS_PER_PAGE = 10;

  // Data Fetching
  const { data, isLoading } = useUsers(
    currentPage, 
    ITEMS_PER_PAGE, 
    roleFilter === 'all' ? ['admin', 'staff'] : roleFilter, 
    statusFilter, 
    searchQuery
  );

  const createMutation = useCreateStaff();
  const updateMutation = useUpdateUser();
  const toggleStatusMutation = useToggleUserStatus();
  const deleteMutation = useDeleteUser();

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setRole(user.role as 'admin' | 'staff');
    setPassword('');
    setErrors({});
    setServerError(null);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('staff');
    setPassword('');
    setErrors({});
    setServerError(null);
    setShowModal(true);
  };

  const validate = () => {
    const data = { name, email, phone, role, password };
    const schema = editingUser ? updateUserSchema : createStaffSchema;
    const result = schema.safeParse(data);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0]?.toString();
        if (path && !newErrors[path]) {
          newErrors[path] = issue.message;
        }
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleDelete = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(showDeleteConfirm);
      toast.success('User deleted successfully');
      setShowDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await toggleStatusMutation.mutateAsync(id);
      toast.success('Status updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);
    
    if (!validate()) return;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('role', role);
    if (password) {
      formData.append('password', password);
    }
    
    try {
      if (editingUser) {
        await updateMutation.mutateAsync({ id: editingUser.id, formData });
        toast.success('User updated successfully');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Staff account created successfully');
      }
      setShowModal(false);
      setEditingUser(null);
    } catch (error: any) {
      if (error.response?.status === 409) {
        const conflictUser = error.response.data.user;
        setPromotionUser({ 
          name: conflictUser?.name || name, 
          phone: phone,
          role: role
        });
        setShowModal(false);
        return;
      }
      
      const message = error.response?.data?.message || 'An error occurred';
      setServerError(message);
      toast.error(message);
    }
  };

  const handlePromote = async () => {
    if (!promotionUser) return;
    try {
      // 1. Search for user by phone
      const searchResponse = await adminApi.get('/users', { 
        params: { search: promotionUser.phone, role: 'customer' } 
      });
      const users = searchResponse.data.data.users;
      
      if (!users || users.length === 0) {
        toast.error('Could not find existing user to promote');
        setPromotionUser(null);
        return;
      }

      const existingUserId = users[0]._id || users[0].id;

      // 2. Update the user with form data
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('role', role);
      if (password) {
        formData.append('password', password);
      }

      await updateMutation.mutateAsync({ id: existingUserId, formData });
      toast.success(`${promotionUser.name} promoted to ${promotionUser.role}`);
      setPromotionUser(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Promotion failed');
    }
  };

  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-[1600px] mx-auto">
      {/* Promotion Modal */}
      {promotionUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle size={24} />
              <h2 className="text-xl font-bold">User Already Exists</h2>
            </div>
            <p className="text-muted text-sm">
              <span className="font-bold text-primary">{promotionUser.name}</span> already exists as a customer. 
              Do you want to promote them to <span className="font-bold text-brand-dark uppercase">{promotionUser.role}</span>?
            </p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setPromotionUser(null)}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm font-bold hover:bg-background transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handlePromote}
                disabled={updateMutation.isPending}
                className="flex-1 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-all flex items-center justify-center gap-2"
              >
                {updateMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                Yes, Promote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Staff Management</h1>
          <p className="text-muted text-sm mt-1">Manage administrators and staff accounts.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 active:scale-95 w-full lg:w-auto"
        >
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-brand transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 shrink-0">
            <Shield size={16} className="text-muted" />
            <select 
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-transparent text-sm font-medium focus:outline-none border-none p-0 cursor-pointer flex-1 sm:min-w-[100px]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2 shrink-0">
            <Filter size={16} className="text-muted" />
            <select 
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-transparent text-sm font-medium focus:outline-none border-none p-0 cursor-pointer flex-1 sm:min-w-[100px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="text-xs font-medium text-muted text-center lg:text-right lg:ml-auto">
            {users.length} Staff Found
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#F2F9F4] border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">User Info</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-dark uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-9 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : users.length > 0 ? (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-background transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-dark shrink-0 font-bold">
                          {user.name?.charAt(0) || <UserIcon size={20} />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-primary">{user.name || 'N/A'}</div>
                          <div className="text-[10px] text-muted font-medium uppercase tracking-wider">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-primary font-medium">
                          <Mail size={12} className="text-muted" />
                          {user.email || 'No email'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <Phone size={12} className="text-muted" />
                          {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-red-50 text-red-600' : 
                        user.role === 'staff' ? 'bg-blue-50 text-blue-600' : 
                        'bg-gray-50 text-gray-600'
                      }`}>
                        <Shield size={10} />
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(user.id)}
                        disabled={toggleStatusMutation.isPending}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          user.isActive ? 'bg-brand' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            user.isActive ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit User"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-[#FF6B6B] hover:bg-red-50 rounded-lg transition-all"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-muted">
                        <Search size={24} />
                      </div>
                      <div>
                        <p className="text-primary font-bold">No staff found</p>
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
        totalPages={totalPages} 
        onPageChange={(page) => setCurrentPage(page)} 
      />

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-border animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-border flex justify-between items-center bg-[#F9FAFB]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand-dark">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary">
                    {editingUser ? 'Edit User' : 'Add New Staff'}
                  </h2>
                  <p className="text-xs text-muted">Enter account details for the user.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-background rounded-lg text-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                {serverError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} />
                    {serverError}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block">Full Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                      }}
                      placeholder="e.g. John Doe"
                      className={`w-full bg-background border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all ${errors.name ? 'border-red-500' : 'border-border'}`}
                    />
                    {errors.name && <p className="text-red-500 text-[10px] font-bold">{errors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block">Email Address</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      placeholder="e.g. john@example.com"
                      className={`w-full bg-background border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all ${errors.email ? 'border-red-500' : 'border-border'}`}
                    />
                    {errors.email && <p className="text-red-500 text-[10px] font-bold">{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block">Phone Number</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      placeholder="e.g. 9876543210"
                      className={`w-full bg-background border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all ${errors.phone ? 'border-red-500' : 'border-border'}`}
                    />
                    {errors.phone && <p className="text-red-500 text-[10px] font-bold">{errors.phone}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block">Account Role</label>
                    <div className="relative">
                      <select 
                        value={role}
                        onChange={(e) => {
                          setRole(e.target.value as 'admin' | 'staff');
                          if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
                        }}
                        className={`w-full bg-background border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all appearance-none cursor-pointer ${errors.role ? 'border-red-500' : 'border-border'}`}
                      >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                      </select>
                      <Shield size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                    {errors.role && <p className="text-red-500 text-[10px] font-bold">{errors.role}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted uppercase tracking-wider block">
                      {editingUser ? 'Reset Password' : 'Password'}
                    </label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                      }}
                      placeholder={editingUser ? "Leave blank to keep current" : "Min 6 characters"}
                      className={`w-full bg-background border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-brand transition-all ${errors.password ? 'border-red-500' : 'border-border'}`}
                    />
                    {errors.password && <p className="text-red-500 text-[10px] font-bold">{errors.password}</p>}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border bg-[#F9FAFB] flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-border rounded-xl text-sm font-bold text-primary hover:bg-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={18} className="animate-spin" />}
                  {editingUser ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
        error={null}
        title="Delete User Account?"
        message="Are you sure you want to delete this user? This action cannot be undone and will permanently remove all associated data."
      />
    </div>
  );
}
