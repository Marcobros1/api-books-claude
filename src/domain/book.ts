/** Un libro tal y como se guarda y se devuelve en la API. */
export interface Book {
  /** UUID asignado por el almacenamiento. */
  id: string;
  author: string;
  country: string;
  imageLink: string;
  language: string;
  link: string;
  pages: number;
  title: string;
  year: number;
}

/** Los datos de un libro sin el id (lo asigna el almacenamiento). */
export type BookData = Omit<Book, "id">;
