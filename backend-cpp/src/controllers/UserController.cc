#include "UserController.h"

#include "Common.h"

namespace bcpos {

void UserController::registerRoutes() {
    using namespace drogon;

    app().registerHandler(
        "/api/users/",
        [](const HttpRequestPtr &, std::function<void(const HttpResponsePtr &)> &&callback) { callback(jsonResultBool(true)); },
        {Post});

    app().registerHandler(
        "/api/users/login",
        [](const HttpRequestPtr &, std::function<void(const HttpResponsePtr &)> &&callback) { callback(jsonResult("mock-jwt-token")); },
        {Post});

    app().registerHandler(
        "/api/users/details",
        [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
            if (!isAuthorized(req)) {
                callback(jsonResultBool(false));
                return;
            }
            Json::Value details;
            details["id"] = "mock-user-id";
            details["email"] = "user@example.com";
            details["isAdmin"] = false;
            callback(jsonResult(details));
        },
        {Get});

    app().registerHandler(
        "/api/users/password",
        [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) { callback(jsonResultBool(isAuthorized(req))); },
        {Patch});

    app().registerHandler(
        "/api/users/",
        [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) { callback(jsonResultBool(isAuthorized(req))); },
        {Delete});

    app().registerHandler(
        "/api/users/all",
        [](const HttpRequestPtr &req, std::function<void(const HttpResponsePtr &)> &&callback) {
            if (!isAuthorized(req)) {
                callback(jsonResultBool(false));
                return;
            }
            Json::Value users(Json::arrayValue);
            Json::Value user;
            user["email"] = "admin@example.com";
            user["firstName"] = "Admin";
            user["lastName"] = "User";
            user["isAdmin"] = true;
            users.append(user);
            callback(jsonResult(users));
        },
        {Get});
}

} // namespace bcpos
