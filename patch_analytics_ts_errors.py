import os

path = 'erp-frontend/src/pages/restaurant/Analytics.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("(value: number)", "(value: any)")
text = text.replace("timeChartData.map((entry, index)", "timeChartData.map((_entry, index)")

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched Analytics.tsx TS errors")
