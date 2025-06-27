import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Attribute Extractor",
    description:
      "Select any element and view its attributes in a floating popup.",
    version: "1.0.0",
    permissions: ["scripting", "storage", "tabs", "activeTab"],
    host_permissions: ["<all_urls>"],
    action: {
      default_popup: "/entrypoints/popup/index.html",
    },
    background: {
      service_worker: "entrypoints/background/index.ts",
      type: "module",
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["/entrypoints/content/index.ts"],
      },
    ],
    web_accessible_resources: [
      {
        resources: ["index.html"],
        matches: ["<all_urls>"],
      },
    ],
  },
});
