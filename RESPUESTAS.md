# Respuestas a la práctica de inyección de dependencias y Clean Architecture

## Pregunta 1: tu API por dentro

### Viaje de un `POST /api/books`

1. **`src/http/books-routes.ts` (Capa HTTP / Adaptador de entrada)**
   - La función `createBooksRouter(service)` define `router.post("/", ...)`.
   - Recibe `req.body` (el JSON del cliente) y llama a `service.create(req.body ?? {})`.
   - No valida, no filtra, no accede a datos: solo traduce HTTP → servicio y elige el código de estado (201 Created).

2. **`src/application/books-service.ts` (Capa Application / Servicio)**
   - `BooksService.create(body)` recibe el body crudo.
   - Llama a `validateBook(body)` (función privada del módulo). Si hay errores, lanza `ValidationError` con el objeto `errors`.
   - Si pasa la validación, transforma el body a datos de libro con `toBookData(body)` y llama a `this.repository.create(data)`.
   - Devuelve el `Book` creado (con su UUID).

3. **`src/domain/books-repository.ts` (Capa Domain / Puerto)**
   - Define la interfaz `BooksRepository` con el método `create(data: BookData): Promise<Book>`.
   - El servicio solo conoce este contrato; no sabe si la implementación usa memoria o MongoDB.

4. **`src/infrastructure/books-repository-mongo.ts` (Capa Infrastructure / Adaptador de salida)**
   - `BooksRepositoryMongo` implementa `BooksRepository`.
   - `create(data)` genera un UUID v4, hace `insertOne({ _id: id, ...data })` en la colección `books` y devuelve `{ id, ...data }`.

### Puerto, adaptadores e inyección

- **Puerto:** `src/domain/books-repository.ts` → `export interface BooksRepository` (línea 13).
- **Adaptadores:**
  - `src/infrastructure/books-repository-in-memory.ts` → `export class BooksRepositoryInMemory implements BooksRepository` (línea 12).
  - `src/infrastructure/books-repository-mongo.ts` → `export class BooksRepositoryMongo implements BooksRepository` (línea 20).
- **Inyección:** `src/index.ts`, líneas 10-13:
  ```ts
  const repository: BooksRepository = new BooksRepositoryMongo();
  // const repository: BooksRepository = new BooksRepositoryInMemory();
  const service = new BooksService(repository);
  app.use("/api/books", createBooksRouter(service));
  ```
  - La línea 10 elige el adaptador (MongoDB o memoria) y se lo pasa al constructor de `BooksService` (línea 13). Ese es el punto único de cambio para cambiar de base de datos.

---

## Pregunta 2: mañana, PostgreSQL

- **Archivo NUEVO a crear:** `src/infrastructure/books-repository-postgres.ts`
  - Debe contener `export class BooksRepositoryPostgres implements BooksRepository` e implementar los siete métodos del puerto (`findAll`, `findById`, `create`, `replace`, `update`, `remove`).
  - Usará `pg` o cualquier driver de PostgreSQL, y su constructor recibirá la conexión/pool (p. ej. `process.env.POSTGRES_URI`).

- **Archivo a CAMBIAR:** `src/index.ts`
  - Cambiar la línea de instanciación (línea 10):
    ```ts
    const repository: BooksRepository = new BooksRepositoryPostgres();
    ```
  - Añadir el import correspondiente arriba:
    ```ts
    import { BooksRepositoryPostgres } from "./infrastructure/books-repository-postgres";
    ```

- **Archivos que NO se tocan** y por qué:
  - `src/domain/*` (Book, BooksRepository): son el núcleo; no dependen de la base de datos.
  - `src/application/books-service.ts`: contiene todas las reglas de validación, filtrado y límite; solo habla con el puerto `BooksRepository`.
  - `src/http/books-routes.ts`: solo traduce HTTP a llamadas al servicio; no sabe nada de almacenamiento.
  - `src/infrastructure/books-repository-in-memory.ts` y `books-repository-mongo.ts`: adaptadores antiguos; se quedan para poder volver si hace falta.

---

## Pregunta 3: una regla nueva — "un libro no puede tener más de 2000 páginas"

- **¿En qué archivo?**
  En `src/application/books-service.ts`, dentro de `validateBook()` (o una función auxiliar que esta llame).
  - Por qué **ahí**: la regla es de negocio (dominio), no de presentación (HTTP) ni de persistencia (repositorio). El servicio es el único lugar donde viven las reglas que deben cumplirse para *cualquier* almacenamiento.
  - Por qué **NO en las rutas**: las rutas no deben conocer reglas de negocio; solo traducen códigos HTTP.
  - Por qué **NO en el repositorio**: el repositorio solo guarda y recupera; no valida reglas de dominio.

- **¿Qué respondería la API?**
  - Si alguien hace `POST /api/books` con `"pages": 3000`, `validateBook` añadirá `errors.pages = "Debe ser un número entero mayor que 0 y no superior a 2000"` (o mensaje similar).
  - El servicio lanza `ValidationError` con ese objeto.
  - El middleware de errores de `src/index.ts` (líneas 60-62) lo atrapa y devuelve:
    ```json
    { "errors": { "pages": "Debe ser un número entero mayor que 0 y no superior a 2000" } }
    ```
    con código **400 Bad Request**.
  - La pieza que decide el código HTTP es el **middleware de errores de Express** en `index.ts`, no el servicio ni las rutas.

- **¿Funcionaría igual en memoria y en MongoDB?**
  Sí. La validación ocurre **antes** de llamar al repositorio, en `BooksService.create()` y `BooksService.replace()`. Como el servicio es el mismo para ambos adaptadores, la regla se aplica en ambos casos sin tocar los repositorios.