// If you want to use globals here you can. Initialize them in startGame then update/change them in gameLoop

const GAME_PIECE_NAMES = ["square", "lblock", "rblock", "pillar", "three", "rsmall", "lsmall"];
// const GAME_PIECE_NAMES = ["rsmall"];
const GRAV_STEP = 0.5;
const FLOOR = -3.5;
var timeCount = 0.0;
var timeStep = 0.5;
var cubeSize = 0.5;
var numRotations = 0;
var score = 0;
var board = [];

/**
 * 
 * @param { Object - Game state } state 
 * @usage Use this function for initializing any in game values in our state or adding event listeners
 */
function startGame(state) {
    // state.spawn = getObject(state, "spawnPoint");
    let leftWall = getObject(state, "leftWall");
    let rightWall = getObject(state, "rightWall");
    let topWall = getObject(state, "topWall");
    let bottomWall = getObject(state, "bottomWall");

    let width = Math.abs(leftWall.model.position[0] - rightWall.model.position[0]);
    let height = Math.abs(topWall.model.position[1] - bottomWall.model.position[1]);
    let dimensions = {
        "top": topWall.model.position[1],
        "bottom": bottomWall.model.position[1],
        "left": leftWall.model.position[0],
        "right": rightWall.model.position[0]
    }

    for (let i = 0; i < height; i += GRAV_STEP) {
        let tempList = [];
        for (let j = 0; j < width; j += cubeSize) {
            tempList.push({ position: vec2.fromValues(j, i), occupied: false, cube: null });
        }
        board.push(tempList);
    }

    state.board = {
        width,
        height,
        dimensions,
        board
    }

    state.gamePieceNum = 0;

    //this just prevents right click from opening up the context menu :)
    document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
    }, false);

    document.addEventListener('keydown', (e) => {
        if (e.code === "KeyX") {
            if (!state.gamePieces.length > 0) {
                spawnGamePiece(state);
            }
        } else if (e.code === "KeyP") {
            console.warn(state.board.board);
            console.warn(score);
            console.warn(timeStep);
        } else if (e.code === "KeyQ") {
            if (!state.gamePieces.length > 0) {
                spawnGamePiece(state, true);
            }
        } else if (e.code === "KeyD") {
            // check if at edge
            if (state.gamePieces.length > 0) {
                let canMove = [];

                state.gamePieces.forEach((piece) => {
                    let pos = piece.boardPosition;

                    if (pos[1] != state.board.board[0].length - 1 && !state.board.board[pos[0]][pos[1] + 1].occupied) {
                        canMove.push(true);
                    } else {
                        canMove.push(false);
                    }
                })

                if (!canMove.includes(false)) {
                    state.gamePieces.forEach((piece) => {
                        piece.translateHoriz(-cubeSize);
                    });
                }
            }
        } else if (e.code === "KeyA") {
            if (state.gamePieces.length > 0) {
                let canMove = [];

                state.gamePieces.forEach((piece) => {
                    let pos = piece.boardPosition;

                    if (pos[1] > 1 && !state.board.board[pos[0]][pos[1] - 1].occupied) {
                        canMove.push(true);
                    } else {
                        canMove.push(false);
                    }
                })

                if (!canMove.includes(false)) {
                    state.gamePieces.forEach((piece) => {
                        piece.translateHoriz(cubeSize);
                    });
                }
            }
        } else if (e.code === "KeyS") {
            let canMoves = canMove(state);
            if (!canMoves.includes(false)) {
                state.gamePieces.forEach((obj) => {
                    moveObjectDown(obj)
                })
            }
        } else if (e.code === "KeyR") {
            if (state.gamePieces.length > 0) {
                rotateShape()
            }
        }
    });
}

