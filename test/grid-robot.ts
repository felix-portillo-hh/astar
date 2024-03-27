import { Binary, Cost } from "../src/score.modifier";
import { Score } from "../src/score";
import {
  AStar,
  Node,
  IData,
  IGoal,
  IScoreOptions,
  IScore,
  AStarParallel,
} from "../src";

export class Point implements IData {
  constructor(public x: number, public y: number) {}

  get id(): string {
    return `${this.x},${this.y}`;
  }

  public equals(other: Point): boolean {
    return this.x === other.x && this.y === other.y;
  }

  public distance(other: Point): number {
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
  }

  static adjacent(point: Point): Point[] {
    return [
      new Point(point.x + 1, point.y),
      new Point(point.x - 1, point.y),
      new Point(point.x, point.y + 1),
      new Point(point.x, point.y - 1),
    ];
  }
}

export class Goal extends Point implements IGoal {
  satisfiedBy(node: Node<Point>): boolean {
    return this.equals(node.data);
  }
}

@Score
class ManhattanScore implements IScore {
  constructor(
    private data: Point,
    private goal: Goal,
    public options: IScoreOptions
  ) {}

  public cost = () => 1;

  public heuristic = () => this.goal.distance(this.data);

  @Cost.Discount
  @Binary
  public isEven(): boolean {
    return this.data.x % 2 === 0;
  }
}

export class GridRobot {
  go(start: Point, goal: Goal): Point[] | null {
    return new AStar<Point, Goal>({
      Score: ManhattanScore,
      scoreOptions: <IScoreOptions>{},
      successors: (node) => Point.adjacent(node.data),
    }).search(start, goal);
  }
}

export class GridRobotParallel {
  go(start: Point, goal: Goal): Point[] | null {
    return new AStarParallel<Point, Goal>({
      Score: ManhattanScore,
      scoreOptions: <IScoreOptions>{},
      successors: (node) => Point.adjacent(node.data),
    }).search(start, goal);
  }
}
