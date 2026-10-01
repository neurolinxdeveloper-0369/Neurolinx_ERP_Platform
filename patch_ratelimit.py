import os

path = 'erp-api/src/main/java/com/neurolinx/erp/config/RateLimitFilter.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

new_filter = """    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (request.getMethod().equalsIgnoreCase("OPTIONS")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (request.getRequestURI().startsWith("/api/auth/")) {"""

text = text.replace("""    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (request.getRequestURI().startsWith("/api/auth/")) {""", new_filter)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched RateLimitFilter to ignore OPTIONS")
