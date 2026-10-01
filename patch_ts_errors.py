import os

path = 'erp-frontend/src/pages/restaurant/Billing.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("onClick={() => handlePrint(order)}", "onClick={() => handlePrint(ord)}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

path2 = 'erp-frontend/src/pages/restaurant/Kitchen.tsx'
with open(path2, 'r', encoding='utf-8') as f:
    text2 = f.read()

text2 = text2.replace("import React, { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';")

with open(path2, 'w', encoding='utf-8') as f:
    f.write(text2)

print("Fixed errors")
