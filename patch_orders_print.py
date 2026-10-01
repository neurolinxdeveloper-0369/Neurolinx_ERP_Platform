import os

path = 'erp-frontend/src/pages/restaurant/Orders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

print_func = """
    const handlePrint = (order: any) => {
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) return;
      
      let itemsHtml = '';
      if (order.items) {
        order.items.forEach((item: any) => {
          itemsHtml += `
            <tr>
              <td style="padding: 4px 0; font-size: 14px;">${item.quantity}x ${item.name || 'Item'}</td>
              <td style="padding: 4px 0; text-align: right; font-size: 14px;">${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `;
        });
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${order.orderNumber}</title>
          <style>
            body { font-family: monospace; width: 300px; margin: 0 auto; padding: 20px; color: #000; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .header h2 { margin: 0; font-size: 20px; }
            .header p { margin: 5px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .totals { border-top: 1px dashed #000; padding-top: 10px; }
            .totals div { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
            .totals .grand-total { font-size: 18px; font-weight: bold; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>RESTAURANT</h2>
            <p>Order #${order.orderNumber}</p>
            <p>${order.createdAt}</p>
            <p>${order.orderType}${order.tableName ? ' - ' + order.tableName : ''}</p>
          </div>
          
          <table>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="grand-total"><span>Total</span> <span>${order.totalAmount?.toFixed(2)}</span></div>
          </div>
          
          <div class="footer">
            <p>Thank you for visiting!</p>
            <p>Powered by Neurolinx</p>
          </div>
          
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
    };

    const saveOrderLocally = (serverOrder?: any) => {
"""

text = text.replace("    const saveOrderLocally = (serverOrder?: any) => {", print_func)

print_call = """
      // Dispatch event for Dashboard to catch live updates
      window.dispatchEvent(new CustomEvent('neurolinx_order_placed', { detail: newOrderRecord }));
      window.dispatchEvent(new Event('storage'));

      if (status === 'Completed') {
        handlePrint(newOrderRecord);
      }

      return newOrderRecord;
"""
text = text.replace("""
      // Dispatch event for Dashboard to catch live updates
      window.dispatchEvent(new CustomEvent('neurolinx_order_placed', { detail: newOrderRecord }));
      window.dispatchEvent(new Event('storage'));

      return newOrderRecord;
""", print_call)


with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched Orders.tsx for thermal receipt printing")
