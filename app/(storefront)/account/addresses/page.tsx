'use client';

import { useEffect, useState } from "react";
import { MapPin, Plus, Edit2, Trash2, Home, Briefcase, Loader2, AlertCircle } from "lucide-react";
import { useAddressStore, Address } from "@/lib/store/useAddressStore";
import AddressForm from "@/components/AddressForm";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "sonner";

export default function AddressesPage() {
  const { 
    addresses, 
    isLoading, 
    fetchAddresses, 
    createAddress, 
    updateAddress, 
    deleteAddress, 
    setDefaultAddress 
  } = useAddressStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleAdd = () => {
    setEditingAddress(null);
    setIsFormOpen(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsActionLoading(true);
    try {
      await deleteAddress(deleteConfirmId);
      toast.success("Address deleted successfully");
      setDeleteConfirmId(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    setIsActionLoading(true);
    try {
      if (editingAddress) {
        await updateAddress(editingAddress._id, data);
        toast.success("Address updated successfully");
      } else {
        await createAddress(data);
        toast.success("Address added successfully");
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setIsActionLoading(true);
    try {
      await setDefaultAddress(id);
      toast.success("Default address updated");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#222222] tracking-tight mb-1">
            Saved Addresses
          </h1>
          <p className="text-[12px] font-medium text-[#666666] uppercase tracking-wider">
            Manage your delivery locations
          </p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-amber-500 text-white px-5 py-2 rounded-full font-bold text-[12px] uppercase tracking-widest hover:bg-[#222222] transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      {isLoading && addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-amber-500 mb-4" />
          <p className="text-[#666666] font-medium">Loading your addresses...</p>
        </div>
      ) : addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((addr) => (
            <div 
              key={addr._id} 
              className={`p-6 rounded-xl border-2 transition-all relative group ${
                addr.isDefault ? "border-amber-500 bg-amber-500/[0.02]" : "border-[#CCCCCC]/20 bg-white hover:border-[#CCCCCC]/50"
              }`}
            >
              {addr.isDefault && (
                <span className="absolute top-5 right-6 bg-amber-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Default
                </span>
              )}
              
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-5 ${
                addr.isDefault ? "bg-amber-500 text-white" : "bg-[#F5F5F5] text-[#666666]"
              }`}>
                <MapPin size={16} />
              </div>

              <h3 className="text-base font-bold text-[#222222] mb-3">{addr.fullName}</h3>
              
              <div className="space-y-1 text-sm text-[#666666] font-medium leading-relaxed mb-6">
                <p>{addr.addressLine1}</p>
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                <p>{addr.city}, {addr.state} - {addr.postalCode}</p>
                <p className="text-[#222222] pt-1.5 flex items-center gap-2 font-bold">
                  Phone: {addr.phone}
                </p>
              </div>

              <div className="flex items-center gap-4 pt-5 border-t border-[#CCCCCC]/20">
                <button 
                  onClick={() => handleEdit(addr)}
                  className="text-[11px] font-bold text-[#222222] uppercase tracking-widest flex items-center gap-2 hover:text-amber-500 transition-colors"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(addr._id)}
                  className="text-[11px] font-bold text-[#222222] uppercase tracking-widest flex items-center gap-2 hover:text-amber-500 transition-colors"
                >
                  <Trash2 size={12} /> Remove
                </button>
                {!addr.isDefault && (
                  <button 
                    onClick={() => handleSetDefault(addr._id)}
                    className="text-[11px] font-bold text-amber-500 uppercase tracking-widest ml-auto hover:underline"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#F5F5F5] rounded-2xl p-12 text-center border-2 border-dashed border-[#CCCCCC]/30">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <MapPin size={32} className="text-[#BBBBBB]" />
          </div>
          <h2 className="text-lg font-bold text-[#222222] mb-2">No Saved Addresses</h2>
          <p className="text-sm text-[#666666] mb-8 max-w-xs mx-auto">
            Add a delivery address to enjoy faster checkout next time you shop.
          </p>
          <button 
            onClick={handleAdd}
            className="bg-[#222222] text-white px-8 py-3 rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-lg"
          >
            Add Your First Address
          </button>
        </div>
      )}

      {/* Modals */}
      <AddressForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingAddress}
        isLoading={isActionLoading}
      />

      <ConfirmModal 
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Address?"
        message="Are you sure you want to remove this address? This action cannot be undone."
        confirmText="Remove Address"
        variant="danger"
        isLoading={isActionLoading}
      />
    </div>
  );
}
