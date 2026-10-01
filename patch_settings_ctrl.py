import os

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/SettingsController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

new_fields = """
        if (payload.containsKey("currencySymbol")) s.setCurrencySymbol((String) payload.get("currencySymbol"));
        if (payload.containsKey("openingTime")) s.setOpeningTime((String) payload.get("openingTime"));
        if (payload.containsKey("closingTime")) s.setClosingTime((String) payload.get("closingTime"));
        return ResponseEntity.ok(settingsRepo.save(s));
"""

text = text.replace('return ResponseEntity.ok(settingsRepo.save(s));', new_fields)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated SettingsController.java")
