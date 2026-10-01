import os

path = 'erp-api/src/main/java/com/neurolinx/erp/config/DataSeeder.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

new_menu = """                MenuItem analytics = seedMenu.apply(new String[]{"Analytics", "/res-analytics", "line-chart", "Restaurant", null});
                MenuItem reports = seedMenu.apply(new String[]{"Reports (CSV)", "/res-reports", "file-spreadsheet", "Restaurant", null});"""

text = text.replace('                MenuItem analytics = seedMenu.apply(new String[]{"Analytics", "/res-analytics", "line-chart", "Restaurant", null});', new_menu)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched DataSeeder with Reports")