function spawnGamePiece(state, hardcode) {
    let choice = Math.floor(Math.random() * GAME_PIECE_NAMES.length);
    choice = GAME_PIECE_NAMES[choice];

    if (hardcode) {
        choice = "pillar";
    }

    let horizValue = Math.floor((state.board.board[0].length - 1) / 2);

    let randomColor = [];

    for (let i = 0; i < 3; i++) {
        randomColor.push(Math.random() * 1.0);
    }
    if (choice === "square") {
        let color = [1.0, 1.0, 0];
        let tempCubeBL = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top),
            vec2.fromValues(state.board.board.length - 1, horizValue), color);
        state.gamePieceNum++;

        let tempCubeBR = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right) + 0.5, state.board.dimensions.top),
            vec2.fromValues(state.board.board.length - 1, horizValue + 1), color);
        state.gamePieceNum++;

        let tempCubeTR = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right) + 0.5, state.board.dimensions.top - 0.5),
            vec2.fromValues((state.board.board.length - 1) - 1, horizValue + 1), color);
        state.gamePieceNum++;

        let tempCubeTL = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top - 0.5),
            vec2.fromValues((state.board.board.length - 1) - 1, horizValue), color);
        state.gamePieceNum++;

        state.objects.push(tempCubeBL.objects[0]);
        state.objects.push(tempCubeBR.objects[0]);
        state.objects.push(tempCubeTR.objects[0]);
        state.objects.push(tempCubeTL.objects[0]);

        state.gamePieces.push(tempCubeBL, tempCubeBR, tempCubeTL, tempCubeTR);
        state.activePiece = "square";
    } else if (choice === "pillar") {
        let color = [0, 1.0, 1.0];
        let tempCubeBL = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top),
            vec2.fromValues(state.board.board.length - 1, horizValue + 1), color);
        state.gamePieceNum++;

        let tempCubeBR = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top - (0.5) * 1),
            vec2.fromValues((state.board.board.length - 1) + -1, horizValue + 1), color);
        state.gamePieceNum++;

        let tempCubeTR = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top - (0.5) * 2),
            vec2.fromValues((state.board.board.length - 1) - 2, horizValue + 1), color);
        state.gamePieceNum++;

        let tempCubeTL = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top - (0.5) * 3),
            vec2.fromValues((state.board.board.length - 1) - 3, horizValue + 1), color);
        state.gamePieceNum++;

        state.objects.push(tempCubeBL.objects[0]);
        state.objects.push(tempCubeBR.objects[0]);
        state.objects.push(tempCubeTR.objects[0]);
        state.objects.push(tempCubeTL.objects[0]);

        state.gamePieces.push(tempCubeBL, tempCubeBR, tempCubeTL, tempCubeTR);
        state.activePiece = "pillar";
    } else if (choice === "lblock") {
        let color = [1.0, 0.6, 0.0];
        let tempCubeBL = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top),
            vec2.fromValues(state.board.board.length - 1, horizValue + 1), color)
        state.gamePieceNum++;

        let tempCubeBR = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top - (0.5) * 1),
            vec2.fromValues((state.board.board.length - 1) - 1, horizValue + 1), color)
        state.gamePieceNum++;

        let tempCubeTR = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top - (0.5) * 2),
            vec2.fromValues((state.board.board.length - 1) - 2, horizValue + 1), color)
        state.gamePieceNum++;

        let tempCubeTL = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right) - 0.5, state.board.dimensions.top - (0.5) * 2),
            vec2.fromValues((state.board.board.length - 1) - 2, horizValue + 2), color)
        state.gamePieceNum++;

        state.objects.push(tempCubeBL.objects[0]);
        state.objects.push(tempCubeBR.objects[0]);
        state.objects.push(tempCubeTR.objects[0]);
        state.objects.push(tempCubeTL.objects[0]);

        state.gamePieces.push(tempCubeBL, tempCubeBR, tempCubeTR, tempCubeTL);
        state.activePiece = "lblock";
    } else if (choice === "rblock") {
        let color = [0, 0, 1.0];
        let tempCubeBL = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top),
            vec2.fromValues(state.board.board.length - 1, horizValue + 1), color)
        state.gamePieceNum++;

        let tempCubeBR = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top - (0.5) * 1),
            vec2.fromValues((state.board.board.length - 1) - 1, horizValue + 1), color)
        state.gamePieceNum++;

        let tempCubeTR = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top - (0.5) * 2),
            vec2.fromValues((state.board.board.length - 1) - 2, horizValue + 1), color)
        state.gamePieceNum++;

        let tempCubeTL = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right) + 0.5, state.board.dimensions.top - (0.5) * 2),
            vec2.fromValues((state.board.board.length - 1) - 2, horizValue), color)
        state.gamePieceNum++;

        state.objects.push(tempCubeBL.objects[0]);
        state.objects.push(tempCubeBR.objects[0]);
        state.objects.push(tempCubeTR.objects[0]);
        state.objects.push(tempCubeTL.objects[0]);

        state.gamePieces.push(tempCubeBL, tempCubeBR, tempCubeTR, tempCubeTL);
        state.activePiece = "rblock";
    } else if (choice === "three") {
        let color = [0.4, 0, 0.8];
        let tempCubeBL = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top),
            vec2.fromValues(state.board.board.length - 1, horizValue + 1), color)
        state.gamePieceNum++;

        let tempCubeBR = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top - (0.5) * 1),
            vec2.fromValues((state.board.board.length - 1) - 1, horizValue + 1), color)
        state.gamePieceNum++;

        let tempCubeTR = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right) - 0.5, state.board.dimensions.top - (0.5) * 1),
            vec2.fromValues((state.board.board.length - 1) - 1, horizValue + 2), color)
        state.gamePieceNum++;

        let tempCubeTL = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right) + 0.5, state.board.dimensions.top - (0.5) * 1),
            vec2.fromValues((state.board.board.length - 1) - 1, horizValue), color)
        state.gamePieceNum++;

        state.objects.push(tempCubeBL.objects[0]);
        state.objects.push(tempCubeBR.objects[0]);
        state.objects.push(tempCubeTR.objects[0]);
        state.objects.push(tempCubeTL.objects[0]);

        state.gamePieces.push(tempCubeBL, tempCubeBR, tempCubeTL, tempCubeTR);
        state.activePiece = "three";
    } else if (choice === "rsmall") {
        let color = [0.0, 1.0, 0.0];
        let cube0 = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top),
            vec2.fromValues(state.board.board.length - 1, horizValue + 1), color)
        state.gamePieceNum++;

        let cube1 = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top - 0.5),
            vec2.fromValues((state.board.board.length - 1) - 1, horizValue + 1), color)
        state.gamePieceNum++;

        let cube2 = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right) - 0.5, state.board.dimensions.top),
            vec2.fromValues((state.board.board.length - 1), horizValue + 2), color)
        state.gamePieceNum++;

        let cube3 = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right) + 0.5, state.board.dimensions.top - 0.5),
            vec2.fromValues((state.board.board.length - 1) - 1, horizValue), color)
        state.gamePieceNum++;

        state.objects.push(cube0.objects[0]);
        state.objects.push(cube1.objects[0]);
        state.objects.push(cube2.objects[0]);
        state.objects.push(cube3.objects[0]);

        state.gamePieces.push(cube0, cube1, cube2, cube3);
        state.activePiece = "rsmall";
    } else if (choice === "lsmall") {
        let color = [1.0, 0.0, 0.0];
        let cube0 = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top),
            vec2.fromValues(state.board.board.length - 1, horizValue + 1), color)
        state.gamePieceNum++;

        let cube1 = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right), state.board.dimensions.top - 0.5),
            vec2.fromValues((state.board.board.length - 1) - 1, horizValue + 1), color)
        state.gamePieceNum++;

        let cube2 = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right) + 0.5, state.board.dimensions.top),
            vec2.fromValues((state.board.board.length - 1), horizValue), color)
        state.gamePieceNum++;

        let cube3 = new SingleCube(
            vec2.fromValues((state.board.dimensions.left + state.board.dimensions.right) - 0.5, state.board.dimensions.top - 0.5),
            vec2.fromValues((state.board.board.length - 1) - 1, horizValue + 2), color)
        state.gamePieceNum++;

        state.objects.push(cube0.objects[0]);
        state.objects.push(cube1.objects[0]);
        state.objects.push(cube2.objects[0]);
        state.objects.push(cube3.objects[0]);

        state.gamePieces.push(cube0, cube1, cube2, cube3);
        state.activePiece = "lsmall";
    }
}

