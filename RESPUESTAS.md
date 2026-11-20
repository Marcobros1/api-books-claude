# RESPUESTAS.md

## 1. ¿Cómo viaja un POST /api/books?

El flujo empieza en la capa HTTP, pasa por el servicio y acaba en el repositorio.

- `src/http/books-routes.ts`  
  `createBooksRouter(service)` monta `router.post("/")`. Recoge `req.body` y llama a `service.create`. Solo se encarga del transporte HTTP y del código 201.

- `src/application/books-service.ts`  
  `BooksService.create(body)` valida con `validateBook`. Si hay errores, lanza `ValidationError`. Si todo es correcto, convierte con `toBookData` y delega en `this.repository.create`.

- `src/domain/books-repository.ts`  
  Aquí está la interfaz `BooksRepository`. Es el puerto. El servicio depende de ella y no sabe nada de la implementación concreta.

- `src/infrastructure/books-repository-mongo.ts`  
  `BooksRepositoryMongo` implementa el puerto. En `create` genera un UUID, hace `insertOne({_id: id, ...data})` y devuelve el libro.

Puerto: `src/domain/books-repository.ts`, `export interface BooksRepository`.  
Adaptadores: `src/infrastructure/books-repository-in-memory.ts` (`BooksRepositoryInMemory`) y `src/infrastructure/books-repository-mongo.ts` (`BooksRepositoryMongo`).  
Inyección: en `src/index.ts` se crea el repositorio y se le pasa al servicio, y el servicio al router:
```ts
const repository: BooksRepository = new BooksRepositoryMongo();
const service = new BooksService(repository);
app.use("/api/books", createBooksRouter(service));
```

Con cambiar esa primera línea se pasa de Mongo a memoria sin tocar rutas ni servicio.

---

## 2. ¿PostgreSQL mañana?

Archivo nuevo: `src/infrastructure/books-repository-postgres.ts`  
Clase `BooksRepositoryPostgres implements BooksRepository` con los siete métodos del puerto. Usa el driver de Postgres y lee la URI de `process.env`.

Archivo a cambiar: `src/index.ts`  
Cambiar la instancia y añadir el import:
```ts
import { BooksRepositoryPostgres } from "./infrastructure/books-repository-postgres";
const repository: BooksRepository = new BooksRepositoryPostgres();
```

No hace falta tocar:
- `src/domain/*` porque es el núcleo sin dependencias externas.
- `src/application/books-service.ts` porque solo usa el puerto.
- `src/http/books-routes.ts` porque solo habla con el servicio.

---

## 3. Regla nueva: un libro no puede tener más de 2000 páginas

La regla va en `src/application/books-service.ts`, dentro de `validateBook`.  
Es regla de negocio, así que debe estar en el servicio. Las rutas no deben conocer reglas y el repositorio solo guarda.

Si llega `POST /api/books` con 3000 páginas, `validateBook` mete el error en `errors.pages` y el servicio lanza `ValidationError`.  
El middleware de errores de `src/index.ts` lo convierte en 400 y devuelve:
```json
{ "errors": { "pages": "..." } }
```

La decisión del 400 la toma el middleware, no el servicio.

Funciona igual en memoria y Mongo porque la validación ocurre antes de llamar al repositorio. El servicio es el mismo para los dos adaptadores.
