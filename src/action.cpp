#include "action.h"
#include "fcitx.h"
#include "inputcontexttoken.h"
#include <emscripten.h>
#include <fcitx/action.h>
#include <fcitx/menu.h>
#include <fcitx/statusarea.h>
#include <fcitx/userinterfacemanager.h>
#include <nlohmann/json.hpp>

namespace fcitx {

namespace {

uint32_t statusAreaGeneration = 0;

} // namespace

static nlohmann::json actionToJson(Action *action, InputContext *ic) {
    nlohmann::json j;
    j["id"] = action->id();
    j["desc"] = action->shortText(ic);
    j["icon"] = action->icon(ic);
    if (action->isSeparator()) {
        j["separator"] = true;
    }
    if (action->isCheckable()) {
        bool checked = action->isChecked(ic);
        j["checked"] = checked;
    }
    if (auto *menu = action->menu()) {
        for (auto *subaction : menu->actions()) {
            j["children"].emplace_back(actionToJson(subaction, ic));
        }
    }
    return j;
}

static nlohmann::json menuActionsToJson(InputContext *ic) {
    nlohmann::json actions = nlohmann::json::array();
    auto &statusArea = ic->statusArea();
    for (auto *action : statusArea.allActions()) {
        if (!action->id()) {
            // Not registered with UI manager.
            continue;
        }
        actions.emplace_back(actionToJson(action, ic));
    }
    return actions;
}

std::optional<nlohmann::json> statusAreaData(InputContext *inputContext) {
    if (!inputContext->hasFocus()) {
        return std::nullopt;
    }
    if (++statusAreaGeneration == 0) {
        ++statusAreaGeneration;
    }
    return nlohmann::json{{"inputContext", inputContextToken(*inputContext)},
                          {"generation", statusAreaGeneration},
                          {"actions", menuActionsToJson(inputContext)}};
}

void notifyStatusArea(InputContext *inputContext) {
    if (!inputContext->hasFocus()) {
        return;
    }
    auto statusArea = statusAreaData(inputContext);
    if (!statusArea) {
        return;
    }
    auto data = statusArea->dump();
    EM_ASM(fcitx.updateStatusArea(JSON.parse(UTF8ToString($0))), data.c_str());
}

InputContext *statusAreaInputContext(std::string_view inputContext,
                                     uint32_t generation) {
    if (generation != statusAreaGeneration) {
        return nullptr;
    }
    return findInputContext(instance.get(), inputContext);
}

extern "C" {
EMSCRIPTEN_KEEPALIVE void activate_menu_action(int id, const char *inputContext,
                                               uint32_t generation) {
    if (!inputContext || !*inputContext) {
        return;
    }
    if (auto *ic = statusAreaInputContext(inputContext, generation)) {
        auto *action = instance->userInterfaceManager().lookupActionById(id);
        action->activate(ic);
    }
}
}
} // namespace fcitx
