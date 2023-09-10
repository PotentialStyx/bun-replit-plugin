# bunimport

> [!NOTE]  
> You will need to put your `connect.sid` cookie in the env var `REPLIT_TOKEN`, it should be url encoded.
> See `.env.example` for an example but replace `s%3a...` with your real `connect.sid`

Put code in `index.ts`, then call `bun run build.ts && bun run out/index.js` to run it.

> [!IMPORTANT]  
> If "`If you see this your code likely wont work :/`" logged in the console then build.ts has failed and `out/index.js` has not been updated with new contents.

Imports are formatted like so:
```ts
import { ... } from "replit:@username/repl-slug/file/path.ts";
```

Currently only ts files can be imported though all natively supported bun file types will be supported soon