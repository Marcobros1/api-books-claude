# RESPUESTAS.md

## 1. ¿Cómo viaja un POST /api/books?

1. `src/http/books-routes.ts`: la ruta `POST /` recibe el body y llama a `service.create(body)`. Solo hace de transporte HTTP y responde 201.
2. `src/application/books-service.ts`: `BooksService.create` valida con `validateBook`. Si hay errores lanza `ValidationError`. Si está bien, hace `toBookData` y llama al repositorio.
3. `src/domain/books-repository.ts`: es la interfaz `BooksRepository`. El servicio depende de esta y no sabe si es memoria o MongoDB.
4. `src/infrastructure/books-repository-mongo.ts`: `BooksRepositoryMongo` implementa la interfaz. Crea el UUID, inserta en Mongo y devuelve el libro.

Puerto: `BooksRepository` en `src/domain/books-repository.ts`.  
Adaptadores: `BooksRepositoryInMemory` y `BooksRepositoryMongo` en `src/infrastructure/`.  
Inyección: en `src/index.ts` se elige el repositorio y se le pasa al servicio, y el servicio al router:

```ts
const repository: BooksRepository = new BooksRepositoryMongo();
const service = new BooksService(repository);
app.use("/api/books", createBooksRouter(service));
```

Cambiar solo esa primera línea pasa de Mongo a memoria sin tocar nada más.

---

## 2. ¿PostgreSQL?

Crearía `src/infrastructure/books-repository-postgres.ts` con una clase `BooksRepositoryPostgres implements BooksRepository` y los mismos métodos.

En `src/index.ts` cambiaría la instancia por `new BooksRepositoryPostgres()` y añadiría el import.

No tocaría `src/domain`, `src/application` ni `src/http` porque ya dependen del puerto, no de la base de datos.

---

## 3. Regla de las 2000 páginas

La pondría en `src/application/books-service.ts`, dentro de `validateBook`. Es regla de negocio, no de HTTP ni de repositorio.

Si alguien envía 3000 páginas, `validateBook` pone el error en `errors.pages`, el servicio lanza `ValidationError` y el middleware de errores de `index.ts` devuelve 400 con el objeto de errores.

Funciona igual en memoria y Mongo porque la validación ocurre antes de llamar al repositorio.
