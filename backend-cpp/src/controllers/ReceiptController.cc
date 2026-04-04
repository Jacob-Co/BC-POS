#include "ReceiptController.h"

#include "Common.h"

namespace bcpos {

void ReceiptController::registerRoutes() {
    using namespace drogon;

    app().registerHandler("/api/receipts/", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
        callback(jsonResultBool(isAuthorized(req)));
    }, {Post});

    app().registerHandler("/api/receipts/hardCode", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
        callback(jsonResultBool(isAuthorized(req)));
    }, {Post});

    app().registerHandler("/api/receipts/multiple", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
        callback(jsonResultBool(isAuthorized(req)));
    }, {Post});

    app().registerHandler("/api/receipts/dates/{1}/{2}", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &, const std::string &) {
        if (!isAuthorized(req)) {
            callback(jsonResultBool(false));
            return;
        }
        Json::Value receipts(Json::arrayValue);
        callback(jsonResult(receipts));
    }, {Get});

    app().registerHandler("/api/receipts/sales/{1}", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &) {
        if (!isAuthorized(req)) {
            callback(jsonResultBool(false));
            return;
        }
        Json::Value sales;
        sales["total"] = 0.0;
        sales["itemPriceHash"] = Json::Value(Json::objectValue);
        sales["itemCountHash"] = Json::Value(Json::objectValue);
        callback(jsonResult(sales));
    }, {Get});

    app().registerHandler("/api/receipts/unresolved", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
        if (!isAuthorized(req)) {
            callback(jsonResultBool(false));
            return;
        }
        Json::Value unresolved(Json::arrayValue);
        callback(jsonResult(unresolved));
    }, {Get});

    app().registerHandler("/api/receipts/{1}", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &) {
        callback(jsonResultBool(isAuthorized(req)));
    }, {Patch});

    app().registerHandler("/api/receipts/{1}", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &) {
        callback(jsonResultBool(isAuthorized(req)));
    }, {Delete});
}

} // namespace bcpos
