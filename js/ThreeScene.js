var camera, scene, renderer, controls;
var geometry, material, cube1, cube2, cube3, plane, sphere;
var textureNameObject = { textureName: 'No Texture Clicked' };
var backgroundTexture = new THREE.ImageUtils.loadTexture('texture/tiles/Haku.png');

let tileWidth = 0.8;
let tileHeight = 0.4;
let tileDepth = 0.9;
let newCube;

const textureNames = [
    'Chun',
    'Haku',
    'Hatsu',
    'Man1',
    'Man2',
    'Man3',
    'Man4',
    'Man5-Dora',
    'Man5',
    'Man6',
    'Man7',
    'Man8',
    'Man9',
    'Nan',
    'Pei',
    'Pin1',
    'Pin2',
    'Pin3',
    'Pin4',
    'Pin5-Dora',
    'Pin5',
    'Pin6',
    'Pin7',
    'Pin8',
    'Pin9',
    'Shaa',
    'Sou1',
    'Sou2',
    'Sou3',
    'Sou4',
    'Sou5-Dora',
    'Sou5',
    'Sou6',
    'Sou7',
    'Sou8',
    'Sou9',
    'Ton'
];

class Game {
    constructor() {
        this.deck = [];
        this.board = [];
    }

    // Initialize the game or reset the game to its initial state
    init() {
        this.deck = this.createDeck();
        this.deck = this.shuffleDeck();
        //this.board = this.createBoard();
    }

    // Create a deck of tiles
    createDeck() {
        let deck = [];
        for (let i = 0; i < 36; i++) {
            for (let j = 0; j < 4; j++) {
                deck.push(textureNames[i]);

            }
        }
        return deck;
    }

    // Shuffle the deck
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
        console.log(this.deck)
        return this.deck;
    }

    newGame() {
        window.location.href = 'index.html';
    }

    reshuffleBoard() {
        this.shuffleDeck();
        //this.updateScene();
        this.updateCubeTextures();
    }

    updateCubeTextures() {
        const cubes = scene.children.filter(obj => obj.name === 'cube');
        console.log(cubes.length);

        cubes.forEach((cube, index) => {
            const textureName = game.deck[index % game.deck.length];
            cube.material[2].map = new THREE.ImageUtils.loadTexture('texture/tiles/' + textureName + '.png');
            cube.textureName = textureName;
        });
    }
}

// Create a new game
let game = new Game();
game.init();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Function to handle cube click
let firstClickedCube = null;

function removeCubes(cube1, cube2) {
    // Remove cubes from the scene
    scene.remove(cube1);
    scene.remove(cube2);

    const index1 = game.deck.findIndex((item) => item === cube1.textureName);
    if (index1 !== -1) game.deck.splice(index1, 1);

    const index2 = game.deck.findIndex((item) => item === cube2.textureName);
    if (index2 !== -1) game.deck.splice(index2, 1);

    console.log(game.deck.length);

    //isGamePlayable();
}


function areCubesAboveRemovedCube(cube1, cube2) {
    let cubesAbove = false;
    const raycaster = new THREE.Raycaster();
    const direction = new THREE.Vector3(0, 1, 0); // Upwards direction
    const maxDistance = 1; // Max distance to check for an object above

    // Calculate the offsets for the corners from the center
    const halfWidth = tileWidth * 0.5;
    const halfDepth = tileDepth * 0.5;

    // Function to get the world position of the cube's corner
    const getCornerPosition = (cube, offsetX, offsetZ) => {
        const position = new THREE.Vector3();
        cube.getWorldPosition(position);
        position.x += offsetX;
        position.z += offsetZ;
        return position;
    };

    // Array of corners for cube1 and cube2
    const corners = [
        getCornerPosition(cube1, halfWidth, halfDepth),
        getCornerPosition(cube1, halfWidth, -halfDepth),
        getCornerPosition(cube1, -halfWidth, halfDepth),
        getCornerPosition(cube1, -halfWidth, -halfDepth),
        getCornerPosition(cube2, halfWidth, halfDepth),
        getCornerPosition(cube2, halfWidth, -halfDepth),
        getCornerPosition(cube2, -halfWidth, halfDepth),
        getCornerPosition(cube2, -halfWidth, -halfDepth)
    ];

    // Check intersections for each corner
    corners.forEach((corner) => {
        // Set the raycaster to start at the corner of the cube and cast upwards
        raycaster.set(corner, direction);

        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(scene.children, true).filter(intersectedObj => intersectedObj.object !== cube1 && intersectedObj.object !== cube2);

        // Check each intersection
        for (let i = 0; i < intersects.length; i++) {
            // Calculate the distance from the cube's top face to the intersection point
            let distance = intersects[i].point.y - corner.y;
            // Check if the distance is less than maxDistance
            if (distance > 0 && distance < maxDistance) {
                cubesAbove = true;
                console.log("Cubes above within 1 unit in the y-direction");
                break; // No need to check other intersections since we found a cube above
            }
        }

        // Break out of the loop early if we've already found a cube above
        if (cubesAbove) {
            return;
        }
    });
    console.log("Cube above: " + cubesAbove);
    return cubesAbove;
}

