const email = 'neurolinxdeveloper@gmail.com';
const baseUrl = 'https://erp-api.neurolinx.in';

async function wipeModules() {
  console.log('Logging in...');
  const loginRes = await fetch(`${baseUrl}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  if (!loginRes.ok) {
    console.error('Failed to login:', await loginRes.text());
    return;
  }
  
  const tokenObj = await loginRes.json();
  const token = tokenObj.token;
  console.log('Got token, length:', token.length);

  console.log('Fetching modules...');
  const modulesRes = await fetch(`${baseUrl}/api/admin/menu-items`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!modulesRes.ok) {
    console.error('Failed to fetch modules:', await modulesRes.text());
    return;
  }
  
  const modules = await modulesRes.json();
  console.log(`Found ${modules.length} modules to delete.`);

  for (const mod of modules) {
    console.log(`Deleting module ${mod.id} - ${mod.name}...`);
    const delRes = await fetch(`${baseUrl}/api/admin/menu-items/${mod.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`Deleted ${mod.id}: ${delRes.status}`);
  }
  
  console.log('Done!');
}

wipeModules().catch(console.error);
