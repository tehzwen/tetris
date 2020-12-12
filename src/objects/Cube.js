class Cube {
    constructor(glContext, object) {
        this.state = {};
        this.gl = glContext;
        this.name = object.name;
        this.parent = object.parent;
        this.type = "cube";
        this.loaded = false;
        this.mode = object.mode;
        this.render = object.render !== undefined ? object.render : true;
        this.initialTransform = { position: object.position, scale: object.scale, rotation: object.rotation };
        this.material = { ...object.material };
        this.model = {
            vertices: [
                [0.0, 0.0, 0.0],
                [0.0, 0.5, 0.0],
                [0.5, 0.5, 0.0],
                [0.5, 0.0, 0.0],

                [0.0, 0.0, 0.5],
                [0.0, 0.5, 0.5],
                [0.5, 0.5, 0.5],
                [0.5, 0.0, 0.5],

                [0.0, 0.5, 0.5],
                [0.0, 0.5, 0.0],
                [0.5, 0.5, 0.0],
                [0.5, 0.5, 0.5],

                [0.0, 0.0, 0.5],
                [0.5, 0.0, 0.5],
                [0.5, 0.0, 0.0],
                [0.0, 0.0, 0.0],

                [0.5, 0.0, 0.5],
                [0.5, 0.0, 0.0],
                [0.5, 0.5, 0.5],
                [0.5, 0.5, 0.0],

                [0.0, 0.0, 0.5],
                [0.0, 0.0, 0.0],
                [0.0, 0.5, 0.5],
                [0.0, 0.5, 0.0]
            ],
            triangles: [
                //front face
                2, 0, 1, 3, 0, 2,
                //backface
                5, 4, 6, 6, 4, 7,
                //top face
                10, 9, 8, 10, 8, 11,
                //bottom face
                13, 12, 14, 14, 12, 15,
                //side
                18, 16, 17, 18, 17, 19,
                //side
                22, 21, 20, 23, 21, 22,
            ],
            uvs: [
                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,

                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,

                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,

                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,

                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0,

                0.0, 0.0,
                1.0, 0.0,
                1.0, 1.0,
                0.0, 1.0
            ],
            normals: [
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,
                0.0, 0.0, -1.0,

                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,
                0.0, 0.0, 1.0,

                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 1.0, 0.0,

                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,
                0.0, -1.0, 0.0,

                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,
                1.0, 0.0, 0.0,

                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0,
                -1.0, 0.0, 0.0
            ],
            bitangents: [
                0, -1, 0,
                0, -1, 0,
                0, -1, 0,
                0, -1, 0, // Front

                0, -1, 0,
                0, -1, 0,
                0, -1, 0,
                0, -1, 0, // Back

                0, -1, 0,
                0, -1, 0,
                0, -1, 0,
                0, -1, 0, // Right

                0, -1, 0,
                0, -1, 0,
                0, -1, 0,
                0, -1, 0, // Left

                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1, // Top

                0, 0, -1,
                0, 0, -1,
                0, 0, -1,
                0, 0, -1, // Bot
            ],
            diffuseTexture: object.diffuseTexture ? object.diffuseTexture : "default.png",
            normalTexture: object.normalTexture ? object.normalTexture : "defaultNorm.png",
            texture: object.diffuseTexture ? getTextures(glContext, object.diffuseTexture) : null,
            textureNorm: object.normalTexture ? getTextures(glContext, object.normalTexture) : null,
            buffers: null,
            modelMatrix: mat4.create(),
            position: vec3.fromValues(0.0, 0.0, 0.0),
            rotation: mat4.create(),
            scale: vec3.fromValues(1.0, 1.0, 1.0),
            programInfo: null,
            fragShader: "",
            vertShader: "",
            mode: object.mode ? object.mode : "static"
        };
    }

    rotate(axis, angle) {
        if (axis === 'x') {
            mat4.rotateX(this.model.rotation, this.model.rotation, angle)
        } else if (axis == 'y') {
            mat4.rotateY(this.model.rotation, this.model.rotation, angle)
        } else if (axis == 'z') {
            mat4.rotateZ(this.model.rotation, this.model.rotation, angle)
        }
    }

    scale(scaleVec) {
        //model scale
        let xVal = this.model.scale[0];
        let yVal = this.model.scale[1];
        let zVal = this.model.scale[2];


        xVal *= scaleVec[0];
        yVal *= scaleVec[1];
        zVal *= scaleVec[2];

        //need to scale bounding box
        this.model.scale = vec3.fromValues(xVal, yVal, zVal);
    }

    translate(translateVec) {
        vec3.add(this.model.position, this.model.position, vec3.fromValues(translateVec[0], translateVec[1], translateVec[2]));
    }

    updateBoundingBox() {
        if (!this.boundingBox) {
            return;
        }
        this.boundingBox = checkBoundingBoxChange(this.boundingBox, this.model.modelMatrix);
    }

    lightingShader() {
        const shaderProgram = initShaderProgram(this.gl, this.vertShader, this.fragShader);
        // Collect all the info needed to use the shader program.
        const programInfo = {
            // The actual shader program
            program: shaderProgram,
            // The attribute locations. WebGL will use there to hook up the buffers to the shader program.
            // NOTE: it may be wise to check if these calls fail by seeing that the returned location is not -1.
            attribLocations: {
                vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aPosition'),
                vertexNormal: this.gl.getAttribLocation(shaderProgram, 'aNormal'),
                vertexUV: this.gl.getAttribLocation(shaderProgram, 'aUV'),
                // vertexBitangent: this.gl.getAttribLocation(shaderProgram, 'aVertBitang')
            },
            uniformLocations: {
                projection: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                view: this.gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
                model: this.gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
                normalMatrix: this.gl.getUniformLocation(shaderProgram, 'normalMatrix'),
                diffuseVal: this.gl.getUniformLocation(shaderProgram, 'diffuseVal'),
                ambientVal: this.gl.getUniformLocation(shaderProgram, 'ambientVal'),
                specularVal: this.gl.getUniformLocation(shaderProgram, 'specularVal'),
                nVal: this.gl.getUniformLocation(shaderProgram, 'nVal'),
                alpha: this.gl.getUniformLocation(shaderProgram, 'alpha'),
                cameraPosition: this.gl.getUniformLocation(shaderProgram, 'uCameraPosition'),
                numLights: this.gl.getUniformLocation(shaderProgram, 'numLights'),
                // lightPositions: this.gl.getUniformLocation(shaderProgram, 'uLightPositions'),
                // lightColours: this.gl.getUniformLocation(shaderProgram, 'uLightColours'),
                // lightStrengths: this.gl.getUniformLocation(shaderProgram, 'uLightStrengths'),
                samplerExists: this.gl.getUniformLocation(shaderProgram, "samplerExists"),
                sampler: this.gl.getUniformLocation(shaderProgram, 'uTexture'),
                // normalSamplerExists: this.gl.getUniformLocation(shaderProgram, 'uTextureNormExists'),
                // normalSampler: this.gl.getUniformLocation(shaderProgram, 'uTextureNorm')
            },
        };

        shaderValuesErrorCheck(programInfo);
        this.programInfo = programInfo;
    }

    initBuffers() {
        //create vertices, normal and indicies arrays
        const positions = new Float32Array(this.model.vertices.flat());
        const normals = new Float32Array(this.model.normals.flat());
        const indices = new Uint16Array(this.model.triangles);
        const textureCoords = new Float32Array(this.model.uvs);
        // const bitangents = new Float32Array(this.model.bitangents);

        var vertexArrayObject = this.gl.createVertexArray();

        this.gl.bindVertexArray(vertexArrayObject);

        this.buffers = {
            vao: vertexArrayObject,
            attributes: {
                position: initPositionAttribute(this.gl, this.programInfo, positions),
                normal: initNormalAttribute(this.gl, this.programInfo, normals),
                uv: initTextureCoords(this.gl, this.programInfo, textureCoords),
                // bitangents: initBitangentBuffer(this.gl, this.programInfo, bitangents)
            },
            indicies: initIndexBuffer(this.gl, indices),
            numVertices: indices.length
        }

        this.loaded = true;
    }

    applyForce(dir, magnitude) {
        this.force = {
            dir,
            magnitude
        }
    }

    delete() {
        Object.keys(this.buffers.attributes).forEach((key) => {
            this.gl.deleteBuffer(this.buffers.attributes[key]);
        })
        this.gl.deleteBuffer(this.buffers.indicies);
    }

    setup() {
        this.centroid = calculateCentroid(this.model.vertices.flat());
        this.lightingShader();
        this.scale(this.initialTransform.scale);
        this.translate(this.initialTransform.position);
        this.model.rotation = this.initialTransform.rotation;

        // get initial bounding box
        this.originalBoundingBox = getBoundingBox(this.model.vertices);
        this.boundingBox = { ...this.originalBoundingBox };

        let modelMatrix = mat4.create();
        let negCentroid = vec3.fromValues(0.0, 0.0, 0.0);
        vec3.negate(negCentroid, this.centroid);
        mat4.translate(modelMatrix, modelMatrix, this.model.position);
        mat4.translate(modelMatrix, modelMatrix, this.centroid);
        mat4.mul(modelMatrix, modelMatrix, this.model.rotation);
        mat4.scale(modelMatrix, modelMatrix, this.model.scale);
        mat4.translate(modelMatrix, modelMatrix, negCentroid);

        if (this.parent) {
            let parent = getObject(state, this.parent);
            if (parent.model && parent.model.modelMatrix) {
                mat4.multiply(modelMatrix, parent.model.modelMatrix, modelMatrix);
            }
        }

        let boundingMax = vec4.fromValues(this.boundingBox.max[0], this.boundingBox.max[1], this.boundingBox.max[2], 1.0);
        let boundingMin = vec4.fromValues(this.boundingBox.min[0], this.boundingBox.min[1], this.boundingBox.min[2], 1.0);

        vec4.transformMat4(boundingMax, boundingMax, modelMatrix);
        vec4.transformMat4(boundingMin, boundingMin, modelMatrix);

        this.boundingBox.max = vec3.fromValues(boundingMax[0], boundingMax[1], boundingMax[2]);
        this.boundingBox.min = vec3.fromValues(boundingMin[0], boundingMin[1], boundingMin[2]);

        this.initBuffers();
    }
}