function areCubesAroundRemovedCube(cube1, cube2) {
    let cubesFree = 0;

    // The distance threshold for considering if there are cubes around
    const closeDistanceThreshold = 0.2;

    // Directions for the four side rays
    const directions = [
        { direction: new THREE.Vector3(1, 0, 0), offsetZ: 0.2, side: "right"},
        { direction: new THREE.Vector3(1, 0, 0), offsetZ: -0.2, side: "right"},
        { direction: new THREE.Vector3(-1, 0, 0), offsetZ: -0.2, side: "left"},
        { direction: new THREE.Vector3(-1, 0, 0), offsetZ: 0.2, side: "left"},
    ];

    // Function to get the world position of the cube's side center
    const getSideCenterPosition = (cube, dir) => {
        const position = new THREE.Vector3();
        cube.getWorldPosition(position);
        position.x += dir.x * tileWidth * 0.5;
        position.y += tileHeight * 0.5; // Centered vertically in the cube
        position.z += dir.z * tileDepth * 0.5;
        return position;
    };

    // Create a raycaster
    const raycaster = new THREE.Raycaster();

    // Check each direction for each cube
    [cube1, cube2].forEach((cube) => {
        let sideFreeLeft = 0;
        let sideFreeRight = 0;
        directions.forEach((dir) => {
            // Get the starting position for the ray
            const start = getSideCenterPosition(cube, dir.direction);
            console.log(start);
            // Set the raycaster
            start.z = start.z + dir.offsetZ;
            raycaster.set(start, dir.direction);

            // Calculate objects intersecting the picking ray
            const intersects = raycaster.intersectObjects(scene.children, true).filter(intersectedObj => intersectedObj.object !== cube1 && intersectedObj.object !== cube2);

            // If no intersected object is within closeDistanceThreshold, it's a free side
            if (intersects.length === 0 || intersects[0].distance > closeDistanceThreshold) {
                if (dir.side === "left") {
                    sideFreeLeft++;
                } else {
                    sideFreeRight++;
                }
            }
        });


        if (sideFreeLeft === 2 || sideFreeRight === 2) {
            console.log("Sides free: " + sideFreeLeft + " " + sideFreeRight);
            cubesFree++;
        }
    });
    return cubesFree !== 2;

}

