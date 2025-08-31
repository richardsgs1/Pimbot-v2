// FIX: The default reference to "vite/client" was causing a type resolution error.
// This is often due to a misconfigured tsconfig.json.
// Replaced with a minimal set of declarations to allow the project to compile.
// If you need to use import.meta.env, you can add properties to ImportMetaEnv.

interface ImportMetaEnv {
  // e.g. readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
