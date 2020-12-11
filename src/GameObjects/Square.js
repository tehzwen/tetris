class Square extends GamePiece {
    constructor(position, boardPosition) {
        super(position, boardPosition);
        this.objects = [];
        this.boardPosition = boardPosition;

        const DEFAULT_MAT = {
            diffuse: [
                1,
                0,
                0
            ],
            ambient: [
                0.3,
                0.3,
                0.3
            ],
            specular: [
                0.5,
                0.5,
                0.5
            ],
            n: 10.000002,
            shaderType: 1,
            alpha: 1
        };

        // bottom left
        let bottomLeftCube = new Cube(state.gl, {
            name: "square-cube-bottom-left",
            position: [
                position[0],
                position[1],
                0
            ],
            scale: [
                1,
                1,
                1
            ],
            rotation: mat4.create(),
            material: DEFAULT_MAT
        });
        bottomLeftCube.vertShader = state.vertShaderSample;
        bottomLeftCube.fragShader = state.fragShaderSample;
        bottomLeftCube.setup();

        // bottom right
        let bottomRightCube = new Cube(state.gl, {
            name: "square-cube-bottom-right",
            position: [
                position[0] + 0.5,
                position[1],
                0
            ],
            scale: [
                1,
                1,
                1
            ],
            rotation: mat4.create(),
            material: DEFAULT_MAT
        });
        bottomRightCube.vertShader = state.vertShaderSample;
        bottomRightCube.fragShader = state.fragShaderSample;
        bottomRightCube.setup();

        // top left
        let topLeftCube = new Cube(state.gl, {
            name: "square-cube-top-left",
            position: [
                position[0],
                position[1] + 0.5,
                0
            ],
            scale: [
                1,
                1,
                1
            ],
            rotation: mat4.create(),
            material: DEFAULT_MAT
        });
        topLeftCube.vertShader = state.vertShaderSample;
        topLeftCube.fragShader = state.fragShaderSample;
        topLeftCube.setup();

        // top left
        let topRightCube = new Cube(state.gl, {
            name: "square-cube-top-right",
            position: [
                position[0] + 0.5,
                position[1] + 0.5,
                0
            ],
            scale: [
                1,
                1,
                1
            ],
            rotation: mat4.create(),
            material: DEFAULT_MAT
        });
        topRightCube.vertShader = state.vertShaderSample;
        topRightCube.fragShader = state.fragShaderSample;
        topRightCube.setup();


        this.objects.push(bottomLeftCube, bottomRightCube, topLeftCube, topRightCube);
    }
}