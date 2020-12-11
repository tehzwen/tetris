var state = {};

// This function loads on window load, uses async functions to load the scene then try to render it
window.onload = async () => {
    try {
        await parseSceneFile("./statefiles/scene.json", state);
        main();
    } catch (err) {
        console.error(err);
        alert(err);
    }
}

/**
 * Main function that gets called when the DOM loads
 */
function main() {
    //document.body.appendChild( stats.dom );
    const canvas = document.querySelector("#glCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize the WebGL2 context
    var gl = canvas.getContext("webgl2");

    // Only continue if WebGL2 is available and working
    if (gl === null) {
        printError('WebGL 2 not supported by your browser',
            'Check to see you are using a <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API#WebGL_2_2" class="alert-link">modern browser</a>.');
        return;
    }

    /**
     * Sample vertex and fragment shader here that simply applies MVP matrix 
     * and diffuse colour of each object
     */
    const vertShaderSample =
        `#version 300 es
        in vec3 aPosition;
        in vec3 aNormal;
        in vec2 aUV;

        uniform mat4 uProjectionMatrix;
        uniform mat4 uViewMatrix;
        uniform mat4 uModelMatrix;
        uniform mat4 normalMatrix;
        uniform vec3 uCameraPosition;

        out vec2 oUV;
        out vec3 oFragPosition;
        out vec3 oNormal;
        out vec3 normalInterp;
        out vec3 oCameraPosition;

        void main() {
            // Postion of the fragment in world space
            gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
            normalInterp = normalize((normalMatrix * vec4(aNormal, 1.0)).xyz);
            oUV = vec2(-aUV[0], aUV[1]);
            oFragPosition = (uModelMatrix * vec4(aPosition, 1.0)).xyz;
            oNormal = aNormal;
            oCameraPosition = uCameraPosition;
        }
        `;

    const fragShaderSample =
        `#version 300 es
        #define MAX_LIGHTS 20
        precision highp float;

        struct PointLight {
            vec3 position;
            vec3 colour;
            float strength;
        };

        in vec2 oUV;
        in vec3 normalInterp;
        in vec3 oCameraPosition;
        in vec3 oFragPosition;

        uniform vec3 diffuseVal;
        uniform vec3 ambientVal;
        uniform vec3 specularVal;
        uniform float alpha;
        uniform float nVal;
        uniform int samplerExists;
        uniform sampler2D uTexture;
        uniform int numLights;
        uniform PointLight[MAX_LIGHTS] pointLights;

        out vec4 fragColor;


        vec3 CalculatePointLight(PointLight light, vec3 normal, vec3 diffuseValue) {
            vec3 ambient = ambientVal * light.colour * diffuseValue;
            vec3 lightDir = normalize(light.position - oFragPosition);
            float distance = distance(light.position, oFragPosition);
            float diff = max(dot(normal, lightDir), 0.0);
            vec3 diffuse = diffuseValue * light.colour * diff;

            vec3 viewDir = normalize(oCameraPosition - oFragPosition);
            vec3 reflectDir = reflect(-lightDir, normal);  
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), nVal);
            vec3 specular = light.colour * (spec * specularVal);  

            float attenuation = light.strength / 1.0 + 0.01 * distance + 0.005 * (distance * distance);

            return attenuation * (ambient + diffuse + specular);
        }


        void main() {
            vec3 total = vec3(0,0,0);

            for (int i = 0; i < numLights; i++) {
                if (samplerExists == 1) {
                    vec3 textureColour = texture(uTexture, oUV).rgb;
                    vec3 diffuseValue = diffuseVal * textureColour;
                    total += CalculatePointLight(pointLights[i], normalInterp, diffuseValue);
    
                } else {
                    // fragColor = vec4(diffuseVal, alpha);
                    total += CalculatePointLight(pointLights[i], normalInterp, diffuseVal);
                }
            }

            fragColor = vec4(total, alpha);
        }
        `;

    /**
     * Initialize state with new values (some of these you can replace/change)
     */
    state = {
        ...state, // this just takes what was already in state and applies it here again
        gl,
        vertShaderSample,
        fragShaderSample,
        gamePieces: [],
        canvas: canvas,
        objectCount: 0,
        lightIndices: [],
        keyboard: {},
        mouse: { sensitivity: 0.2 },
        gameStarted: false,
        samplerExists: 0,
        samplerNormExists: 0,
        constVal: 1
    };

    state.numLights = state.pointLights.length;

    //iterate through the level's objects and add them
    state.loadObjects.map(async (object) => {
        if (object.type === "mesh") {
            let mesh = await parseOBJFileToJSON(object.model);
            createMesh(mesh, object);
        } else if (object.type === "cube") {
            let tempCube = new Cube(gl, object);
            tempCube.vertShader = vertShaderSample;
            tempCube.fragShader = fragShaderSample;
            tempCube.setup();
            addObjectToScene(state, tempCube);
        } else if (object.type === "plane") {
            let tempPlane = new Plane(gl, object);
            tempPlane.vertShader = vertShaderSample;
            tempPlane.fragShader = fragShaderSample;
            tempPlane.setup();
            addObjectToScene(state, tempPlane);
        } else if (object.type.includes("Custom")) {
            let tempObject = new CustomObject(gl, object);
            tempObject.vertShader = vertShaderSample;
            tempObject.fragShader = fragShaderSample;
            tempObject.setup();
            addObjectToScene(state, tempObject);
        }
    })
    startRendering(gl, state); // now that scene is setup, start rendering it
    // myPlayer.onCollide = (object) => {
    //     console.log("I ran into", object);
    // };
    // state.player = myPlayer;
}

/**
 * 
 * @param {object - contains vertex, normal, uv information for the mesh to be made} mesh 
 * @param {object - the game object that will use the mesh information} object 
 * @purpose - Helper function called as a callback function when the mesh is done loading for the object
 */
function createMesh(mesh, object) {
    let testModel = new Model(state.gl, object, mesh);
    testModel.vertShader = state.vertShaderSample;
    testModel.fragShader = state.fragShaderSample;
    testModel.setup();
    addObjectToScene(state, testModel);
}

/**
 * 
 * @param {gl context} gl 
 * @param {object - object containing scene values} state 
 * @purpose - Calls the drawscene per frame
 */
function startRendering(gl, state) {
    // A variable for keeping track of time between frames
    var then = 0.0;

    // This function is called when we want to render a frame to the canvas
    function render(now) {

        let newNow = now * 0.001; // convert to seconds
        const deltaTime = newNow - then;
        then = newNow;

        state.time = now / 1000;
        state.deltaTime = deltaTime;

        //wait until the scene is completely loaded to render it
        if (state.numberOfObjectsToLoad <= state.objects.length) {
            if (!state.gameStarted) {
                startGame(state);
                state.gameStarted = true;
                // let loadingPage = document.getElementById("loadingPage");
                loadingPage.remove();
            }
            // Draw our scene
            drawScene(gl, deltaTime, state);

            gameLoop(state, deltaTime); //constantly call our game loop
            drawScene(gl, deltaTime, state);

        }


        // Request another frame when this one is done
        requestAnimationFrame(render);
    }
    // Draw the scene
    requestAnimationFrame(render);
}

/**
 * 
 * @param {gl context} gl 
 * @param {float - time from now-last} deltaTime 
 * @param {object - contains the state for the scene} state 
 * @purpose Iterate through game objects and render the objects aswell as update uniforms
 */
function drawScene(gl, deltaTime, state) {
    gl.clearColor(state.settings.backgroundColor[0], state.settings.backgroundColor[1], state.settings.backgroundColor[2], 1.0); // Here we are drawing the background color that is saved in our state
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.disable(gl.CULL_FACE); // Cull the backface of our objects to be more efficient
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.clearDepth(1.0); // Clear everything
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let mainLight = state.pointLights[0];

    // sort objects by nearness to camera
    let sorted = state.objects.sort((a, b) => {
        let aCentroidFour = vec4.fromValues(a.centroid[0], a.centroid[1], a.centroid[2], 1.0);
        vec4.transformMat4(aCentroidFour, aCentroidFour, a.model.modelMatrix);

        let bCentroidFour = vec4.fromValues(b.centroid[0], b.centroid[1], b.centroid[2], 1.0);
        vec4.transformMat4(bCentroidFour, bCentroidFour, b.model.modelMatrix);

        return vec3.distance(state.camera.position, vec3.fromValues(aCentroidFour[0], aCentroidFour[1], aCentroidFour[2]))
            >= vec3.distance(state.camera.position, vec3.fromValues(bCentroidFour[0], bCentroidFour[1], bCentroidFour[2])) ? -1 : 1;
    });

    // iterate over each object and render them
    sorted.forEach((object) => {
        //check if we should even render this or not

        if (object.loaded && object.render) {
            gl.useProgram(object.programInfo.program);
            {

                if (object.material.alpha < 1.0) {
                    gl.disable(gl.CULL_FACE);
                    gl.disable(gl.DEPTH_TEST);
                } else {
                    gl.enable(gl.CULL_FACE);
                    gl.enable(gl.DEPTH_TEST);
                }

                // Projection Matrix ....
                let projectionMatrix = mat4.create();
                let fovy = 60.0 * Math.PI / 180.0; // Vertical field of view in radians
                let aspect = state.canvas.clientWidth / state.canvas.clientHeight; // Aspect ratio of the canvas
                let near = 0.1; // Near clipping plane
                let far = 1000000.0; // Far clipping plane

                mat4.perspective(projectionMatrix, fovy, aspect, near, far);
                gl.uniformMatrix4fv(object.programInfo.uniformLocations.projection, false, projectionMatrix);
                state.projectionMatrix = projectionMatrix;

                // View Matrix & Camera ....
                let viewMatrix = mat4.create();
                let camFront = vec3.fromValues(0, 0, 0);
                vec3.add(camFront, state.camera.position, state.camera.front);
                mat4.lookAt(
                    viewMatrix,
                    state.camera.position,
                    camFront,
                    state.camera.up,
                );
                gl.uniformMatrix4fv(object.programInfo.uniformLocations.view, false, viewMatrix);
                gl.uniform3fv(object.programInfo.uniformLocations.cameraPosition, state.camera.position);
                state.viewMatrix = viewMatrix;

                // Model Matrix ....
                let modelMatrix = mat4.create();
                let negCentroid = vec3.fromValues(0.0, 0.0, 0.0);
                vec3.negate(negCentroid, object.centroid);
                mat4.translate(modelMatrix, modelMatrix, object.model.position);
                mat4.translate(modelMatrix, modelMatrix, object.centroid);
                mat4.mul(modelMatrix, modelMatrix, object.model.rotation);
                mat4.scale(modelMatrix, modelMatrix, object.model.scale);
                mat4.translate(modelMatrix, modelMatrix, negCentroid);

                if (object.parent) {
                    let parent = getObject(state, object.parent);
                    if (parent.model && parent.model.modelMatrix) {
                        mat4.multiply(modelMatrix, parent.model.modelMatrix, modelMatrix);
                    }
                }

                object.model.modelMatrix = modelMatrix;
                if (object.model.mode !== "static") {
                    object.updateBoundingBox();
                }
                gl.uniformMatrix4fv(object.programInfo.uniformLocations.model, false, modelMatrix);

                //check collisions
                // get state.objects that are collidable state.objects.filter((object) => {if (object.collide) return object})
                // COLLISION
                // if (object we collided with.onCollide) colObject.onCollide(object)
                // if (thisobject.onCollide) object.onCollide(colObject)


                // Normal Matrix ....
                let normalMatrix = mat4.create();
                mat4.invert(normalMatrix, modelMatrix);
                mat4.transpose(normalMatrix, normalMatrix);
                gl.uniformMatrix4fv(object.programInfo.uniformLocations.normalMatrix, false, normalMatrix);

                // Object material
                gl.uniform3fv(object.programInfo.uniformLocations.diffuseVal, object.material.diffuse);
                gl.uniform3fv(object.programInfo.uniformLocations.ambientVal, object.material.ambient);
                gl.uniform3fv(object.programInfo.uniformLocations.specularVal, object.material.specular);
                gl.uniform1f(object.programInfo.uniformLocations.nVal, object.material.n);
                gl.uniform1f(object.programInfo.uniformLocations.alpha, object.material.alpha);

                gl.uniform3fv(gl.getUniformLocation(object.programInfo.program, 'mainLight.position'), mainLight.position);
                gl.uniform3fv(gl.getUniformLocation(object.programInfo.program, 'mainLight.colour'), mainLight.colour);
                gl.uniform1f(gl.getUniformLocation(object.programInfo.program, 'mainLight.strength'), mainLight.strength);


                if (state.pointLights.length > 0) {
                    gl.uniform1i(object.programInfo.uniformLocations.numLights, state.pointLights.length);

                    for (let i = 0; i < state.pointLights.length; i++) {
                        gl.uniform3fv(gl.getUniformLocation(object.programInfo.program, 'pointLights[' + i + '].position'), state.pointLights[i].position);
                        gl.uniform3fv(gl.getUniformLocation(object.programInfo.program, 'pointLights[' + i + '].colour'), state.pointLights[i].colour);
                        gl.uniform1f(gl.getUniformLocation(object.programInfo.program, 'pointLights[' + i + '].strength'), state.pointLights[i].strength);
                    }
                    // this currently only sends the first light to the shader, how might we do multiple? :)

                }


                {
                    // Bind the buffer we want to draw
                    gl.bindVertexArray(object.buffers.vao);

                    //check for diffuse texture and apply it
                    if (object.material.shaderType === 3) {
                        state.samplerExists = 1;
                        gl.activeTexture(gl.TEXTURE0);
                        gl.uniform1i(object.programInfo.uniformLocations.samplerExists, state.samplerExists);
                        gl.uniform1i(object.programInfo.uniformLocations.sampler, 0);
                        gl.bindTexture(gl.TEXTURE_2D, object.model.texture);
                    } else {
                        gl.activeTexture(gl.TEXTURE0);
                        state.samplerExists = 0;
                        gl.uniform1i(object.programInfo.uniformLocations.samplerExists, state.samplerExists);
                    }

                    //check for normal texture and apply it
                    if (object.material.shaderType === 4) {
                        state.samplerNormExists = 1;
                        gl.activeTexture(gl.TEXTURE1);
                        gl.uniform1i(object.programInfo.uniformLocations.normalSamplerExists, state.samplerNormExists);
                        gl.uniform1i(object.programInfo.uniformLocations.normalSampler, 1);
                        gl.bindTexture(gl.TEXTURE_2D, object.model.textureNorm);
                    } else {
                        gl.activeTexture(gl.TEXTURE1);
                        state.samplerNormExists = 0;
                        gl.uniform1i(object.programInfo.uniformLocations.normalSamplerExists, state.samplerNormExists);
                    }

                    // Draw the object
                    const offset = 0; // Number of elements to skip before starting

                    //if its a mesh then we don't use an index buffer and use drawArrays instead of drawElements
                    if (object.type === "mesh" || object.type === "meshCustom") {
                        gl.drawArrays(gl.TRIANGLES, offset, object.buffers.numVertices / 3);
                    } else {
                        gl.drawElements(gl.TRIANGLES, object.buffers.numVertices, gl.UNSIGNED_SHORT, offset);
                    }
                }
            }
        }
    });
}