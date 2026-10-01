import os

path = 'erp-frontend/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('<Route path="/res-billing" element={<PlaceholderModule title="Billing" iconName="Receipt" description="View all past invoices, receipts, and split payments." />} />', '<Route path="/res-billing" element={<RestaurantBilling />} />')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

path2 = 'erp-frontend/src/pages/restaurant/Billing.tsx'
with open(path2, 'r', encoding='utf-8') as f:
    text2 = f.read()
text2 = text2.replace("import React, { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';")
with open(path2, 'w', encoding='utf-8') as f:
    f.write(text2)
print("Fixed App and Billing TS errors")
