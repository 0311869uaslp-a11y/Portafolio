document.getElementById('year').textContent = new Date().getFullYear();

  // --- escena base y renderer ---
  const container = document.getElementById('container');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050a16);
  scene.fog = new THREE.FogExp2(0x050a16, 0.035);

  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // --- cámara y controles ---
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 200);
  const initialCamPos = new THREE.Vector3(0,6,18);
  camera.position.copy(initialCamPos);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 3;
  controls.maxDistance = 40;
  controls.target.set(0,2,0);

  // --- luces ---
  const hemi = new THREE.HemisphereLight(0x446688, 0x080820, 0.6); scene.add(hemi);
  const moon = new THREE.DirectionalLight(0xc8d8ff, 0.6);
  moon.position.set(-20,20,10); moon.castShadow = true; scene.add(moon);

  const fireLight = new THREE.PointLight(0xff7733, 2, 20);
  fireLight.position.set(-5,1.2,0);
  scene.add(fireLight);

  // --- terreno ---
  const groundGeo = new THREE.PlaneGeometry(80,80,64,64);
  groundGeo.rotateX(-Math.PI/2);
  const groundMat = new THREE.MeshStandardMaterial({color:0x1a1f28, roughness:1, metalness:0});
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  const pos = groundGeo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const y = Math.sin(pos.getX(i)*0.15)*Math.cos(pos.getZ(i)*0.15)*0.6 + (Math.random()-0.5)*0.1;
    pos.setY(i,y);
  }
  pos.needsUpdate = true;

  // --- lago ---
  const lakeGeo = new THREE.CircleGeometry(8,64);
  const lakeMat = new THREE.MeshStandardMaterial({color:0x223355, roughness:0.1, metalness:0.9, envMapIntensity:1});
  const lake = new THREE.Mesh(lakeGeo, lakeMat);
  lake.rotation.x = -Math.PI/2;
  lake.position.set(5,0.02,-5);
  scene.add(lake);

  // --- fogata ---
  const fireGeo = new THREE.ConeGeometry(0.3,0.8,10);
  const fireMat = new THREE.MeshStandardMaterial({color:0xff5500, emissive:0xff3300, emissiveIntensity:1});
  const fire = new THREE.Mesh(fireGeo, fireMat);
  fire.position.set(-5,0.4,10);
  scene.add(fire);

  // --- árboles ---
  const treeMat = new THREE.MeshStandardMaterial({color:0x113311});
  for(let i=0;i<15;i++){
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,1.2,8), new THREE.MeshStandardMaterial({color:0x4a2a14}));
    const foliage = new THREE.Mesh(new THREE.ConeGeometry(0.6,1.6,8), treeMat);
    const x = (Math.random()-0.5)*60;
    const z = (Math.random()-0.5)*60;
    trunk.position.set(x,0.6,z);
    foliage.position.set(x,1.8,z);
    scene.add(trunk, foliage);
  }

  // --- paneles ---
  const panels = [];
  
  function makePanel(title, lines, pos, rot){
    const cvs = document.createElement('canvas');
    cvs.width = 1024;
    cvs.height = 512;
    const ctx = cvs.getContext('2d');

    ctx.translate(0, cvs.height);
    ctx.scale(1, -1);

    function draw(){
      ctx.fillStyle = '#051226';
      ctx.fillRect(0,0,cvs.width,cvs.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px sans-serif';
      ctx.fillText(title, 48, 80);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(40,100,cvs.width-80,2);
      ctx.fillStyle = 'rgba(230,238,248,0.95)';
      ctx.font = '28px sans-serif';
      for(let i=0;i<lines.length;i++){
        ctx.fillText(lines[i], 48, 150 + i*40);
      }
    }

    draw();
    const tex = new THREE.CanvasTexture(cvs);
    tex.needsUpdate = true;

    const geo = new THREE.PlaneGeometry(4.5, 2.25);
    const mat = new THREE.MeshBasicMaterial({map:tex, side:THREE.DoubleSide});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    if(rot) mesh.rotation.y = rot;

    mesh.userData = {title, lines, canvas:cvs, ctx, tex};
    scene.add(mesh);
    panels.push(mesh);
    return mesh;
  }


// 1️⃣ Cubo sólido
function addSolidCube(x, y, z, sizex,sizey,sizez, color) {
    const geometry = new THREE.BoxGeometry(sizex, sizey, sizez);
    const material = new THREE.MeshStandardMaterial({ color });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(x, y, z);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);
    return cube;
}

