import React, { useEffect } from 'react';
import { NearNode, StatusResponse, SyncStatusResponse, TrackedShardsResponse } from './nodes';
import './NodeView.css';

interface Props {
    node: NearNode;
    highestHeight: number;
}

export function NodeView({ node, highestHeight }: Props) {
    const [loading, setLoading] = React.useState(true);
    const [status, setStatus] = React.useState<StatusResponse | null>(null);
    const [fullStatus, setFullStatus] = React.useState<StatusResponse | null>(null);
    const [syncStatus, setSyncStatus] = React.useState<SyncStatusResponse | null>(null);
    const [trackedShards, setTrackedShards] = React.useState<TrackedShardsResponse | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    useEffect(() => {
        async function initialize() {
            try {
                setStatus(await node.status);
                setFullStatus(await node.fullStatus);
                setSyncStatus(await node.syncStatus);
                setTrackedShards(await node.trackedShards);
                setLoading(false);
            } catch (e) {
                setError('' + e);
            }
        }

        initialize();
    }, []);

    return (
        <div className='node-view'>
            <div className="ip">
                <a target="_blank"
                    href={"http://" + node.ip + ":3030/debug"}>
                    {node.ip}
                </a>
            </div>
            {status && <div className={
                "height" + (status.sync_info.latest_block_height < highestHeight - 1 ? " old-height" : "")
            }>{status.sync_info.latest_block_height}</div>}
            {status && status.validator_account_id && <div className="account">{status.validator_account_id}</div>}
            {syncStatus && <div className="sync-status">{syncStatusToText(syncStatus)}</div>}
            {trackedShards && <div className="tracked-shards">{trackedShardsToText(trackedShards)}</div>}
            {error && <div className="error">{error}</div>}
            {loading && !error && <div className="loading">Loading...</div>}
        </div>
    );
}

function syncStatusToText(syncStatus: SyncStatusResponse): string {
    const status = syncStatus.status_response.SyncStatus;
    if (status == null) {
        return 'No sync status??';
    }
    if (status == 'AwaitingPeers') {
        return "Awaiting peers";
    }
    if (status == 'NoSync') {
        return '';
    }
    if (status == 'StateSyncDone') {
        return "State sync done";
    }
    if ("EpochSync" in status) {
        return "Epoch sync";
    }
    if ("HeaderSync" in status) {
        return "Header sync";
    }
    if ("StateSync" in status) {
        return "State sync";
    }
    return `Body sync ${status.BodySync.start_height} -> ${status.BodySync.highest_height}`;
}

function booleanArrayToIndexList(array: boolean[]): number[] {
    const result = [];
    for (let i = 0; i < array.length; i++) {
        if (array[i]) {
            result.push(i);
        }
    }
    return result;
}

function trackedShardsToText(trackedShards: TrackedShardsResponse): string {
    const { shards_tracked_this_epoch, shards_tracked_next_epoch } = trackedShards.status_response.TrackedShards;
    const thisShards = booleanArrayToIndexList(shards_tracked_this_epoch).join(', ');
    const nextShards = booleanArrayToIndexList(shards_tracked_next_epoch).join(', ');
    return `[${thisShards}] next: [${nextShards}]`;
}