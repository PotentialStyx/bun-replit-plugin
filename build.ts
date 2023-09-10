import replImports from "./replplugin";

Bun.build({
    entrypoints: ["./index.ts"],
    outdir: "./out",
    plugins: [replImports],
});
