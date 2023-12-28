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


class Game {
    constructor() {
        this.deck = [];
        this.board = [];
    }

    // Initialize the game or reset the game to its initial state
    init() {
        this.deck = this.createDeck();
        this.shuffleDeck();
        //this.board = this.createBoard();
    }

    // Create a deck of cards
    createDeck() {
        let deck = [];
        // In Mahjongg, there are 144 tiles, with 4 duplicates of each kind.
        // Here, we'll just use numbers for simplicity.
        for (let i = 1; i <= 36; i++) {
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
        this.updateScene();
        //this.updateCubeTextures();
    }

    updateCubeTextures() {
        const cubes = scene.children.filter(obj => obj.name === 'cube');
        let deck1 = this.deck;
        cubes.forEach(cube => {
            const newTexture = deck1.pop();
            cube.material[2].map = new THREE.ImageUtils.loadTexture('texture/tiles/' + newTexture + '.png');
            console.log(cube.textureName)
            cube.textureName = newTexture;
            console.log(cube.textureName)
        });
    }
    updateScene() {
        // Clear existing cubes from the scene
        scene.children.forEach((child) => {
            if (child.isMesh || child instanceof  THREE.PointLight
                || child instanceof  THREE.AmbientLight || child instanceof  THREE.CameraHelper) {
                scene.remove(child);
            }
        });
        addObjects();
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
    const index2 = game.deck.findIndex((item) => item === cube2.textureName);

    if (index1 !== -1) game.deck.splice(index1, 1);
    if (index2 !== -1) game.deck.splice(index2, 1);

    console.log(game.deck.length);
}




function areCubesAboveRemovedCubes(cube1, cube2) {
    let cubesAbove = false;

    // Iterate through all objects in the scene
    scene.traverse((object) => {
        if (object.isMesh && object !== cube1 && object !== cube2) {
            // Check if the object is in the same column and above the removed cubes
            const sameColumn = Math.abs(object.position.x - cube1.position.x) < 0.5; // Adjust the threshold as needed
            const aboveRemovedCubes = object.position.y > Math.max(cube1.position.y, cube2.position.y);

            if (sameColumn && aboveRemovedCubes) {
                cubesAbove = true;
                console.log("cubes above");
            }
        }
    });

    return cubesAbove;
}



function areCubesAroundRemovedCubes(cube1, cube2) {
    let cube1Free = false;
    let cube2Free = false;

    // Iterate through all objects in the scene
    scene.traverse((object) => {
        if (object.isMesh && object !== cube1 && object !== cube2) {
            const distanceX = Math.abs(object.position.x - cube1.position.x);

            // Check for cube1
            if (distanceX === tileWidth) {
                if (object.position.z === cube1.position.z) {
                    if (object.position.x < cube1.position.x) {
                        cube1Free = true; // Free on the left side
                    } else {
                        cube2Free = true; // Since cube2 is to the right of cube1
                    }
                }
            }

            // Check for cube2 (mirror logic of cube1)
            if (distanceX === tileWidth) {
                if (object.position.z === cube2.position.z) {
                    if (object.position.x > cube2.position.x) {
                        cube2Free = true; // Free on the right side
                    } else {
                        cube1Free = true; // Since cube1 is to the left of cube2
                    }
                }
            }
        }
    });

    return cube1Free && cube2Free;
}

function simulateGame(scene) {
    let allTilesProcessed = false;
    // Keep trying until all tiles are processed
    console.log("in")
    while(!allTilesProcessed){
        scene.traverse((object) => {
            if (object.isMesh ) {
                texture1= object.textureName
                scene.traverse((object2) => { if(object!=object2 && texture1 == object2.textureName){
                    texture2= object2.textureName;
                    console.log("som dnu");
                    //checkIfSelectedCubesCanDisappear(object,object2);

                }})
            }
        });
        allTilesProcessed=true;


/*
        // If all tiles are processed, exit the loop
        if (allTilesProcessed) {
            break;
        } else {
            // Reset the game and try again
            game.init();
            scene.children = []; // Clear the scene
            addObjects(); // Add cubes to the scene
            console.log("creating new board");
        }*/
    }
    console.log("all files proccessed");
}


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


    console.log("pos1x" + cube1.position.x);
    console.log("pos1y" + cube1.position.y);
    console.log("pos1z" + cube1.position.z);

    console.log("pos2x" + cube2.position.x);
    console.log("pos2y" + cube2.position.y);
    console.log("pos2z" + cube2.position.z);

    const cubesAbove = areCubesAboveRemovedCubes(cube1, cube2);
    const cubesAround = areCubesAroundRemovedCubes(cube1,cube2);
    //let cubesAround = false;
    if (!cubesAbove && !cubesAround) {
        // There are no cubes above the removed cubes
        console.log("There are no cubes above the removed cubes.");
        removeCubes(cube1,cube2);
    } else {
        // There are cubes above the removed cubes
        console.log("There are cubes above or around the removed cubes.");
    }


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
function init() {
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
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    addObjects();
    simulateGame(scene);
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
    var geometryPlane = new THREE.PlaneGeometry(10, 10, 4, 4);
    var materialPlane = new THREE.MeshBasicMaterial({
        color: 0x747570,
        side: THREE.DoubleSide
    });
    plane = new THREE.Mesh(geometryPlane, materialPlane);
    plane.position.set(0, -2.2, 0);
    plane.rotation.x = Math.PI / 2;
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
        {rows: 9,cols: 7, skipCenter: true, centerRows: [2,3], centerCols:[3,4] },
        // Second layer dimensions
        { rows: 8, cols: 6, skipCenter: true, centerRows: [2, 3], centerCols: [4, 5, 6, 7] },
        // Third layer dimensions
        { rows: 5, cols: 3, skipCenter: false },
        // Fourth layer dimensions
        { rows: 2, cols: 2, skipCenter: false },
        // Fifth layer (single tile on top)
        //{ rows: 1, cols: 1, skipCenter: false }
    ];

// The height of each layer, assuming each tile is offset upwards by the height of the tile below it
    let layerHeight = tileHeight;

    layerDefinitions.forEach((layerDef, layerIndex) => {
        for (let row = 0; row < layerDef.rows; row++) {
            for (let col = 0; col < layerDef.cols; col++) {
                // Skip the center if required by the current layer definition
                if (layerDef.skipCenter && layerDef.centerRows.includes(row) && layerDef.centerCols.includes(col)) {
                    continue;
                }

                if (deckcount >= game.deck.length) {
                    break;
                }

                let tile = game.deck[deckcount];
                deckcount++;
                var geometryCube = new THREE.BoxGeometry(tileWidth, tileHeight, tileDepth);
                var cubeTexture = new THREE.ImageUtils.loadTexture('texture/tiles/' + tile + '.png');
                var materialCube = [
                    new THREE.MeshBasicMaterial({ color: 0xe8c17a }), // Right side
                    new THREE.MeshBasicMaterial({ color: 0xe8c17a }), // Left side
                    new THREE.MeshBasicMaterial({ color: 0xe8c17a, map: cubeTexture }), // Top side
                    new THREE.MeshBasicMaterial({ color: 0xe8c17a }), // Bottom side
                    new THREE.MeshBasicMaterial({ color: 0xe8c17a }), // Front side
                    new THREE.MeshBasicMaterial({ color: 0xe8c17a })  // Back side

                ];

                // Calculate the offsets for positioning each layer
                offsetX = ((col - (layerDef.cols / 2)) + 0.5) * tileWidth;
                offsetY = layerHeight * (layerIndex + 1); // Stack layers on top of each other
                offsetZ = ((row - (layerDef.rows / 2)) + 0.5) * tileDepth;

                let cube = new THREE.Mesh(geometryCube, materialCube);
                cube.position.set(offsetX, offsetY, offsetZ);
                cube.textureName = tile;
                cube.name = 'cube';
                scene.add(cube);

            }
        }
    });




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



init();
render();
