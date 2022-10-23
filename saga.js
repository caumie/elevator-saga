{
    init: (elevators, floors) => {

        const stat = () => {

            this.adfa = aaa
        };

        elevators.map((e, i) => {

            e.id = i;
            e.plannedDirection = undefined;

            e.getNextFloorDirection = () => {
                if (e.destinationQueue.length === 0) {
                    return "none";
                }
                const nextFloorNum = e.destinationQueue[0];
                return nextFloorNum >= e.currentFloor() ? "up" : "down";
            };

            e.setIndicator = (direction) => {
                if (direction === "up") {
                    e.goingUpIndicator(true);
                    e.goingDownIndicator(false);
                }
                if (direction === "down") {
                    e.goingUpIndicator(false);
                    e.goingDownIndicator(true);
                }
            };

            e.checkAvailability = () => {
                const perPassengerFactor = 1 / e.maxPassengerCount();
                return (e.loadFactor() + (perPassengerFactor * 2) <= 1)
            };

            e.stayFloorNum = (
                () => {
                    // default waiting point
                    const per = floors.length / elevators.length;
                    const stayFloorNum = i * per;
                    return stayFloorNum;
                }
            )();

            e.on("idle", () => {

                // 周囲の状況から計画作成
                // 適切な計画がなければ標準位置へ移動

                {

                    if (e.currentFloor() > goingFloorNum) {
                        e.goingUpIndicator(false);
                        e.goingDownIndicator(true);
                    } else {
                        e.goingUpIndicator(true);
                        e.goingDownIndicator(false);
                    }

                    e.goToFloor(goingFloorNum);

                }
            });
            e.on("passing_floor", (floorNum, direction) => {

                // そもそも止まる予定か
                // 合致する方向の要求があるか
                // 重量に空きがあるか
                // よい場合は停止要求のキューの最初に追加
                if (floorNum === e.destinationQueue[0]) { return; }
                if (false === floors[floorNum][direction].called) { return; }
                if (false === e.checkAvailability()) { return; }

                e.destinationQueue.unshift(floorNum);
                e.checkDestinationQueue();

            });
            e.on("stopped_at_floor", (floorNum) => {

                const direction = e.getNextFloorDirection();
                if (direction === "none") { return };

                // 次の階次第で進行方向表示を更新
                e.setIndicator(direction);

                // フロアの進行方向の要求をクリア
                floors[floorNum].clear(direction);

            });
            e.on("floor_button_pressed", (floorNum) => {

                // 押されたボタン＋周囲の状況から、再計画、キュー入れ込む
                const pressedFloors = e.getPressedFloors();
                
                const lowerFloors = pressedFloors.filter(fN => e.currentFloor() > fN);
                const higherFloors = pressedFloors.filter(fN => e.currentFloor() < fN);

                if (lowerFloors.length <= higherFloors){
                    const sortedPressedFloors = [...pressedFloors].sort();
                }else{
                    const sortedPressedFloors = [...pressedFloors].sort().reverse();
                }

                e.destinationQueue = sortedPressedFloors;
                e.checkDestinationQueue();
            });
        })

        floors.map((f, i) => {

            f.id = i;
            f.up = { floor: i, direction: "up", called: false, reserve: undefined };
            f.down = { floor: i, direction: "down", called: false, reserve: undefined };

            f.clear = (direction) => {
                f[direction].called = false;
                f[direction].reserve = undefined;
            };

            f.on("up_button_pressed", () => {
                f["up"].called = true;
            });
            f.on("down_button_pressed", () => {
                f["down"].called = true;
            });

        })
    },
        update: (dt, elevators, floors) => {
            // console.log(dt, elevators, floors);
        }
}