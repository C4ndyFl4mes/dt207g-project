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
Slug är för att kunna hanteras i url:en då en specifik produkt hämtas genom /:categoryslug/:productslug. API:n automatiskt slugifierar namn som "MRE-23: Ration Bar – Spicy Nebula" blir "mre-23-ration-bar-spicy-nebula".

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

## Användning
API:et har CRUD för alla tabeller med viss begränsning gällande auktorisering. Alla gets har pagineringsmöjligheter med queries som page och limit. Page är sidan användaren hamnar på och limit är hur många menyval det finns per sida.

Uesers
<table>
  <tr>
    <th>Metod</th>
    <th>Ändpunkt</th>
    <th>Body</th>
    <th>Headers</th>
    <th>Beskrivning</th>
  </tr>
  <tr>
    <td>GET</td>
    <td>/api/users</td>
    <td></td>
    <td>"content-type": "application/json", "authorization": "Bearer token"</td>
    <td>Endast med rollen admin eller root kan hämta och se alla användare.</td>
  </tr>
  <tr>
    <td>POST</td>
    <td>/api/auth/register</td>
    <td>firstname, lastname, email, password</td>
    <td></td>
    <td>För att registrera en användare.</td>
  </tr>
  <tr>
    <td>POST</td>
    <td>/api/auth/login</td>
    <td>email, password</td>
    <td></td>
    <td>För att logga in en användare</td>
  </tr>
  <tr>
    <td>POST</td>
    <td>/api/auth/root/register</td>
    <td>firstname, lastname, email, password, role</td>
    <td>"content-type": "application/xml", "authorization": "Bearer token"</td>
    <td>För att registrera en admin, endast root kan göra detta.</td>
  </tr>
  <tr>
    <td>PUT</td>
    <td>/api/users/user/:id</td>
    <td>firstname, lastname, email, password</td>
    <td>"content-type": "application/xml", "authorization": "Bearer token"</td>
    <td>Ändrar för- och efternamn, samt email. Men inte lösenord. Lösenord går tyvärr inte att ändra, dumt av mig.</td>
  </tr>
  <tr>
    <td>DELETE</td>
    <td>/api/users/user/:id</td>
    <td></td>
    <td>"content-type": "application/xml", "authorization": "Bearer token"</td>
    <td>Raderar en användare, endast admin och root kan göra det. Admin kan inte radera sig själv eller någon annan admin.</td>
  </tr>
  <tr>
    <td>GET</td>
    <td>/api/users/profile</td>
    <td>Query: userid</td>
    <td>"content-type": "application/xml", "authorization": "Bearer token"</td>
    <td>Utan ett query visas endast den nuvarande inloggade användaren. Endast admin eller root kan se andra användares profiler. En profil är användarens information och recensioner med statistik.</td>
  </tr>
  <tr>
    <td>GET</td>
    <td>/api/users/check/:id</td>
    <td></td>
    <td>"content-type": "application/xml", "authorization": "Bearer token"</td>
    <td>Kollar om nuvarande användare är inloggad.</td>
  </tr>
</table>

Products
<table>
   <tr>
    <th>Metod</th>
    <th>Ändpunkt</th>
    <th>Body</th>
    <th>Headers</th>
    <th>Beskrivning</th>
  </tr>
  <tr>
    <td>GET</td>
    <td>/api/menu</td>
    <td></td>
    <td></td>
    <td>För att hämta alla produkter.</td>
  </tr>
  <tr>
    <td>GET</td>
    <td>/api/menu/category/:categoryslug</td>
    <td></td>
    <td></td>
    <td>Hämtar alla produkter från en kategori.</td>
  </tr>
  <tr>
    <td>GET</td>
    <td>/api/menu/:categoryslug/:productslug</td>
    <td></td>
    <td></td>
    <td>Hämtar en specifik produkt beroende på kategori- och produktnamn</td>
  </tr>
  <tr>
    <td>POST</td>
    <td>/api/menu/product</td>
    <td>name, price, description, inCategory</td>
    <td>"content-type": "application/xml", "authorization": "Bearer token"</td>
    <td>Endast admin och root kan skapa produkter.</td>
  </tr>
  <tr>
    <td>PUT</td>
    <td>/api/menu/product/:id</td>
    <td>name, price, description, inCategory</td>
    <td>"content-type": "application/xml", "authorization": "Bearer token"</td>
    <td>Endast admin och root kan ändra produkter.</td>
  </tr>
  <tr>
    <td>DELETE</td>
    <td>/api/menu/product/:id</td>
    <td></td>
    <td>"content-type": "application/xml", "authorization": "Bearer token"</td>
    <td>Endast admin och root kan radera produkter.</td>
  </tr>
</table>


