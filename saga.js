{
    init: (elevators, floors) => {

        // const getFloorPriority = (targetFloorNum) => {
        //     const f = floors[targetFloorNum];
        //     console.log(targetFloorNum, f.waiting("up"), f.waiting("down"))
        //     if (f.waiting("up") || f.waiting("down")) {
        //         const priority = Math.abs(e.currentFloor() - targetFloorNum);
        //         return priority;
        //     } else {
        //         return Infinity;
        //     }
        // const stat = () => {
        //     // waiting search. both direction.
        //     const floorNums = [...Array(floors.length).keys()];
        //     const priorities = floorNums.map(getFloorPriority);
        //     const highPriorityValue = Math.min(...priorities);
        //     const highPriorityFloorNum = priorities.findIndex(v => v === highPriorityValue);
        //     console.log(priorities, highPriorityValue, highPriorityFloorNum);
        //     if (highPriorityFloorNum !== -1) {
        //         goingFloorNum = highPriorityFloorNum
        //     }
        // };

        elevators.map((e, i) => {

            e.id = i;
            e.plannedDirection = undefined;

            e.getNextFloorDirection = (nextFloorNum) => {
                if (nextFloorNum === e.currentFloor()) {
                    return "none";
                }
                return nextFloorNum > e.currentFloor() ? "up" : "down";
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
                console.log("idle");

                // 周囲の状況から計画作成
                // 適切な計画がなければ標準位置へ移動
                e.goingUpIndicator(true);
                e.goingDownIndicator(true);

                {
                    const direction = e.getNextFloorDirection(e.stayFloorNum);
                    e.setIndicator(direction);
                    e.goToFloor(e.stayFloorNum);
                    
                }
            });
            e.on("passing_floor", (floorNum, direction) => {
                console.log("pass", floors[floorNum][direction].called, e.checkAvailability())

                // そもそも止まる予定か
                // 合致する方向の要求があるか
                // 重量に空きがあるか
                // よい場合は停止要求のキューの最初に追加
                if (false === floors[floorNum][direction].called) { return; }
                if (false === e.checkAvailability()) { return; }
                
                if (floorNum !== e.destinationQueue[0]) {
                    console.log("push!", floorNum)
                    e.destinationQueue.unshift(floorNum);
                    e.checkDestinationQueue();
                }

            });
            e.on("stopped_at_floor", (floorNum) => {

                const direction = e.getNextFloorDirection(floorNum);
                console.log("stopped", direction, e.getPressedFloors());
                if (direction === "none") { return };

                // 次の階次第で進行方向表示を更新
                e.setIndicator(direction);

                // フロアの進行方向の要求をクリア
                floors[floorNum].clear(direction);

            });
            e.on("floor_button_pressed", (floorNum) => {
                console.log("press", e.getPressedFloors());

                // 押されたボタン＋周囲の状況から、再計画、キュー入れ込む
                const pressedFloors = e.getPressedFloors();

                const lowerFloors = pressedFloors.filter(fN => e.currentFloor() > fN);
                const higherFloors = pressedFloors.filter(fN => e.currentFloor() < fN);

                let sortedPressedFloors= [...pressedFloors].sort();
                if (lowerFloors.length > higherFloors.length) {
                    sortedPressedFloors.reverse();
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