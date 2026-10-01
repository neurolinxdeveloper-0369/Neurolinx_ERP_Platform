import os

path = 'erp-api/src/main/java/com/neurolinx/erp/config/DataSeeder.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

new_menu = """                MenuItem branches = seedMenu.apply(new String[]{"Branches", "/res-branches", "store", "Restaurant", null});
                MenuItem settings = seedMenu.apply(new String[]{"Settings", "/res-settings", "settings", "Restaurant", null});"""

text = text.replace('                MenuItem settings = seedMenu.apply(new String[]{"Settings", "/res-settings", "settings", "Restaurant", null});', new_menu)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched DataSeeder with Branches")
