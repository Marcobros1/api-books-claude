# RESPUESTAS.md

## 1. POST /api/books

Explica cómo viaja un `POST /api/books` por tu API, desde que llega la petición hasta que se guarda el libro. Para cada archivo por el que pasa, di qué hace y en qué capa está. Señala cuál es el puerto, cuáles son los adaptadores, y en qué línea se hace la inyección (copia la línea y explica qué hace).

La petición llega a `src/http/books-routes.ts`, que es la capa HTTP. La función `createBooksRouter(service)` recibe el servicio por parámetro y la ruta `POST /` solo le pasa el body y responde 201.

Después va a `src/application/books-service.ts`, que es la capa de aplicación. `BooksService.create` valida el body con `validateBook`, transforma los datos con `toBookData` y llama al repositorio.

Luego está `src/domain/books-repository.ts`, que es la capa de dominio. Ahí está el puerto: `export interface BooksRepository` con los métodos `create`, `findAll`, etc. El servicio depende de esta interfaz y no sabe si es memoria o MongoDB.

Finalmente llega a `src/infrastructure/books-repository-mongo.ts`, que es la infraestructura. `BooksRepositoryMongo` implementa el puerto, genera el UUID, hace `insertOne` en Mongo y devuelve el libro creado.

El puerto es `src/domain/books-repository.ts` (`export interface BooksRepository`).  
Los adaptadores son `src/infrastructure/books-repository-in-memory.ts` y `src/infrastructure/books-repository-mongo.ts`.  
La inyección está en `src/index.ts`, líneas 10 y 13:

```ts
const repository: BooksRepository = new BooksRepositoryMongo();
const service = new BooksService(repository);
app.use("/api/books", createBooksRouter(service));
```

Cambiar solo la primera línea pasa de Mongo a memoria sin tocar rutas ni servicio.

---

## 2. Mañana, PostgreSQL

El cliente quiere guardar los libros en PostgreSQL en vez de en MongoDB. Sin escribir el código, explica: qué archivo nuevo crearías y qué tendría que cumplir, qué archivo cambiarías y qué línea, qué archivos no tocarías, y por qué no hace falta tocarlos.

Crearía `src/infrastructure/books-repository-postgres.ts` con una clase `BooksRepositoryPostgres implements BooksRepository` y los mismos métodos que el resto de adaptadores.

En `src/index.ts` cambiaría la instancia por `new BooksRepositoryPostgres()` y añadiría el import al principio del archivo.

No tocaría `src/domain`, `src/application` ni `src/http` porque ya dependen del puerto `BooksRepository`, no de la base de datos concreta.

---

## 3. Una regla nueva

Nueva regla: "un libro no puede tener más de 2000 páginas". ¿En qué archivo la pondrías? ¿Por qué ahí y no en las rutas ni en el repositorio? ¿Qué respondería la API si alguien crea un libro de 3000 páginas? ¿Qué pieza decide ese código HTTP? ¿Funcionaría igual en memoria y en MongoDB? ¿Por qué?

La pondría en `src/application/books-service.ts`, dentro de `validateBook`. Es una regla de negocio, así que va en el servicio. Las rutas solo traducen HTTP y el repositorio solo guarda datos, ninguno de los dos debe conocer esa regla.

Si alguien envía 3000 páginas, `validateBook` pone el error en `errors.pages`, el servicio lanza `ValidationError` y el middleware de errores de `src/index.ts` devuelve 400 con el objeto de errores. La pieza que decide el código HTTP es ese middleware, no el servicio ni las rutas.

Funcionaría igual en memoria y Mongo porque la validación ocurre antes de llamar al repositorio. El servicio es el mismo para ambos adaptadores.
