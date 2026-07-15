# Matrices en Videojuegos (Three.js)

Proyecto interactivo desarrollado para la exposición de Matemática Básica, demostrando la aplicación de matrices bidimensionales en el desarrollo de simulaciones espaciales y videojuegos.

## 🚀 Cómo ejecutar el proyecto

Este proyecto está diseñado para funcionar de manera nativa sin configuraciones complejas.
1. Descarga o clona la carpeta del proyecto.
2. Haz doble clic en el archivo `index.html`.
3. El proyecto se abrirá en tu navegador predeterminado (se recomienda Chrome, Edge o Firefox).

## 🎮 Controles
* **Movimiento:** Teclas `W`, `A`, `S`, `D` o las flechas de dirección.
* **Cámara:** Haz clic izquierdo y arrastra para rotar la cámara. Usa la rueda del ratón para hacer zoom (OrbitControls).

## 🧠 Concepto Matemático (Guion para la Exposición)

Durante tu presentación, puedes utilizar el siguiente argumento mientras manejas la aplicación:

1. **La Estructura Fundamental:** 
   _"Todo lo que observan en este mundo 3D no está posicionado de forma manual. Deriva matemáticamente de una matriz bidimensional (un arreglo $M \times N$). En el panel derecho pueden ver los datos puros. La fila representa el eje Z y la columna el eje X."_
   
2. **Transformación de Datos:** 
   _"Cuando declaro un `1` en la matriz de JavaScript, una función de renderizado convierte esa coordenada discreta $(i, j)$ en una coordenada continua $(x, y, z)$ y genera un prisma rectangular, representando un muro."_

3. **Demostración de Estado (Single Source of Truth):** 
   _"Observen cuando presiono la tecla W. Lo primero que ocurre en la lógica del código **no es** mover la figura 3D azul. Lo primero que hace el programa es realizar una validación algebraica: evalúa si la celda destino en la matriz tiene un valor sólido. Como no lo tiene, sobrescribe los datos puros de la matriz (cambia el 2 de lugar). Únicamente después de este cambio aritmético en memoria, el motor gráfico actualiza el modelo en pantalla."_

## 🛠️ Cómo modificar el mundo

Abre el archivo `script.js` y localiza la constante `mapa`.
Puedes cambiar los números en tiempo real, guardar el archivo y refrescar el navegador para ver un mundo completamente distinto instantáneamente.

* `0`: Vacío / Pasto
* `1`: Muro
* `2`: Jugador (Solo debe haber uno)
* `3`: Enemigo
* `4`: Tesoro
* `5`: Árbol
* `6`: Roca