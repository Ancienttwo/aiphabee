// AiphaBee web API layer — typed client over the worker's ResponseEnvelope
// contract. Swapping synthetic -> live data is a worker-side change; this layer
// already speaks the canonical envelope.

export * from "./config";
export * from "./client";
export * from "./stream";
export * from "./errors";
export * from "./endpoints";
export * from "./types";
