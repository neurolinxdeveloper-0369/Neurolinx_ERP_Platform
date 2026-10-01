import os

path = 'erp-frontend/src/pages/restaurant/Billing.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("import React, { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
