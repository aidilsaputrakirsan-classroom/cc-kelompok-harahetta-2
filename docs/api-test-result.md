**1. POST /items** — Buat 3 item:
```json
{"name": "Laptop", "price": 15000000, "description": "Laptop untuk cloud computing", "quantity": 5}
```
```json
{"name": "Mouse Wireless", "price": 250000, "description": "Mouse bluetooth", "quantity": 20}
```
```json
{"name": "Keyboard Mechanical", "price": 1200000, "description": "Keyboard untuk coding", "quantity": 8}
```
![gambr](img/1.png)
**2. GET /items** — Harus mengembalikan 3 items dengan `total: 3`
![gambr](img/2.png)
**3. GET /items/1** — Harus mengembalikan item "Laptop"
![gambr](img/3.png)
**4. PUT /items/1** — Update harga:
```json
{"price": 14000000}
```
![gambr](img/4.png)
**5. GET /items/1** — Harga harus berubah ke 14000000
![gambr](img/5.png)
**6. GET /items?search=laptop** — Harus mengembalikan 1 item
![gambr](img/6.png)
**7. DELETE /items/1** — Harus response 204
![gambr](img/7.png)
**8. GET /items/1** — Harus response 404
![gambr](img/8.png)