{
    init: (elevators, floors) => {

        const sameDirection = (floorNum) => { };

        elevators.map((e, i) => {

            e.id = i;

            e.getNextFloorDirection = (nextFloorNum) => {
                if (nextFloorNum === e.currentFloor()) {
                    return "none";
                }
                return nextFloorNum > e.currentFloor() ? "up" : "down";
            };

            e.setIndicator = (direction) => {
                if (direction === "none") {
                    e.goingUpIndicator(false);
                    e.goingDownIndicator(false);
                    return;
                }
                if (direction === "up") {
                    e.goingUpIndicator(true);
                    e.goingDownIndicator(false);
                    return;
                }
                if (direction === "down") {
                    e.goingUpIndicator(false);
                    e.goingDownIndicator(true);
                    return;
                }
                if (direction === "both") {
                    e.goingUpIndicator(true);
                    e.goingDownIndicator(true);
                    return;
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
                console.log("idle", e);

                // 周囲の状況から計画作成
                // 適切な計画がなければ標準位置へ移動
                {
                    direction = e.getNextFloorDirection(e.stayFloorNum)
                    e.setIndicator(direction);
                    e.goToFloor(e.stayFloorNum);
                }
            });
            e.on("passing_floor", (floorNum, direction) => {
                console.log("pass", e)

                e.setIndicator(direction);

                // そもそも止まる予定か
                // 合致する方向の要求があるか
                // 重量に空きがあるか
                // よい場合は停止要求のキューの最初に追加
                if ("" === floors[floorNum].buttonStates[direction]) { return; }
                if (false === e.checkAvailability()) { return; }

                if (floorNum !== e.destinationQueue[0]) {
                    e.destinationQueue.unshift(floorNum);
                    e.checkDestinationQueue();
                }

            });
            e.on("stopped_at_floor", (floorNum) => {
                console.log("stopped", e);

                if (floorNum === 0) {
                    e.setIndicator("up");
                    return;
                };
                if (floorNum === floors.length) {
                    e.setIndicator("down");
                    return;
                };

                if (e.getPressedFloors().length === 0) {
                    const upStatus = floors[floorNum].buttonStates["up"];
                    if (upStatus) {
                        e.setIndicator("up")
                        return;
                    }
                    const downStatus = floors[floorNum].buttonStates["down"];
                    if (downStatus) {
                        e.setIndicator("down")
                        return;
                    }
                    return;
                }


                // const direction = e.getNextFloorDirection(floorNum);
                // if (direction === "none") { return };

                // 次の階次第で進行方向表示を更新
                // e.setIndicator(direction);

            });
            e.on("floor_button_pressed", (floorNum) => {
                console.log("press", e);

                // 押されたボタン＋周囲の状況から、再計画、キュー入れ込む
                const pressedFloors = e.getPressedFloors();

                const lowerFloors = pressedFloors.filter(fN => e.currentFloor() > fN);
                const higherFloors = pressedFloors.filter(fN => e.currentFloor() < fN);

                let sortedPressedFloors = [...pressedFloors].sort();
                if (lowerFloors.length > higherFloors.length) {
                    sortedPressedFloors.reverse();
                }

                e.destinationQueue = sortedPressedFloors;
                e.checkDestinationQueue();
            });
        })

        floors.map((f, i) => {

            //buttonStates.up = "activated" | "";

            f.id = i;
            f.on("up_button_pressed", () => {
            });
            f.on("down_button_pressed", () => {
            });

        })
    },
        update: (dt, elevators, floors) => {
            // console.log(dt, elevators, floors);
        }
}