function checkIfSelectedCubesCanDisappear(cube1,cube2,cube3){
    const cubesAbove = areCubesAboveRemovedCube(cube1, cube2);
    const cubesAround = areCubesAroundRemovedCube(cube1, cube2);
    if (!cubesAbove && !cubesAround) {
        // There are no cubes above the removed cubes
        console.log("There are no cubes above the removed cubes.");
        removeCubes(cube3,cube2);
        return true;

    } else {
        // There are cubes above the removed cubes
        alert("There are tiles above or around the second tile!");
        return false;
    }

    return false;

}
function onCubeClick(event) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children.filter(obj => obj.name === 'cube'));
    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.isMesh) {
            textureNameObject.textureName = object.textureName;
            if (!firstClickedCube) {
                // First click, store the texture name
                firstClickedCube = object;
                if(!areCubesAroundRemovedCube(firstClickedCube,object) > 0 && !areCubesAboveRemovedCube(firstClickedCube,object) > 0) {
                    console.log('First clicked cube texture:', firstClickedCube.textureName);
                    newCube = firstClickedCube.clone();
                    const whiteMaterial = new THREE.MeshPhongMaterial({color: 0xFFFFFF});
                    console.log(newCube.material);
                    var cubeTexture = new THREE.ImageUtils.loadTexture('texture/tiles/' + firstClickedCube.textureName + '.png');

                    var materialCube = [
                        new THREE.MeshPhongMaterial({color: 0xFFFFFF, side: THREE.DoubleSide,}), // Right side
                        new THREE.MeshPhongMaterial({color: 0xFFFFFF, side: THREE.DoubleSide,}), // Left side
                        new THREE.MeshPhongMaterial({color: 0xFFFFFF, map: cubeTexture, side: THREE.DoubleSide,}), // Top side
                        new THREE.MeshPhongMaterial({color: 0xFFFFFF, side: THREE.DoubleSide,}), // Bottom side
                        new THREE.MeshPhongMaterial({color: 0xFFFFFF, side: THREE.DoubleSide,}), // Front side
                        new THREE.MeshPhongMaterial({color: 0xFFFFFF, side: THREE.DoubleSide,})  // Back side
                    ];
                    newCube.material = materialCube;

                    newCube.position.copy(firstClickedCube.position);
                    newCube.rotation.copy(firstClickedCube.rotation);
                    newCube.scale.copy(firstClickedCube.scale);
                    scene.remove(firstClickedCube);
                    scene.add(newCube);
                }else{
                    alert("There are tiles above or around the first tile!");
                    firstClickedCube = null;
                }
                //highlightCube(firstClickedCube);
            } else if (object === newCube){
                scene.remove(newCube);
                scene.add(firstClickedCube);
                firstClickedCube = null;

            } else {
                // Second click, compare texture names
                console.log('Second clicked cube texture:', object.textureName);
                if (firstClickedCube.textureName === object.textureName && firstClickedCube!=object) {
                    if(checkIfSelectedCubesCanDisappear(newCube,object, firstClickedCube)) {
                        scene.remove(newCube);
                        console.log('Textures match!');
                    }else{
                        scene.remove(newCube);
                        scene.add(firstClickedCube);
                    }
                } else {
                    console.log('Textures do not match.');
                    scene.remove(newCube);
                    scene.add(firstClickedCube);
                    //unhighlightCube(firstClickedCube);
                }

                // Reset for the next comparison
                firstClickedCube = null;
            }
        }
    }
}
function init(pyramide) {
    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        1000);
    camera.position.set(0, 7.5, 0);
    var gui = new dat.GUI();

    // Add a button to the GUI
    var buttonObject = { clickButton: function() { game.reshuffleBoard(); } };
    var buttonObject1 = { clickButton: function() { game.newGame(); } };


    gui.add(buttonObject, 'clickButton').name('Reshuffle');
    gui.add(buttonObject1, 'clickButton').name('Exit');
    //gui.add(textureNameObject, 'textureName').name('Clicked Texture');

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optional, for softer shadows
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    //scene.background = new THREE.Color(0xADD8E6); // Example: a soft blue background color

    if(pyramide){
        addObjectsPyramide()
    }else {
        addObjects();
    }

    // simulateGame(scene, game);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.mouseButtons = {
        ORBIT: THREE.MOUSE.RIGHT,
        ZOOM: THREE.MOUSE.MIDDLE,
        PAN: THREE.MOUSE.LEFT
    }
    controls.minDistance = 5;
    controls.maxDistance = 14
    controls.maxPolarAngle = Math.PI / 2;
    controls.enablePan = false;
    controls.maxAzimuthAngle = 0.5;
    controls.minAzimuthAngle = -0.5;

}

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    camera.lookAt(scene.position);

    controls.update();
    renderer.domElement.addEventListener('click', onCubeClick);

    checkIfGameIsFinished();

}

function checkIfGameIsFinished(){
    const cubes = scene.children.filter(obj => obj.name === 'cube');
    if(cubes.length <= 0){
        console.log("game won");
        window.location.href = 'gameFinished.html';
    }
}

