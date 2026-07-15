// ==========================================
// 1. DEFINICIÓN DE LA MATRIZ (ESTADO DEL JUEGO)
// ==========================================
// 0 = Pasto (vacío)
// 1 = Muro (colisión)
// 2 = Jugador (móvil)
// 3 = Enemigo (animado)
// 4 = Tesoro (recogible)
// 5 = Árbol (colisión)
// 6 = Roca (colisión)

const mapa = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 3, 0, 1],
    [1, 0, 2, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 4, 1],
    [1, 5, 0, 0, 0, 0, 1],
    [1, 0, 0, 6, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1]
];

// Variables globales para rastrear elementos clave
let playerPosition = { fila: 2, col: 2 }; 
let playerMesh = null; // Referencia al objeto 3D del jugador
const animatableObjects = []; // Arreglo para guardar cosas que rotan/se mueven
const objectsGrid = []; // Matriz secundaria para guardar los modelos 3D y poder borrarlos

// ==========================================
// 2. CONFIGURACIÓN DEL MOTOR GRÁFICO (Three.js)
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Cielo azul claro
scene.fog = new THREE.Fog(0x87CEEB, 10, 25); // Efecto de niebla suave en los bordes

// Cámara en perspectiva
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// Posicionamos la cámara para una vista isométrica / superior inicial
camera.position.set(3, 8, 10);

// Renderizador moderno con soporte de sombras (PBR)
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Activar sombras
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras suaves
document.getElementById('game-container').appendChild(renderer.domElement);

// Controles para rotar el mapa con el ratón
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(3, 0, 3); // Apuntar al centro del mapa (aprox)
controls.update();

// ==========================================
// 3. ILUMINACIÓN DINÁMICA
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Luz general
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 15, 10);
directionalLight.castShadow = true; // Permitir que esta luz genere sombras
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

// ==========================================
// 4. FÁBRICA DE OBJETOS 3D (TRADUCCIÓN DE DATOS A GRÁFICOS)
// ==========================================
// Constantes para el tamaño del mapa
const CELL_SIZE = 1.2; // Espacio que ocupa cada bloque

function crearPasto(x, z) {
    const geo = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2; // Acostar el plano
    mesh.position.set(x, 0, z);
    mesh.receiveShadow = true; // El piso recibe sombras
    scene.add(mesh);
}

function crearMuro(x, z) {
    const geo = new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE);
    const mat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, CELL_SIZE / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

function crearJugador(x, z) {
    // Cambiamos CapsuleGeometry por CylinderGeometry para compatibilidad con r128
    const geo = new THREE.CylinderGeometry(CELL_SIZE * 0.3, CELL_SIZE * 0.3, CELL_SIZE * 0.8, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.2, roughness: 0.2 });
    const mesh = new THREE.Mesh(geo, mat);
    
    // Ajustamos la altura para que el cilindro toque el suelo correctamente
    mesh.position.set(x, CELL_SIZE * 0.4, z);
    mesh.castShadow = true;
    return mesh;
}

function crearEnemigo(x, z) {
    const geo = new THREE.BoxGeometry(CELL_SIZE * 0.6, CELL_SIZE * 0.6, CELL_SIZE * 0.6);
    const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.7 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, CELL_SIZE * 0.3, z);
    mesh.castShadow = true;
    animatableObjects.push({ mesh, type: 'enemy', baseX: x, time: Math.random() * 10 });
    return mesh;
}

function crearTesoro(x, z) {
    const geo = new THREE.OctahedronGeometry(CELL_SIZE * 0.3);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0xfacc15, 
        emissive: 0xfacc15, // Brillo propio
        emissiveIntensity: 0.4,
        metalness: 1, 
        roughness: 0 
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, CELL_SIZE * 0.5, z);
    mesh.castShadow = true;
    animatableObjects.push({ mesh, type: 'treasure' });
    return mesh;
}

function crearArbol(x, z) {
    const group = new THREE.Group();
    // Tronco
    const troncoGeo = new THREE.CylinderGeometry(0.15, 0.15, CELL_SIZE * 0.8);
    const troncoMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const tronco = new THREE.Mesh(troncoGeo, troncoMat);
    tronco.position.y = CELL_SIZE * 0.4;
    tronco.castShadow = true;
    
    // Copa
    const copaGeo = new THREE.ConeGeometry(CELL_SIZE * 0.5, CELL_SIZE);
    const copaMat = new THREE.MeshStandardMaterial({ color: 0x15803d });
    const copa = new THREE.Mesh(copaGeo, copaMat);
    copa.position.y = CELL_SIZE * 1.2;
    copa.castShadow = true;

    group.add(tronco);
    group.add(copa);
    group.position.set(x, 0, z);
    return group;
}

function crearRoca(x, z) {
    const geo = new THREE.DodecahedronGeometry(CELL_SIZE * 0.4, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, CELL_SIZE * 0.3, z);
    mesh.castShadow = true;
    return mesh;
}

