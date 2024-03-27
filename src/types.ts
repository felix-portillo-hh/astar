export interface IGoal {
  satisfiedBy(node: INode): boolean;
}

export interface IData {
  id: string;
}

export interface IScore {
  cost(): number;
  heuristic(): number;
}

export interface IScoreOptions {
  cost: {
    discount: Record<string, number>;
    penalty: Record<string, number>;
  };
  heuristic: {
    discount: Record<string, number>;
    penalty: Record<string, number>;
  };
}

export type IScoreConstructor<
  Data extends IData,
  Goal extends IGoal,
  Score extends IScore
> = new (data: Data, goal: Goal, options: IScoreOptions) => Score;

export interface IScoreFactory {
  createScore(goal: IGoal, data: IData): IScore;
}

export interface INode {
  parent: INode;
  data: IData;
  depth: number;
  children: INode[];
  id(): string;
  g(): number;
  h(): number;
  f(): number;
  id(): string;
  compareF(other: INode): number;
  reconstruct(): IData[];
  addChild(node: INode): INode;
}

export interface INodeFactory {
  scoreFactory: IScoreFactory;
  createRoot(): INode;
  createChild(parent: INode, goal: IGoal, data: IData): INode;
  successors(goal: IGoal, node: INode): INode[];
}

export interface SerializedNode {
  data: IData;
  depth: number;
  children: SerializedNode[];
}
