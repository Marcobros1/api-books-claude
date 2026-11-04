# PRD: API de libros

## Objetivo
Una API para consultar y gestionar el catálogo de libros de una librería.

## Usuarios
- Clientes: buscan libros.
- Empleados: añaden, editan y borran libros.

## Funcionalidades
1. Listar libros, con filtros por autor, género y precio máximo.
2. Ver un libro por su id.
3. Crear un libro (título, autor y precio obligatorios).
4. Editar y borrar un libro.

## Fuera de alcance (por ahora)
- Login y usuarios.
- Pagos.

## Hecho cuando...
- Todos los endpoints responden con los códigos HTTP correctos (200, 201, 400, 404).
- Se puede cambiar de memoria a MongoDB sin tocar las rutas.