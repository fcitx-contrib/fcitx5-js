#pragma once

#include <fcitx/inputcontext.h>
#include <nlohmann/json.hpp>

#include <cstdint>
#include <optional>
#include <string_view>

namespace fcitx {

std::optional<nlohmann::json> statusAreaData(InputContext *inputContext);
void notifyStatusArea(InputContext *inputContext);
InputContext *statusAreaInputContext(std::string_view inputContext,
                                     uint32_t generation);

} // namespace fcitx