// ==========================================
// 5. GENERACIÓN DEL MUNDO BASADO EN LA MATRIZ
// ==========================================
function construirMapa() {
    for (let f = 0; f < mapa.length; f++) {
        objectsGrid[f] = [];
        for (let c = 0; c < mapa[f].length; c++) {
            const valor = mapa[f][c];
            
            // X = columna, Z = fila (Cálculo algebraico básico para posicionamiento)
            const posX = c * CELL_SIZE;
            const posZ = f * CELL_SIZE;

            // Todos tienen pasto debajo
            crearPasto(posX, posZ);

            let mesh = null;

            // Transformar número a objeto 3D
            switch (valor) {
                case 1: mesh = crearMuro(posX, posZ); break;
                case 2: 
                    mesh = crearJugador(posX, posZ); 
                    playerMesh = mesh; // Guardamos referencia para moverlo luego
                    playerPosition = { fila: f, col: c };
                    break;
                case 3: mesh = crearEnemigo(posX, posZ); break;
                case 4: mesh = crearTesoro(posX, posZ); break;
                case 5: mesh = crearArbol(posX, posZ); break;
                case 6: mesh = crearRoca(posX, posZ); break;
            }

            if (mesh) {
                scene.add(mesh);
                objectsGrid[f][c] = mesh; // Guardamos en la grid de objetos
            } else {
                objectsGrid[f][c] = null;
            }
        }
    }
}

// ==========================================
// 6. ACTUALIZACIÓN DE LA UI (PANEL HTML)
// ==========================================
function actualizarPanelMatriz() {
    const display = document.getElementById('matrix-display');
    let html = '';
    
    for (let f = 0; f < mapa.length; f++) {
        for (let c = 0; c < mapa[f].length; c++) {
            const val = mapa[f][c];
            // Envolvemos el número en un span con una clase de color específico
            html += `<span class="val-${val}">${val}</span> `;
        }
        html += '<br>'; // Salto de línea al terminar la fila
    }
    
    display.innerHTML = html;
}

// ==========================================
// 7. LÓGICA DE MOVIMIENTO Y COLISIONES (CORREGIDO)
// ==========================================
window.addEventListener('keydown', (event) => {
    // ... (El cálculo de nuevaFila y nuevaCol sigue igual) ...
    let nuevaFila = playerPosition.fila;
    let nuevaCol = playerPosition.col;

    if (event.key === 'w' || event.key === 'ArrowUp') nuevaFila--;
    if (event.key === 's' || event.key === 'ArrowDown') nuevaFila++;
    if (event.key === 'a' || event.key === 'ArrowLeft') nuevaCol--;
    if (event.key === 'd' || event.key === 'ArrowRight') nuevaCol++;

    // ... (Límites de la matriz siguen igual) ...
    if (nuevaFila < 0 || nuevaFila >= mapa.length || nuevaCol < 0 || nuevaCol >= mapa[0].length) {
        return; 
    }

    const valorDestino = mapa[nuevaFila][nuevaCol];

    // ========================================================
    // LÍNEA MODIFICADA PARA ARREGLAR LA COLISIÓN DEL ENEMIGO
    // ========================================================
    // Antes: (valorDestino === 1 || valorDestino === 5 || valorDestino === 6)
    // Ahora: Incluimos explicitamente el valor 3 (Enemigo).
    // Esto es lo que se ilustra en el panel de código de la imagen.

    if (valorDestino === 1 || valorDestino === 5 || valorDestino === 6 || valorDestino === 3) {
        return; // Movimiento bloqueado por un objeto sólido o un enemigo.
    }

    // ... (El resto de la lógica sigue igual: recoger tesoro, mover datos, mover 3D, UI) ...
    // Lógica para recoger tesoro (4)
    if (valorDestino === 4) {
        const tesoroMesh = objectsGrid[nuevaFila][nuevaCol];
        scene.remove(tesoroMesh);
    }

    // Actualizamos los datos puros (La Matriz)
    mapa[playerPosition.fila][playerPosition.col] = 0;
    mapa[nuevaFila][nuevaCol] = 2;

    // Actualizamos la posición lógica
    playerPosition.fila = nuevaFila;
    playerPosition.col = nuevaCol;

    // Modificamos el modelo visual 3D
    playerMesh.position.x = playerPosition.col * CELL_SIZE;
    playerMesh.position.z = playerPosition.fila * CELL_SIZE;

    // Reflejamos el cambio en la interfaz gráfica
    actualizarPanelMatriz();
}); 

// ==========================================
// 8. BUCLE DE ANIMACIÓN
// ==========================================
function animar() {
    requestAnimationFrame(animar);

    // Animación de objetos almacenados
    animatableObjects.forEach(obj => {
        if (obj.type === 'treasure') {
            obj.mesh.rotation.y += 0.02; // Rotar tesoro
            obj.mesh.position.y = (CELL_SIZE * 0.5) + Math.sin(Date.now() * 0.003) * 0.1; // Flotar
        }
        if (obj.type === 'enemy') {
            obj.time += 0.02;
            // Movimiento lateral simple basado en seno
            obj.mesh.position.x = obj.baseX + Math.sin(obj.time) * 0.5;
        }
    });

    // Pequeña respiración al jugador
    if (playerMesh) {
        playerMesh.scale.y = 1 + Math.sin(Date.now() * 0.005) * 0.05;
    }

    controls.update(); // Necesario para OrbitControls
    renderer.render(scene, camera);
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
construirMapa();
actualizarPanelMatriz();
animar();

// Adaptación de la cámara si se redimensiona la ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});