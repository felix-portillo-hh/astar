import { GridRobot, GridRobotParallel, Point, Goal } from "./grid-robot";

const result = new GridRobot().go(new Point(0, 0), new Goal(3, 3));

console.log(result);

const resultParallel = new GridRobotParallel().go(
  new Point(0, 0),
  new Goal(3, 3)
);

console.log(resultParallel);

process.exit();
