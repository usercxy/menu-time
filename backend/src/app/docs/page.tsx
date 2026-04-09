import Script from "next/script";

export const metadata = {
  title: "API Docs",
  description: "Swagger UI for Menu Time backend APIs",
};

export default function ApiDocsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#fafafa" }}>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
      />
      <div id="swagger-ui" />
      <Script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"
        strategy="afterInteractive"
      />
      <Script
        id="swagger-ui-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function initSwaggerUi() {
              if (!window.SwaggerUIBundle) {
                window.setTimeout(initSwaggerUi, 50);
                return;
              }

              window.SwaggerUIBundle({
                url: "/api/openapi",
                dom_id: "#swagger-ui",
                deepLinking: true,
                persistAuthorization: true,
                displayRequestDuration: true,
              });
            })();
          `,
        }}
      />
    </main>
  );
}