// 2️⃣ Cubo hueco (wireframe)
function addHollowCube(x, y, z, size, color) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color });
    const wireframe = new THREE.LineSegments(edges, material);
    wireframe.position.set(x, y, z);
    scene.add(wireframe);
    return wireframe;
}

// 3️⃣ Pirámide rectangular (base rectangular)
function addRectangularPyramid(x, y, z, width, depth, height, color) {
    const geometry = new THREE.ConeGeometry( Math.max(width, depth)/2, height, 4 );
    const material = new THREE.MeshStandardMaterial({ color });
    const pyramid = new THREE.Mesh(geometry, material);
    pyramid.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
    pyramid.position.set(x, y + height/2, z);
    
    const degToRad = Math.PI / 180; // factor de conversión
    // Aplicar rotaciones
    pyramid.rotation.x = 0; // en radianes
    pyramid.rotation.y = 45 * degToRad ;
    pyramid.rotation.z = 0;
    
    
    pyramid.castShadow = true;
    pyramid.receiveShadow = true;
    scene.add(pyramid);
    return pyramid;
}

// 4️⃣ Pirámide cuadrada (más simple)
function addPyramid(x, y, z, size, height, color) {
    const geometry = new THREE.ConeGeometry(size/2, height, 4);
    const material = new THREE.MeshStandardMaterial({ color });
    const pyramid = new THREE.Mesh(geometry, material);
    pyramid.position.set(x, y + height/2, z);
    pyramid.castShadow = true;
    pyramid.receiveShadow = true;
    scene.add(pyramid);
    return pyramid;
}

// 5️⃣ Esfera sólida
function addSolidSphere(x, y, z, radius, color) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);
    return sphere;
}

// 6️⃣ Esfera hueca (wireframe)
function addHollowSphere(x, y, z, radius, color) {
    const geometry = new THREE.SphereGeometry(radius, 24, 24);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color });
    const wireframe = new THREE.LineSegments(edges, material);
    wireframe.position.set(x, y, z);
    scene.add(wireframe);
    return wireframe;
}

function addTrapezoid(x, y, z, topWidth, bottomWidth, height, depth, color) {
    // Crear forma 2D del trapecio (vista frontal)
    const shape = new THREE.Shape();
    const halfBottom = bottomWidth / 2;
    const halfTop = topWidth / 2;

    shape.moveTo(-halfBottom, 0);            // esquina inferior izquierda
    shape.lineTo(halfBottom, 0);             // inferior derecha
    shape.lineTo(halfTop, height);           // superior derecha
    shape.lineTo(-halfTop, height);          // superior izquierda
    shape.lineTo(-halfBottom, 0);            // cerrar figura

    // Extruir la forma para darle profundidad
    const extrudeSettings = {
        depth: depth,
        bevelEnabled: false
    };
    
   

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshStandardMaterial({ color });
    const trapezoid = new THREE.Mesh(geometry, material);

    // Centrar y posicionar
    geometry.center();
    trapezoid.position.set(x, y, z);

      const degToRad = Math.PI / 180; // factor de conversión
    // Aplicar rotaciones
    trapezoid.rotation.x = 0; // en radianes
    trapezoid.rotation.y = 90 * degToRad ;
    trapezoid.rotation.z = 0;

    scene.add(trapezoid);
    return trapezoid;
}


function addCabinRoofHollow(x, y, z, width = 10, height = 3, depth = 3, thickness = 0.05, textureURL) {
  const texture = new THREE.TextureLoader().load(textureURL);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.7,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  // --- Forma del tejado triangular (solo lados y pico, sin base) ---
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0); // esquina inferior izquierda
  shape.lineTo(0, height);     // pico
  shape.lineTo(width / 2, 0);  // esquina inferior derecha
  // NO cerramos hacia abajo

  // --- Hueco interior (solo lados y pico) ---
  const inset = thickness;
  const hole = new THREE.Path();
  hole.moveTo(-width / 2 + inset, inset);
  hole.lineTo(0, height - inset);
  hole.lineTo(width / 2 - inset, inset);
  // NO cerramos la base
  shape.holes.push(hole);

  // --- Extruir solo la profundidad ---
  const extrudeSettings = {
    depth: depth,
    bevelEnabled: false,
    steps: 1,
  };

  const roofGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  roofGeometry.center();

  const roof = new THREE.Mesh(roofGeometry, material);

  // --- Posicionar y rotar ---
  roof.position.set(x, y, z);
  roof.rotation.x = Math.PI; // voltear para que cara visible quede arriba
  roof.rotation.z = Math.PI / 4; // inclinación del tejado
  roof.position.y += height / 2; // ajustar altura del pico

  scene.add(roof);

  return roof;
}

