var camera, scene, renderer, controls;
var geometry, material, cube1, cube2, cube3, plane, sphere;
var textureNameObject = { textureName: 'No Texture Clicked' };
let tileWidth = 0.8;
let tileHeight = 0.4;
let tileDepth = 0.9;

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
// Now you can use this array in your code


function isGamePlayable() {
    let playable = false;
    const cubes = scene.children.filter(obj => obj.name === 'cube');
    // We'll use a nested loop to compare each cube with every other cube.
    for (let i = 0; i < cubes.length - 1; i++) {
        for (let j = i + 1; j < cubes.length; j++) {
            if (cubes[i].textureName === cubes[j].textureName && checkIfSelectedCubesCanDisappear(cubes[i], cubes[j])) {
                // If there's at least one pair that can be removed, the game is playable.
                playable = true
                //return true;
                break;
            }
        }
        if (playable) {
            break;
        }
    }

    if (!playable) {
        // No more moves can be made with the current arrangement of cubes.
        console.log('No more moves. Reshuffling...');
        //game.reshuffleBoard();
    } else {
        console.log('The game is playable. Make your move.');
    }
    return playable;
}

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

    // Create a deck of cards
    createDeck() {
        let deck = [];
        // In Mahjongg, there are 144 tiles, with 4 duplicates of each kind.
        // Here, we'll just use numbers for simplicity.
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

    // Create the board
    createBoard() {
        let board = [];
        for (let i = 0; i < 4; i++) {
            let row = [];
            for (let j = 0; j < 6; j++) {
                let line = [];
                for (let k=0; k<6;k++){
                    line.push(this.deck.pop());
                    //console.log(this.deck[i][j][k]);
                }
                row.push(line);
            }
            board.push(row);
        }
        return board;
    }

    newGame() {
        this.init();
        this.updateCubeTextures(); // Add this line to update the Three.js scene after initializing a new game
    }
    // Check if a move is valid
    isValidMove(tile1, tile2) {
        return tile1 === tile2;
    }

    reshuffleBoard() {
        this.shuffleDeck();
        //this.updateScene();
        this.updateCubeTextures();
    }

    updateCubeTextures() {
        const cubes = scene.children.filter(obj => obj.name === 'cube');
        console.log(cubes.length);
        // let shuffledTextures = [...this.deck]; // Create a copy of the deck
        //toto tu preco
        //this.shuffleArray(game.deck); // Shuffle the copy, not the original deck

        cubes.forEach((cube, index) => {
            const textureName = game.deck[index % game.deck.length];
            //zeby sa neuklada spravne?
            cube.material[2].map = new THREE.ImageUtils.loadTexture('texture/tiles/' + textureName + '.png');
            cube.textureName = textureName;
        });
    }

// Helper function to shuffle an array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    /*    updateCubeTextures() {
            const cubes = scene.children.filter(obj => obj.name === 'cube');
            let deck1 = this.deck;
            console.log(this.deck);
            cubes.forEach(cube => {
                const newTexture = deck1.pop();
                cube.material[2].map = new THREE.ImageUtils.loadTexture('texture/tiles/' + newTexture + '.png');
                //console.log(cube.textureName)
                cube.textureName = newTexture;
                //console.log(cube.textureName)
            });
        }*/
    updateScene() {
        // Clear existing cubes from the scene
        scene.children.forEach((child) => {
            if (child.isMesh || child instanceof  THREE.PointLight
                || child instanceof  THREE.AmbientLight || child instanceof  THREE.CameraHelper) {
                scene.remove(child);
            }
        });
        //addObjects();
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

    // Dimensions of the cubes
    const Width = 0.8;
    const Height = 0.4;
    const Depth = 0.9;

    // Calculate the offsets for the corners from the center
    const halfWidth = Width * 0.5;
    const halfDepth = Depth * 0.5;
    const topY = Height * 0.5; // Since we want the top corners

    // Function to get the world position of the cube's corner
    const getCornerPosition = (cube, offsetX, offsetZ) => {
        const position = new THREE.Vector3();
        cube.getWorldPosition(position);
        position.x += offsetX;
        position.y += topY;
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
        //Ak su rovnake tak ze jedna je nad druhou tak to prejde treba fixnut?
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



/*function areCubesAroundRemovedCube(cube1) {
    scene.traverse((object) => {
        if (object.isMesh && object !== cube1 && object !== cube2) {
            if(object.position.y == cube1.position.y && object.position.z == cube1.position.z){
                if((object.position.x - cube1.position.x) <= 0.8){
                    console.log("in condition")
                    return false;

                }
            }
        }

    });
    return true;


}*/

function areCubesAroundRemovedCube(cube1, cube2) {
    let cubesFree = 0;


    // Dimensions of the cubes
    const Width = 0.8;
    const Height = 0.4;
    const Depth = 0.9;

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
        position.x += dir.x * Width * 0.5;
        position.y += Height * 0.5; // Centered vertically in the cube
        position.z += dir.z * Depth * 0.5;
        return position;
    };

    // Create a raycaster
    const raycaster = new THREE.Raycaster();

    // Check each direction for each cube
    [cube1, cube2].forEach((cube) => {
        let sideFreeLeft = 0; // Counter for free sides
        let sideFreeRight = 0; // Counter for free sides
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


/*function simulateGame(scene, game) {
    let allTilesProcessed = false;
    // Keep trying until all tiles are processed
    deck = game.deck;
    console.log("in")
    while(!allTilesProcessed){
        scene.traverse((object) => {
            if (object.isMesh ) {
                texture1= object.textureName
                scene.traverse((object2) => { if(object!=object2 && texture1 == object2.textureName){
                    texture2= object2.textureName;
                    console.log("som dnu");
                    checkIfSelectedCubesCanDisappear(object,object2);

                }})
            }
        });
        allTilesProcessed=true;

    }

    console.log("all files proccessed");
}
*/

// Add this function to find cubes by texture in the scene
function findCubesByTexture(scene, texture1, texture2) {
    const cubes = [];

    scene.traverse((object) => {
        if (object.isMesh && object.textureName === texture1) {
            cubes.push(object);
        } else if (object.isMesh && object.textureName === texture2) {
            cubes.push(object);
        }
    });

    return cubes;
}

function findFreeTiles(deck) {
    const freeTiles = [];
    //console.log("inin")
    for (let i = 0; i < deck.length; i++) {
        if (isTileOnBoard(scene, deck[i])) {
            freeTiles.push(deck[i]);
            //console.log(deck[i])
        }
    }


    return freeTiles;
}

function isTileOnBoard(scene, tile) {
    let isOnBoard = false;
    //console.log("ininin")
    scene.traverse((object) => {
        if (object.isMesh && object.textureName === tile) {
            isOnBoard = true;
        }
    });
    //console.log(isOnBoard)
    return isOnBoard;
}



function checkIfSelectedCubesCanDisappear(cube1,cube2){


    //console.log("pos1x" + cube1.position.x);
    //console.log("pos1y" + cube1.position.y);
    //console.log("pos1z" + cube1.position.z);

    //  console.log("pos2x" + cube2.position.x);
//    console.log("pos2y" + cube2.position.y);
    //console.log("pos2z" + cube2.position.z);

    const cubesAbove = areCubesAboveRemovedCube(cube1, cube2);
    const cubesAround = areCubesAroundRemovedCube(cube1, cube2);

    //const cubesAround1 = areCubesAroundRemovedCube(cube1);
    //const cubesAround2 = areCubesAroundRemovedCube(cube2);

    //let cubesAround = false;
    if (!cubesAbove && !cubesAround) {
        // There are no cubes above the removed cubes
        console.log("There are no cubes above the removed cubes.");
        removeCubes(cube1,cube2);
        return true;

    } else {
        // There are cubes above the removed cubes
        console.log("There are cubes above or around the removed cubes.");
        return false;
    }

    return false;

}
function onCubeClick(event) {
    event.preventDefault();

    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components.
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Intersect objects in the scene
    // const intersects = raycaster.intersectObjects(scene.children);
    const intersects = raycaster.intersectObjects(scene.children.filter(obj => obj.name === 'cube'));
    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.isMesh) {
            textureNameObject.textureName = object.textureName;
            if (!firstClickedCube) {
                // First click, store the texture name

                firstClickedCube = object;
                console.log('First clicked cube texture:', firstClickedCube.textureName);
                //highlightCube(firstClickedCube);
            } else {
                // Second click, compare texture names
                console.log('Second clicked cube texture:', object.textureName);
                if (firstClickedCube.textureName === object.textureName && firstClickedCube!=object) {
                    checkIfSelectedCubesCanDisappear(firstClickedCube,object);

                    console.log('Textures match!');

                } else {
                    console.log('Textures do not match.');
                    //unhighlightCube(firstClickedCube);
                }

                // Reset for the next comparison
                firstClickedCube = null;
            }
        }
    }
}
function highlightCube(cube) {
    cube.material.color.set(0xff0000); // Set the color to red as an example
}

// Function to unhighlight a cube (reset material color for example)
function unhighlightCube(cube) {
    cube.material.color.set(0xffffff); // Reset color to white as an example
}
function init(pyramide) {
    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        1000);
    camera.position.set(0, 5, 5);
    var gui = new dat.GUI();

// Add a button to the GUI
    var buttonObject = { clickButton: function() { game.reshuffleBoard(); } };
    var buttonObject1 = { clickButton: function() { game.newGame(); } };


    gui.add(buttonObject, 'clickButton').name('Reshuffle');
    gui.add(buttonObject1, 'clickButton').name('New Game');
    gui.add(textureNameObject, 'textureName').name('Clicked Texture');





    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optional, for softer shadows
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    console.log(pyramide);
    if(pyramide){
        addObjectsPyramide()
    }else {
        addObjects();
    }
    // simulateGame(scene, game);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
}

function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    camera.lookAt(scene.position);

    controls.update();
    renderer.domElement.addEventListener('click', onCubeClick);

}
function gameMap(x,y){
//    maparray=[[0,0][0,1][]]
}

