#pragma once

#include <drogon/drogon.h>

#include <optional>
#include <string>
#include <string_view>

namespace bcpos {

inline drogon::HttpResponsePtr jsonResultBool(const bool result) {
    Json::Value body;
    body["result"] = result;
    return drogon::HttpResponse::newHttpJsonResponse(body);
}

inline drogon::HttpResponsePtr jsonResult(const Json::Value &result) {
    Json::Value body;
    body["result"] = result;
    return drogon::HttpResponse::newHttpJsonResponse(body);
}

inline std::optional<std::string> bearerToken(const drogon::HttpRequestPtr &req) {
    const auto auth = req->getHeader("Authorization");
    constexpr std::string_view prefix = "Bearer ";
    if (auth.rfind(prefix, 0) != 0 || auth.size() <= prefix.size()) {
        return std::nullopt;
    }
    return auth.substr(prefix.size());
}

inline bool isAuthorized(const drogon::HttpRequestPtr &req) {
    return bearerToken(req).has_value();
}

} // namespace bcpos
