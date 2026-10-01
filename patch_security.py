import os

path = 'erp-api/src/main/java/com/neurolinx/erp/security/SecurityConfig.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add Customizer.withDefaults() for cors
new_security = """        http
            .cors(Customizer.withDefaults())
            .headers(headers -> headers
                .crossOriginOpenerPolicy(coop -> coop.policy(org.springframework.security.web.header.writers.CrossOriginOpenerPolicyHeaderWriter.CrossOriginOpenerPolicy.UNSAFE_NONE))
            )
            .csrf(csrf -> csrf.disable())"""

text = text.replace("""        http
            
            .csrf(csrf -> csrf.disable())""", new_security)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched SecurityConfig COOP and CORS")
