class SingleCube extends GamePiece {
    constructor(position, boardPosition, color) {
        super(position, boardPosition);
        this.objects = [];
        this.boardPosition = boardPosition;

        this.cube = new Cube(state.gl, {
            name: "single-cube" + state.gamePieceNum,
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
            material: {
                diffuse: color,
                ambient: [
                    0.1,
                    0.1,
                    0.1
                ],
                specular: [
                    0.5,
                    0.5,
                    0.5
                ],
                n: 500,
                shaderType: 1,
                alpha: 1
            }
        });
        this.cube.vertShader = state.vertShaderSample;
        this.cube.fragShader = state.fragShaderSample;
        this.cube.setup();
        this.objects.push(this.cube);
    }
}