// 🔹 Uso:
const hollowRoof = addCabinRoofHollow(
  0, 10, 0,
  10, 10, 6, 0.2,
  'https://threejs.org/examples/textures/hardwood2_diffuse.jpg'
);





function addTrapezoidWood(x, y, z, topWidth, bottomWidth, height, depth) {
  // --- Crear forma 2D del trapecio ---
  const shape = new THREE.Shape();
  const halfBottom = bottomWidth / 2;
  const halfTop = topWidth / 2;

  shape.moveTo(-halfBottom, 0);
  shape.lineTo(halfBottom, 0);
  shape.lineTo(halfTop, height);
  shape.lineTo(-halfTop, height);
  shape.lineTo(-halfBottom, 0);

  // --- Configurar la extrusión ---
  const extrudeSettings = {
    depth: depth,
    bevelEnabled: false,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // --- Cargar textura de madera ---
  const textureLoader = new THREE.TextureLoader();
  const woodTexture = textureLoader.load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');

  // Permitir que se repita la textura si el objeto es grande
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(0.3,0.3); // Ajusta estos valores según el tamaño

  // --- Crear material con la textura ---
  const woodMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.7,
    metalness: 0.1,
  });

  // --- Crear el mesh ---
  const trapezoid = new THREE.Mesh(geometry, woodMaterial);

  // Centrar y posicionar
  geometry.center();
  trapezoid.position.set(x, y, z);

  // --- Rotaciones ---
  const degToRad = Math.PI / 180;
  trapezoid.rotation.x = 0;
  trapezoid.rotation.y = 90 * degToRad;
  trapezoid.rotation.z = 0;

  scene.add(trapezoid);
  return trapezoid;
}




function addNeonBar(x, y, z, length = 5, radius = 0.1, color = 0x00ffff) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 32);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,        // emite luz del mismo color
    emissiveIntensity: 2.5, // más alto = más brillo
    roughness: 0.2,
    metalness: 0.5
  });

  const bar = new THREE.Mesh(geometry, material);
  bar.position.set(x, y, z);
  bar.rotation.x = Math.PI / 2; // horizontal
  scene.add(bar);
  return bar;
}


function addNeonBarWithLight(x, y, z, length = 5, radius = 0.1, color = 0x00ffff) {
  const bar = addNeonBar(x, y, z, length, radius, color);

  const light = new THREE.PointLight(color, 1.2, 10);
  light.position.set(x, y, z);
  scene.add(light);

  return { bar, light };
}


function addNeonText(text, x, y, z, color = 0x00ffff, size = 1) {
  const loader = new THREE.FontLoader();
  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {

    const geometry = new THREE.TextGeometry(text, {
      font: font,
      size: size,
      height: 0.3,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.03,
      bevelSegments: 5
    });

    // 💡 Material tipo neón
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 1.5, // brillo base
      roughness: 0.2,
      metalness: 0.7
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    
    rotY = 3*Math.PI/2 ;
    
    mesh.rotation.y = rotY; // rotación sobre Y
    scene.add(mesh);
    
    mesh.castShadow = true;
    scene.add(mesh);

    // 💡 Luz puntual asociada al neón
    const light = new THREE.PointLight(color, 1.2, 12);
    light.position.set(x, y + 1, z + 1);
    scene.add(light);

    // ✨ Efecto de pulso suave
    const base = material.emissiveIntensity;
    const speed = 0.003 + Math.random() * 0.002; // cada uno ligeramente distinto
    function animateGlow() {
      requestAnimationFrame(animateGlow);
      const pulse = Math.sin(Date.now() * speed) * 0.5 + 1.0; // rango 0.5–1.5
      material.emissiveIntensity = base * pulse;
      light.intensity = 1 + Math.sin(Date.now() * speed) * 0.4; // luz acompaña
    }
    animateGlow();
  });
}