function addObjects() {
    var planeWidth = 20;
    var planeHeight = 10;
    var geometryPlane = new THREE.PlaneGeometry(planeWidth, planeHeight, 4, 4);
    var matTexture = new THREE.ImageUtils.loadTexture('texture/green_mat2.jpg');
    var materialPlane = new THREE.MeshPhongMaterial({
        color: 0x747570,
        side: THREE.DoubleSide,
        map: matTexture,
        shininess: 0
    });
    plane = new THREE.Mesh(geometryPlane, materialPlane);
    plane.position.set(0, -2.2, 0);
    plane.rotation.x = Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    var borderWidth = 1;
    var borderHeight = 0.5;
    var borderYPosition = -2.2 + borderHeight / 2;
    var borderTexture = new THREE.ImageUtils.loadTexture('texture/wood.png');

    var borderMaterial = new THREE.MeshPhongMaterial({ color: 0xe8c17a, map: borderTexture, shininess: 0 });

    // Function to create a single border segment
    function createBorder(width, height, depth, position) {
        var borderGeometry = new THREE.BoxGeometry(width, height, depth);
        var borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
        borderMesh.position.set(position.x, position.y, position.z);
        scene.add(borderMesh);
    }


    // Border positions based on the plane size
    var borderPositions = [
        { width: planeWidth + 2 * borderWidth, height: borderHeight, depth: borderWidth, position: { x: 0, y: borderYPosition + 0.01, z: planeHeight / 2 + borderWidth / 2 } },
        { width: planeWidth + 2 * borderWidth, height: borderHeight, depth: borderWidth, position: { x: 0, y: borderYPosition + 0.01, z: -planeHeight / 2 - borderWidth / 2 } },
        { width: borderWidth, height: borderHeight, depth: planeHeight + borderWidth, position: { x: -planeWidth / 2 - borderWidth / 2, y: borderYPosition, z: 0 } },
        { width: borderWidth, height: borderHeight, depth: planeHeight + borderWidth, position: { x: planeWidth / 2 + borderWidth / 2, y: borderYPosition, z: 0 } }
    ];

    for (var i = 0; i < borderPositions.length; i++) {
        var pos = borderPositions[i];
        createBorder(pos.width, pos.height, pos.depth, pos.position);
    }

    let deckcount = 0;
    let offsetX, offsetY, offsetZ;

    let layerDefinitions = [
        {rows: 6,cols: 8, firstLayer: true, centerRows: [2,3], centerCols:[3,4] },
        // Second layer dimensions
        { rows: 6, cols: 6, skipCenter: false, centerRows: [2, 3], centerCols: [4, 5, 6, 7] },
        // Third layer dimensions
        { rows: 4, cols: 4, skipCenter: false },
        // Fourth layer dimensions
        { rows: 2, cols: 2, skipCenter: false },
        // Fifth layer (single tile on top)
        { rows: 1, cols: 1, skipCenter: false }
    ];

    // The height of each layer, assuming each tile is offset upwards by the height of the tile below it
    let layerHeight = tileHeight;
    const gap = 0.05;

    layerDefinitions.forEach((layerDef, layerIndex) => {
        for (let row = 0; row < layerDef.rows; row++) {
            for (let col = 0; col < layerDef.cols; col++) {
                // Skip the center if required by the current layer definition
                if (layerDef.skipCenter && layerDef.centerRows.includes(row) && layerDef.centerCols.includes(col)) {
                    continue;
                }

                if (deckcount >= game.deck.length) {
                    console.log("Error!")
                    break;
                }

                let tile = game.deck[deckcount];
                deckcount++;
                var geometryCube = new THREE.BoxGeometry(tileWidth, tileHeight, tileDepth);
                var cubeTexture = new THREE.ImageUtils.loadTexture('texture/tiles/' + tile + '.png');
                var materialCube = [
                    new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,}), // Right side
                    new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,}), // Left side
                    new THREE.MeshPhongMaterial({color: 0xe8c17a, map: cubeTexture, side: THREE.DoubleSide,}), // Top side
                    new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,}), // Bottom side
                    new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,}), // Front side
                    new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,})  // Back side
                ];

                // Calculate the offsets for positioning each layer
                offsetX = ((col - (layerDef.cols / 2)) + 0.5) * (tileWidth + gap);

                offsetY = layerHeight * (layerIndex - 5) + 0.01 * layerIndex; // Stack layers on top of each other

                offsetZ = ((row - (layerDef.rows / 2)) + 0.5) * (tileDepth + gap);

                let cube = new THREE.Mesh(geometryCube, materialCube);
                cube.position.set(offsetX, offsetY, offsetZ);
                cube.textureName = tile;
                cube.name = 'cube';
                cube.castShadow = true;
                cube.receiveShadow = true;
                scene.add(cube);
            }
        }
        if(layerDef.firstLayer){
            let customLayers = [
                { rows: 1, cols: 12, skipCenter: false },
                { rows: 1, cols: 12, skipCenter: false },
                { rows: 1, cols: 1, skipCenter: false },
                { rows: 1, cols: 2, skipCenter: false },
                { rows: 1, cols: 2, skipCenter: false },
                { rows: 1, cols: 1, skipCenter: false },
                { rows: 1, cols: 1, skipCenter: false },
                { rows: 1, cols: 2, skipCenter: false },
                { rows: 1, cols: 2, skipCenter: false },
                { rows: 1, cols: 1, skipCenter: false },
                { rows: 1, cols: 1, skipCenter: false },
                { rows: 1, cols: 2, skipCenter: false },]
            customLayers.forEach((layerDef, layerIndex) => {
                for (let row = 0; row < layerDef.rows; row++) {
                    for (let col = 0; col < layerDef.cols; col++) {
                        // Skip the center if required by the current layer definition
                        if (layerDef.skipCenter && layerDef.centerRows.includes(row) && layerDef.centerCols.includes(col)) {
                            continue;
                        }

                        if (deckcount >= game.deck.length) {
                            console.log("Error!")
                            break;
                        }

                        let tile = game.deck[deckcount];
                        deckcount++;
                        var geometryCube = new THREE.BoxGeometry(tileWidth, tileHeight, tileDepth);
                        var cubeTexture = new THREE.ImageUtils.loadTexture('texture/tiles/' + tile + '.png');
                        var materialCube = [
                            new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,}), // Right side
                            new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,}), // Left side
                            new THREE.MeshPhongMaterial({color: 0xe8c17a, map: cubeTexture, side: THREE.DoubleSide,}), // Top side
                            new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,}), // Bottom side
                            new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,}), // Front side
                            new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,})  // Back side
                        ];

                        // Calculate the offsets for positioning each layer
                        if (layerIndex === 2 || layerIndex === 5) {
                            offsetX = ((col - (layerDef.cols / 2)) - 4) * (tileWidth + gap);
                        } else if (layerIndex === 3 || layerIndex === 4) {
                            offsetX = ((col - (layerDef.cols / 2)) - 4.5 ) * (tileWidth + gap);
                        } else if (layerIndex === 6 || layerIndex === 9) {
                            offsetX = ((col - (layerDef.cols / 2)) + 5 ) * (tileWidth + gap);

                        } else if (layerIndex === 7 || layerIndex === 8) {
                            offsetX = ((col - (layerDef.cols / 2)) + 5.5 ) * (tileWidth + gap);
                        } else if (layerIndex === 10 ) {
                            offsetX = ((col - (layerDef.cols / 2)) - 6) * (tileWidth + gap);
                        } else if (layerIndex === 11 ) {
                            offsetX = ((col - (layerDef.cols / 2)) + 7.5 ) * (tileWidth + gap);

                        } else {
                            offsetX = ((col - (layerDef.cols / 2)) + 0.5) * (tileWidth + gap);
                        }
                        if (layerIndex === 0) {
                            offsetZ = ((row - (layerDef.rows / 2)) + 4) * (tileDepth + gap);
                        } else if (layerIndex === 1) {
                            offsetZ = ((row - (layerDef.rows / 2)) - 3) * (tileDepth + gap);
                        } else if (layerIndex === 2 || layerIndex === 6) {
                            offsetZ = ((row - (layerDef.rows / 2)) - 1) * (tileDepth + gap);
                        } else if (layerIndex === 3 || layerIndex === 7) {
                            offsetZ = ((row - (layerDef.rows / 2))  ) * (tileDepth + gap);
                        } else if (layerIndex === 4 || layerIndex === 8) {
                            offsetZ = ((row - (layerDef.rows / 2)) + 1) * (tileDepth + gap);
                        } else if (layerIndex === 5 || layerIndex === 9) {
                            offsetZ = ((row - (layerDef.rows / 2)) + 2) * (tileDepth + gap);
                        } else if (layerIndex === 10 || layerIndex === 11) {
                            offsetZ = ((row - (layerDef.rows / 2)) + 0.5 ) * (tileDepth + gap);
                        }
                        let cube = new THREE.Mesh(geometryCube, materialCube);
                        cube.position.set(offsetX, offsetY, offsetZ);
                        cube.textureName = tile;
                        cube.name = 'cube';
                        cube.castShadow = true;
                        cube.receiveShadow = true;
                        scene.add(cube);
                    }
                }
            });

        }


    });

    const cubes = scene.children.filter(obj => obj.name === 'cube');
    console.log('cubes length ' + cubes.length);

    var pointLight = new THREE.PointLight(0xffffff, 2, 23);
    var pointLight2 = new THREE.PointLight(0xffffff, 2, 23);
    var pointLight3 = new THREE.PointLight(0xffffff, 2, 23);
    var pointLight4 = new THREE.PointLight(0xffffff, 2, 23);

    pointLight.position.set(-10, 10, 10   );
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 1000;
    pointLight.shadow.mapSize.height = 1000;
    pointLight.shadow.bias = -0.001;

    pointLight2.position.set(10, 10, 10);
    pointLight2.castShadow = true;
    pointLight2.shadow.mapSize.width = 1000;
    pointLight2.shadow.mapSize.height = 1000;
    pointLight2.shadow.bias = -0.001;

    pointLight3.position.set(-10, 10, -10);
    pointLight3.castShadow = true;
    pointLight3.shadow.mapSize.width = 1000;
    pointLight3.shadow.mapSize.height = 1000;
    pointLight3.shadow.bias = -0.001;

    pointLight4.position.set(10, 10, -10);
    pointLight4.castShadow = true;
    pointLight4.shadow.mapSize.width = 1000;
    pointLight4.shadow.mapSize.height = 1000;
    pointLight4.shadow.bias = -0.001;

    var ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    scene.add(pointLight);
    scene.add(pointLight2);
    scene.add(pointLight3);
    scene.add(pointLight4);

    //scene.add(helper);

}


