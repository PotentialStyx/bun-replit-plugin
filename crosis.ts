import type { Channel, ChannelOptions, FetchConnectionMetadataResult, GovalMetadata, OpenChannelCb } from '@replit/crosis';
import { Client, FetchConnectionMetadataError } from '@replit/crosis';

let TOKEN = process.env.REPLIT_TOKEN!;

if (!TOKEN) {
    console.error("Replit sid not provided in $REPLIT_TOKEN, program wont work.")
} else if (decodeURIComponent(TOKEN) == TOKEN) {
    console.log("Something might go wrong, wait and see :D")
    TOKEN = encodeURIComponent(TOKEN)
}

export async function getReplId(username: string, replname: string): Promise<string> {
    let data;
    data = await fetch(`https://replit.com/data/repls/@${username}/${replname}`, {
        headers: {
            'User-Agent': `Mozilla/5.0 (bun-replit-plugin)`,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            Referrer: `https://replit.com`,
            Cookie: `connect.sid=${TOKEN}`,
        },
    });

    if (data.status !== 200) {
        throw new Error(`Repl: @${username}/${replname} doesn't exist (Is your sid invalid?).`)
    }

    return (await data.json()).id
}

async function metadataHandler(
    signal: AbortSignal,
    replId: string
): Promise<FetchConnectionMetadataResult> {
    let res: Response;

    try {
        res = await fetch(
            `https://replit.com/data/repls/${replId}/get_connection_metadata`,
            {
                signal,
                method: 'POST',
                headers: {
                    'User-Agent': `Mozilla/5.0 (bun-replit-plugin)`,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    Referrer: `https://replit.com`,
                    Cookie: `connect.sid=${TOKEN}`,
                },
                body: JSON.stringify({}),
            },
        );
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return {
                error: new Error(FetchConnectionMetadataError.Aborted),
            };
        }

        throw error;
    }

    if (res.status !== 200) {
        if (res.status > 500) {
            return {
                error: new Error(FetchConnectionMetadataError.Retriable),
            };
        }

        const errorText = await res.text();
        throw new Error(errorText);
    }

    const connectionMetadata = (await res.json()) as GovalMetadata;

    return {
        token: connectionMetadata.token,
        gurl: connectionMetadata.gurl,
        conmanURL: connectionMetadata.conmanURL,
        error: null,
    };
};

function getMetadataFunc(replId: string) {
    return function fetchConnectionMetadata(signal: AbortSignal) {
        return metadataHandler(
            signal,
            replId,
        )
    };
}

function openChannelFunc<Ctx>(res: (channel: Channel) => any, rej: (err: any) => any): OpenChannelCb<Ctx> {
    return function ({ channel }) {
        if (!channel) {
            rej('Client closed');
            return;
        }

        res(channel);

        return ({ willReconnect }) => {
            if (willReconnect) {
                console.warn('A crosis reconnect is about to occur, reconnects can break stuff and are untested. If another error has occured after this message this could be the reason.');
            }
        }
    }
}

export async function openClient<Ctx>(replId: string, context: Ctx): Promise<Client<Ctx>> {
    const client: Client<Ctx> = new Client();

    const _chan0: Channel = await (new Promise((res, rej) => {
        client.open({ fetchConnectionMetadata: getMetadataFunc(replId), context }, openChannelFunc(res, rej));
    }));

    return client;
}

export function openChannel<Ctx>(client: Client<Ctx>, options: ChannelOptions<Ctx>): Promise<Channel> {
    return new Promise((res, rej) => {
        client.openChannel(options, openChannelFunc(res, rej));
    })
}

export async function readFile(channel: Channel, path: string): Promise<Uint8Array> {
    const contents = await channel.request({ read: { path } });

    if (!contents.file) {
        console.log(contents);
        throw new Error(`Unexpected reply to read: ${contents}`);
    }

    return contents.file.content;
}
