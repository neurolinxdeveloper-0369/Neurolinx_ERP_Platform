import os

path = 'erp-frontend/src/components/Login.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

old_block = """    localStorage.setItem('token', data.token);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('username', userEmail);
    if (data.role) localStorage.setItem('role', data.role);
    if (data.industryType) localStorage.setItem('industryType', data.industryType);
    if (data.companySlug) localStorage.setItem('companySlug', data.companySlug);
    if (data.companyName) localStorage.setItem('companyName', data.companyName);
    if (data.companyLogo) localStorage.setItem('companyLogo', data.companyLogo);"""

new_block = """    localStorage.clear(); // Clear previous session data
    localStorage.setItem('token', data.token);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('username', userEmail);
    if (data.role) localStorage.setItem('role', data.role);
    if (data.industryType) localStorage.setItem('industryType', data.industryType);
    if (data.companySlug) localStorage.setItem('companySlug', data.companySlug);
    if (data.companyName) localStorage.setItem('companyName', data.companyName);
    if (data.companyLogo) localStorage.setItem('companyLogo', data.companyLogo);"""

text = text.replace(old_block, new_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed Login.tsx localstorage bug')