function canMove(state) {
    let val = [];
    if (state.gamePieces.length === 0) {
        return [false];
    }

    state.gamePieces.forEach((obj) => {
        let pos = obj.boardPosition;
        if (pos[0] == 0 || state.board.board[pos[0] - 1][pos[1]].occupied) {
            val.push(false);
        } else {
            val.push(true);
        }
    });

    // console.log(val)
    return val;
}

function rotateShape() {
    if (state.activePiece === "single" || state.activePiece === "square") {
        return;
    } else if (state.activePiece === "pillar") {
        if (numRotations === 0
            && state.gamePieces[0].boardPosition[1] + 1 < state.board.board[0].length
            && state.gamePieces[0].boardPosition[1] + 2 < state.board.board[0].length
            && state.gamePieces[0].boardPosition[1] + 3 < state.board.board[0].length
            && !state.board.board[state.gamePieces[0].boardPosition[0]][state.gamePieces[0].boardPosition[1] + 1].occupied
            && !state.board.board[state.gamePieces[0].boardPosition[0]][state.gamePieces[0].boardPosition[1] + 2].occupied
            && !state.board.board[state.gamePieces[0].boardPosition[0]][state.gamePieces[0].boardPosition[1] + 3].occupied) {
            // initial rot
            state.gamePieces[1].boardPosition = [state.gamePieces[0].boardPosition[0], state.gamePieces[0].boardPosition[1] + 1];
            state.gamePieces[1].cube.model.position = vec3.fromValues(state.gamePieces[1].cube.model.position[0] - 0.5, state.gamePieces[0].cube.model.position[1], 0.0);

            state.gamePieces[2].boardPosition = [state.gamePieces[0].boardPosition[0], state.gamePieces[0].boardPosition[1] + 2];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[1].cube.model.position[0] - 0.5, state.gamePieces[0].cube.model.position[1], 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[0].boardPosition[0], state.gamePieces[0].boardPosition[1] + 3];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[2].cube.model.position[0] - 0.5, state.gamePieces[0].cube.model.position[1], 0.0);

            numRotations++;
        } else {
            state.gamePieces[1].boardPosition = [state.gamePieces[0].boardPosition[0] - 1, state.gamePieces[0].boardPosition[1]];
            state.gamePieces[1].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0], state.gamePieces[0].cube.model.position[1] - 0.5, 0.0);

            state.gamePieces[2].boardPosition = [state.gamePieces[0].boardPosition[0] - 2, state.gamePieces[0].boardPosition[1]];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0], state.gamePieces[0].cube.model.position[1] - 1, 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[0].boardPosition[0] - 3, state.gamePieces[0].boardPosition[1]];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0], state.gamePieces[0].cube.model.position[1] - 1.5, 0.0);

            numRotations = 0;
        }
    } else if (state.activePiece === "lblock") {
        if (numRotations === 0
            && state.gamePieces[0].boardPosition[1] + 1 < state.board.board[0].length
            && state.gamePieces[0].boardPosition[1] + 2 < state.board.board[0].length
            && !state.board.board[state.gamePieces[0].boardPosition[0]][state.gamePieces[0].boardPosition[1] + 1].occupied
            && !state.board.board[state.gamePieces[0].boardPosition[0]][state.gamePieces[0].boardPosition[1] + 2].occupied) {
            state.gamePieces[2].boardPosition = [state.gamePieces[0].boardPosition[0], state.gamePieces[0].boardPosition[1] + 1];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0] - 0.5, state.gamePieces[0].cube.model.position[1], 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[0].boardPosition[0], state.gamePieces[0].boardPosition[1] + 2];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0] - 1.0, state.gamePieces[0].cube.model.position[1], 0.0);
            numRotations++;
        } else if (numRotations === 1
            && state.gamePieces[0].boardPosition[1] - 1 > 0
            && state.gamePieces[1].boardPosition[0] - 1 > 0
            && !state.board.board[state.gamePieces[0].boardPosition[0]][state.gamePieces[0].boardPosition[1] - 1].occupied
            && !state.board.board[state.gamePieces[1].boardPosition[0] - 1][state.gamePieces[0].boardPosition[1]].occupied) {
            state.gamePieces[2].boardPosition = [state.gamePieces[0].boardPosition[0], state.gamePieces[0].boardPosition[1] - 1];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0] + 0.5, state.gamePieces[0].cube.model.position[1], 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[1].boardPosition[0] - 1, state.gamePieces[0].boardPosition[1]];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0], state.gamePieces[0].cube.model.position[1] - 1.0, 0.0);
            numRotations++;
        } else if (numRotations === 2
            && state.gamePieces[0].boardPosition[1] - 2 > 0
            && !state.board.board[state.gamePieces[0].boardPosition[0] + 1][state.gamePieces[0].boardPosition[1]].occupied
            && !state.board.board[state.gamePieces[0].boardPosition[0]][state.gamePieces[0].boardPosition[1] - 2].occupied) {
            state.gamePieces[1].boardPosition = [state.gamePieces[0].boardPosition[0] + 1, state.gamePieces[0].boardPosition[1]];
            state.gamePieces[1].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0], state.gamePieces[0].cube.model.position[1] + 0.5, 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[0].boardPosition[0], state.gamePieces[0].boardPosition[1] - 2];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0] + 1.0, state.gamePieces[0].cube.model.position[1], 0.0);
            numRotations++;
        } else if (numRotations === 3
            && state.gamePieces[2].boardPosition[1] + 1 < state.board.board[0].length
            && state.gamePieces[0].boardPosition[0] - 2 > 0
            && state.gamePieces[0].boardPosition[0] - 1 > 0
            && !state.board.board[state.gamePieces[0].boardPosition[0] - 1].occupied
            && !state.board.board[state.gamePieces[0].boardPosition[0] - 2][state.gamePieces[0].boardPosition[1]].occupied
            && !state.board.board[state.gamePieces[2].boardPosition[0]][state.gamePieces[2].boardPosition[1] + 1].occupied) {
            // return to normal
            state.gamePieces[1].boardPosition = [state.gamePieces[0].boardPosition[0] - 1, state.gamePieces[0].boardPosition[1]];
            state.gamePieces[1].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0], state.gamePieces[0].cube.model.position[1] - 0.5, 0.0);

            state.gamePieces[2].boardPosition = [state.gamePieces[0].boardPosition[0] - 2, state.gamePieces[0].boardPosition[1]];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[1].cube.model.position[0], state.gamePieces[1].cube.model.position[1] - 0.5, 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[2].boardPosition[0], state.gamePieces[2].boardPosition[1] + 1];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[2].cube.model.position[0] - 0.5, state.gamePieces[2].cube.model.position[1], 0.0);

            numRotations = 0;
        }
    } else if (state.activePiece === "rblock") {
        if (numRotations === 0
            && state.gamePieces[1].boardPosition[1] + 1 !== state.board.board[0].length
            && state.gamePieces[1].boardPosition[1] + 2 !== state.board.board[0].length
            && !state.board.board[state.gamePieces[1].boardPosition[0]][state.gamePieces[1].boardPosition[1] + 1].occupied
            && !state.board.board[state.gamePieces[1].boardPosition[0]][state.gamePieces[1].boardPosition[1] + 2].occupied) {
            state.gamePieces[2].boardPosition = [state.gamePieces[1].boardPosition[0], state.gamePieces[1].boardPosition[1] + 1];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[1].cube.model.position[0] - 0.5, state.gamePieces[1].cube.model.position[1], 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[1].boardPosition[0], state.gamePieces[1].boardPosition[1] + 2];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[1].cube.model.position[0] - 1.0, state.gamePieces[1].cube.model.position[1], 0.0);
            numRotations++;
        } else if (numRotations === 1
            && state.gamePieces[0].boardPosition[1] + 1 !== state.board.board[0].length
            && !state.board.board[state.gamePieces[0].boardPosition[0]][state.gamePieces[0].boardPosition[1] + 1].occupied
            && !state.board.board[state.gamePieces[1].boardPosition[0] - 1][state.gamePieces[0].boardPosition[1] + 1].occupied) {
            state.gamePieces[2].boardPosition = [state.gamePieces[0].boardPosition[0], state.gamePieces[0].boardPosition[1] + 1];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0] - 0.5, state.gamePieces[0].cube.model.position[1], 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[1].boardPosition[0] - 1, state.gamePieces[0].boardPosition[1]];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0], state.gamePieces[0].cube.model.position[1] - 1.0, 0.0);
            numRotations++;
        } else if (numRotations === 2
            && state.gamePieces[0].boardPosition[1] - 1 > 0
            && state.gamePieces[0].boardPosition[1] - 2 > 0
            && !state.board.board[state.gamePieces[0].boardPosition[0]][state.gamePieces[0].boardPosition[1] - 1].occupied
            && !state.board.board[state.gamePieces[0].boardPosition[0]][state.gamePieces[0].boardPosition[1] - 2].occupied
        ) {
            state.gamePieces[2].boardPosition = [state.gamePieces[0].boardPosition[0], state.gamePieces[0].boardPosition[1] - 1];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0] + 0.5, state.gamePieces[0].cube.model.position[1], 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[0].boardPosition[0], state.gamePieces[0].boardPosition[1] - 2];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0] + 1.0, state.gamePieces[0].cube.model.position[1], 0.0);

            numRotations++;
        } else if (numRotations === 3
            && !state.board.board[state.gamePieces[0].boardPosition[0] - 2][state.gamePieces[0].boardPosition[1]].occupied
            && !state.board.board[state.gamePieces[0].boardPosition[0] - 2][state.gamePieces[0].boardPosition[1] - 1].occupied) {
            // return to normal
            state.gamePieces[2].boardPosition = [state.gamePieces[0].boardPosition[0] - 2, state.gamePieces[0].boardPosition[1]];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0], state.gamePieces[0].cube.model.position[1] - 1.0, 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[0].boardPosition[0] - 2, state.gamePieces[0].boardPosition[1] - 1];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0] + 0.5, state.gamePieces[0].cube.model.position[1] - 1.0, 0.0);
            numRotations = 0;
        }
    } else if (state.activePiece === "three") {
        if (numRotations === 0
            && state.gamePieces[1].boardPosition[1] + 1 !== state.board.board[0].length
            && !state.board.board[state.gamePieces[0].boardPosition[0] - 2][state.gamePieces[0].boardPosition[1]].occupied
            && !state.board.board[state.gamePieces[1].boardPosition[0]][state.gamePieces[1].boardPosition[1] + 1].occupied) {
            state.gamePieces[2].boardPosition = [state.gamePieces[0].boardPosition[0] - 2, state.gamePieces[0].boardPosition[1]];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0], state.gamePieces[0].cube.model.position[1] - 1.0, 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[1].boardPosition[0], state.gamePieces[1].boardPosition[1] + 1];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[1].cube.model.position[0] - 0.5, state.gamePieces[1].cube.model.position[1], 0.0);
            numRotations++;
        } else if (numRotations === 1
            && state.gamePieces[0].boardPosition[1] + 1 < state.board.board[0].length
            && state.gamePieces[0].boardPosition[1] - 1 > 0
            && !state.board.board[state.gamePieces[0].boardPosition[0]][state.gamePieces[0].boardPosition[1] + 1].occupied
            && !state.board.board[state.gamePieces[0].boardPosition[0]][state.gamePieces[0].boardPosition[1] - 1].occupied) {
            state.gamePieces[2].boardPosition = [state.gamePieces[0].boardPosition[0], state.gamePieces[0].boardPosition[1] + 1];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0] - 0.5, state.gamePieces[0].cube.model.position[1], 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[0].boardPosition[0], state.gamePieces[0].boardPosition[1] - 1];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0] + 0.5, state.gamePieces[0].cube.model.position[1], 0.0);
            numRotations++;
        } else if (numRotations === 2
            && state.gamePieces[1].boardPosition[1] - 1 > 0
            && !state.board.board[state.gamePieces[1].boardPosition[0]][state.gamePieces[1].boardPosition[1] - 1].occupied
            && !state.board.board[state.gamePieces[0].boardPosition[0] - 2][state.gamePieces[0].boardPosition[1]].occupied) {
            state.gamePieces[2].boardPosition = [state.gamePieces[1].boardPosition[0], state.gamePieces[1].boardPosition[1] - 1];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[1].cube.model.position[0] + 0.5, state.gamePieces[1].cube.model.position[1], 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[0].boardPosition[0] - 2, state.gamePieces[0].boardPosition[1]];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0], state.gamePieces[0].cube.model.position[1] - 1.0, 0.0);

            numRotations++;
        } else if (numRotations === 3
            && state.gamePieces[1].boardPosition[1] + 1 < state.board.board[0].length
            && !state.board.board[state.gamePieces[1].boardPosition[0]][state.gamePieces[1].boardPosition[1] + 1].occupied) {
            // return to normal
            state.gamePieces[3].boardPosition = [state.gamePieces[1].boardPosition[0], state.gamePieces[1].boardPosition[1] + 1];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[1].cube.model.position[0] - 0.5, state.gamePieces[1].cube.model.position[1], 0.0);
            numRotations = 0;
        }
    } else if (state.activePiece === "rsmall") {
        if (numRotations === 0
            && !state.board.board[state.gamePieces[1].boardPosition[0]][state.gamePieces[1].boardPosition[1] + 1].occupied
            && !state.board.board[state.gamePieces[1].boardPosition[0] - 1][state.gamePieces[1].boardPosition[1] + 1].occupied) {
            state.gamePieces[2].boardPosition = [state.gamePieces[1].boardPosition[0], state.gamePieces[1].boardPosition[1] + 1];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[1].cube.model.position[0] - 0.5, state.gamePieces[1].cube.model.position[1], 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[1].boardPosition[0] - 1, state.gamePieces[1].boardPosition[1] + 1];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[1].cube.model.position[0] - 0.5, state.gamePieces[1].cube.model.position[1] - 0.5, 0.0);

            numRotations++;
        } else if (state.gamePieces[0].boardPosition[1] + 1 < state.board.board[0].length
            && state.gamePieces[1].boardPosition[1] - 1 > 0) {
            state.gamePieces[2].boardPosition = [state.gamePieces[0].boardPosition[0], state.gamePieces[0].boardPosition[1] + 1];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0] - 0.5, state.gamePieces[0].cube.model.position[1], 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[1].boardPosition[0], state.gamePieces[1].boardPosition[1] - 1];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[1].cube.model.position[0] + 0.5, state.gamePieces[1].cube.model.position[1], 0.0);

            numRotations = 0;
        }
    } else if (state.activePiece === "lsmall") {
        if (numRotations === 0
            && !state.board.board[state.gamePieces[1].boardPosition[0]][state.gamePieces[1].boardPosition[1] - 1].occupied
            && !state.board.board[state.gamePieces[1].boardPosition[0] - 1][state.gamePieces[1].boardPosition[1] - 1].occupied) {
            state.gamePieces[2].boardPosition = [state.gamePieces[1].boardPosition[0], state.gamePieces[1].boardPosition[1] - 1];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[1].cube.model.position[0] + 0.5, state.gamePieces[1].cube.model.position[1], 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[1].boardPosition[0] - 1, state.gamePieces[1].boardPosition[1] - 1];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[1].cube.model.position[0] + 0.5, state.gamePieces[1].cube.model.position[1] - 0.5, 0.0);

            numRotations++;
        } else if (state.gamePieces[0].boardPosition[1] - 1 > 0
            && state.gamePieces[1].boardPosition[1] + 1 < state.board.board[0].length
            && !state.board.board[state.gamePieces[0].boardPosition[0]][state.gamePieces[0].boardPosition[1] - 1].occupied
            && !state.board.board[state.gamePieces[1].boardPosition[0]][state.gamePieces[1].boardPosition[1] + 1].occupied) {
            state.gamePieces[2].boardPosition = [state.gamePieces[0].boardPosition[0], state.gamePieces[0].boardPosition[1] - 1];
            state.gamePieces[2].cube.model.position = vec3.fromValues(state.gamePieces[0].cube.model.position[0] + 0.5, state.gamePieces[0].cube.model.position[1], 0.0);

            state.gamePieces[3].boardPosition = [state.gamePieces[1].boardPosition[0], state.gamePieces[1].boardPosition[1] + 1];
            state.gamePieces[3].cube.model.position = vec3.fromValues(state.gamePieces[1].cube.model.position[0] - 0.5, state.gamePieces[1].cube.model.position[1], 0.0);

            numRotations = 0;
        }
    }
}

