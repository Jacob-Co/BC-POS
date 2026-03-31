#include "ItemController.h"

#include "Common.h"

namespace bcpos {

void ItemController::registerRoutes() {
    using namespace drogon;

    app().registerHandler("/api/items/", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
        callback(jsonResultBool(isAuthorized(req)));
    }, {Post});

    app().registerHandler("/api/items/no-barcode", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
        callback(jsonResultBool(isAuthorized(req)));
    }, {Post});

    app().registerHandler("/api/items/all", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
        if (!isAuthorized(req)) {
            callback(jsonResultBool(false));
            return;
        }
        Json::Value items(Json::arrayValue);
        callback(jsonResult(items));
    }, {Get});

    app().registerHandler("/api/items/invalid-barcodes", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
        if (!isAuthorized(req)) {
            callback(jsonResultBool(false));
            return;
        }
        Json::Value items(Json::arrayValue);
        callback(jsonResult(items));
    }, {Get});

    app().registerHandler("/api/items/csv-inventory", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
        if (!isAuthorized(req)) {
            callback(jsonResultBool(false));
            return;
        }
        Json::Value data;
        data["csvString"] = "Product Name,Stock,Price, Expiry Date\n";
        data["date"] = "20260331";
        callback(jsonResult(data));
    }, {Get});

    app().registerHandler("/api/items/{1}", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &) {
        callback(jsonResultBool(isAuthorized(req)));
    }, {Patch});

    app().registerHandler("/api/items/{1}", [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback, const std::string &) {
        callback(jsonResultBool(isAuthorized(req)));
    }, {Delete});
}

} // namespace bcpos
