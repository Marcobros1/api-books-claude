/**
 * Puerto del repositorio de libros.
 *
 * Dice qué se puede hacer con los libros, no cómo se guardan.
 * Para cambiar de almacenamiento (por ejemplo, de memoria a MongoDB) basta con
 * escribir otra clase que implemente `BooksRepository`; el servicio no cambia.
 *
 * Los métodos devuelven `Promise` aunque la versión en memoria no lo necesite:
 * así el contrato ya sirve para almacenamientos asíncronos como una base de datos.
 */
import type { Book, BookData } from "./book";

export interface BooksRepository {
  /** Devuelve todos los libros. */
  findAll(): Promise<Book[]>;

  /**
   * Busca un libro por su id.
   * @returns El libro, o `undefined` si no existe.
   */
  findById(id: string): Promise<Book | undefined>;

  /**
   * Guarda un libro nuevo y le asigna un id (UUID).
   * @param data - Datos ya validados.
   * @returns El libro creado, con su id.
   */
  create(data: BookData): Promise<Book>;

  /**
   * Sustituye por completo los datos de un libro (PUT). El id no cambia.
   * @returns El libro sustituido, o `undefined` si no existe.
   */
  replace(id: string, data: BookData): Promise<Book | undefined>;

  /**
   * Modifica solo los campos recibidos de un libro (PATCH). El id no cambia.
   * @returns El libro modificado, o `undefined` si no existe.
   */
  update(id: string, data: Partial<BookData>): Promise<Book | undefined>;

  /**
   * Borra un libro.
   * @returns El libro borrado, o `undefined` si no existía.
   */
  remove(id: string): Promise<Book | undefined>;
}