function applyForce(state) {
    state.gamePieces.forEach((obj) => {
        if (state.canMove) {
            moveObjectDown(obj);
        }
    });
}

function moveObjectDown(obj) {
    obj.objects.forEach((innerObject) => {
        obj.boardPosition[0] -= 1;
        innerObject.translate(vec3.fromValues(0.0, -GRAV_STEP, 0.0));
    });
}

function checkForTetris() {

    let leftOverPieces = [];
    for (let i = 0; i < state.board.board.length; i++) {
        let tempTetris = [];
        for (let j = 1; j < state.board.board[i].length; j++) {
            if (state.board.board[i][j].occupied) {
                tempTetris.push(state.board.board[i][j].cube);
            }
        }

        if (tempTetris.length === state.board.board[i].length - 1) {
            state.tetris = true;
            score += 10;

            // increase the speed for every 4 blocks
            if (score % 40 === 0) {
                timeStep -= 0.05;
            }

            tempTetris.forEach((object) => {
                state.board.board[object.boardPosition[0]][object.boardPosition[1]].occupied = false;
                removeObject(state, object.cube.name);
            });
        } else {
            leftOverPieces = leftOverPieces.concat(tempTetris);
        }
    }

    if (state.tetris) {
        leftOverPieces.forEach((object) => {
            state.board.board[object.boardPosition[0]][object.boardPosition[1]].occupied = false;
            state.gamePieces.push(object);
        });

        state.tetris = false;
    }
}

/**
 * 
 * @param { Object - Game state } state 
 * @param { Float - time difference between the previous frame that was drawn and the current frame } deltaTime 
 */
function gameLoop(state, deltaTime) {
    // TODO - Here we can add game logic, like getting player objects, and moving them, detecting collisions, you name it. Examples of functions can be found in sceneFunctions
    if (timeCount < timeStep) {
        timeCount += deltaTime;

        checkForTetris();

        let canMoves = canMove(state);
        if (!canMoves.includes(false)) {
            state.canMove = true;
        } else {
            if (canMoves.length === state.gamePieces.length) {
                state.gamePieces.forEach((obj) => {
                    let pos = obj.boardPosition;
                    state.board.board[pos[0]][pos[1]].occupied = true;
                    state.board.board[pos[0]][pos[1]].cube = obj;
                })
                state.gamePieces = [];
                numRotations = 0;
            }
            state.canMove = false;
        }
    } else {
        timeCount = 0.0;
        applyForce(state);
    }
}