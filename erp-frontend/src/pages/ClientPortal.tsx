import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';

export default function ClientPortal() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<{ name: string; logo: string } | null>(null);

  useEffect(() => {
    fetch('https://erp-api.neurolinx.in/api/auth/client/' + slug)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setClient(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!client) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
      <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '600px', width: '100%' }}>
        {client.logo && (
          <img src={client.logo} alt={client.name + ' Logo'} style={{ maxWidth: '200px', maxHeight: '200px', marginBottom: '2rem', borderRadius: '8px' }} />
        )}
        <h1 style={{ color: '#111827', margin: '0 0 1rem 0', fontSize: '2.5rem' }}>Welcome to {client.name}</h1>
        <p style={{ color: '#4b5563', fontSize: '1.25rem', margin: 0 }}>
          Hi! Welcome to our digital portal. Please scan a QR code at your table to order.
        </p>
      </div>
    </div>
  );
}
