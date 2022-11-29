
export interface StatusResponse {
    chain_id: string;
    latest_protocol_version: number;
    node_key: string;
    node_public_key: string;
    protocol_version: number;
    rpc_addr?: string;
    sync_info: StatusSyncInfo;
    uptime_sec: number;
    validator_account_id: string | null;
    validator_public_key: string | null;
    validators: ValidatorInfo[];
    version: BuildInfo;
    detailed_debug_status: DetailedDebugStatus | null;
}

export interface StatusSyncInfo {
    earliest_block_hash: string;
    earliest_block_height: number;
    earliest_block_time: string;
    epoch_id: string;
    epoch_start_height: number;
    latest_block_hash: string;
    latest_block_height: number;
    latest_block_time: string;
    latest_state_root: string;
    syncing: boolean;
}

export interface ValidatorInfo {
    account_id: string;
    is_slashed: boolean;
}

export interface BuildInfo {
    build: string;
    rustc_version: string;
    version: string;
}

export interface DetailedDebugStatus {
    network_info: NetworkInfoView,
    sync_status: String,
    catchup_status: CatchupStatusView[],
    current_head_status: BlockStatusView,
    current_header_head_status: BlockStatusView,
    block_production_delay_millis: number,
}

export interface NetworkInfoView {
    peer_max_count: number,
    num_connected_peers: number,
    connected_peers: PeerInfoView[],
    known_producers: KnownProducerView[],
    tier1_accounts_data: AccountData[],
    tier1_connections: PeerInfoView[],
}

export interface CatchupStatusView {
    sync_block_hash: string,
    sync_block_height: number,
    shard_sync_status: { [shard_id: number]: string },
    blocks_to_catchup: BlockStatusView[],
}

export interface BlockStatusView {
    height: number,
    hash: string,
}

export interface PeerInfoView {
    addr: string,
    account_id: string | null,
    height: number | null,
    block_hash: string | null,
    is_highest_block_invalid: boolean,
    tracked_shards: number[],
    archival: boolean,
    peer_id: string,
    received_bytes_per_sec: number,
    sent_bytes_per_sec: number,
    last_time_peer_requested_millis: number,
    last_time_received_message_millis: number,
    connection_established_time_millis: number,
    is_outbound_peer: boolean,
    nonce: number,
}

export interface KnownProducerView {
    account_id: string,
    peer_id: string,
    next_hops: string[] | null,
}

export interface PeerAddr {
    addr: string,
    peer_id: string,
}

export interface AccountData {
    peer_id: string,
    proxies: PeerAddr[],
    account_key: string,
    version: number,
    timestamp: string,
}

export type SyncStatusView =
    'AwaitingPeers' |
    'NoSync' | {
        EpochSync: { epoch_ord: number }
    } | {
        HeaderSync: {
            start_height: number,
            current_height: number,
            highest_height: number,
        }
    } | {
        StateSync: [
            string,
            { [shard_id: number]: ShardSyncDownloadView },
        ]
    } |
    'StateSyncDone' | {
        BodySync: {
            start_height: number,
            current_height: number,
            highest_height: number,
        }
    };

export interface ShardSyncDownloadView {
    downloads: { error: boolean, done: boolean }[];
    status: string;
}

export interface SyncStatusResponse {
    status_response: {
        SyncStatus: SyncStatusView,
    };
}

export interface TrackedShardsResponse {
    status_response: {
        TrackedShards: {
            shards_tracked_this_epoch: boolean[],
            shards_tracked_next_epoch: boolean[],
        },
    };
}

export class NearNode {
    ip: string;
    status: Promise<StatusResponse>;
    statusData: StatusResponse | null = null;
    fullStatus: Promise<StatusResponse>;
    fullStatusData: StatusResponse | null = null;
    syncStatus: Promise<SyncStatusResponse>;
    syncStatusData: SyncStatusResponse | null = null;
    trackedShards: Promise<TrackedShardsResponse>;
    trackedShardsData: TrackedShardsResponse | null = null;

    constructor(ip: string) {
        this.ip = ip;
        this.status = this.fetchBasicStatus();
        this.fullStatus = this.fetchFullStatus();
        this.syncStatus = this.fetchSyncStatus();
        this.trackedShards = this.fetchTrackedShards();
    }

    async fetchBasicStatus(): Promise<StatusResponse> {
        const response = await fetch(`http://${this.ip}:3030/status`);
        return this.statusData = await response.json();
    }

    async fetchFullStatus(): Promise<StatusResponse> {
        await this.status;
        const response = await fetch(`http://${this.ip}:3030/debug/api/status`);
        return this.fullStatusData = await response.json();
    }

    async fetchSyncStatus(): Promise<SyncStatusResponse> {
        await this.status;
        const response = await fetch(`http://${this.ip}:3030/debug/api/sync_status`);
        return this.syncStatusData = await response.json();
    }

    async fetchTrackedShards(): Promise<TrackedShardsResponse> {
        await this.status;
        const response = await fetch(`http://${this.ip}:3030/debug/api/tracked_shards`);
        return this.trackedShardsData = await response.json();
    }
}

export class NearNodes {
    nodes: NearNode[] = [];
    knownIps: Set<string> = new Set();

    constructor(public notification: () => void) {
    }

    async addNode(ip: string) {
        this.knownIps.add(ip);
        const node = new NearNode(ip);
        this.nodes.push(node);
        this.notification();
        await node.status;
        this.notification();  // for sorting and height comparison
        const status = await node.fullStatus;
        const networkInfo = status.detailed_debug_status!.network_info;
        const newAddrs = [];
        for (const peer of networkInfo.connected_peers) {
            newAddrs.push(peer.addr);
        }
        for (const peer of networkInfo.tier1_connections) {
            newAddrs.push(peer.addr);
        }
        for (const addr of newAddrs) {
            const ip = addr.split(':')[0];
            if (!this.knownIps.has(ip)) {
                this.addNode(ip);
            }
        }
    }
}