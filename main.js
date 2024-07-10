"use strict";

async function main() {
    //Setup
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        return;
    }
    twgl.setAttributePrefix("a_");
    const program = twgl.createProgramInfo(gl, [vs, fs]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(174/255, 198/255, 207/255, 1); 


    // Variáveis de Câmera
    let cameraPosition = [0, 20, 200];
    let up = [0, 1, 0];
    let cameraRadius = 100; 
    let cameraAngle = 0; 
    let sensitivity = 0.002; 
    let mouseDown = false;
    let lastMouseX = 0;
    canvas.addEventListener('mousedown', (event) => {
        mouseDown = true;
        lastMouseX = event.clientX;
    });
    canvas.addEventListener('mouseup', (event) => {
        mouseDown = false;
    });
    document.addEventListener('mousemove', (event) => {
        if (mouseDown) {
            const deltaX = event.clientX - lastMouseX;
            lastMouseX = event.clientX;
    
            cameraAngle -= deltaX * sensitivity;
        }
    });
    function updateCameraPosition() {
        cameraPosition[0] = cameraRadius * Math.sin(cameraAngle);
        cameraPosition[2] = cameraRadius * Math.cos(cameraAngle);
    }
    
    // Variáveis de geração
    let seed = 666;

    let numberOfTrees = document.getElementById('numberOfTrees').value;
    let sizeOfTress = document.getElementById('sizeOfTress').value;
    let numberOfAnimals = document.getElementById('numberOfAnimals').value;
    let sizeOfForest = document.getElementById('sizeOfForest').value;

    document.getElementById('generate').addEventListener('click', () => {
        numberOfTrees = document.getElementById('numberOfTrees').value;
        sizeOfTress = document.getElementById('sizeOfTress').value;
        numberOfAnimals = document.getElementById('numberOfAnimals').value;
        sizeOfForest = document.getElementById('sizeOfForest').value;
        ground = loadGround(gl, program, sizeOfForest);
    });

    document.getElementById('newSeed').addEventListener('click', () => {
        seed = Math.floor(Math.random() * 1000);
    });


    // Load Ground
    var ground = loadGround(gl, program, sizeOfForest);

    // Load tree1 
    const tree1File = 'Objects/PineTree.obj';
    const tree1 = await loadOBJ(gl, program, tree1File);

    // Load tree2
    const tree2File = 'Objects/Willow.obj';
    const tree2 = await loadOBJ(gl, program, tree2File);

    // Load tree3
    const tree3File = 'Objects/Tree.obj';
    const tree3 = await loadOBJ(gl, program, tree3File);

    // Load Rock
    const rockFile = 'Objects/Rock.obj';
    const rock = await loadOBJ(gl, program, rockFile);

    // Load Flowers
    const flowersFile = 'Objects/Flowers.obj';
    const flowers = await loadOBJ(gl, program, flowersFile);

    // Load Rabbit
    const rabbitFile = 'Objects/Rabbit.obj';
    const rabbit = await loadOBJ(gl, program, rabbitFile);

    // Load Horse
    const horseFile = 'Objects/Horse.obj';
    const horse = await loadOBJ(gl, program, horseFile);
            

    // Render
    requestAnimationFrame(render);

    function render() {
        updateCameraPosition();
        
        // Setup
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.clearColor(174/255, 198/255, 207/255, 1); 

        // Camera
        const zNear = 1;
        const zFar = 2000;
        const fieldOfViewRadians = degToRad(60);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

        // Atualizar a matriz de visualização com base na posição e direção da câmera
        const lookAt = m4.lookAt(cameraPosition, [0, 0, 0], up);
        const view = m4.inverse(lookAt);
    
        const sharedUniforms = {
            u_lightDirection: m4.normalize([-1, 8, 5]),
            u_view: view,
            u_projection: projection,
            u_viewWorldPosition: cameraPosition,
        };
        gl.useProgram(program.program);
        twgl.setUniforms(program, sharedUniforms);

        Math.seedrandom(seed);

        // Desenhar chao
        let u_world = m4.identity();
        u_world = m4.translate(u_world, 0, 0, 0);
        gl.bindVertexArray(ground.vao);
        twgl.setUniforms(program, {
            u_world,
        }, ground.material);
        twgl.drawBufferInfo(gl, ground.bufferInfo);


        // Desenhar as árvores
        const treePositions = [];
        const minDistanceBetweenTrees = 2;
        const min = -(sizeOfForest-20);
        const max = (sizeOfForest-20);
        const radius = sizeOfForest-5

        for (let i = 0; i < numberOfTrees; ++i) {
            let valid = false;
            let x, z;
            while (!valid) {
                const angle = Math.random() * 2 * Math.PI;
                const r = Math.sqrt(Math.random()) * radius;
                    
                x = r * Math.cos(angle);
                z = r * Math.sin(angle);

                valid = isPositionValid([x,z], treePositions, minDistanceBetweenTrees);
            };
            treePositions.push([x, z]);

            let y;
            let tree;
            if (Math.random() < 0.5) {
                tree = tree1;
                y = 1.65
            }
            else if (Math.random() < 0.5) {
                tree = tree2;
                y = 1.4
            }
            else {
                tree = tree3;
                y = 1.5
            }

            const rotation = m4.yRotation(Math.random() * Math.PI * 2);
        
            let u_world = m4.identity();
            u_world = m4.multiply(u_world, rotation);
            u_world = m4.translate(u_world, ...tree.objOffset);
            u_world = m4.translate(u_world, x, y, z);
            u_world = m4.scale(u_world, sizeOfTress,sizeOfTress,sizeOfTress);
            
            for (const { bufferInfo, vao, material } of tree.parts) {
                gl.bindVertexArray(vao);
                twgl.setUniforms(program, {
                    u_world,
                }, material);
        
                twgl.drawBufferInfo(gl, bufferInfo);
            }
        }

        // Desenhar as pedras
        for (let i = 0; i < 50; ++i) {
            let x, z;
            x = Math.random() * (max - min) + min;
            z = Math.random() * (max - min) + min;
        
            let u_world = m4.identity();
            u_world = m4.translate(u_world, ...rock.objOffset);
            u_world = m4.translate(u_world, x, 0.23, z);
        
            for (const { bufferInfo, vao, material } of rock.parts) {
                gl.bindVertexArray(vao);
                twgl.setUniforms(program, {
                    u_world,
                }, material);
        
                twgl.drawBufferInfo(gl, bufferInfo);
            }
        }

        // Desenhar as flores
        for (let i = 0; i < 50; ++i) {
            let x, z;
            x = Math.random() * (max - min) + min;
            z = Math.random() * (max - min) + min;
        
            let u_world = m4.identity();
            u_world = m4.translate(u_world, ...flowers.objOffset);
            u_world = m4.translate(u_world, x, 0.23, z);
        
            for (const { bufferInfo, vao, material } of flowers.parts) {
                gl.bindVertexArray(vao);
                twgl.setUniforms(program, {
                    u_world,
                }, material);
        
                twgl.drawBufferInfo(gl, bufferInfo);
            }
        }

        // Desenhar animais
        for (let i = 0; i < numberOfAnimals; ++i) {
            let x, y, z, scale;
            x = Math.random() * (max - min) + min;
            z = Math.random() * (max - min) + min;
            
            let animal 
            if (Math.random() < 0.5) {
                animal = rabbit;
                y = 0.5
                scale = 3
            }
            else {
                animal = horse;
                y = 0.7
                scale = 1
            }

            const rotation = m4.yRotation(Math.random() * Math.PI * 2);

            let u_world = m4.identity();
            u_world = m4.multiply(u_world, rotation);
            u_world = m4.translate(u_world, ...animal.objOffset);
            u_world = m4.translate(u_world, x, y, z);
            u_world = m4.scale(u_world, scale, scale, scale);
        
            for (const { bufferInfo, vao, material } of animal.parts) {
                gl.bindVertexArray(vao);
                twgl.setUniforms(program, {
                    u_world,
                }, material);
        
                twgl.drawBufferInfo(gl, bufferInfo);
            }
        }
        requestAnimationFrame(render);
    }
    
    
}

function isPositionValid(newPos, positions, minDistance) {
    for (let pos of positions) {
        const dx = newPos[0] - pos[0];
        const dz = newPos[2] - pos[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < minDistance) {
            return false;
        }
    }
    return true;
}
function degToRad(deg) {
    return deg * Math.PI / 180;
}

main();
