import { BunPlugin, PluginBuilder, plugin } from "bun";

const filter = /replit:@((?:[A-z]|-){1,40})\/((?:[A-z]|-){1,60})\/([0-9a-zA-Z'"#,\-/_ .@]+)/

export default {
    name: "Replit Loader",
    async setup(build) {
        const { getReplId, openClient, openChannel, readFile } = (await import("./crosis"))

        build.onResolve({ filter }, ({ path }) => {
            return { path: path, namespace: "replit" }
        })

        build.onLoad({ filter: /.*/, namespace: "replit" }, async ({ path }) => {
            try {
                const parsed = filter.exec(path)

                if (!parsed || parsed.length !== 4) {
                    throw new Error(`Regex is being weird, state: ${parsed}.`)
                }

                const replId = await getReplId(parsed[1], parsed[2])
                const client = await openClient(replId, undefined);
                const channel = await openChannel(client, { service: "gcsfiles" })
                const contents = await readFile(channel, parsed[3]);

                client.destroy()

                return {
                    contents,
                    loader: "ts",
                };
            } catch (err) {
                console.log(err)
                console.error("If you see this your code likely wont work :/")
                throw err
            }
        });
    },
} as BunPlugin