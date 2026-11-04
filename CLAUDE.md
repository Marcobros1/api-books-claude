# API de libros

## Tecnología
- Node.js + Express 5 + TypeScript.
- Datos en memoria por ahora. Más adelante, MongoDB.

## Comandos
- `npm run dev`: arranca la API en http://localhost:3000
- `npm run lint`: revisa el código

## Normas
- Todo el código en inglés: variables, rutas, campos, tipos.
- Arquitectura: routes -> service -> repository.
- Las rutas no tocan los datos directamente: siempre a través del servicio.
- Ramas con el formato `feature/<funcionalidad>`.
- No instales librerías nuevas sin preguntarme.

## Requisitos del producto
Requisitos funcionales y criterios de "hecho" de la API:

@docs/prd-books.md