import { Router } from "express";
import type { Response } from "express";
import { validate as validateUuid } from "uuid";
import type { BooksService } from "../application/books-service";

export function createBooksRouter(service: BooksService): Router {
  const router = Router();

  /**
   * GET /api/books
   *
   * Texto (busca dentro del texto):  ?author=  ?country=  ?language=  ?title=  ?link=  ?imageLink=
   * Números (pages, year):           ?pages=  ?pages_gt=  ?pages_gte=  ?pages_lt=  ?pages_lte=
   *                                  ?year=1958  ?year_gt=  ?year_gte=  ?year_lt=  ?year_lte=
   * Límite de resultados:            ?limit=10
   *
   * Ejemplo: /api/books?country=chi&pages_gte=200&limit=5
   */
  router.get("/", async (req, res) => {
    const books = await service.list(req.query ?? {});
    res.json(books);
  });

  /**
   * GET /api/books/:id
   *
   * Devuelve el libro con ese id.
   * 400 si el id no es un UUID válido, 404 si no existe.
   *
   * Ejemplo: /api/books/99d9de0b-95a4-4b4f-b684-ed478b4a15a7
   */
  router.get("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (id === undefined) {
      res.status(400).json({ error: "El id debe ser un UUID válido" });
      return;
    }

    const book = await service.getById(id);

    if (!book) {
      sendNotFound(res, id);
      return;
    }

    res.json(book);
  });

  /**
   * POST /api/books
   *
   * Crea un libro. El id lo asigna el repositorio (un UUID nuevo); si el body trae un id, se ignora.
   * 400 con un error por cada campo no válido.
   *
   * Body: { author, country, imageLink, language, link, title, pages, year }
   */
  router.post("/", async (req, res) => {
    const newBook = await service.create(req.body ?? {});
    res.status(201).json(newBook);
  });

  /**
   * PUT /api/books/:id
   *
   * Sustituye por completo el libro con ese id (hay que enviar todos los campos).
   * El id de la URL manda: si el body trae un id, se ignora.
   * 400 si el id no es un UUID válido o algún campo no es válido, 404 si no existe.
   *
   * Body: { author, country, imageLink, language, link, title, pages, year }
   */
  router.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (id === undefined) {
      res.status(400).json({ error: "El id debe ser un UUID válido" });
      return;
    }

    const updatedBook = await service.replace(id, req.body ?? {});

    if (!updatedBook) {
      sendNotFound(res, id);
      return;
    }

    res.json(updatedBook);
  });

  /**
   * PATCH /api/books/:id
   *
   * Modifica solo los campos que se envían; el resto del libro no cambia.
   * Cada campo enviado se valida con las mismas reglas que en POST y PUT.
   * El id de la URL manda: si el body trae un id, se ignora. Los campos desconocidos también se ignoran.
   * 400 si el id no es un UUID válido, no se envía ningún campo editable o alguno no es válido.
   * 404 si no existe.
   *
   * Body (todos opcionales, al menos uno): { author, country, imageLink, language, link, title, pages, year }
   *
   * Ejemplo: PATCH /api/books/99d9de0b-95a4-4b4f-b684-ed478b4a15a7  { "pages": 210 }
   */
  router.patch("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (id === undefined) {
      res.status(400).json({ error: "El id debe ser un UUID válido" });
      return;
    }

    const patchedBook = await service.update(id, req.body ?? {});

    if (!patchedBook) {
      sendNotFound(res, id);
      return;
    }

    res.json(patchedBook);
  });

  /**
   * DELETE /api/books/:id
   *
   * Borra el libro con ese id y lo devuelve en la respuesta (200).
   * 400 si el id no es un UUID válido, 404 si no existe.
   *
   * Ejemplo: DELETE /api/books/99d9de0b-95a4-4b4f-b684-ed478b4a15a7
   */
  router.delete("/:id", async (req, res) => {
    const id = parseId(req.params.id);

    if (id === undefined) {
      res.status(400).json({ error: "El id debe ser un UUID válido" });
      return;
    }

    const deletedBook = await service.remove(id);

    if (!deletedBook) {
      sendNotFound(res, id);
      return;
    }

    res.json(deletedBook);
  });

  return router;
}

// Respuesta 404 común a todas las rutas con :id
function sendNotFound(res: Response, id: string): void {
  res.status(404).json({ error: `No existe ningún libro con id ${id}` });
}

// Solo acepta UUID válidos: rechaza "1", "abc", " 99d9de0b-..."
function parseId(raw: string): string | undefined {
  return validateUuid(raw) ? raw : undefined;
}