// --- Cubo o casa con textura de madera ---
function addWoodHouse(x, y, z, size = 4) {
  const loader = new THREE.TextureLoader();
  const woodTexture = loader.load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(2, 2); // ajusta cuántas veces se repite la textura

  const woodMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.7,
    metalness: 0.1
  });

  // cuerpo principal (cubo)
  const bodyGeo = new THREE.BoxGeometry(size, 8, 9);
  const house = new THREE.Mesh(bodyGeo, woodMaterial);
  house.position.set(x, y + size / 2, z);
  house.castShadow = true;
  house.receiveShadow = true;

  scene.add(house);
  return house;
}

// ejemplo de uso:

function addLuminousWindow(x, y, z, width = 1.5, height = 1.2, color = 0xffcc66) {
  // Material emisivo: parece luz encendida
  const material = new THREE.MeshStandardMaterial({
    color: 0xffe0b3,     // color base del vidrio
    emissive: color,     // color que "emite" luz
    emissiveIntensity: 2.5,
    transparent: true,
    opacity: 0.85,
    roughness: 0.3,
    metalness: 0.1
  });

  const geometry = new THREE.PlaneGeometry(width, height);
  const windowMesh = new THREE.Mesh(geometry, material);
  windowMesh.position.set(x, y, z);
  scene.add(windowMesh);

  // 🔆 luz real opcional (ilumina alrededores)
  const light = new THREE.PointLight(color, 0.8, 10); // color, intensidad, distancia
  light.position.set(x, y, z - 0.5);
  scene.add(light);

  return { windowMesh, light };
}

// ejemplo: ventana frontal con luz cálida

function addWindowWithFrame(x, y, z, width = 1.5, height = 1.2, color = 0xffcc66, frameColor = 0x3a2d1a) {
  // --- Vidrio brillante ---
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe0b3,
    emissive: color,
    emissiveIntensity: 2.5,
    transparent: true,
    opacity: 0.85,
    roughness: 0.3,
    metalness: 0.1
  });

  const glassGeometry = new THREE.PlaneGeometry(width, height);
  const windowMesh = new THREE.Mesh(glassGeometry, glassMaterial);
  windowMesh.position.set(x, y, z);
  scene.add(windowMesh);

  // --- Marco (4 bordes) ---
  const frameThickness = 0.1;
  const frameDepth = 0.05;
  const frameMaterial = new THREE.MeshStandardMaterial({ color: frameColor });

  // Borde superior
  const top = new THREE.Mesh(new THREE.BoxGeometry(width + frameThickness, frameThickness, frameDepth), frameMaterial);
  top.position.set(x, y + height / 2 + frameThickness / 2, z + 0.01);
  scene.add(top);

  // Borde inferior
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(width + frameThickness, frameThickness, frameDepth), frameMaterial);
  bottom.position.set(x, y - height / 2 - frameThickness / 2, z + 0.01);
  scene.add(bottom);

  // Borde izquierdo
  const left = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, height, frameDepth), frameMaterial);
  left.position.set(x - width / 2 - frameThickness / 2, y, z + 0.01);
  scene.add(left);

  // Borde derecho
  const right = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, height, frameDepth), frameMaterial);
  right.position.set(x + width / 2 + frameThickness / 2, y, z + 0.01);
  scene.add(right);

  // --- Luz interior opcional ---
  const light = new THREE.PointLight(color, 0.8, 10);
  light.position.set(x, y, z - 0.5);
  scene.add(light);

  return { windowMesh, frame: [top, bottom, left, right], light };
}

// 🔰 Asegúrate de tener cargado THREE.TextureLoader antes
const textureLoader = new THREE.TextureLoader();

