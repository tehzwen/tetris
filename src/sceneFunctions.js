function getObject(state, name) {
    let objectToFind = null;

    for (let i = 0; i < state.objects.length; i++) {
        if (state.objects[i].name === name) {
            objectToFind = state.objects[i];
            break;
        }
    }

    return objectToFind;
}

function intersect(a, b) {
    return (a.min[0] <= b.max[0] && a.max[0] >= b.min[0]) &&
        (a.min[1] <= b.max[1] && a.max[1] >= b.min[1]) &&
        (a.min[2] <= b.max[2] && a.max[2] >= b.min[2])
}

function getBoundingBox(vertices) {
    let max = vec3.fromValues(-Infinity, -Infinity, -Infinity);
    let min = vec3.fromValues(Infinity, Infinity, Infinity);

    for (let i = 0; i < vertices.length; i++) {
        let tempVert = vec3.fromValues(vertices[i][0], vertices[i][1], vertices[i][2]);
        let summedVal = tempVert[0] + tempVert[1] + tempVert[2];
        let maxSummed = max[0] + max[1] + max[2];
        let minSummed = min[0] + min[1] + min[2];

        if (summedVal > maxSummed) {
            max = tempVert;
        }

        if (summedVal < minSummed) {
            min = tempVert
        }
    }

    // get other points
    //top
    let xyminZMax = vec3.fromValues(min[0], min[1], max[2]);
    let yminXZMax = vec3.fromValues(max[0], min[1], max[2]);
    let zyminXMax = vec3.fromValues(max[0], min[1], min[2]);

    //bottom
    let xzminYMax = vec3.fromValues(min[0], max[1], min[2]);
    let zminXYMax = vec3.fromValues(max[0], max[1], min[2]);
    let xminZYMax = vec3.fromValues(min[0], max[1], max[2]);


    let points = [min, xyminZMax, yminXZMax, zyminXMax, xzminYMax, zminXYMax, xminZYMax, max];


    return { max, min, points }
}

function checkBoundingBoxChange(boundingBox, modelMatrix) {
    let copyMM = [...modelMatrix];
    let tempBB = { ...boundingBox };
    let max = vec3.fromValues(-Infinity, -Infinity, -Infinity);
    let min = vec3.fromValues(Infinity, Infinity, Infinity);

    for (let i = 0; i < 8; i++) {
        let copy = tempBB.points[i];
        let tempVal = vec4.fromValues(copy[0], copy[1], copy[2], 1.0);
        vec4.transformMat4(tempVal, tempVal, copyMM);

        let summedVal = tempVal[0] + tempVal[1] + tempVal[2];
        let maxSummed = max[0] + max[1] + max[2];
        let minSummed = min[0] + min[1] + min[2];


        if (summedVal > maxSummed) {
            max = vec3.fromValues(tempVal[0], tempVal[1], tempVal[2]);
        }

        if (summedVal < minSummed) {
            min = vec3.fromValues(tempVal[0], tempVal[1], tempVal[2]);
        }
    }
    return { min, max, points: tempBB.points };
}

function syncGetBoundingBox(vertices, modelMatrix) {
    let max = vec3.fromValues(-Infinity, -Infinity, -Infinity);
    let min = vec3.fromValues(Infinity, Infinity, Infinity);

    return new Promise((resolve, reject) => {
        let promises = [];
        for (let i = 0; i < vertices.length / 3; i += 3) {
            let currentVertices = vec3.fromValues(vertices[i], vertices[i + 1], vertices[i + 2]);

            if (modelMatrix) {
                let tempVerts = vec4.fromValues(currentVertices[0], currentVertices[1], currentVertices[2], 1.0);
                vec4.transformMat4(tempVerts, tempVerts, modelMatrix);
                currentVertices = vec3.fromValues(tempVerts[0], tempVerts[1], tempVerts[2]);
            }

            if (currentVertices[0] > max[0]) {
                max[0] = currentVertices[0];
            }
            if (currentVertices[0] < min[0]) {
                min[0] = currentVertices[0];
            }
            if (currentVertices[1] > max[1]) {
                max[1] = currentVertices[1];
            }
            if (currentVertices[1] < min[1]) {
                min[1] = currentVertices[1];
            }
            if (currentVertices[2] > max[2]) {
                max[2] = currentVertices[2];
            }
            if (currentVertices[2] < min[2]) {
                min[2] = currentVertices[2];
            }

            promises.push(new Promise((res, rej) => res()))
        }
        Promise.all(promises)
            .then(() => {
                // have min now get other points
                // get other points
                //top
                let xyminZMax = vec3.fromValues(min[0], min[1], max[2]);
                let yminXZMax = vec3.fromValues(max[0], min[1], max[2]);
                let zyminXMax = vec3.fromValues(max[0], min[1], min[2]);

                //bottom
                let xzminYMax = vec3.fromValues(min[0], max[1], min[2]);
                let zminXYMax = vec3.fromValues(max[0], max[1], min[2]);
                let xminZYMax = vec3.fromValues(min[0], max[1], max[2]);


                let points = [min, xyminZMax, yminXZMax, zyminXMax, xzminYMax, zminXYMax, xminZYMax, max];

                resolve({ max, min, points });
            })
    })
}

/**
 * 
 * @param {object - object containing scene values} state 
 * @param {object - the object to be added to the scene} object 
 * @purpose - Helper function for adding a new object to the scene and refreshing the GUI
 */
function addObjectToScene(state, object) {
    object.name = object.name;
    state.objects.push(object);
}