# 📦 Endpoints del Módulo de Inventario y Finanzas

## 🔐 Autenticación

Todos los endpoints (excepto /api/auth/**) requieren autenticación JWT. Incluye el token en el header:

Authorization: Bearer {tu_token_jwt}


---

## 🛍 PRODUCTOS

### 1. Crear Producto

*POST* /api/products

*Headers:*

Authorization: Bearer {token}
Content-Type: application/json


*Body:*
json
{
  "name": "Laptop Dell",
  "description": "Laptop Dell Inspiron 15",
  "purchasePrice": 500.00,
  "salePrice": 750.00,
  "stock": 10,
  "minStock": 2,
  "unit": "unidades"
}


*Respuesta (201 Created):*
json
{
  "id": 1,
  "userId": 1,
  "name": "Laptop Dell",
  "description": "Laptop Dell Inspiron 15",
  "purchasePrice": 500.00,
  "salePrice": 750.00,
  "stock": 10,
  "minStock": 2,
  "unit": "unidades",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00",
  "active": true,
  "profitPerUnit": 250.00
}


### 2. Obtener Productos

*GET* /api/products?activeOnly=true

*Headers:*

Authorization: Bearer {token}


*Respuesta (200 OK):*
json
[
  {
    "id": 1,
    "userId": 1,
    "name": "Laptop Dell",
    "description": "Laptop Dell Inspiron 15",
    "purchasePrice": 500.00,
    "salePrice": 750.00,
    "stock": 10,
    "minStock": 2,
    "unit": "unidades",
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:30:00",
    "active": true,
    "profitPerUnit": 250.00
  }
]


---

## 💰 VENTAS

### 3. Registrar Venta

*POST* /api/sales

*Headers:*

Authorization: Bearer {token}
Content-Type: application/json


*Body:*
json
{
  "productId": 1,
  "quantity": 2,
  "unitPrice": 750.00,
  "notes": "Venta al cliente Juan Pérez",
  "saleDate": "2024-01-15T10:30:00"
}


*Respuesta (201 Created):*
json
{
  "id": 1,
  "userId": 1,
  "productId": 1,
  "productName": "Laptop Dell",
  "quantity": 2,
  "unitPrice": 750.00,
  "totalAmount": 1500.00,
  "profit": 500.00,
  "saleDate": "2024-01-15T10:30:00",
  "notes": "Venta al cliente Juan Pérez",
  "createdAt": "2024-01-15T10:30:00"
}


*Nota:* El stock del producto se actualiza automáticamente al registrar la venta.

---

## 💵 GASTOS FIJOS

### 4. Crear Gasto Fijo

*POST* /api/expenses/fixed

*Headers:*

Authorization: Bearer {token}
Content-Type: application/json


*Body:*
json
{
  "name": "Alquiler local",
  "description": "Alquiler mensual del local comercial",
  "amount": 1000.00,
  "period": "MONTHLY"
}


**Valores válidos para period:**
- MONTHLY - Mensual
- WEEKLY - Semanal
- DAILY - Diario
- YEARLY - Anual

*Respuesta (201 Created):*
json
{
  "id": 1,
  "userId": 1,
  "name": "Alquiler local",
  "description": "Alquiler mensual del local comercial",
  "amount": 1000.00,
  "period": "MONTHLY",
  "monthlyAmount": 1000.00,
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00",
  "active": true
}


---

## 💳 TRANSACCIONES FINANCIERAS (Ingresos/Egresos)

### 5. Crear Transacción

*POST* /api/transactions

*Headers:*

Authorization: Bearer {token}
Content-Type: application/json


*Body (Ingreso):*
json
{
  "type": "INCOME",
  "amount": 500.00,
  "description": "Pago por servicios de consultoría",
  "category": "Servicios",
  "transactionDate": "2024-01-15T10:30:00"
}


*Body (Egreso):*
json
{
  "type": "EXPENSE",
  "amount": 200.00,
  "description": "Compra de materiales de oficina",
  "category": "Materiales",
  "transactionDate": "2024-01-15T10:30:00"
}


**Valores válidos para type:**
- INCOME - Ingreso
- EXPENSE - Egreso

*Respuesta (201 Created):*
json
{
  "id": 1,
  "userId": 1,
  "type": "INCOME",
  "amount": 500.00,
  "description": "Pago por servicios de consultoría",
  "category": "Servicios",
  "transactionDate": "2024-01-15T10:30:00",
  "createdAt": "2024-01-15T10:30:00"
}


---

## 📊 REPORTES FINANCIEROS

### 6. Obtener Ganancia por Producto

*GET* /api/financial/product-profits

*Headers:*

Authorization: Bearer {token}


*Respuesta (200 OK):*
json
[
  {
    "productId": 1,
    "productName": "Laptop Dell",
    "totalQuantitySold": 5,
    "totalSales": 3750.00,
    "totalProfit": 1250.00,
    "profitPerUnit": 250.00,
    "profitMargin": 33.33
  }
]


### 7. Obtener Punto de Equilibrio

*GET* /api/financial/break-even

*Headers:*

Authorization: Bearer {token}


*Respuesta (200 OK):*
json
{
  "totalFixedExpenses": 1000.00,
  "averageProfitMargin": 33.33,
  "breakEvenSales": 3000.00,
  "currentSales": 3750.00,
  "currentProfit": 1250.00,
  "difference": 750.00,
  "status": "ABOVE"
}


*Explicación:*
- totalFixedExpenses: Total de gastos fijos mensuales
- averageProfitMargin: Margen de ganancia promedio (%)
- breakEvenSales: Ventas necesarias para cubrir gastos fijos
- currentSales: Ventas actuales
- currentProfit: Ganancia actual de las ventas
- difference: Diferencia entre ventas actuales y punto de equilibrio
- status: ABOVE (por encima) o BELOW (por debajo) del punto de equilibrio

### 8. Obtener Resumen Financiero Completo

*GET* /api/financial/summary

*Headers:*

Authorization: Bearer {token}


*Respuesta (200 OK):*
json
{
  "totalSales": 3750.00,
  "totalProfit": 1250.00,
  "totalIncome": 500.00,
  "totalExpenses": 200.00,
  "totalFixedExpenses": 1000.00,
  "netProfit": 2550.00,
  "productProfits": [
    {
      "productId": 1,
      "productName": "Laptop Dell",
      "totalQuantitySold": 5,
      "totalSales": 3750.00,
      "totalProfit": 1250.00,
      "profitPerUnit": 250.00,
      "profitMargin": 33.33
    }
  ],
  "breakEvenPoint": {
    "totalFixedExpenses": 1000.00,
    "averageProfitMargin": 33.33,
    "breakEvenSales": 3000.00,
    "currentSales": 3750.00,
    "currentProfit": 1250.00,
    "difference": 750.00,
    "status": "ABOVE"
  }
}


*Explicación:*
- totalSales: Total de ventas realizadas
- totalProfit: Ganancia total de las ventas
- totalIncome: Total de ingresos registrados
- totalExpenses: Total de egresos registrados
- totalFixedExpenses: Total de gastos fijos mensuales
- netProfit: Ganancia neta = (Ventas + Ingresos) - (Gastos fijos + Egresos)
- productProfits: Lista de ganancias por producto
- breakEvenPoint: Información del punto de equilibrio

---

## 📝 Ejemplos de Flujo Completo

### Flujo 1: Registrar Producto y Vender

1. *Crear producto:*
bash
POST /api/products
{
  "name": "Mouse Logitech",
  "purchasePrice": 10.00,
  "salePrice": 15.00,
  "stock": 50,
  "minStock": 10,
  "unit": "unidades"
}


2. *Registrar venta:*
bash
POST /api/sales
{
  "productId": 1,
  "quantity": 5,
  "unitPrice": 15.00
}


3. *Ver ganancia por producto:*
bash
GET /api/financial/product-profits


### Flujo 2: Configurar Gastos Fijos y Calcular Punto de Equilibrio

1. *Crear gasto fijo:*
bash
POST /api/expenses/fixed
{
  "name": "Salario empleado",
  "amount": 800.00,
  "period": "MONTHLY"
}


2. *Obtener punto de equilibrio:*
bash
GET /api/financial/break-even


3. *Obtener resumen financiero:*
bash
GET /api/financial/summary


---

## ⚠ Errores Comunes

### Error 401 - No autorizado
- Verifica que estés enviando el token JWT en el header Authorization
- Verifica que el token no haya expirado

### Error 404 - Producto no encontrado
- Verifica que el productId existe
- Verifica que el producto pertenece al usuario autenticado

### Error 400 - Stock insuficiente
- El stock disponible es menor a la cantidad solicitada en la venta

### Error 400 - Tipo de transacción inválido
- El tipo debe ser INCOME o EXPENSE

---

## 🧪 Pruebas Rápidas con cURL

### 1. Crear Producto
bash
curl -X POST http://localhost:8080/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Producto Test",
    "purchasePrice": 100.00,
    "salePrice": 150.00,
    "stock": 20,
    "minStock": 5,
    "unit": "unidades"
  }'


### 2. Registrar Venta
bash
curl -X POST http://localhost:8080/api/sales \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 2,
    "unitPrice": 150.00
  }'


### 3. Obtener Resumen Financiero
bash
curl -X GET http://localhost:8080/api/financial/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
