'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { useAuth } from '@/context/AuthContext';

interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
}

interface AddressForm extends Omit<Address, '_id' | 'isDefault'> {
  isDefault: boolean;
}

const parseJsonSafe = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<AddressForm>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: false,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/addresses', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load addresses');
      const data = await parseJsonSafe(res);
      const list: Address[] = data?.addresses || [];
      setAddresses(list);
      if (list.length > 0) {
        const preferred = list.find((a) => a.isDefault) || list[0];
        setSelectedId(preferred._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load addresses');
    }
  };

  const validate = () => {
    if (!form.fullName.trim()) return 'Full name is required';
    if (!/^\d{10}$/.test(form.phone)) return 'Phone number must be 10 digits';
    if (!form.addressLine1.trim()) return 'Address line 1 is required';
    if (!form.city.trim()) return 'City is required';
    if (!form.state.trim()) return 'State is required';
    if (!/^\d{6}$/.test(form.pincode)) return 'Pincode must be 6 digits';
    return null;
  };

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await parseJsonSafe(res);
        throw new Error(body?.error || 'Failed to add address');
      }
      const data = await parseJsonSafe(res);
      if (data?.address?._id) {
        setSelectedId(data.address._id);
      }
      setForm({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        isDefault: false,
      });
      await fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add address');
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: string) => {
    await fetch(`/api/addresses/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    });
    await fetchAddresses();
  };

  const deleteAddress = async (id: string) => {
    setError('');
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await parseJsonSafe(res);
        throw new Error(body?.error || 'Failed to delete address');
      }
      await fetchAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address');
    }
  };

  if (authLoading) {
    return <UserLayout><div style={{ padding: '30px' }}>Loading...</div></UserLayout>;
  }

  return (
    <UserLayout>
      <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        <h1>My Addresses</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '14px' }}>
            <h3 style={{ marginTop: 0 }}>Saved Addresses</h3>
            {addresses.length === 0 ? (
              <p style={{ color: '#666' }}>No addresses saved yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {addresses.map((addr) => (
                  <li key={addr._id} style={{ border: '1px solid #eee', padding: '12px', borderRadius: '6px', marginBottom: '10px', background: selectedId === addr._id ? '#f5f9ff' : '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <label style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" name="address" value={addr._id} checked={selectedId === addr._id} onChange={() => setSelectedId(addr._id)} />
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {addr.fullName} {addr.isDefault && <span style={{ color: '#1976d2', fontSize: '12px' }}>(Default)</span>}
                          </div>
                          <div style={{ color: '#555' }}>{addr.phone}</div>
                          <div style={{ color: '#555' }}>{addr.addressLine1}</div>
                          {addr.addressLine2 && <div style={{ color: '#777' }}>{addr.addressLine2}</div>}
                          <div style={{ color: '#555' }}>{addr.city}, {addr.state} - {addr.pincode}</div>
                          <div style={{ color: '#555' }}>{addr.country}</div>
                        </div>
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!addr.isDefault && (
                          <button onClick={() => setDefault(addr._id)} style={{ padding: '6px 10px', border: '1px solid #1976d2', background: '#fff', color: '#1976d2', borderRadius: '4px', cursor: 'pointer' }}>Set Default</button>
                        )}
                        <button onClick={() => deleteAddress(addr._id)} style={{ padding: '6px 10px', border: '1px solid #d32f2f', background: '#fff', color: '#d32f2f', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '14px' }}>
            <h3 style={{ marginTop: 0 }}>Add Address</h3>
            <form onSubmit={addAddress}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                <input type="text" name="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full Name" required style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <input type="tel" name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (10 digits)" required maxLength={10} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <input type="text" name="addressLine1" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} placeholder="Address line 1" required style={{ marginTop: '10px', width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              <input type="text" name="addressLine2" value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} placeholder="Address line 2 (optional)" style={{ marginTop: '10px', width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginTop: '10px' }}>
                <input type="text" name="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" required style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <input type="text" name="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" required style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px', marginTop: '10px' }}>
                <input type="text" name="pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="Pincode" required maxLength={6} style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
                <input type="text" name="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                Set as default
              </label>
              <button type="submit" disabled={saving} style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                {saving ? 'Saving...' : 'Add Address'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
