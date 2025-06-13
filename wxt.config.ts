import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Attribute Extractor",
    description:
      "Select any element and view its attributes in a floating popup.",
    version: "1.0.0",
    permissions: ["scripting", "tabs", "activeTab"],
    host_permissions: ["<all_urls>"],
    action: {
      default_popup: "/entrypoints/popup/index.html",
    },
    background: {
      service_worker: "/entrypoints/background.ts",
      type: "module",
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["/entrypoints/content.ts"],
      },
    ],
  },
});
