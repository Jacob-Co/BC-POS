#include <drogon/drogon.h>

#include <cstdlib>
#include <string>

#include "controllers/ItemController.h"
#include "controllers/ReceiptController.h"
#include "controllers/UserController.h"

namespace {
int parsePort() {
    if (const char *port = std::getenv("PORT"); port != nullptr) {
        return std::stoi(port);
    }
    return 3001;
}
} // namespace

int main() {
    bcpos::UserController::registerRoutes();
    bcpos::ItemController::registerRoutes();
    bcpos::ReceiptController::registerRoutes();

    drogon::app().registerHandler("/api/openapi.json", [](const drogon::HttpRequestPtr &, std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
        auto resp = drogon::HttpResponse::newFileResponse("../config/openapi.json");
        resp->setContentTypeCode(drogon::CT_APPLICATION_JSON);
        callback(resp);
    });

    drogon::app().registerHandler("/api/docs", [](const drogon::HttpRequestPtr &, std::function<void(const drogon::HttpResponsePtr &)> &&callback) {
        static const std::string html = R"(
<!doctype html>
<html>
  <head>
    <meta charset=\"utf-8\" />
    <title>BC POS API Docs</title>
    <link rel=\"stylesheet\" href=\"https://unpkg.com/swagger-ui-dist@5/swagger-ui.css\" />
  </head>
  <body>
    <div id=\"swagger-ui\"></div>
    <script src=\"https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js\"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.json',
        dom_id: '#swagger-ui'
      });
    </script>
  </body>
</html>
)";
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setContentTypeCode(drogon::CT_TEXT_HTML);
        resp->setBody(html);
        callback(resp);
    });

    drogon::app().addListener("0.0.0.0", parsePort());
    drogon::app().run();
}