function addObjectsPyramide() {
        var planeWidth = 20;
        var planeHeight = 20;
        var geometryPlane = new THREE.PlaneGeometry(planeWidth, planeHeight, 4, 4);
        var matTexture = new THREE.ImageUtils.loadTexture('texture/green_mat2.jpg');
        var materialPlane = new THREE.MeshPhongMaterial({
            color: 0x747570,
            side: THREE.DoubleSide,
            map: matTexture,
            shininess: 0
        });
        plane = new THREE.Mesh(geometryPlane, materialPlane);

        plane.position.set(0, -2.2, 0);
        plane.rotation.x = Math.PI / 2;
        plane.receiveShadow = true;
        scene.add(plane);


    var borderWidth = 1;
    var borderHeight = 0.5;
    var borderYPosition = -2.2 + borderHeight / 2;
    var borderTexture = new THREE.ImageUtils.loadTexture('texture/wood.png');

    var borderMaterial = new THREE.MeshPhongMaterial({ color: 0xe8c17a, map: borderTexture, shininess: 0 });

    // Function to create a single border segment
    function createBorder(width, height, depth, position) {
        var borderGeometry = new THREE.BoxGeometry(width, height, depth);
        var borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
        borderMesh.position.set(position.x, position.y, position.z); // Add a small offset to the y position
        scene.add(borderMesh);
    }

    // Border positions based on the plane size
    var borderPositions = [
        { width: planeWidth + 2 * borderWidth, height: borderHeight, depth: borderWidth, position: { x: 0, y: borderYPosition + 0.01, z: planeHeight / 2 + borderWidth / 2 } },
        { width: planeWidth + 2 * borderWidth, height: borderHeight, depth: borderWidth, position: { x: 0, y: borderYPosition + 0.01, z: -planeHeight / 2 - borderWidth / 2 } },
        { width: borderWidth, height: borderHeight, depth: planeHeight + borderWidth, position: { x: -planeWidth / 2 - borderWidth / 2, y: borderYPosition, z: 0 } },
        { width: borderWidth, height: borderHeight, depth: planeHeight + borderWidth, position: { x: planeWidth / 2 + borderWidth / 2, y: borderYPosition, z: 0 } }
    ];

    // Create and position border segments using a loop
    for (var i = 0; i < borderPositions.length; i++) {
        var pos = borderPositions[i];
        createBorder(pos.width, pos.height, pos.depth, pos.position);
    }

        let deckcount = 0;
        let offsetX, offsetY, offsetZ;

        let layerDefinitions = [
            {rows: 11,cols: 8, skipCenter: true, centerRows: [2,3], centerCols:[3,4] },
            // Second layer dimensions
            { rows: 7, cols: 6, skipCenter: true, centerRows: [2, 3], centerCols: [4, 5, 6, 7] },
            // Third layer dimensions
            { rows: 5, cols: 4, skipCenter: false },
            // Fourth layer dimensions
            { rows: 2, cols: 2, skipCenter: false },
            // Fifth layer (single tile on top)
            //{ rows: 1, cols: 1, skipCenter: false }
        ];

        // The height of each layer, assuming each tile is offset upwards by the height of the tile below it
        let layerHeight = tileHeight;
        // Define a small constant for the gap
        const gap = 0.05;

        layerDefinitions.forEach((layerDef, layerIndex) => {
            for (let row = 0; row < layerDef.rows; row++) {
                for (let col = 0; col < layerDef.cols; col++) {
                    // Skip the center if required by the current layer definition
                    if (layerDef.skipCenter && layerDef.centerRows.includes(row) && layerDef.centerCols.includes(col)) {
                        continue;
                    }

                    if (deckcount >= game.deck.length) {
                        console.log("Error!")
                        break;
                    }

                    let tile = game.deck[deckcount];
                    deckcount++;
                    var geometryCube = new THREE.BoxGeometry(tileWidth, tileHeight, tileDepth);
                    var cubeTexture = new THREE.ImageUtils.loadTexture('texture/tiles/' + tile + '.png');
                    var materialCube = [
                        new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,}), // Right side
                        new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,}), // Left side
                        new THREE.MeshPhongMaterial({color: 0xe8c17a, map: cubeTexture, side: THREE.DoubleSide,}), // Top side
                        new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,}), // Bottom side
                        new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,}), // Front side
                        new THREE.MeshPhongMaterial({color: 0xe8c17a, map: backgroundTexture, side: THREE.DoubleSide,}),  // Back side
                    ];

                    // Calculate the offsets for positioning each layer
                    offsetX = ((col - (layerDef.cols / 2)) + 0.5) * (tileWidth + gap);
                    offsetY = layerHeight * (layerIndex - 5); // Stack layers on top of each other
                    offsetZ = ((row - (layerDef.rows / 2)) + 0.5) * (tileDepth + gap);

                    let cube = new THREE.Mesh(geometryCube, materialCube);
                    cube.position.set(offsetX, offsetY, offsetZ);
                    cube.textureName = tile;
                    cube.name = 'cube';
                    cube.castShadow = true;
                    cube.receiveShadow = true;
                    scene.add(cube);
                }
            }
        });

        const cubes = scene.children.filter(obj => obj.name === 'cube');
        console.log('cubes length ' + cubes.length);

        var pointLight = new THREE.PointLight(0xffffff, 2, 23);
        var pointLight2 = new THREE.PointLight(0xffffff, 2, 23);
        var pointLight3 = new THREE.PointLight(0xffffff, 2, 23);
        var pointLight4 = new THREE.PointLight(0xffffff, 2, 23);

        pointLight.position.set(-10, 10, 10   );
        pointLight.castShadow = true;
        pointLight.shadow.mapSize.width = 1000;
        pointLight.shadow.mapSize.height = 1000;
        pointLight.shadow.bias = -0.001;

        pointLight2.position.set(10, 10, 10);
        pointLight2.castShadow = true;
        pointLight2.shadow.mapSize.width = 1000;
        pointLight2.shadow.mapSize.height = 1000;
        pointLight2.shadow.bias = -0.001;

        pointLight3.position.set(-10, 10, -10);
        pointLight3.castShadow = true;
        pointLight3.shadow.mapSize.width = 1000;
        pointLight3.shadow.mapSize.height = 1000;
        pointLight3.shadow.bias = -0.001;

        pointLight4.position.set(10, 10, -10);
        pointLight4.castShadow = true;
        pointLight4.shadow.mapSize.width = 1000;
        pointLight4.shadow.mapSize.height = 1000;
        pointLight4.shadow.bias = -0.001;

        var ambientLight = new THREE.AmbientLight(0x404040, 1);
        scene.add(ambientLight);
        scene.add(pointLight);
        scene.add(pointLight2);
        scene.add(pointLight3);
        scene.add(pointLight4);


        //scene.add(helper);

    }


