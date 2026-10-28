import * as Icons from 'lucide-react';

interface Props {
  title: string;
  iconName: keyof typeof Icons;
  description: string;
}

export default function PlaceholderModule({ title, iconName, description }: Props) {
  const IconComponent = Icons[iconName] as any || Icons.Box;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <IconComponent size={24} color="#0284c7" />
        <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.25rem' }}>{title}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
        <IconComponent size={64} color="#cbd5e1" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ margin: 0, color: '#334155', fontSize: '1.5rem', fontWeight: 600 }}>{title} Module</h2>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem', color: '#64748b', maxWidth: '400px', textAlign: 'center' }}>
          {description}
        </p>
        <button style={{ marginTop: '2rem', backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(2,132,199,0.2)' }}>
          Configure Module
        </button>
      </div>
    </div>
  );
}
