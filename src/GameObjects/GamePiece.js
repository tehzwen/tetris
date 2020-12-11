class GamePiece {
    constructor(position, boardPosition) {
        this.objects = [];
        this.position = position;
        this.boardPosition = boardPosition;
        this.stopped = false;
    }


    translateHoriz(step) {
        if (step < 0.0) {
            this.boardPosition[1] += 1;
        } else {
            this.boardPosition[1] -= 1;
        }
        this.objects.forEach((obj) => {
            obj.translate(vec3.fromValues(step, 0.0, 0.0));
        });
    }

    rotate() {

    }
}