function addWindowWithWoodFrame(x, y, z, width = 1.5, height = 1.2, color = 0xffcc66) {
  // --- Textura de madera ---
  const woodTexture = textureLoader.load('https://threejs.org/examples/textures/wood.jpg');
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(1, 1);

  const frameMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    roughness: 0.6,
    metalness: 0.1
  });

  // --- Vidrio brillante ---
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe0b3,
    emissive: color,
    emissiveIntensity: 2.5,
    transparent: true,
    opacity: 0.85,
    roughness: 0.3,
    metalness: 0.1
  });

  const glassGeometry = new THREE.PlaneGeometry(width, height);
  const windowMesh = new THREE.Mesh(glassGeometry, glassMaterial);
  windowMesh.position.set(x, y, z);
  scene.add(windowMesh);

  // --- Marco (4 piezas de madera) ---
  const frameThickness = 0.1;
  const frameDepth = 0.05;

  const top = new THREE.Mesh(new THREE.BoxGeometry(width + frameThickness, frameThickness, frameDepth), frameMaterial);
  top.position.set(x, y + height / 2 + frameThickness / 2, z + 0.01);
  scene.add(top);

  const bottom = new THREE.Mesh(new THREE.BoxGeometry(width + frameThickness, frameThickness, frameDepth), frameMaterial);
  bottom.position.set(x, y - height / 2 - frameThickness / 2, z + 0.01);
  scene.add(bottom);

  const left = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, height, frameDepth), frameMaterial);
  left.position.set(x - width / 2 - frameThickness / 2, y, z + 0.01);
  scene.add(left);

  const right = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, height, frameDepth), frameMaterial);
  right.position.set(x + width / 2 + frameThickness / 2, y, z + 0.01);
  scene.add(right);

  // --- Luz interior cálida ---
  const light = new THREE.PointLight(color, 0.8, 10);
  light.position.set(x, y, z - 0.5);
  scene.add(light);

  return { windowMesh, frame: [top, bottom, left, right], light };
}


function addWoodenDoor(x, y, z, width = 1.5, height = 3.5, thickness = 0.1) {
  const textureLoader = new THREE.TextureLoader();

  // --- Textura de madera ---
 const woodMaterial = new THREE.MeshStandardMaterial({
  color: 0x8b4513, // marrón tipo madera (SaddleBrown)
  roughness: 0.8,
  metalness: 0.2,
});

 // woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
 // woodTexture.repeat.set(1, 2);

 

  // --- Cuerpo de la puerta ---
  const doorGeometry = new THREE.BoxGeometry(width, height, thickness);
  const door = new THREE.Mesh(doorGeometry, woodMaterial);
  door.position.set(x, y, z);

  // 🔄 Rotar puerta 90° sobre eje Y (si lo deseas)
   door.rotation.y = -(Math.PI / 2);

  scene.add(door);

  // --- Picaporte metálico ---
  const handleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 32);
  const handleMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // dorado
    metalness: 1.0,
    roughness: 0.3,
  });

  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.rotation.z = Math.PI / 2; // horizontal

  // 👉 Esquina superior derecha
  handle.position.set(
    width / 2 - 0.08,
    height / 2 - 0.12,
    thickness / 2 + 0.02
  );

  door.add(handle);

  // --- Luz tenue cerca del picaporte (opcional) ---
  const handleLight = new THREE.PointLight(0xffd580, 0.3, 2);
  handleLight.position.set(handle.position.x, handle.position.y, handle.position.z + 0.07);
  door.add(handleLight);

  return { door, handle, handleLight };
}


function addFireplace(x, y, z, width = 2, height = 2, depth = 1) {
  const textureLoader = new THREE.TextureLoader();

  // --- Textura de ladrillo ---
  const brickTexture = textureLoader.load('https://threejs.org/examples/textures/brick_diffuse.jpg');
  brickTexture.wrapS = brickTexture.wrapT = THREE.RepeatWrapping;
  brickTexture.repeat.set(2, 2);

  const brickMaterial = new THREE.MeshStandardMaterial({
    map: brickTexture,
    roughness: 0.8,
    metalness: 0.1,
  });

  // --- Estructura principal ---
  const chimneyGeometry = new THREE.BoxGeometry(width, height, depth);
  const chimney = new THREE.Mesh(chimneyGeometry, brickMaterial);
  chimney.position.set(x, y + height / 2, z);
  scene.add(chimney);

  // --- Hueco interior (la "boca" de la chimenea) ---
  const innerGeometry = new THREE.BoxGeometry(width * 0.6, height * 0.6, depth * 1.05);
  const innerMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const inner = new THREE.Mesh(innerGeometry, innerMaterial);
  inner.position.set(x, y + height * 0.3, z + 0.01);
  scene.add(inner);

  // --- Fuego (emisión de luz y color) ---
  const fireGeometry = new THREE.PlaneGeometry(0.8, 0.8);
  const fireMaterial = new THREE.MeshStandardMaterial({
    color: 0xffaa33,
    emissive: 0xff5500,
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.9,
  });
  const fire = new THREE.Mesh(fireGeometry, fireMaterial);
  fire.position.set(x, y + 0.4, z + depth / 2 - 0.05);
  scene.add(fire);

  // --- Luz cálida oscilante (efecto realista de fuego) ---
  const fireLight = new THREE.PointLight(0xffaa55, 1.5, 6);
  fireLight.position.set(x, y + 0.5, z + depth / 2 - 0.1);
  scene.add(fireLight);

  

  return { chimney, inner, fire, fireLight };
}

