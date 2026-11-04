---
name: libros-absurdos
description: Inventa libros de prueba con títulos absurdos y los añade a los datos de la API de libros. Úsala cuando pidan datos de prueba, libros falsos o "rellenar el catálogo".
---

# Libros absurdos para probar la API

Vas a inventar libros de prueba ridículos pero VÁLIDOS para la API.

## Cuántos

Crea el número de libros que diga el usuario: $ARGUMENTS
Si no dice nada, crea 3. Nunca más de 10.

## Reglas de cada libro

- **title**: absurdo y relacionado con la programación o la comida.
  Ejemplos: "El misterio del punto y coma perdido", "Croquetas asíncronas".
- **author**: nombre inventado que sea un juego de palabras.
  Ejemplos: "Ana Lista", "Elena Nito", "Armando Bronca".
- **year**: número entero entre 1990 y el año actual.
- **pages**: número entero mayor que 0.
- **country** y **language**: texto no vacío, en inglés como en los datos existentes
  (ejemplo: "Spain", "Spanish").
- **imageLink**: `images/<slug-del-titulo>.jpg`, igual que los libros existentes.
- **link**: una URL no vacía (ejemplo: `https://example.com/books/<slug-del-titulo>`).
- **id**: sigue el mismo formato de id que ya usan los libros existentes.
- Los nombres de los campos van en inglés, igual que el resto del proyecto;
  los valores de title y author pueden ir en español.
- No repitas títulos que ya existan.

## Pasos

1. Busca dónde están los datos de libros y el tipo `Book`. No inventes campos:
   usa exactamente los campos de `Book`.
2. Inventa los libros siguiendo las reglas.
3. Enséñame la lista ANTES de guardar y espera a que diga "ok".
4. Añádelos a los datos sin borrar ni cambiar los libros que ya había.
5. Arranca la API con `npm run dev` y comprueba con una petición a
   `GET http://localhost:3000/api/books` que aparecen.
6. Para la API cuando termines.

## Cómo responder al final

Una tabla con: title | author | year | pages.
Debajo, una sola frase: cuántos libros había antes y cuántos hay ahora.
Termina con un chiste malo sobre libros. Solo uno.