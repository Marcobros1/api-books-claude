import booksData from "../data/books.json";
import type { Book, BookData, BooksStorage } from "./books-storage";

/**
 * Almacenamiento de libros en memoria.
 *
 * Arranca con los libros de `data/books.json`. Los cambios se pierden al
 * reiniciar el servidor.
 */
export class BooksStorageInMemory implements BooksStorage {
  private books: Book[] = [...booksData];

  async findAll(): Promise<Book[]> {
    // Copia: quien la reciba no puede modificar el almacenamiento desde fuera
    return [...this.books];
  }

  async findById(id: number): Promise<Book | undefined> {
    return this.books.find((book) => book.id === id);
  }

  /**
   * El id es el mayor id existente + 1 (no `books.length + 1`): así no se
   * repiten ids si hay huecos.
   * Ojo: si se borra el libro con el mayor id, ese id se vuelve a usar.
   */
  async create(data: BookData): Promise<Book> {
    const nextId = Math.max(0, ...this.books.map((book) => book.id)) + 1;
    const newBook: Book = { id: nextId, ...data };

    this.books.push(newBook);
    return newBook;
  }

  async replace(id: number, data: BookData): Promise<Book | undefined> {
    const index = this.findIndex(id);
    if (index === -1) return undefined;

    const replacedBook: Book = { id, ...data };

    this.books[index] = replacedBook;
    return replacedBook;
  }

  async update(id: number, data: Partial<BookData>): Promise<Book | undefined> {
    const index = this.findIndex(id);
    if (index === -1) return undefined;

    // El id va al final para que nunca se pueda sobrescribir
    const updatedBook: Book = { ...this.books[index], ...data, id };

    this.books[index] = updatedBook;
    return updatedBook;
  }

  async remove(id: number): Promise<Book | undefined> {
    const index = this.findIndex(id);
    if (index === -1) return undefined;

    const [removedBook] = this.books.splice(index, 1);
    return removedBook;
  }

  private findIndex(id: number): number {
    return this.books.findIndex((book) => book.id === id);
  }
}
