# Rymdrosten Kafé - API
Det här är ett REST API skriven i JavaScript med Express för att hantera konton, autentisering, kafé-menyer, recensioner, administrativa funktioner och skyddade resurser.

## Länk
Webbapplikationen som använder API:et: [repo](https://github.com/C4ndyFl4mes/dt207g-frontend/) [URL](...).

## Databas
API:et använder en NoSQL-databas, MongoDB, som består av fyra tabeller: Users, Products, Reviews och Categories.

Users
```json
{
  "id": "objectid",
  "firstname": "string",
  "lastname": "string",
  "email": "string",
  "password": "string",
  "role": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```
Lösenord hashas innan lagring. Role kan vara "user", "admin", eller "root".

Products
```json
{
  "id": "objectid"
  "name": {
    "normal": "string",
    "slug": "string"
  },
  "price": "number",
  "description": "string",
  "inCategory": "objectid",
  "createdAt": "date",
  "updatedAt": "date"
}
```
Slug är för att kunna hanteras i url:en då en specifik produkt hämtas genom /:categoryslug/:productslug.

Reviews
```json
{
  "id": "objectid",
  "rating": "number",
  "message": "string",
  "createdOn": "objectid",
  "createdBy": "objectid",
  "createdAt": "date",
  "updatedAt": "date"
}
```
En recension är kopplad till en produkt och en användare.

Categories
```json
{
  "id": "objectid",
  "name": {
    "normal": "string",
    "slug": "string"
  },
  "createdAt": "date",
  "updatedAt": "date"
}
```
Samma som för produkter gällande slug. Hämta alla produkter i en kategori blir /:categoryslug.