function addObjects() {
    var geometryPlane = new THREE.PlaneGeometry(20, 20, 4, 4);
    var materialPlane = new THREE.MeshPhongMaterial({
        color: 0x747570,
        side: THREE.DoubleSide
    });
    plane = new THREE.Mesh(geometryPlane, materialPlane);
    plane.position.set(0, -2.2, 0);
    plane.rotation.x = Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);
    var geometrySphere = new THREE.SphereGeometry(100, 100, 100);
    var sphereTexture = new THREE.ImageUtils.loadTexture('texture/sky.jpg');
    var materialSphere = new THREE.MeshBasicMaterial({ map: sphereTexture, transparent: true, side: THREE.DoubleSide });
    sphere = new THREE.Mesh(geometrySphere, materialSphere);
    sphere.position.set(0, 0, 0);
    scene.add(sphere);

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
                    new THREE.MeshPhongMaterial({color: 0xe8c17a}), // Right side
                    new THREE.MeshPhongMaterial({color: 0xe8c17a}), // Left side
                    new THREE.MeshPhongMaterial({color: 0xe8c17a, map: cubeTexture, side: THREE.DoubleSide,}), // Top side
                    new THREE.MeshPhongMaterial({color: 0xe8c17a}), // Bottom side
                    new THREE.MeshPhongMaterial({color: 0xe8c17a}), // Front side
                    new THREE.MeshPhongMaterial({color: 0xe8c17a})  // Back side
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
                            new THREE.MeshPhongMaterial({color: 0xe8c17a}), // Right side
                            new THREE.MeshPhongMaterial({color: 0xe8c17a}), // Left side
                            new THREE.MeshPhongMaterial({color: 0xe8c17a, map: cubeTexture, side: THREE.DoubleSide,}), // Top side
                            new THREE.MeshPhongMaterial({color: 0xe8c17a}), // Bottom side
                            new THREE.MeshPhongMaterial({color: 0xe8c17a}), // Front side
                            new THREE.MeshPhongMaterial({color: 0xe8c17a})  // Back side
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
    var centerLight = new THREE.PointLight(0xffffff, 2, 5);

    centerLight.position.set(0, 10, 0);
    centerLight.castShadow = true;
    centerLight.shadow.mapSize.width = 1000;
    centerLight.shadow.mapSize.height = 1000;
    centerLight.shadow.camera.near = 0.5;
    centerLight.shadow.camera.far = 500;
    centerLight.shadow.bias = -0.001;


    pointLight.position.set(-10, 10, 10   );
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 1000;
    pointLight.shadow.mapSize.height = 1000;
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 500;
    pointLight.shadow.bias = -0.001; // Adjust this value carefully to reduce shadow acne

    pointLight2.position.set(10, 10, 10);
    pointLight2.castShadow = true;
    pointLight2.shadow.mapSize.width = 1000;
    pointLight2.shadow.mapSize.height = 1000;
    pointLight2.shadow.camera.near = 0.5;
    pointLight2.shadow.camera.far = 500;
    pointLight2.shadow.bias = -0.001; // Adjust this value carefully to reduce shadow acne

    pointLight3.position.set(-10, 10, -10);
    pointLight3.castShadow = true;
    pointLight3.shadow.mapSize.width = 1000;
    pointLight3.shadow.mapSize.height = 1000;
    pointLight3.shadow.camera.near = 0.5;
    pointLight3.shadow.camera.far = 500;
    pointLight3.shadow.bias = -0.001; // Adjust this value carefully to reduce shadow acne

    pointLight4.position.set(10, 10, -10);
    pointLight4.castShadow = true;
    pointLight4.shadow.mapSize.width = 1000;
    pointLight4.shadow.mapSize.height = 1000;
    pointLight4.shadow.camera.near = 0.5;
    pointLight4.shadow.camera.far = 500;
    pointLight4.shadow.bias = -0.001; // Adjust this value carefully to reduce shadow acne

    var ambientLight = new THREE.AmbientLight(0x404040, 1); // soft white light
    scene.add(ambientLight);
    scene.add(centerLight);
    scene.add(pointLight);
    scene.add(pointLight2);
    scene.add(pointLight3);
    scene.add(pointLight4);

    var helper = new THREE.CameraHelper(centerLight.shadow.camera);
    //scene.add(helper);

}

