import os

path = 'erp-api/src/main/java/com/neurolinx/erp/config/DataSeeder.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

new_menu = """                MenuItem orders = seedMenu.apply(new String[]{"Orders", "/res-orders", "clipboard-list", "Restaurant", null});
                MenuItem kitchen = seedMenu.apply(new String[]{"Kitchen KDS", "/res-kitchen", "monitor-play", "Restaurant", null});"""

text = text.replace('                MenuItem orders = seedMenu.apply(new String[]{"Orders", "/res-orders", "clipboard-list", "Restaurant", null});', new_menu)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched DataSeeder with Kitchen KDS")
