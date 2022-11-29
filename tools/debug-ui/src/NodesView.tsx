import React from 'react';
import { NearNode, NearNodes } from './nodes';
import { NodeView } from './NodeView';

interface Props {
    nodes: NearNode[];
    highestHeight: number;
}

export function NodesView({ nodes, highestHeight }: Props) {
    return (
        <div>
            <h1>Nodes</h1>
            {nodes.map((node) => <NodeView node={node} key={node.ip} highestHeight={highestHeight} />)}
        </div>
    );
}