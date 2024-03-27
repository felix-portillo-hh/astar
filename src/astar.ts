import { NodeSet } from "./node.set";
import { NodeFactory } from "./node.factory";
import {
  IData,
  IGoal,
  IScore,
  IScoreConstructor,
  IScoreOptions,
} from "./types";
import { NodeQueue } from "./node.queue";
import { Node } from "./node";
import { ScoreFactory } from "./score.factory";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

interface AStarOptions<Data extends IData, Goal extends IGoal> {
  Score: IScoreConstructor<Data, Goal, IScore>;
  scoreOptions: IScoreOptions;
  successors: (node: Node<Data>) => Data[];
}

export class AStar<Data extends IData, Goal extends IGoal> {
  protected nodeFactory: NodeFactory<Data>;

  constructor(options: AStarOptions<Data, Goal>) {
    this.nodeFactory = new NodeFactory(
      new ScoreFactory(options.Score, options.scoreOptions),
      options.successors
    );
  }

  public searchFromRoot(goal: IGoal): Data[] | null {
    return this._search(this.nodeFactory.createRoot(), goal);
  }

  public search(start: Data, goal: IGoal): Data[] | null {
    const root = this.nodeFactory.createRoot();
    return this._search(this.nodeFactory.createChild(root, goal, start), goal);
  }

  private _search(start: Node<Data>, goal: IGoal) {
    const open = new NodeQueue<Node<Data>>().push(start);
    const closed = new NodeSet<Node<Data>>();

    while (open.length > 0) {
      const node = open.pop();
      // If the node has already been evaluated, skip it
      if (closed.has(node)) {
        continue;
      }
      // If the node satisfies the goal, return the whole path
      if (goal.satisfiedBy(node)) {
        return node.reconstruct();
      }
      // Add unsatisfying node to the closed list
      closed.push(node);
      for (const successor of this.nodeFactory.successors(goal, node)) {
        // If the successor is already queued, skip it
        if (open.has(successor)) {
          continue;
        }
        open.push(successor);
      }
    }

    return null;
  }
}

export class AStarParallel<
  Data extends IData,
  Goal extends IGoal
> extends AStar<Data, Goal> {
  private numCPUs = require("os").cpus().length;
  private workerThreads: Worker[] = [];

  constructor(options: AStarOptions<Data, Goal>) {
    super(options);
  }

  public search(start: Data, goal: IGoal): Data[] | null {
    let finalResult: Data[];
    if (!isMainThread) {
      parentPort.on("message", ({ successor, targetProcessor }) => {
        console.log("TARGET PROCESSOR");
        console.log(targetProcessor);
        if (targetProcessor === workerData.workerID) {
          const result = this.hdaStar(successor, goal);
          if (result) finalResult = result;
        }
      });
    } else {
      const root = this.nodeFactory.createRoot();
      for (let i = 0; i < this.numCPUs; i++) {
        const worker = new Worker(__filename, {
          workerData: { workerID: i },
        });
        this.workerThreads.push(worker);
        const startingNode = this.nodeFactory.createChild(root, goal, start);
        const targetProcessor = this._hashNode(startingNode);

        for (const worker of this.workerThreads) {
          worker.postMessage({ startingNode, targetProcessor });
        }
      }
    }
    return null;
  }

  private _hashNode(node: Node<Data>) {
    return Math.abs(node.depth) % this.numCPUs;
  }

  private hdaStar(start: Node<Data>, goal: IGoal) {
    const open = new NodeQueue<Node<Data>>().push(start);
    const closed = new NodeSet<Node<Data>>();

    while (open.length > 0) {
      const node = open.pop();
      // If the node has already been evaluated, skip it
      if (closed.has(node)) {
        continue;
      }
      // If the node satisfies the goal, return the whole path
      if (goal.satisfiedBy(node)) {
        return node.reconstruct();
      }
      // Add unsatisfying node to the closed list
      closed.push(node);
      for (const successor of this.nodeFactory.successors(goal, node)) {
        const targetWorker = this._hashNode(successor);
        // If the successor is already queued, skip it
        if (open.has(successor)) {
          continue;
        }
        if (targetWorker === workerData.workerID) {
          open.push(successor);
        } else {
          parentPort.postMessage({ successor, targetWorker });
        }
      }
    }

    return null;
  }
}
