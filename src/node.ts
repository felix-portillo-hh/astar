import { cost, heuristic } from "./score";
import { IData, INode, IScore, SerializedNode } from "./types";

export class Node<Data extends IData> implements INode {
  public depth: number;
  public children: Node<Data>[] = [];

  constructor(
    public parent: Node<Data>,
    public data: Data,
    private score: IScore
  ) {
    this.depth = this instanceof Root ? 0 : this.parent.depth + 1;
  }

  public id(): string {
    return [...this.ancestors()]
      .map((node) => node.data.id)
      .sort()
      .join(".");
  }

  private _g: number | null = null;
  public g(): number {
    if (typeof this._g === "number") return this._g;
    this._g = cost(this.score);
    return this._g;
  }

  private _h: number | null = null;
  public h(): number {
    if (typeof this._h === "number") return this._h;
    this._h = heuristic(this.score);
    return this._h;
  }

  public f(): number {
    return (
      [...this.ancestors()].reduce((acc, node) => acc + node.g(), 0) + this.h()
    );
  }

  public compareF(other: Node<Data>): number {
    return this.f() - other.f();
  }

  public addChild(node: Node<Data>): Node<Data> {
    this.children.push(node);
    return node;
  }

  private *ancestors(): Iterable<Node<Data>> {
    let node: Node<Data> = this;
    while (!(node instanceof Root)) {
      yield node;
      node = node.parent;
    }
  }

  public reconstruct(): Data[] {
    return [...this.ancestors()].map((node) => node.data).reverse();
  }
}

export class Root<Data extends IData> extends Node<Data> {
  constructor() {
    super(<Node<Data>>null, <Data>{ id: "root" }, <IScore>null);
  }
}

export class NodeSerializer {
  static serialize(node: INode): SerializedNode {
    return {
      data: node.data,
      depth: node.depth,
      children: node.children.map((child) => this.serialize(child)),
    };
  }

  static deserialize(
    serializedNode: SerializedNode,
    parent: INode | null = null
  ): INode {
    const node: INode = {
      parent: parent,
      data: serializedNode.data,
      depth: serializedNode.depth,
      children: serializedNode.children.map((child) =>
        this.deserialize(child, node)
      ),
    };

    return node;
  }
}
