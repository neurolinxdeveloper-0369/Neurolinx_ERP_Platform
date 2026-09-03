import os
import re

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(
    r"const \[viewMode, setViewMode\] = useState<'POS' \| 'Tables' \| 'Reservations'>\('POS'\);\s*const \[selectedTable, setSelectedTable\] = useState<string>\(''\);",
    "const [viewMode, setViewMode] = useState<'POS' | 'Tables' | 'Reservations'>('POS');\n  const [selectedTable, setSelectedTable] = useState<string>('');\n  const [activeTableTab, setActiveTableTab] = useState<string | null>(null);\n  const [activeFloor, setActiveFloor] = useState<string>('1st Floor');",
    text
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Fixed state replacement")