function addExteriorChimney(x, y, z, height = 2, width = 0.8) {
  const textureLoader = new THREE.TextureLoader();

  // --- Textura de ladrillo ---
  const brickTexture = textureLoader.load('https://threejs.org/examples/textures/brick_diffuse.jpg');
  brickTexture.wrapS = brickTexture.wrapT = THREE.RepeatWrapping;
  brickTexture.repeat.set(1, 2);

  const brickMaterial = new THREE.MeshStandardMaterial({
    map: brickTexture,
    roughness: 0.8,
    metalness: 0.1,
  });

  // --- Cuerpo principal de la chimenea ---
  const chimneyGeometry = new THREE.BoxGeometry(width, height, width);
  const chimney = new THREE.Mesh(chimneyGeometry, brickMaterial);
  chimney.position.set(x, y + height / 2, z);
  scene.add(chimney);

  // --- Borde superior (un poco más ancho) ---
  const topGeometry = new THREE.BoxGeometry(width * 1.2, 0.1, width * 1.2);
  const topMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const top = new THREE.Mesh(topGeometry, topMaterial);
  top.position.set(x, y + height, z);
  scene.add(top);

  // --- Grupo para el humo ---
  const smokeParticles = [];
  const smokeMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    transparent: true,
    opacity: 0.5,
  });

  // Crear varias “nubes” de humo (esferas suaves)
  for (let i = 0; i < 20; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), smokeMaterial.clone());
    puff.position.set(
      x + (Math.random() - 0.5) * 0.2,
      y + height + Math.random() * 0.5,
      z + (Math.random() - 0.5) * 0.2
    );
    puff.material.opacity = 0.3 + Math.random() * 0.3;
    scene.add(puff);
    smokeParticles.push(puff);
  }

  // --- Animar humo (sube y se desvanece) ---
  function animateSmoke() {
    requestAnimationFrame(animateSmoke);
    smokeParticles.forEach(puff => {
      puff.position.y += 0.01 + Math.random() * 0.005;  // sube lentamente
      puff.material.opacity -= 0.002;                   // se desvanece
      puff.scale.addScalar(0.002);                      // se expande un poco

      // Reiniciar partícula cuando desaparece
      if (puff.material.opacity <= 0) {
        puff.position.set(
          x + (Math.random() - 0.5) * 0.2,
          y + height + Math.random() * 0.3,
          z + (Math.random() - 0.5) * 0.2
        );
        puff.material.opacity = 0.4 + Math.random() * 0.3;
        puff.scale.set(1, 1, 1);
      }
    });
  }
  animateSmoke();

  return { chimney, top, smokeParticles };
}

function addTable(x, y, z, width=2, depth=1, height=1, color=0x8B4513) {
    // Patas de la mesa
    const legGeo = new THREE.BoxGeometry(0.1, height, 0.1);
    const legMat = new THREE.MeshStandardMaterial({ color });
    const legs = [];
    const legOffsets = [
        [-width/2 + 0.05, height/2, -depth/2 + 0.05],
        [width/2 - 0.05, height/2, -depth/2 + 0.05],
        [-width/2 + 0.05, height/2, depth/2 - 0.05],
        [width/2 - 0.05, height/2, depth/2 - 0.05],
    ];
    legOffsets.forEach(offset => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(x + offset[0], y + offset[1], z + offset[2]);
        scene.add(leg);
        legs.push(leg);
    });

    // Tablero de la mesa
    const topGeo = new THREE.BoxGeometry(width, 0.1, depth);
    const topMat = new THREE.MeshStandardMaterial({ color });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(x, y + height + 0.05, z);
    scene.add(top);

    return { legs, top };
}

