#pragma once

#include <fcitx/inputcontextmanager.h>
#include <fcitx/instance.h>

#include <cstdint>
#include <string>
#include <string_view>

namespace fcitx {

inline std::string inputContextToken(const InputContext &inputContext) {
    constexpr char hexDigits[] = "0123456789abcdef";
    std::string result;
    result.reserve(inputContext.uuid().size() * 2);
    for (auto byte : inputContext.uuid()) {
        result.push_back(hexDigits[byte >> 4]);
        result.push_back(hexDigits[byte & 0xf]);
    }
    return result;
}

inline InputContext *findInputContext(Instance *instance,
                                      std::string_view token) {
    auto hexValue = [](char value) {
        if (value >= '0' && value <= '9') {
            return value - '0';
        }
        if (value >= 'a' && value <= 'f') {
            return value - 'a' + 10;
        }
        if (value >= 'A' && value <= 'F') {
            return value - 'A' + 10;
        }
        return -1;
    };

    ICUUID uuid;
    if (token.size() != uuid.size() * 2) {
        return nullptr;
    }
    for (size_t i = 0; i < uuid.size(); ++i) {
        int high = hexValue(token[i * 2]);
        int low = hexValue(token[i * 2 + 1]);
        if (high < 0 || low < 0) {
            return nullptr;
        }
        uuid[i] = static_cast<uint8_t>((high << 4) | low);
    }
    auto *inputContext = instance->inputContextManager().findByUUID(uuid);
    return inputContext && inputContext->hasFocus() ? inputContext : nullptr;
}

} // namespace fcitx
