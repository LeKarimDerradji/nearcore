import React, { useEffect, useState } from 'react';
import './App.css';
import { NearNode, NearNodes } from './nodes';
import { NodesView } from './NodesView';

function sortingKeyForNode(node: NearNode) {
  if (node.statusData && node.statusData.validator_account_id) {
    return '0' + node.statusData.validator_account_id;
  } else {
    return '1' + node.ip;
  }
}

function App() {
  const [nodes, setNodes] = useState<NearNode[]>([]);
  const [highestHeight, setHighestHeight] = useState<number>(0);
  useEffect(() => {
    const nodes = new NearNodes(() => {
      const sortedNodes = [];
      for (const node of nodes.nodes) {
        sortedNodes.push(node);
      }
      sortedNodes.sort((a, b) => {
        return sortingKeyForNode(a) < sortingKeyForNode(b) ? -1 : 1;
      });
      setNodes(sortedNodes);

      let highestHeight = 0;
      for (const node of nodes.nodes) {
        if (node.statusData) {
          highestHeight = Math.max(highestHeight, node.statusData.sync_info.latest_block_height);
        }
      }

      setHighestHeight(highestHeight);
    });
    nodes.addNode('35.192.7.154');
  }, []);
  return (
    <NodesView nodes={nodes} highestHeight={highestHeight} />
  );
}

export default App;
