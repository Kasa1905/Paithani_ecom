'use client';

import { useState, useEffect } from 'react';
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

interface AddressForm {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
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
  
  const [address, setAddress] = useState<AddressForm>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchCart();
    fetchUserAddress();
  }, [isAuthenticated, router]);

  const fetchUserAddress = async () => {
    try {
      const response = await fetch('/api/user', { credentials: 'include' });
      if (response.ok) {
        const data = await parseJsonSafe(response);
        if (data?.user?.address) {
          setAddress(prev => ({
            ...prev,
            ...data.user.address,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch user address:', err);
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

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const validateAddress = () => {
    if (!address.fullName.trim()) return 'Full name is required';
    if (!address.phone.trim()) return 'Phone number is required';
    if (!/^\d{10}$/.test(address.phone)) return 'Phone number must be 10 digits';
    if (!address.addressLine1.trim()) return 'Address is required';
    if (!address.city.trim()) return 'City is required';
    if (!address.state.trim()) return 'State is required';
    if (!address.pincode.trim()) return 'Pincode is required';
    if (!/^\d{6}$/.test(address.pincode)) return 'Pincode must be 6 digits';
    return null;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateAddress();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ address }),
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
    return <UserLayout><div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div></UserLayout>;
  }

  return (
    <UserLayout>
      <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '30px' }}>Checkout</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px' }}>
          {/* Address Form */}
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Shipping Address</h2>
            
            {error && (
              <div style={{ 
                padding: '12px', 
                backgroundColor: '#fee', 
                color: '#c00', 
                borderRadius: '4px', 
                marginBottom: '20px',
                fontSize: '14px' 
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handlePlaceOrder}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={address.fullName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={address.phone}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile number"
                  required
                  maxLength={10}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={address.addressLine1}
                  onChange={handleInputChange}
                  placeholder="House no., Street name"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={address.addressLine2}
                  onChange={handleInputChange}
                  placeholder="Landmark, Area (Optional)"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={address.pincode}
                    onChange={handleInputChange}
                    placeholder="6 digits"
                    required
                    maxLength={6}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={address.country}
                    onChange={handleInputChange}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#f5f5f5',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: submitting ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div style={{ 
              padding: '20px', 
              border: '1px solid #ddd', 
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
              position: 'sticky',
              top: '20px',
            }}>
              <h2 style={{ marginTop: 0, fontSize: '20px', marginBottom: '20px' }}>Order Summary</h2>
              
              <div style={{ marginBottom: '16px' }}>
                {cartItems.map((item) => (
                  <div 
                    key={item.product._id}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      paddingBottom: '10px',
                      marginBottom: '10px',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>
                      {item.product.title} x {item.quantity}
                    </span>
                    <span style={{ fontWeight: '500', fontSize: '14px' }}>
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '2px solid #333',
                fontSize: '18px',
                fontWeight: 'bold',
              }}>
                <span>Total:</span>
                <span style={{ color: '#28a745' }}>
                  ₹{calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