function addChair(x, y, z, seatSize=0.5, height=1, color=0x8B4513) {
    const mat = new THREE.MeshStandardMaterial({ color });

    // Asiento
    const seatGeo = new THREE.BoxGeometry(seatSize, 0.1, seatSize);
    const seat = new THREE.Mesh(seatGeo, mat);
    seat.position.set(x, y + 0.5, z);
    scene.add(seat);

    // Patas
    const legGeo = new THREE.BoxGeometry(0.08, 0.5, 0.08);
    const legOffsets = [
        [-seatSize/2 + 0.04, 0.25, -seatSize/2 + 0.04],
        [seatSize/2 - 0.04, 0.25, -seatSize/2 + 0.04],
        [-seatSize/2 + 0.04, 0.25, seatSize/2 - 0.04],
        [seatSize/2 - 0.04, 0.25, seatSize/2 - 0.04],
    ];
    legOffsets.forEach(offset => {
        const leg = new THREE.Mesh(legGeo, mat);
        leg.position.set(x + offset[0], y + offset[1], z + offset[2]);
        scene.add(leg);
    });

    // Respaldo
    const backGeo = new THREE.BoxGeometry(seatSize, height, 0.1);
    const back = new THREE.Mesh(backGeo, mat);
    back.position.set(x, y + 0.5 + height/2, z - seatSize/2 + 0.05);
    scene.add(back);

    return { seat, back };
}

function addStreetLamp(x, y, z, height=3, poleColor=0x333333, lampColor=0xffffaa) {
    // Poste
    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, height, 16);
    const poleMat = new THREE.MeshStandardMaterial({ color: poleColor });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, y + height/2, z);
    scene.add(pole);

    // Lámpara
    const lampGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const lampMat = new THREE.MeshStandardMaterial({
        color: lampColor,
        emissive: lampColor,
        emissiveIntensity: 1.5
    });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(x, y + height + 0.2, z);
    scene.add(lamp);

    // Luz puntual
    const light = new THREE.PointLight(lampColor, 1.5, 10);
    light.position.set(x, y + height + 0.2, z);
    scene.add(light);

    return { pole, lamp, light };
}

function addSmallPlane(x, y, z, scale=1, color=0xff0000) {
    const planeGroup = new THREE.Group();
    
    // Cuerpo
    const bodyGeo = new THREE.CylinderGeometry(0.2*scale, 0.2*scale, 1.2*scale, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI/2;
    planeGroup.add(body);

    // Alas
    const wingGeo = new THREE.BoxGeometry(0.05*scale, 0.6*scale, 1.2*scale);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xaa0000 });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(0, 0, 0);
    planeGroup.add(wing);

    // Hélice
    const propellerGeo = new THREE.BoxGeometry(0.05*scale, 0.02*scale, 0.4*scale);
    const propellerMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const propeller = new THREE.Mesh(propellerGeo, propellerMat);
    propeller.position.set(0.6*scale, 0, 0);
    planeGroup.add(propeller);

    // Cola
    const tailGeo = new THREE.BoxGeometry(0.05*scale, 0.2*scale, 0.2*scale);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(-0.6*scale, 0, 0);
    planeGroup.add(tail);

    planeGroup.position.set(x, y, z);
    scene.add(planeGroup);

    return { planeGroup, propeller };
}

// --- Crear avioncito ---
const { planeGroup, propeller } = addSmallPlane(5, 10, 0, 1, 0xff0000);

// --- Animación de hélice ---
function animatePropeller() {
    propeller.rotation.x += 0.1; // velocidad de rotación
    requestAnimationFrame(animatePropeller);
}
animatePropeller();


// Crear panel "Portafolio Online"
const pWebFull = makePanel(
  'Portafolio Online',
  ['Haz clic aquí para visitar mi sitio'],
  new THREE.Vector3(5, 2, 5),  // posición
  Math.PI / 4                   // rotación Y
);

// Marcar todo el panel como clickeable
pWebFull.userData.clickZones = [
  { yMin: 0, yMax: pWebFull.userData.canvas.height, link: 'https://serveruaslp.com/graficas.php' }
];
