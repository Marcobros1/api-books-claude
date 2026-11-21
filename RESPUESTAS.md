# RESPUESTAS.md

**Pregunta 1:** Explica cómo viaja un `POST /api/books` por tu API, desde que llega la petición hasta que se guarda el libro. Para cada archivo por el que pasa, di qué hace y en qué capa está. Señala cuál es el puerto, cuáles son los adaptadores, y en qué línea se hace la inyección (copia la línea y explica qué hace).

**Respuesta:** La petición llega a `src/http/books-routes.ts`, capa HTTP. La función `createBooksRouter(service)` recibe el servicio por parámetro y la ruta `POST /` solo le pasa el body y responde 201.

Después va a `src/application/books-service.ts`, capa de aplicación. `BooksService.create` valida con `validateBook`, transforma con `toBookData` y llama al repositorio.

Luego está `src/domain/books-repository.ts`, capa de dominio. Ahí está el puerto `export interface BooksRepository`. El servicio depende de esta interfaz y no sabe si es memoria o MongoDB.

Finalmente llega a `src/infrastructure/books-repository-mongo.ts`, infraestructura. `BooksRepositoryMongo` implementa el puerto, genera el UUID, hace `insertOne` en Mongo y devuelve el libro creado.

Puerto: `src/domain/books-repository.ts` (`export interface BooksRepository`).
Adaptadores: `src/infrastructure/books-repository-in-memory.ts` y `src/infrastructure/books-repository-mongo.ts`.
Inyección en `src/index.ts`:
```ts
const repository: BooksRepository = new BooksRepositoryMongo();
const service = new BooksService(repository);
app.use("/api/books", createBooksRouter(service));
```
Cambiar solo la primera línea pasa de Mongo a memoria sin tocar rutas ni servicio.

---

**Pregunta 2:** El cliente quiere guardar los libros en PostgreSQL en vez de en MongoDB. Sin escribir el código, explica: qué archivo nuevo crearías y qué tendría que cumplir, qué archivo cambiarías y qué línea, qué archivos no tocarías, y por qué no hace falta tocarlos.

**Respuesta:** Crearía `src/infrastructure/books-repository-postgres.ts` con una clase `BooksRepositoryPostgres implements BooksRepository` y los mismos métodos que el resto de adaptadores.

En `src/index.ts` cambiaría la instancia por `new BooksRepositoryPostgres()` y añadiría el import correspondiente.

No tocaría `src/domain`, `src/application` ni `src/http` porque ya dependen del puerto `BooksRepository`, no de la base de datos concreta.

---

**Pregunta 3:** Nueva regla: "un libro no puede tener más de 2000 páginas". ¿En qué archivo la pondrías? ¿Por qué ahí y no en las rutas ni en el repositorio? ¿Qué respondería la API si alguien crea un libro de 3000 páginas? ¿Qué pieza decide ese código HTTP? ¿Funcionaría igual en memoria y en MongoDB? ¿Por qué?

**Respuesta:** La pondría en `src/application/books-service.ts`, dentro de `validateBook`. Es una regla de negocio, así que va en el servicio. Las rutas solo traducen HTTP y el repositorio solo guarda datos.

Si alguien envía 3000 páginas, `validateBook` mete el error en `errors.pages`, el servicio lanza `ValidationError` y el middleware de errores de `src/index.ts` devuelve 400 con el objeto de errores. La pieza que decide el código HTTP es ese middleware, no el servicio ni las rutas.

Funcionaría igual en memoria y Mongo porque la validación ocurre antes de llamar al repositorio. El servicio es el mismo para ambos adaptadores.
