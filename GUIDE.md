# Project Summary
This project is to create a games rewards system in Ganaya.live. 
-- Text to be inserted --
¿Qué quiero construir yo con la página del casino? 

Nosotros queremos crear una interfaz simple donde el usuario del casino pueda realizar misiones para obtener fichas y jugar. 

¿Cuáles son las características que quiero que tenga LuckyBet misiones? 

## Módulos: 

Autenticación para usuarios: 

El módulo de autenticación inicia sesión usando la API del panel de LuckyBet, yo no controlo ese backend.

Misiones para usuarios: 

El módulo de misiones para usuarios debe mostrar las misiones fijas, diarias y semanales de la plataforma. De esta manera, se promueve la participación activa de los usuarios de la comunidad y la promoción constante.

Este módulo, a su vez, incluirá un reto semanal de misiones completadas lo que a su vez traerá consigo beneficios de fichas. 

Sistema de niveles:

GanaYa LuckyBet implementará un sistema de niveles en los que los usuarios, al alcanzar un nuevo nivel, recibirán un regalo de fichas y tendrá un bono disponible durante X tiempo. Cada nivel alcanzado debería desbloquear más recompensas y también debería estar relacionado a la cantidad de dinero apostado en la plataforma y las cargas realizadas (tengo que pensar esto más a profundidad)

Pantalla principal de Dashboard: 

- En la pantalla principal se muestra una misión especial diaria
- Se muestran los juegos más jugados, valga la redundancia.
- Una tabla con los últimos premios de todos los jugadores
- Los juegos más jugados durante la semana

Pantalla de ranking

En esta pantalla aparecerán los jugadores con los niveles más altos y sus posiciones dentro de la plataforma.
Aparecerá tu posición en el ranking. 
Las fichas ganadas por misiones en esta semana y día
El nivel y la cantidad de experiencia


Módulo de administración

En el módulo de administración, hay dos tipos de usuarios administrador: 
- Reviewer: valida todas las tareas de los usuarios y chequea su comportamiento dentro del sistema.
- Admin: crea tareas, mira estadísticas y tiene todas las capacidades del reviewer.


Módulo de misiones

En este módulo habrá un historial de misiones activas, inactivas, culminadas y canceladas. A su vez, incluirá los botones para crear, editar, activar y desactivar misiones. El módulo de misiones, cuando la creas o editas abre un modal para crearlas y/o editarlas. 

En cada misión debe definirse: 
- Monto de fichas a cargar
- Bono
- Descripción
- Título
- Cantidad de experiencia que otorga la misión.
- Imagen de la tarea
- Pasos a completar para que la tarea sea culminada exitosamente. Por cada paso se debe adjuntar una imagen o enviar un texto para que el reviewer lo verifique. (Está sujeto a modificación a medida que obtengamos nuevas ideas)

Cada misión tendrá los siguientes estados: 
- Inactiva: Se creó pero no ha sido activada para que la usen. Solo en este estado las tareas pueden ser editadas
- Activa: Fue activada y los usuarios están haciéndola.  Luego de que una tarea es activada, el contenido de la misma no puede ser modificado bajo ningún motivo.
- Culminada: La misión llegó a su tiempo límite y ya no aparecerá en el tablero de misiones de los usuarios
- Cancelada: El administrador removió la tarea del tablero por X o Y motivo.

Módulo de revisión de misiones:

En este módulo se observará la lista de misiones por revisar. Acá se podrá filtrar por categoría de misiones, fecha de revisión y misiones activas. Además, se podrá hacer switch a una lista de tareas ya culminadas o rechazadas. Cada vez que se haga clic a una misión para revisarla, aparecerá un modal con la descripción de la tarea y las imágenes o respuestas de la misión sumado a una descripción para su verificación.

Habrán tres tipos de misiones: 

Tareas semanales: duran 7 días desde el momento en el que se activan

Tareas diarias: duran 24 horas desde el momento en el que se activan

Tareas fijas: son tareas que no tienen un tiempo límite y que son completadas solo una vez 

Módulo de revisión de usuarios:
En este módulo podremos chequear los movimientos de cada usuario dentro de la plataforma, esto incluye cada misión completada por los usuarios, la experiencia que tiene y los premios ganados gracias a la plataforma de misiones.

## Modulos por considerar

Apartado de juegos multijugador de la plataforma

Juegos simples dentro de la plataforma como: 
- Piedra, papel o tijera. 
- Ludo
Cualquier otro juego

Apartado para un mapa de niveles dentro de la plataforma donde, por un hover, se pueda denotar los premios ganados.
