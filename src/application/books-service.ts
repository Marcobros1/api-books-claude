import type { Book } from "../domain/book";
import type { BooksRepository } from "../domain/books-repository";

/** Entrada genérica de las rutas (body o query), sin validar. */
export type Input = Record<string, unknown>;

/** Error de validación que el middleware de Express convierte en 400. */
export class ValidationError extends Error {
  readonly errors?: Record<string, string>;

  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.errors = errors;
  }
}

/**
 * Servicio de libros: reglas de negocio, validación, filtrado y límite.
 *
 * No sabe nada de HTTP ni de cómo se guardan los datos.
 * Recibe el repositorio por constructor (inyección).
 */
export class BooksService {
  private readonly repository: BooksRepository;

  constructor(repository: BooksRepository) {
    this.repository = repository;
  }

  /** GET /api/books - lista con filtros y límite */
  async list(query: Input): Promise<Book[]> {
    const books = await this.repository.findAll();
    const filteredBooks = books.filter((book) => matchesAllFilters(book, query));
    return applyLimit(filteredBooks, query.limit);
  }

  /** GET /api/books/:id - busca por id */
  getById(id: string): Promise<Book | undefined> {
    return this.repository.findById(id);
  }

  /** POST /api/books - crea un libro */
  async create(body: Input): Promise<Book> {
    throwIfInvalid(validateBook(body));
    return this.repository.create(toBookData(body));
  }

  /** PUT /api/books/:id - sustituye por completo (existencia antes que validación) */
  async replace(id: string, body: Input): Promise<Book | undefined> {
    if (!(await this.repository.findById(id))) return undefined; // primero el 404
    throwIfInvalid(validateBook(body));
    return this.repository.replace(id, toBookData(body));
  }

  /** PATCH /api/books/:id - modifica campos (existencia antes que validación) */
  async update(id: string, body: Input): Promise<Book | undefined> {
    if (!(await this.repository.findById(id))) return undefined;

    if (!EDITABLE_FIELDS.some((field) => body[field] !== undefined)) {
      throw new ValidationError(`Hay que enviar al menos un campo: ${EDITABLE_FIELDS.join(", ")}`);
    }

    throwIfInvalid(validateBook(body, { partial: true }));
    return this.repository.update(id, toPartialBookData(body));
  }

  /** DELETE /api/books/:id - borra un libro */
  remove(id: string): Promise<Book | undefined> {
    return this.repository.remove(id);
  }
}

/** Lanza ValidationError si hay errores de validación. */
function throwIfInvalid(errors: Record<string, string>): void {
  if (Object.keys(errors).length > 0) {
    throw new ValidationError("Hay campos no válidos", errors);
  }
}

// ---- Validación y transformación (movidas desde routes sin cambios) ----

// Campos de texto: obligatorios al crear o sustituir, opcionales en PATCH
const TEXT_FIELDS = ["author", "country", "imageLink", "language", "link", "title"] as const;

// Todos los campos editables (el id nunca)
const EDITABLE_FIELDS = [...TEXT_FIELDS, "pages", "year"] as const;

/**
 * Devuelve un error por cada campo no válido (vacío si todo está bien).
 *
 * @param body - Body de la petición, sin validar.
 * @param options.partial - Si es true (PATCH), los campos ausentes no se validan.
 * @returns Un objeto campo -> mensaje de error.
 */
function validateBook(body: Input, { partial = false } = {}): Record<string, string> {
  const errors: Record<string, string> = {};

  // En PATCH solo se valida lo que llega
  const shouldCheck = (field: string) => !partial || body[field] !== undefined;

  for (const field of TEXT_FIELDS) {
    if (!shouldCheck(field)) continue;

    const value = body[field];
    if (typeof value !== "string" || value.trim() === "") {
      errors[field] = "Debe ser un texto no vacío";
    }
  }

  // isSafeInteger rechaza valores enormes como 1e300 (isInteger los aceptaría)
  if (shouldCheck("pages") && (!Number.isSafeInteger(body.pages) || (body.pages as number) <= 0)) {
    errors.pages = "Debe ser un número entero mayor que 0";
  }

  // Los años negativos están permitidos (a. C.), los futuros no
  if (
    shouldCheck("year") &&
    (!Number.isSafeInteger(body.year) || (body.year as number) > new Date().getFullYear())
  ) {
    errors.year = "Debe ser un número entero no posterior al año actual";
  }

  return errors;
}

// Construye los datos del libro (sin id) a partir de un body ya validado
function toBookData(body: Input): Omit<Book, "id"> {
  return {
    author: (body.author as string).trim(),
    country: (body.country as string).trim(),
    imageLink: (body.imageLink as string).trim(),
    language: (body.language as string).trim(),
    link: (body.link as string).trim(),
    title: (body.title as string).trim(),
    pages: body.pages as number,
    year: body.year as number,
  };
}

/**
 * Construye solo los campos que llegan en un body de PATCH ya validado.
 * Los textos se guardan recortados, igual que en toBookData.
 */
function toPartialBookData(body: Input): Partial<Omit<Book, "id">> {
  const data: Partial<Omit<Book, "id">> = {};

  for (const field of TEXT_FIELDS) {
    if (body[field] !== undefined) data[field] = (body[field] as string).trim();
  }

  if (body.pages !== undefined) data.pages = body.pages as number;
  if (body.year !== undefined) data.year = body.year as number;

  return data;
}

// ---- Filtrado y límite ----

function matchesAllFilters(book: Book, query: Input): boolean {
  return (
    matchesText(book.author, query.author) &&
    matchesText(book.country, query.country) &&
    matchesText(book.language, query.language) &&
    matchesText(book.title, query.title) &&
    matchesText(book.link, query.link) &&
    matchesText(book.imageLink, query.imageLink) &&
    matchesNumber(book.pages, query, "pages") &&
    matchesNumber(book.year, query, "year")
  );
}

// "China" coincide con "chi", "CHI", "ina"...
function matchesText(bookValue: string, search: unknown): boolean {
  if (typeof search !== "string") return true;

  return bookValue.toLowerCase().includes(search.toLowerCase());
}

// Comprueba field, field_gt, field_gte, field_lt y field_lte
function matchesNumber(bookValue: number, query: Input, field: string): boolean {
  const equal = parseNumber(query[field]);
  const greaterThan = parseNumber(query[`${field}_gt`]);
  const greaterOrEqual = parseNumber(query[`${field}_gte`]);
  const lessThan = parseNumber(query[`${field}_lt`]);
  const lessOrEqual = parseNumber(query[`${field}_lte`]);

  if (equal !== undefined && bookValue !== equal) return false;
  if (greaterThan !== undefined && bookValue <= greaterThan) return false;
  if (greaterOrEqual !== undefined && bookValue < greaterOrEqual) return false;
  if (lessThan !== undefined && bookValue >= lessThan) return false;
  if (lessOrEqual !== undefined && bookValue > lessOrEqual) return false;

  return true;
}

function applyLimit(books: Book[], limitParam: unknown): Book[] {
  const limit = parseNumber(limitParam);
  if (limit === undefined || limit < 0) return books;

  return books.slice(0, limit);
}

// Devuelve undefined si el parámetro no viene, está en blanco o no es un número finito
function parseNumber(value: unknown): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}