function addObjectsPyramide() {

        var geometryPlane = new THREE.PlaneGeometry(20, 20, 4, 4);
        var materialPlane = new THREE.MeshPhongMaterial({
            color: 0x747570,
            side: THREE.DoubleSide
        });
        plane = new THREE.Mesh(geometryPlane, materialPlane);
        plane.position.set(0, -2.2, 0);
        plane.rotation.x = Math.PI / 2;
        plane.receiveShadow = true;
        scene.add(plane);
        var geometrySphere = new THREE.SphereGeometry(100, 100, 100);
        var sphereTexture = new THREE.ImageUtils.loadTexture('texture/sky.jpg');
        var materialSphere = new THREE.MeshBasicMaterial({ map: sphereTexture, transparent: true, side: THREE.DoubleSide });
        sphere = new THREE.Mesh(geometrySphere, materialSphere);
        sphere.position.set(0, 0, 0);
        scene.add(sphere);

        let deckcount = 0;
        let offsetX, offsetY, offsetZ;


        // Assuming the base layer is a 12x8 rectangle with the center 4 tiles removed
        /*for (let row = 0; row < 12; row++) {
            for (let col = 0; col < 8; col++) {
                // Skip the center 4 tiles
                if (row >= 3 && row <= 4 && col >= 4 && col <= 7) {
                    continue;
                }

                if (deckcount >= game.deck.length) {
                    break;
                }

                let tile = game.deck[deckcount++];
                var geometryCube = new THREE.BoxGeometry(0.8, 0.4, 0.9);
                var cubeTexture = new THREE.ImageUtils.loadTexture('texture/tiles/' + tile + '.png');
                var materialCube = [
                    new THREE.MeshBasicMaterial({ color: 0xe8c17a }), // Right side
                    new THREE.MeshBasicMaterial({ color: 0xe8c17a }), // Left side
                    new THREE.MeshBasicMaterial({ color: 0xe8c17a, map: cubeTexture }), // Top side
                    new THREE.MeshBasicMaterial({ color: 0xe8c17a }), // Bottom side
                    new THREE.MeshBasicMaterial({ color: 0xe8c17a }), // Front side
                    new THREE.MeshBasicMaterial({ color: 0xe8c17a })  // Back side
                ];

                offsetX = (col - 6) * tileWidth; // Centering the layout on the X-axis
                offsetY = 0; // Base layer is at the bottom
                offsetZ = (row - 4) * tileDepth; // Centering the layout on the Z-axis

                let cube = new THREE.Mesh(geometryCube, materialCube);
                cube.position.set(offsetX, offsetY, offsetZ);
                cube.textureName = tile;
                scene.add(cube);
                }
            }*/
        // Define the number of tiles in each subsequent layer

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
                        new THREE.MeshPhongMaterial({color: 0xe8c17a}), // Right side
                        new THREE.MeshPhongMaterial({color: 0xe8c17a}), // Left side
                        new THREE.MeshPhongMaterial({color: 0xe8c17a, map: cubeTexture, side: THREE.DoubleSide,}), // Top side
                        new THREE.MeshPhongMaterial({color: 0xe8c17a}), // Bottom side
                        new THREE.MeshPhongMaterial({color: 0xe8c17a}), // Front side
                        new THREE.MeshPhongMaterial({color: 0xe8c17a})  // Back side
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
        var centerLight = new THREE.PointLight(0xffffff, 2, 5);

        centerLight.position.set(0, 10, 0);
        centerLight.castShadow = true;
        centerLight.shadow.mapSize.width = 1000;
        centerLight.shadow.mapSize.height = 1000;
        centerLight.shadow.camera.near = 0.5;
        centerLight.shadow.camera.far = 500;
        centerLight.shadow.bias = -0.001;


        pointLight.position.set(-10, 10, 10   );
        pointLight.castShadow = true;
        pointLight.shadow.mapSize.width = 1000;
        pointLight.shadow.mapSize.height = 1000;
        pointLight.shadow.camera.near = 0.5;
        pointLight.shadow.camera.far = 500;
        pointLight.shadow.bias = -0.001; // Adjust this value carefully to reduce shadow acne

        pointLight2.position.set(10, 10, 10);
        pointLight2.castShadow = true;
        pointLight2.shadow.mapSize.width = 1000;
        pointLight2.shadow.mapSize.height = 1000;
        pointLight2.shadow.camera.near = 0.5;
        pointLight2.shadow.camera.far = 500;
        pointLight2.shadow.bias = -0.001; // Adjust this value carefully to reduce shadow acne

        pointLight3.position.set(-10, 10, -10);
        pointLight3.castShadow = true;
        pointLight3.shadow.mapSize.width = 1000;
        pointLight3.shadow.mapSize.height = 1000;
        pointLight3.shadow.camera.near = 0.5;
        pointLight3.shadow.camera.far = 500;
        pointLight3.shadow.bias = -0.001; // Adjust this value carefully to reduce shadow acne

        pointLight4.position.set(10, 10, -10);
        pointLight4.castShadow = true;
        pointLight4.shadow.mapSize.width = 1000;
        pointLight4.shadow.mapSize.height = 1000;
        pointLight4.shadow.camera.near = 0.5;
        pointLight4.shadow.camera.far = 500;
        pointLight4.shadow.bias = -0.001; // Adjust this value carefully to reduce shadow acne

        var ambientLight = new THREE.AmbientLight(0x404040, 1); // soft white light
        scene.add(ambientLight);
        scene.add(centerLight);
        scene.add(pointLight);
        scene.add(pointLight2);
        scene.add(pointLight3);
        scene.add(pointLight4);

        var helper = new THREE.CameraHelper(centerLight.shadow.camera);
        //scene.add(helper);

    }


