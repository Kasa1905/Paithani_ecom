'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { useAuth } from '@/context/AuthContext';

interface CartItem {
  product: {
    _id: string;
    title: string;
    price: number;
  };
  quantity: number;
}

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

export default function CheckoutAddressPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  const [addressForm, setAddressForm] = useState<AddressForm>({
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
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchCart();
    fetchAddresses();
  }, [isAuthenticated, router]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/addresses', { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to load addresses');
      }

      const data = await parseJsonSafe(res);
      const list: Address[] = data?.addresses || [];
      setAddresses(list);
      if (list.length > 0) {
        const preferred = list.find((a) => a.isDefault) || list[0];
        setSelectedAddressId(preferred._id);
      }
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch cart');
      }
      const data = await parseJsonSafe(response);
      setCartItems(data?.items || []);

      if (!data?.items || data.items.length === 0) {
        router.push('/cart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = useMemo(
    () => () => cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const validateAddress = () => {
    if (!addressForm.fullName.trim()) return 'Full name is required';
    if (!addressForm.phone.trim()) return 'Phone number is required';
    if (!/^\d{10}$/.test(addressForm.phone)) return 'Phone number must be 10 digits';
    if (!addressForm.addressLine1.trim()) return 'Address is required';
    if (!addressForm.city.trim()) return 'City is required';
    if (!addressForm.state.trim()) return 'State is required';
    if (!addressForm.pincode.trim()) return 'Pincode is required';
    if (!/^\d{6}$/.test(addressForm.pincode)) return 'Pincode must be 6 digits';
    return null;
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateAddress();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(addressForm),
      });

      if (!res.ok) {
        const errBody = await parseJsonSafe(res);
        throw new Error(errBody?.error || 'Failed to add address');
      }

      const data = await parseJsonSafe(res);
      await fetchAddresses();
      if (data?.address?._id) {
        setSelectedAddressId(data.address._id);
      }
      setAddressForm({
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
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
      if (selectedAddressId === id) {
        setSelectedAddressId('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select an address to continue');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ addressId: selectedAddressId }),
      });

      if (!response.ok) {
        const errorData = await parseJsonSafe(response);
        throw new Error(errorData?.error || 'Failed to place order');
      }

      const data = await parseJsonSafe(response);
      router.push(`/orders?success=true&orderId=${data.order._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '30px' }}>Checkout</h1>

        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fee',
              color: '#c00',
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', background: '#fff' }}>
            <h2 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px' }}>My Addresses</h2>

            {addresses.length === 0 ? (
              <p style={{ color: '#666', marginBottom: '16px' }}>No saved addresses yet. Add one to continue.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0' }}>
                {addresses.map((addr) => (
                  <li
                    key={addr._id}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '10px',
                      backgroundColor: selectedAddressId === addr._id ? '#f3f8ff' : '#fafafa',
                    }}
                  >
                    <label style={{ display: 'flex', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="selectedAddress"
                        value={addr._id}
                        checked={selectedAddressId === addr._id}
                        onChange={() => setSelectedAddressId(addr._id)}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {addr.fullName}{' '}
                          {addr.isDefault && (
                            <span style={{ color: '#1976d2', fontSize: '12px' }}>(Default)</span>
                          )}
                        </div>
                        <div style={{ color: '#555' }}>{addr.phone}</div>
                        <div style={{ color: '#555' }}>{addr.addressLine1}</div>
                        {addr.addressLine2 && <div style={{ color: '#777' }}>{addr.addressLine2}</div>}
                        <div style={{ color: '#555' }}>
                          {addr.city}, {addr.state} - {addr.pincode}
                        </div>
                        <div style={{ color: '#555' }}>{addr.country}</div>
                      </div>
                    </label>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/addresses/${addr._id}`, {
                              method: 'PATCH',
                              credentials: 'include',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isDefault: true }),
                            });
                            await fetchAddresses();
                          }}
                          style={{
                            padding: '6px 10px',
                            border: '1px solid #1976d2',
                            background: '#fff',
                            color: '#1976d2',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr._id)}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #d32f2f',
                          background: '#fff',
                          color: '#d32f2f',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <h3 style={{ marginBottom: '10px', fontSize: '16px' }}>Add New Address</h3>
            <form onSubmit={handleAddAddress}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <input
                  type="text"
                  name="fullName"
                  value={addressForm.fullName}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  required
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <input
                  type="tel"
                  name="phone"
                  value={addressForm.phone}
                  onChange={handleInputChange}
                  placeholder="Phone (10 digits)"
                  required
                  maxLength={10}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <input
                type="text"
                name="addressLine1"
                value={addressForm.addressLine1}
                onChange={handleInputChange}
                placeholder="Address line 1"
                required
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              <input
                type="text"
                name="addressLine2"
                value={addressForm.addressLine2}
                onChange={handleInputChange}
                placeholder="Address line 2 (optional)"
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  marginTop: '10px',
                }}
              >
                <input
                  type="text"
                  name="city"
                  value={addressForm.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  required
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  name="state"
                  value={addressForm.state}
                  onChange={handleInputChange}
                  placeholder="State"
                  required
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  marginTop: '10px',
                }}
              >
                <input
                  type="text"
                  name="pincode"
                  value={addressForm.pincode}
                  onChange={handleInputChange}
                  placeholder="Pincode"
                  required
                  maxLength={6}
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  name="country"
                  value={addressForm.country}
                  onChange={handleInputChange}
                  placeholder="Country"
                  style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                />
                Set as default
              </label>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: '12px',
                  padding: '12px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {submitting ? 'Saving...' : 'Add Address'}
              </button>
            </form>
          </div>

          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' }}>
            <h2 style={{ marginTop: 0, fontSize: '18px' }}>Order Summary</h2>

            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '10px' }}>Items:</h3>
              {cartItems.map((item) => (
                <div
                  key={item.product._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #eee',
                    marginBottom: '10px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.product.title}</div>
                    <div style={{ color: '#666' }}>Qty: {item.quantity}</div>
                  </div>
                  <div>₹{(item.product.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '20px',
                fontSize: '16px',
                fontWeight: 700,
              }}
            >
              <span>Total:</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting || addresses.length === 0}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px 16px',
                backgroundColor: addresses.length === 0 ? '#bbb' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: addresses.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: 700,
              }}
            >
              {submitting ? 'Placing order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
