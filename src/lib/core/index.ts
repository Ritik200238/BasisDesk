// Deterministic finance core for BasisDesk. Framework-free and network-free: every
// function here is pure and unit-tested, so the numbers a user sees are reproducible and
// auditable. The LLM narration layer reads these results; it never computes them.

export * from "./money";
export * from "./types";
export * from "./sizing";
export * from "./delta";
export * from "./funding";
export * from "./vault";
export * from "./risk";
